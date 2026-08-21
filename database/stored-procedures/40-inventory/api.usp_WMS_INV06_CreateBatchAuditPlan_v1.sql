-- ============================================================================
-- SP: TẠO KẾ HOẠCH KIỂM KÊ THEO BATCH (TRƯỞNG PHÒNG KHO - UC-18 / INV-06)
-- ============================================================================

USE [MMS];
GO

SET XACT_ABORT ON;
GO

CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_CreateBatchAuditPlan_v1
    @UserId          NVARCHAR(50),
    @PlanName        NVARCHAR(255),
    @WarehouseCode   NVARCHAR(50) = N'20020100',
    @AuditType       NVARCHAR(50) = N'BATCH_LIST',
    @BatchIdsJson    NVARCHAR(MAX) = NULL,
    @LocationPrefix  NVARCHAR(50) = NULL,
    @MaterialId      NVARCHAR(50) = NULL,
    @AgingDays       INT = NULL,
    @Note            NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Kiểm tra quyền
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode IN (N'scr_kiemke_batch', N'scr_kiemke_kh_vattu', N'scr_admin_role_app'))
        THROW 51001, N'Bạn không có quyền lập kế hoạch kiểm kê batch!', 1;

    SET @PlanName = NULLIF(LTRIM(RTRIM(@PlanName)), N'');
    IF @PlanName IS NULL
        THROW 51002, N'Tên kế hoạch kiểm kê không được để trống!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Now DATETIME = GETDATE();
        DECLARE @PlanId INT;

        -- Tạo kế hoạch kiểm kê
        INSERT INTO dbo.tbl_kiemke_batch_kh (
            ten_kehoach, ma_kho, loai_kiemke, trang_thai,
            user_cre, time_cre, ghi_chu
        )
        VALUES (
            @PlanName, @WarehouseCode, @AuditType, 1,
            @UserId, @Now, @Note
        );
        SET @PlanId = SCOPE_IDENTITY();

        -- Snapshot danh sách Batch được chọn vào bảng chi tiết
        IF @BatchIdsJson IS NOT NULL AND LTRIM(RTRIM(@BatchIdsJson)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_kiemke_batch_chitiet (
                id_kh_batch, id_batch, id_vattu, id_bravo, ten_vattu, unit,
                location_snapshot, soluong_snapshot, trang_thai_kiem
            )
            SELECT 
                @PlanId, b.id_batch, b.id_vattu, b.id_bravo, b.ten_vattu, b.unit,
                b.location, ISNULL(b.so_luong, 0), N'CHUA_KIEM'
            FROM dbo.tbl_batch_inv b
            INNER JOIN OPENJSON(@BatchIdsJson) j ON b.id_batch = CAST(j.value AS INT)
            WHERE ISNULL(b.trang_thai_ton, N'1') <> N'0';
        END
        ELSE IF @LocationPrefix IS NOT NULL AND LTRIM(RTRIM(@LocationPrefix)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_kiemke_batch_chitiet (
                id_kh_batch, id_batch, id_vattu, id_bravo, ten_vattu, unit,
                location_snapshot, soluong_snapshot, trang_thai_kiem
            )
            SELECT 
                @PlanId, b.id_batch, b.id_vattu, b.id_bravo, b.ten_vattu, b.unit,
                b.location, ISNULL(b.so_luong, 0), N'CHUA_KIEM'
            FROM dbo.tbl_batch_inv b
            WHERE b.location LIKE @LocationPrefix + N'%'
              AND ISNULL(b.trang_thai_ton, N'1') <> N'0';
        END
        ELSE IF @MaterialId IS NOT NULL AND LTRIM(RTRIM(@MaterialId)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_kiemke_batch_chitiet (
                id_kh_batch, id_batch, id_vattu, id_bravo, ten_vattu, unit,
                location_snapshot, soluong_snapshot, trang_thai_kiem
            )
            SELECT 
                @PlanId, b.id_batch, b.id_vattu, b.id_bravo, b.ten_vattu, b.unit,
                b.location, ISNULL(b.so_luong, 0), N'CHUA_KIEM'
            FROM dbo.tbl_batch_inv b
            WHERE b.id_vattu = @MaterialId
              AND ISNULL(b.trang_thai_ton, N'1') <> N'0';
        END
        ELSE IF @AgingDays IS NOT NULL AND @AgingDays > 0
        BEGIN
            INSERT INTO dbo.tbl_kiemke_batch_chitiet (
                id_kh_batch, id_batch, id_vattu, id_bravo, ten_vattu, unit,
                location_snapshot, soluong_snapshot, trang_thai_kiem
            )
            SELECT 
                @PlanId, b.id_batch, b.id_vattu, b.id_bravo, b.ten_vattu, b.unit,
                b.location, ISNULL(b.so_luong, 0), N'CHUA_KIEM'
            FROM dbo.tbl_batch_inv b
            WHERE DATEDIFF(DAY, ISNULL(b.time_cre, b.time_up), @Now) >= @AgingDays
              AND ISNULL(b.trang_thai_ton, N'1') <> N'0';
        END
        ELSE
        BEGIN
            -- Mặc định lấy toàn bộ các Lô còn tồn kho nếu không có bộ lọc cụ thể
            INSERT INTO dbo.tbl_kiemke_batch_chitiet (
                id_kh_batch, id_batch, id_vattu, id_bravo, ten_vattu, unit,
                location_snapshot, soluong_snapshot, trang_thai_kiem
            )
            SELECT 
                @PlanId, b.id_batch, b.id_vattu, b.id_bravo, b.ten_vattu, b.unit,
                b.location, ISNULL(b.so_luong, 0), N'CHUA_KIEM'
            FROM dbo.tbl_batch_inv b
            WHERE ISNULL(b.trang_thai_ton, N'1') <> N'0'
              AND ISNULL(b.so_luong, 0) > 0;
        END

        -- Tính tổng số Batch và tổng số lượng snapshot
        DECLARE @BatchCount INT, @TotalSnapshotQty FLOAT;
        SELECT 
            @BatchCount = COUNT(*),
            @TotalSnapshotQty = ISNULL(SUM(soluong_snapshot), 0)
        FROM dbo.tbl_kiemke_batch_chitiet
        WHERE id_kh_batch = @PlanId;

        IF @BatchCount = 0
            THROW 51003, N'Không tìm thấy lô hàng (batch) nào thỏa điều kiện để lập kế hoạch kiểm kê!', 1;

        UPDATE dbo.tbl_kiemke_batch_kh
        SET 
            tong_so_batch = @BatchCount,
            tong_snapshot_qty = @TotalSnapshotQty
        WHERE id_kh_batch = @PlanId;

        COMMIT TRANSACTION;

        SELECT 
            PlanId = @PlanId,
            PlanName = @PlanName,
            TotalBatches = @BatchCount,
            TotalSnapshotQuantity = CONVERT(decimal(19,4), @TotalSnapshotQty),
            CreatedAt = @Now;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
