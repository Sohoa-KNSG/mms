CREATE OR ALTER PROCEDURE api.usp_WMS_OUT00_SubmitRequest_v1
    @UserId nvarchar(50),
    @Classification nvarchar(20),
    @PlanningUnit nvarchar(50),
    @NeededAt datetime,
    @DestinationBravoCode nvarchar(50) = NULL,
    @DestinationName nvarchar(50) = NULL,
    @Items api.OutboundRequestItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @Classification = LOWER(NULLIF(LTRIM(RTRIM(@Classification)), N''));
    SET @PlanningUnit = NULLIF(LTRIM(RTRIM(@PlanningUnit)), N'');
    SET @DestinationBravoCode = NULLIF(LTRIM(RTRIM(@DestinationBravoCode)), N'');
    SET @DestinationName = NULLIF(LTRIM(RTRIM(@DestinationName)), N'');

    IF @Classification NOT IN (N'trong', N'ngoai', N'vuot')
        THROW 51022, N'Phân loại yêu cầu không hợp lệ.', 1;
    IF @PlanningUnit IS NULL OR @NeededAt IS NULL
        THROW 51002, N'Đơn vị kế hoạch và thời gian cần là bắt buộc.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Items) OR EXISTS (SELECT 1 FROM @Items WHERE Quantity <= 0)
        THROW 51002, N'Phiếu phải có vật tư và số lượng lớn hơn 0.', 1;
    IF EXISTS
    (
        SELECT 1 FROM @Items
        GROUP BY MaterialId, ISNULL(DestinationBravoCode, N'') HAVING COUNT(*) > 1
    ) THROW 51022, N'Không được trùng vật tư và tổ nhận trên cùng phiếu.', 1;

    DECLARE @DepartmentCode nvarchar(50), @RequesterName nvarchar(50),
        @DefaultBravoCode nvarchar(50), @DefaultBravoName nvarchar(50);
    SELECT @DepartmentCode = userInfo.ma_bophan, @RequesterName = userInfo.ho_ten_nv,
        @DefaultBravoCode = userInfo.ma_bravo_bophan, @DefaultBravoName = userInfo.ten_bravo_bophan
    FROM dbo.tbl_dm_user AS userInfo
    WHERE userInfo.user_n = @UserId AND ISNULL(userInfo.status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tài khoản không hoạt động hoặc chưa có bộ phận.', 1;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND
          (
              (@Classification = N'trong' AND ScreenCode IN (N'scr_denghi_xuatkho_planning', N'scr_mob_denghi_xuatkho_planning'))
              OR (@Classification = N'ngoai' AND ScreenCode IN (N'scr_denghi_xuatkho_no_planning', N'scr_mob_denghi_xuatkho_no_planning', N'scr_denghi_xuatkho_request'))
              OR (@Classification = N'vuot' AND ScreenCode IN (N'scr_denghi_xuatkho_planning_vuot', N'scr_mob_denghi_xuatkho_planning_vuot'))
          )
    )
        THROW 51001, N'Không có quyền lập đề nghị xuất kho.', 1;

    IF NOT EXISTS
    (
        SELECT 1 FROM dbo.tbl_dm_kehoach
        WHERE donvi_kehoach = @PlanningUnit AND ma_ql = @DepartmentCode AND ISNULL(status_active, 0) = 1
    )
        THROW 51022, N'Đơn vị kế hoạch không thuộc bộ phận của người lập.', 1;

    IF EXISTS
    (
        SELECT 1 FROM @Items AS item
        LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId
        WHERE material.id_vattu IS NULL
    )
        THROW 51004, N'Có vật tư không tồn tại trong danh mục.', 1;

    IF EXISTS
    (
        SELECT 1 FROM @Items AS item
        WHERE COALESCE(NULLIF(item.DestinationBravoCode, N''), @DestinationBravoCode, @DefaultBravoCode) IS NULL
    )
        THROW 51002, N'Mỗi vật tư phải có tổ nhận Bravo.', 1;

    IF EXISTS
    (
        SELECT 1 FROM @Items AS item
        LEFT JOIN dbo.tbl_sx_bravo AS destination
          ON destination.ma_ql = @DepartmentCode
         AND destination.donvi_ke_hoach = @PlanningUnit
         AND destination.ma_bravo = COALESCE(NULLIF(item.DestinationBravoCode, N''), @DestinationBravoCode, @DefaultBravoCode)
        WHERE destination.id_sx_bravo IS NULL
    )
        THROW 51022, N'Có tổ nhận Bravo không thuộc đơn vị kế hoạch đã chọn.', 1;

    IF @Classification IN (N'trong', N'vuot') AND EXISTS
    (
        SELECT 1 FROM @Items AS item
        LEFT JOIN dbo.tbl_dinhmuc AS planItem
          ON planItem.id_kehoach = item.PlanId
         AND planItem.id_vattu = item.MaterialId
         AND planItem.donvi_kehoach = @PlanningUnit
         AND ISNULL(planItem.is_active, 0) = 1
        WHERE item.PlanId IS NULL OR planItem.id_kehoach IS NULL
    )
        THROW 51022, N'Có vật tư không thuộc định mức đang hoạt động.', 1;

    DECLARE @FlowId int, @TotalSteps int;
    SELECT TOP (1) @FlowId = flow.id_flow, @TotalSteps = flow.tong_buoc_duyet
    FROM dbo.tbl_flow_pheduyet AS flow
    WHERE flow.donvi_kehoach = @PlanningUnit
      AND LOWER(flow.phan_loai) = @Classification
      AND ISNULL(flow.status_active, 0) = 1
    ORDER BY flow.id_flow DESC;
    IF @FlowId IS NULL OR ISNULL(@TotalSteps, 0) < 1
        THROW 51022, N'Chưa cấu hình quy trình phê duyệt cho loại phiếu này.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM dbo.tbl_pheduyet_process
        WHERE id_flow = @FlowId AND buoc_pheduyet = 1 AND ISNULL(status_active, 0) = 1
    )
        THROW 51022, N'Quy trình chưa có người phê duyệt bước 1.', 1;

    DECLARE @Now datetime = GETDATE(), @RequestId int, @ApprovalRunId int;
    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Classification = N'trong'
        BEGIN
            IF EXISTS
            (
                SELECT 1
                FROM @Items AS item
                INNER JOIN dbo.tbl_dinhmuc AS planItem WITH (UPDLOCK, HOLDLOCK)
                  ON planItem.id_kehoach = item.PlanId
                OUTER APPLY
                (
                    SELECT ReservedQuantity = SUM(CONVERT(decimal(19,4), ISNULL(line.so_luong, 0)))
                    FROM dbo.tbl_phieu_yeucau_chitiet AS line
                    INNER JOIN dbo.tbl_phieu_yeucau AS request ON request.id_phieu_yeucau = line.id_phieu_yeucau
                    WHERE line.id_kehoach = planItem.id_kehoach
                      AND ISNULL(request.trang_thai_phieu, N'0') <> N'0'
                      AND NOT EXISTS
                      (
                          SELECT 1 FROM dbo.tbl_his_pheduyet AS history
                          WHERE history.id_phieu_yeucau = request.id_phieu_yeucau
                            AND LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'reject'
                      )
                ) AS reserved
                WHERE item.Quantity + ISNULL(reserved.ReservedQuantity, 0)
                    > CONVERT(decimal(19,4), ISNULL(planItem.dinh_muc, 0))
            )
                THROW 51022, N'Số lượng trong kế hoạch vượt định mức còn lại.', 1;
        END;

        IF @DestinationBravoCode IS NULL
            SELECT TOP (1) @DestinationBravoCode = COALESCE(NULLIF(item.DestinationBravoCode, N''), @DefaultBravoCode)
            FROM @Items AS item;
        IF @DestinationName IS NULL
            SELECT TOP (1) @DestinationName = destination.ten_bravo_bophan
            FROM dbo.tbl_sx_bravo AS destination
            WHERE destination.ma_ql = @DepartmentCode
              AND destination.donvi_ke_hoach = @PlanningUnit
              AND destination.ma_bravo = @DestinationBravoCode;
        SET @DestinationName = COALESCE(@DestinationName, @DefaultBravoName);

        INSERT dbo.tbl_phieu_yeucau
        (
            bo_phan, nguoi_lap_phieu, time_lap_phieu, id_flow_pheduyet,
            trang_thai_phieu, time_cre, ma_bravo_bophan, ten_bravo_bophan,
            thoi_gian_can, status_soanhang
        )
        VALUES
        (
            @DepartmentCode, @RequesterName, @Now, CONVERT(nvarchar(20), @FlowId),
            N'1', @Now, @DestinationBravoCode, @DestinationName, @NeededAt, NULL
        );
        SET @RequestId = CONVERT(int, SCOPE_IDENTITY());

        INSERT dbo.tbl_phieu_yeucau_chitiet
        (
            id_phieu_yeucau, id_vattu, ten_vattu, id_bravo, so_luong,
            unit, thoi_gian_can, ghi_chu, time_cre, bravo_bophan, id_kehoach
        )
        SELECT @RequestId, item.MaterialId,
            LEFT(COALESCE(NULLIF(item.MaterialName, N''), material.ten_vattu), 100),
            COALESCE(NULLIF(item.BravoId, N''), material.id_bravo), CONVERT(float, item.Quantity),
            COALESCE(NULLIF(item.Unit, N''), material.unit), @NeededAt, item.Note, @Now,
            COALESCE(NULLIF(item.DestinationBravoCode, N''), @DestinationBravoCode, @DefaultBravoCode),
            CASE WHEN @Classification = N'ngoai' THEN NULL ELSE item.PlanId END
        FROM @Items AS item
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId;

        INSERT dbo.tbl_his_pheduyet
        (
            id_lan_pheduyet, tong_buoc_duyet, id_flow_pheduyet, id_phieu_yeucau,
            ma_ql_pheduyet, ten_ql_pheduyet, mail_ql_pheduyet, capbac_pheduyet
        )
        SELECT TOP (1) 1, @TotalSteps, @FlowId, @RequestId,
            approval.msnv_ql_pheduyet, approval.ten_ql_pheduyet,
            approval.mail_ql_pheduyet, approval.capbac_pheduyet
        FROM dbo.tbl_pheduyet_process AS approval
        WHERE approval.id_flow = @FlowId AND approval.buoc_pheduyet = 1
          AND ISNULL(approval.status_active, 0) = 1
        ORDER BY approval.id_pheduyet;
        SET @ApprovalRunId = CONVERT(int, SCOPE_IDENTITY());

        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, FlowId = @FlowId, Classification = @Classification,
            ApprovalRunId = @ApprovalRunId, CurrentApprovalStep = 1,
            TotalApprovalSteps = @TotalSteps, CreatedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
