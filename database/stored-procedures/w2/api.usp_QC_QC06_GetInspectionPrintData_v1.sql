CREATE OR ALTER PROCEDURE api.usp_QC_QC06_GetInspectionPrintData_v1
    @UserId nvarchar(50),
    @InspectionId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_qc_phieukiem_print'
    )
        THROW 51001, N'Không có quyền in phiếu kiểm.', 1;

    DECLARE @ReceiptId int =
        (SELECT id_phieu_nhanhang FROM dbo.tbl_qc_phieu_kiem WHERE id_phieukiem = @InspectionId);
    IF @ReceiptId IS NULL
        THROW 51004, N'Không tìm thấy phiếu kiểm.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_qc_kiem WHERE id_phieukiem = @InspectionId)
        THROW 51022, N'Phiếu kiểm chưa có kết quả.', 1;
    IF EXISTS
    (
        SELECT 1
        FROM dbo.tbl_chitiet_nhanhang AS line
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        WHERE line.ma_phieu = @ReceiptId
          AND material.ma_kiem IS NOT NULL
          AND line.ket_qua_qc IS NULL
    )
        THROW 51022, N'Phiếu kiểm còn vật tư chưa có kết luận.', 1;

    SELECT
        InspectionId = inspection.id_phieukiem,
        ReceiptId = inspection.id_phieu_nhanhang,
        PurchaseOrder = receipt.ma_po,
        CustomerName = receipt.khach_hang,
        WarehouseCode = receipt.kho,
        Note = inspection.ghi_chu,
        CreatedBy = inspection.user_cre,
        CreatedByName = COALESCE(userDetail.ho_ten_nv, manager.ho_ten, inspection.user_cre),
        CreatedAt = inspection.time_cre,
        PrintedAt = SYSDATETIME()
    FROM dbo.tbl_qc_phieu_kiem AS inspection
    INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt
        ON receipt.ma_phieu = inspection.id_phieu_nhanhang
    LEFT JOIN dbo.tbl_dm_user AS userDetail ON userDetail.user_n = inspection.user_cre
    LEFT JOIN dbo.tbl_user_ql AS manager ON manager.user_ql = inspection.user_cre
    WHERE inspection.id_phieukiem = @InspectionId;

    SELECT DISTINCT
        ReceivingLineId = line.id_nhanhang,
        MaterialId = line.ma_hang,
        MaterialName = material.ten_vattu,
        QuantityReceived = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        Unit = COALESCE(line.unit, material.unit),
        OverallResultCode = line.ket_qua_qc,
        OverallResultLabel = CASE line.ket_qua_qc
            WHEN N'1' THEN N'Đạt' WHEN N'2' THEN N'Không Đạt'
            WHEN N'3' THEN N'Nhân Nhượng' END,
        InspectionType = result.loai_kiem,
        InspectedQuantity = CONVERT(decimal(19,4), result.soluong_kiemtra),
        FailedQuantity = CONVERT(decimal(19,4), result.soluong_khongdat)
    FROM dbo.tbl_qc_kiem AS result
    INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.id_nhanhang = result.id_nhanhang
    INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    WHERE result.id_phieukiem = @InspectionId
    ORDER BY line.id_nhanhang;

    SELECT
        ReceivingLineId = result.id_nhanhang,
        CriterionId = result.id_tieuchi_kiem,
        CriterionCode = criterion.tieu_chi,
        CriterionName = criterion.mo_ta,
        Specification = criterion.thong_so,
        ResultCode = result.ket_qua_qc,
        DefectNote = result.ghi_nhan_loi
    FROM dbo.tbl_qc_kiem AS result
    LEFT JOIN dbo.tbl_tieuchi_kiem AS criterion ON criterion.id_tc_kiem = result.id_tieuchi_kiem
    WHERE result.id_phieukiem = @InspectionId
    ORDER BY result.id_nhanhang, result.id_qc;
END;

