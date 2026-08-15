CREATE OR ALTER PROCEDURE api.usp_QC_QC04_GetEvaluation_v1
    @UserId nvarchar(50),
    @InspectionId int,
    @ReceivingLineId int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_qc_danhgia_vattu', N'scr_qc_info_danhgia')
    )
        THROW 51001, N'Không có quyền đánh giá vật tư.', 1;

    SELECT
        InspectionId = inspection.id_phieukiem,
        ReceiptId = inspection.id_phieu_nhanhang,
        Status = ISNULL(inspection.status_duyet, 0),
        Note = inspection.ghi_chu,
        CreatedBy = inspection.user_cre,
        CreatedAt = inspection.time_cre,
        PurchaseOrder = receipt.ma_po,
        CustomerName = receipt.khach_hang
    FROM dbo.tbl_qc_phieu_kiem AS inspection
    INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt
        ON receipt.ma_phieu = inspection.id_phieu_nhanhang
    WHERE inspection.id_phieukiem = @InspectionId;

    SELECT
        ReceivingLineId = line.id_nhanhang,
        MaterialId = line.ma_hang,
        MaterialName = material.ten_vattu,
        QuantityReceived = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        Unit = COALESCE(line.unit, material.unit),
        OverallResultCode = line.ket_qua_qc,
        CheckId = material.ma_kiem
    FROM dbo.tbl_qc_phieu_kiem AS inspection
    INNER JOIN dbo.tbl_chitiet_nhanhang AS line
        ON line.ma_phieu = inspection.id_phieu_nhanhang
    INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    WHERE inspection.id_phieukiem = @InspectionId
      AND material.ma_kiem IS NOT NULL
      AND (@ReceivingLineId IS NULL OR line.id_nhanhang = @ReceivingLineId)
    ORDER BY line.id_nhanhang;

    SELECT
        ReceivingLineId = line.id_nhanhang,
        CriterionId = criterion.id_tc_kiem,
        CriterionCode = criterion.tieu_chi,
        CriterionName = criterion.mo_ta,
        Specification = criterion.thong_so,
        SampleImage = criterion.hinh_mau,
        ResultCode = currentResult.ket_qua_qc,
        DefectNote = currentResult.ghi_nhan_loi
    FROM dbo.tbl_qc_phieu_kiem AS inspection
    INNER JOIN dbo.tbl_chitiet_nhanhang AS line
        ON line.ma_phieu = inspection.id_phieu_nhanhang
    INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    INNER JOIN dbo.tbl_tieuchi_kiem AS criterion ON criterion.ma_kiem = material.ma_kiem
    OUTER APPLY
    (
        SELECT TOP (1) result.ket_qua_qc, result.ghi_nhan_loi
        FROM dbo.tbl_qc_kiem AS result
        WHERE result.id_phieukiem = @InspectionId
          AND result.id_nhanhang = line.id_nhanhang
          AND result.id_tieuchi_kiem = criterion.id_tc_kiem
        ORDER BY result.id_qc DESC
    ) AS currentResult
    WHERE inspection.id_phieukiem = @InspectionId
      AND (@ReceivingLineId IS NULL OR line.id_nhanhang = @ReceivingLineId)
    ORDER BY line.id_nhanhang, criterion.id_tc_kiem;
END;

