-- ============================================================================
-- SP: LẤY CHI TIẾT KẾ HOẠCH & BẢNG ĐỐI SOÁT KIỂM KÊ BATCH (UC-18 / INV-06)
-- ============================================================================

USE [MMS];
GO

SET XACT_ABORT ON;
GO

CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_GetBatchAuditPlanDetail_v1
    @UserId          NVARCHAR(50),
    @PlanId          INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Result Set 1: Thông tin kế hoạch chung
    SELECT
        PlanId = k.id_kh_batch,
        PlanName = k.ten_kehoach,
        WarehouseCode = k.ma_kho,
        AuditType = k.loai_kiemke,
        StatusCode = k.trang_thai,
        TotalBatches = k.tong_so_batch,
        CountedBatches = k.so_batch_da_kiem,
        DiscrepantBatches = k.so_batch_lech,
        TotalSnapshotQuantity = CONVERT(decimal(19,4), k.tong_snapshot_qty),
        TotalActualQuantity = CONVERT(decimal(19,4), k.tong_thucte_qty),
        TotalDifferenceQuantity = CONVERT(decimal(19,4), k.tong_lech_qty),
        CreatedBy = k.user_cre,
        CreatedAt = k.time_cre,
        ApprovedBy = k.user_approve,
        ApprovedAt = k.time_approve,
        ApprovalNote = k.ghi_chu_duyet,
        Note = k.ghi_chu
    FROM dbo.tbl_kiemke_batch_kh k
    WHERE k.id_kh_batch = @PlanId;

    -- Result Set 2: Danh sách chi tiết các Lô & Bảng đối soát 3 chiều
    SELECT
        DetailId = d.id_chitiet,
        PlanId = d.id_kh_batch,
        BatchId = d.id_batch,
        MaterialId = d.id_vattu,
        BravoId = d.id_bravo,
        MaterialName = d.ten_vattu,
        Unit = d.unit,
        LocationSnapshot = d.location_snapshot,
        LocationActual = d.location_thucte,
        CurrentInventoryQuantity = CONVERT(decimal(19,4), ISNULL(b.so_luong, 0)),
        CurrentLocation = b.location,
        SnapshotQuantity = CONVERT(decimal(19,4), d.soluong_snapshot),
        ActualQuantity = CONVERT(decimal(19,4), d.soluong_thucte),
        DifferenceQuantity = CONVERT(decimal(19,4), d.chenh_lech),
        AuditStatus = d.trang_thai_kiem, -- CHUA_KIEM, KHOP, LECH_THUA, LECH_THIEU, YEU_CAU_DEM_LAI
        VarianceReason = d.ly_do_lech,
        LastCountedBy = d.user_dem_cuoi,
        LastCountedAt = d.time_dem_cuoi
    FROM dbo.tbl_kiemke_batch_chitiet d
    LEFT JOIN dbo.tbl_batch_inv b ON b.id_batch = d.id_batch
    WHERE d.id_kh_batch = @PlanId
    ORDER BY 
        CASE d.trang_thai_kiem 
            WHEN N'LECH_THIEU' THEN 1 
            WHEN N'LECH_THUA' THEN 2 
            WHEN N'CHUA_KIEM' THEN 3 
            ELSE 4 END, 
        d.id_chitiet ASC;

    -- Result Set 3: Lịch sử quét đếm thực tế của các nhân viên PDA
    SELECT
        LogId = l.id_log,
        DetailId = l.id_chitiet,
        PlanId = l.id_kh_batch,
        BatchId = l.id_batch,
        CountedQuantity = CONVERT(decimal(19,4), l.so_luong_dem),
        Unit = l.unit,
        LocationScanned = l.vi_tri_quet,
        Note = l.ghi_chu,
        CountedBy = l.user_cre,
        CountedAt = l.time_cre
    FROM dbo.tbl_kiemke_batch_log l
    WHERE l.id_kh_batch = @PlanId
    ORDER BY l.time_cre DESC, l.id_log DESC;
END;
GO
