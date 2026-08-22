CREATE OR ALTER PROCEDURE api.usp_WMS_OUT04_SaveRequest_v1
    @UserId nvarchar(50), @RequestId int, @NeededAt datetime,
    @DestinationBravoCode nvarchar(50) = NULL, @DestinationName nvarchar(50) = NULL,
    @ExpectedChangedAt datetime, @Items api.OutboundRequestItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @NeededAt IS NULL OR @ExpectedChangedAt IS NULL OR NOT EXISTS (SELECT 1 FROM @Items)
        THROW 51002, N'Thời gian cần, phiên bản phiếu và danh sách vật tư là bắt buộc.', 1;
    IF EXISTS (SELECT 1 FROM @Items WHERE Quantity <= 0) THROW 51022, N'Số lượng phải lớn hơn 0.', 1;
    IF EXISTS
    (
        SELECT 1 FROM @Items
        GROUP BY MaterialId, ISNULL(DestinationBravoCode, N'') HAVING COUNT(*) > 1
    ) THROW 51022, N'Không được trùng vật tư và tổ nhận trên cùng phiếu.', 1;
    SET @DestinationBravoCode = NULLIF(LTRIM(RTRIM(@DestinationBravoCode)), N'');
    SET @DestinationName = NULLIF(LTRIM(RTRIM(@DestinationName)), N'');

    DECLARE @DepartmentCode nvarchar(50), @IsAdmin bit = 0, @Now datetime = GETDATE();
    SELECT @DepartmentCode = ma_bophan FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tài khoản không hoạt động.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi')
    ) THROW 51001, N'Không có quyền chỉnh sửa đề nghị.', 1;
    IF EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN (N'scr_admin_chinhsua_denghi', N'scr_chinhsua_denghi_baobi')
    ) SET @IsAdmin = 1;

    DECLARE @OwnerDepartment nvarchar(50), @CurrentStatus nvarchar(20), @PickingStatus nvarchar(20),
        @ChangedAt datetime, @FlowId int, @Classification nvarchar(50), @PlanningUnit nvarchar(50);
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @OwnerDepartment = request.bo_phan, @CurrentStatus = request.trang_thai_phieu,
            @PickingStatus = request.status_soanhang, @ChangedAt = COALESCE(request.time_cre, request.time_lap_phieu),
            @FlowId = TRY_CONVERT(int, request.id_flow_pheduyet)
        FROM dbo.tbl_phieu_yeucau AS request WITH (UPDLOCK, HOLDLOCK)
        WHERE request.id_phieu_yeucau = @RequestId;
        IF @OwnerDepartment IS NULL THROW 51004, N'Không tìm thấy phiếu.', 1;
        IF @IsAdmin = 0 AND @OwnerDepartment <> @DepartmentCode THROW 51001, N'Không có quyền sửa phiếu.', 1;
        IF @CurrentStatus <> N'1' OR ISNULL(@PickingStatus, N'0') NOT IN (N'0', N'')
            THROW 51022, N'Phiếu đã hủy hoặc đã bắt đầu soạn hàng.', 1;
        IF @ChangedAt <> @ExpectedChangedAt THROW 51009, N'Phiếu đã thay đổi. Hãy tải lại.', 1;
        IF EXISTS (SELECT 1 FROM dbo.tbl_his_pheduyet WHERE id_phieu_yeucau = @RequestId AND trangthai_pheduyet IS NOT NULL)
            THROW 51022, N'Không được sửa phiếu sau khi đã có quyết định phê duyệt.', 1;

        SELECT @Classification = LOWER(phan_loai), @PlanningUnit = donvi_kehoach
        FROM dbo.tbl_flow_pheduyet WHERE id_flow = @FlowId;
        IF @Classification IS NULL THROW 51022, N'Phiếu không có quy trình phê duyệt hợp lệ.', 1;
        IF EXISTS
        (
            SELECT 1 FROM @Items AS item LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId
            WHERE material.id_vattu IS NULL
        ) THROW 51004, N'Có vật tư không tồn tại.', 1;
        IF @Classification IN (N'trong', N'vuot') AND EXISTS
        (
            SELECT 1 FROM @Items AS item LEFT JOIN dbo.tbl_dinhmuc AS planItem
              ON planItem.id_kehoach = item.PlanId AND planItem.id_vattu = item.MaterialId
             AND planItem.donvi_kehoach = @PlanningUnit AND ISNULL(planItem.is_active, 0) = 1
            WHERE planItem.id_kehoach IS NULL
        ) THROW 51022, N'Có vật tư không thuộc định mức của phiếu.', 1;

        IF @Classification = N'trong' AND EXISTS
        (
            SELECT 1 FROM @Items AS item
            INNER JOIN dbo.tbl_dinhmuc AS planItem WITH (UPDLOCK, HOLDLOCK) ON planItem.id_kehoach = item.PlanId
            OUTER APPLY
            (
                SELECT ReservedQuantity = SUM(CONVERT(decimal(19,4), ISNULL(line.so_luong, 0)))
                FROM dbo.tbl_phieu_yeucau_chitiet AS line
                INNER JOIN dbo.tbl_phieu_yeucau AS otherRequest ON otherRequest.id_phieu_yeucau = line.id_phieu_yeucau
                WHERE line.id_kehoach = planItem.id_kehoach AND otherRequest.id_phieu_yeucau <> @RequestId
                  AND ISNULL(otherRequest.trang_thai_phieu, N'0') <> N'0'
                  AND NOT EXISTS (SELECT 1 FROM dbo.tbl_his_pheduyet AS history
                    WHERE history.id_phieu_yeucau = otherRequest.id_phieu_yeucau
                      AND LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'reject')
            ) AS reserved
            WHERE item.Quantity + ISNULL(reserved.ReservedQuantity, 0) > CONVERT(decimal(19,4), ISNULL(planItem.dinh_muc, 0))
        ) THROW 51022, N'Số lượng trong kế hoạch vượt định mức còn lại.', 1;

        IF @DestinationBravoCode IS NULL
            SELECT TOP (1) @DestinationBravoCode = item.DestinationBravoCode FROM @Items AS item WHERE item.DestinationBravoCode IS NOT NULL;
        IF EXISTS
        (
            SELECT 1 FROM @Items AS item LEFT JOIN dbo.tbl_sx_bravo AS destination
              ON destination.ma_ql = @OwnerDepartment AND destination.donvi_ke_hoach = @PlanningUnit
             AND destination.ma_bravo = COALESCE(NULLIF(item.DestinationBravoCode, N''), @DestinationBravoCode)
            WHERE destination.id_sx_bravo IS NULL
        ) THROW 51022, N'Có tổ nhận Bravo không hợp lệ.', 1;
        IF @DestinationName IS NULL
            SELECT TOP (1) @DestinationName = ten_bravo_bophan FROM dbo.tbl_sx_bravo
            WHERE ma_ql = @OwnerDepartment AND donvi_ke_hoach = @PlanningUnit AND ma_bravo = @DestinationBravoCode;

        UPDATE dbo.tbl_phieu_yeucau SET thoi_gian_can = @NeededAt,
            ma_bravo_bophan = @DestinationBravoCode, ten_bravo_bophan = @DestinationName
        WHERE id_phieu_yeucau = @RequestId;
        DELETE dbo.tbl_phieu_yeucau_chitiet WHERE id_phieu_yeucau = @RequestId;
        INSERT dbo.tbl_phieu_yeucau_chitiet
        (
            id_phieu_yeucau, id_vattu, ten_vattu, id_bravo, so_luong,
            unit, thoi_gian_can, ghi_chu, time_cre, bravo_bophan, id_kehoach
        )
        SELECT @RequestId, item.MaterialId, LEFT(COALESCE(NULLIF(item.MaterialName, N''), material.ten_vattu), 100),
            COALESCE(NULLIF(item.BravoId, N''), material.id_bravo), CONVERT(float, item.Quantity),
            COALESCE(NULLIF(item.Unit, N''), material.unit), @NeededAt, item.Note, @Now,
            COALESCE(NULLIF(item.DestinationBravoCode, N''), @DestinationBravoCode),
            CASE WHEN @Classification = N'ngoai' THEN NULL ELSE item.PlanId END
        FROM @Items AS item INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId;

        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
