-- ============================================================================
-- SP: GHI NHẬN SỐ ĐẾM HIỆN TRƯỜNG TỪ PDA (NHÂN VIÊN KHO - UC-18 / INV-06)
-- ============================================================================

USE [MMS];
GO

SET XACT_ABORT ON;
GO

CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_LogBatchCount_v1
    @UserId          NVARCHAR(50),
    @PlanId          INT,
    @BatchId         INT,
    @ActualQuantity  FLOAT,
    @LocationCode    NVARCHAR(50) = NULL,
    @Note            NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Kiểm tra kế hoạch
    DECLARE @PlanStatus INT;
    SELECT @PlanStatus = trang_thai FROM dbo.tbl_kiemke_batch_kh WHERE id_kh_batch = @PlanId;

    IF @PlanStatus IS NULL
        THROW 51001, N'Kế hoạch kiểm kê batch không tồn tại!', 1;

    IF @PlanStatus <> 1
        THROW 51002, N'Kế hoạch kiểm kê này đã được đóng hoặc bị hủy, không thể ghi nhận thêm!', 1;

    IF @ActualQuantity < 0
        THROW 51003, N'Số lượng đếm không được là số âm!', 1;

    -- 2. Tìm dòng chi tiết của Lô trong kế hoạch
    DECLARE @DetailId INT, @SnapshotQty FLOAT, @Unit NVARCHAR(50);
    SELECT 
        @DetailId = id_chitiet,
        @SnapshotQty = soluong_snapshot,
        @Unit = unit
    FROM dbo.tbl_kiemke_batch_chitiet
    WHERE id_kh_batch = @PlanId AND id_batch = @BatchId;

    IF @DetailId IS NULL
        THROW 51004, N'Lô hàng này không nằm trong danh sách kiểm kê của kế hoạch!', 1;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @Now DATETIME = GETDATE();

        -- Ghi log lượt đếm
        INSERT INTO dbo.tbl_kiemke_batch_log (
            id_chitiet, id_kh_batch, id_batch, so_luong_dem,
            unit, vi_tri_quet, ghi_chu, user_cre, time_cre
        )
        VALUES (
            @DetailId, @PlanId, @BatchId, @ActualQuantity,
            @Unit, @LocationCode, @Note, @UserId, @Now
        );

        -- Cập nhật số lượng đếm thực tế và chênh lệch trên dòng chi tiết
        DECLARE @Diff FLOAT = @ActualQuantity - @SnapshotQty;
        DECLARE @AuditStatus NVARCHAR(50);

        IF ABS(@Diff) <= 0.0001
            SET @AuditStatus = N'KHOP';
        ELSE IF @Diff > 0
            SET @AuditStatus = N'LECH_THUA';
        ELSE
            SET @AuditStatus = N'LECH_THIEU';

        UPDATE dbo.tbl_kiemke_batch_chitiet
        SET 
            soluong_thucte = @ActualQuantity,
            chenh_lech = @Diff,
            location_thucte = COALESCE(@LocationCode, location_snapshot),
            trang_thai_kiem = @AuditStatus,
            user_dem_cuoi = @UserId,
            time_dem_cuoi = @Now
        WHERE id_chitiet = @DetailId;

        -- Cập nhật thống kê kế hoạch tổng
        UPDATE k
        SET 
            so_batch_da_kiem = (SELECT COUNT(*) FROM dbo.tbl_kiemke_batch_chitiet WHERE id_kh_batch = @PlanId AND soluong_thucte IS NOT NULL),
            so_batch_lech = (SELECT COUNT(*) FROM dbo.tbl_kiemke_batch_chitiet WHERE id_kh_batch = @PlanId AND trang_thai_kiem IN (N'LECH_THUA', N'LECH_THIEU')),
            tong_thucte_qty = ISNULL((SELECT SUM(soluong_thucte) FROM dbo.tbl_kiemke_batch_chitiet WHERE id_kh_batch = @PlanId AND soluong_thucte IS NOT NULL), 0),
            tong_lech_qty = ISNULL((SELECT SUM(chenh_lech) FROM dbo.tbl_kiemke_batch_chitiet WHERE id_kh_batch = @PlanId AND soluong_thucte IS NOT NULL), 0)
        FROM dbo.tbl_kiemke_batch_kh k
        WHERE k.id_kh_batch = @PlanId;

        COMMIT TRANSACTION;

        SELECT 
            PlanId = @PlanId,
            DetailId = @DetailId,
            BatchId = @BatchId,
            ActualQuantity = CONVERT(decimal(19,4), @ActualQuantity),
            DifferenceQuantity = CONVERT(decimal(19,4), @Diff),
            AuditStatus = @AuditStatus,
            CountedBy = @UserId,
            CountedAt = @Now;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
