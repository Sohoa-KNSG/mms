CREATE OR ALTER PROCEDURE api.usp_WMS_RET03_GetReturnDocuments_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_nhaptra_tachbatch_intem')
        THROW 51001, N'Khong co quyen tach batch nhap tra.', 1;
    SELECT TransactionDocumentId = document.id_phieu_trans, ReturnId = document.ma_yeucau,
        DestinationCode = document.ma_kho_to, DestinationName = internalReturn.ten_bravo_bophan,
        CreatedAt = document.time_cre, StatusCode = document.trang_thai_phieu,
        BatchCount = CONVERT(int, COUNT_BIG(DISTINCT transactionLine.id_batch)),
        TotalQuantity = CONVERT(decimal(18,4), ISNULL(SUM(ISNULL(transactionLine.so_luong, 0)), 0))
    FROM dbo.tbl_phieu_transaction AS document
    INNER JOIN dbo.tbl_transaction AS transactionLine ON transactionLine.id_phieu_trans = document.id_phieu_trans
    LEFT JOIN dbo.tbl_batch_inv AS batch ON batch.id_batch = transactionLine.id_batch
    LEFT JOIN dbo.tbl_phieu_nhap_noibo AS internalReturn ON internalReturn.id_phieu_noibo = document.ma_yeucau
    WHERE document.nghiep_vu = N'IN_PROD' AND document.trang_thai_phieu = N'2'
      AND transactionLine.nghiep_vu = N'IN_PROD'
      AND (internalReturn.id_phieu_noibo IS NOT NULL OR batch.id_nhanhang = 9788)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), document.id_phieu_trans) LIKE N'%' + @Search + N'%'
           OR CONVERT(nvarchar(20), document.ma_yeucau) LIKE N'%' + @Search + N'%'
           OR document.ma_kho_to LIKE N'%' + @Search + N'%')
    GROUP BY document.id_phieu_trans, document.ma_yeucau, document.ma_kho_to,
        internalReturn.ten_bravo_bophan, document.time_cre, document.trang_thai_phieu
    ORDER BY document.id_phieu_trans DESC;
END;
