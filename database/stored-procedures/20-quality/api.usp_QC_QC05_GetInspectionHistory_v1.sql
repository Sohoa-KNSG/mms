CREATE OR ALTER PROCEDURE api.usp_QC_QC05_GetInspectionHistory_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @InspectionId int = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN
          (
              N'scr_qc_log_phieu_kiem', N'scr_qc_log_phieu_nhanhang',
              N'scr_qc_log_info_edit'
          )
    )
        THROW 51001, N'Không có quyền xem lịch sử QC.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT
        InspectionId = inspection.id_phieukiem,
        ReceiptId = inspection.id_phieu_nhanhang,
        PurchaseOrder = receipt.ma_po,
        CustomerName = receipt.khach_hang,
        Status = ISNULL(inspection.status_duyet, 0),
        Note = inspection.ghi_chu,
        CreatedBy = inspection.user_cre,
        CreatedAt = inspection.time_cre,
        EvaluatedMaterialCount = COUNT(DISTINCT result.id_nhanhang),
        ResultRowCount = COUNT(result.id_qc)
    FROM dbo.tbl_qc_phieu_kiem AS inspection
    INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt
        ON receipt.ma_phieu = inspection.id_phieu_nhanhang
    LEFT JOIN dbo.tbl_qc_kiem AS result ON result.id_phieukiem = inspection.id_phieukiem
    WHERE @Search IS NULL
       OR CONVERT(nvarchar(50), inspection.id_phieukiem) LIKE N'%' + @Search + N'%'
       OR CONVERT(nvarchar(50), inspection.id_phieu_nhanhang) LIKE N'%' + @Search + N'%'
       OR receipt.ma_po LIKE N'%' + @Search + N'%'
       OR receipt.khach_hang LIKE N'%' + @Search + N'%'
    GROUP BY inspection.id_phieukiem, inspection.id_phieu_nhanhang,
        receipt.ma_po, receipt.khach_hang, inspection.status_duyet,
        inspection.ghi_chu, inspection.user_cre, inspection.time_cre
    ORDER BY inspection.time_cre DESC, inspection.id_phieukiem DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_qc_phieu_kiem AS inspection
    INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt
        ON receipt.ma_phieu = inspection.id_phieu_nhanhang
    WHERE @Search IS NULL
       OR CONVERT(nvarchar(50), inspection.id_phieukiem) LIKE N'%' + @Search + N'%'
       OR CONVERT(nvarchar(50), inspection.id_phieu_nhanhang) LIKE N'%' + @Search + N'%'
       OR receipt.ma_po LIKE N'%' + @Search + N'%'
       OR receipt.khach_hang LIKE N'%' + @Search + N'%';

    ;WITH PageInspections AS
    (
        SELECT InspectionId = inspection.id_phieukiem
        FROM dbo.tbl_qc_phieu_kiem AS inspection
        INNER JOIN dbo.tbl_phieu_nhan_hang AS receipt
            ON receipt.ma_phieu = inspection.id_phieu_nhanhang
        WHERE @Search IS NULL
           OR CONVERT(nvarchar(50), inspection.id_phieukiem) LIKE N'%' + @Search + N'%'
           OR CONVERT(nvarchar(50), inspection.id_phieu_nhanhang) LIKE N'%' + @Search + N'%'
           OR receipt.ma_po LIKE N'%' + @Search + N'%'
           OR receipt.khach_hang LIKE N'%' + @Search + N'%'
        ORDER BY inspection.time_cre DESC, inspection.id_phieukiem DESC
        OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    )
    SELECT
        QcResultId = result.id_qc,
        InspectionId = result.id_phieukiem,
        ReceivingLineId = result.id_nhanhang,
        MaterialId = line.ma_hang,
        MaterialName = material.ten_vattu,
        CriterionId = result.id_tieuchi_kiem,
        CriterionCode = criterion.tieu_chi,
        CriterionName = criterion.mo_ta,
        InspectionType = result.loai_kiem,
        InspectedQuantity = CONVERT(decimal(19,4), result.soluong_kiemtra),
        FailedQuantity = CONVERT(decimal(19,4), result.soluong_khongdat),
        ResultCode = result.ket_qua_qc,
        OverallResultCode = line.ket_qua_qc,
        DefectNote = result.ghi_nhan_loi,
        Unit = result.unit,
        ActorId = result.user_cre,
        ChangedAt = result.time_cre,
        IsLocked = CONVERT(bit, CASE
            WHEN ISNULL(inspection.status_duyet, 0) <> 0 OR line.status_nhanhang = N'5' THEN 1 ELSE 0 END)
    FROM dbo.tbl_qc_kiem AS result
    INNER JOIN dbo.tbl_qc_phieu_kiem AS inspection
        ON inspection.id_phieukiem = result.id_phieukiem
    LEFT JOIN dbo.tbl_chitiet_nhanhang AS line ON line.id_nhanhang = result.id_nhanhang
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    LEFT JOIN dbo.tbl_tieuchi_kiem AS criterion ON criterion.id_tc_kiem = result.id_tieuchi_kiem
    WHERE (@InspectionId IS NOT NULL AND result.id_phieukiem = @InspectionId)
       OR (@InspectionId IS NULL AND result.id_phieukiem IN (SELECT InspectionId FROM PageInspections))
    ORDER BY result.id_phieukiem DESC, result.id_nhanhang, result.id_qc;
END;

