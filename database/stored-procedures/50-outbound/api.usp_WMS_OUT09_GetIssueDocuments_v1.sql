CREATE OR ALTER PROCEDURE api.usp_WMS_OUT09_GetIssueDocuments_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL, @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 OR @PageSize > 200 SET @PageSize = 50;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN
            (N'scr_xuatkho_thutuc', N'scr_xuatkho_phieu_print', N'scr_xuatkho_phieu_print_20')
    ) THROW 51001, N'Khong co quyen xem phieu xuat kho.', 1;
    SELECT IssueDocumentId = document.id_phieu_trans, RequestId = request.id_phieu_yeucau,
        RequesterName = request.nguoi_lap_phieu, DepartmentCode = request.bo_phan,
        DestinationBravoCode = request.ma_bravo_bophan, DestinationName = request.ten_bravo_bophan,
        NeededAt = request.thoi_gian_can, CreatedAt = document.time_cre,
        IssueDocumentStatusCode = document.trang_thai_phieu,
        TotalQuantity = CONVERT(decimal(18,4), ISNULL(summary.TotalQuantity, 0)),
        BatchCount = CONVERT(int, ISNULL(summary.BatchCount, 0))
    FROM dbo.tbl_phieu_transaction AS document
    INNER JOIN dbo.tbl_phieu_yeucau AS request ON request.id_phieu_yeucau = document.ma_yeucau
    OUTER APPLY
    (
        SELECT TotalQuantity = SUM(ISNULL(transactionLine.so_luong, 0)),
            BatchCount = COUNT_BIG(*)
        FROM dbo.tbl_transaction AS transactionLine
        WHERE transactionLine.id_phieu_trans = document.id_phieu_trans
          AND transactionLine.nghiep_vu = N'OUT_CON'
    ) AS summary
    WHERE document.nghiep_vu = N'OUT_CON' AND ISNULL(document.trang_thai_phieu, N'0') <> N'0'
      AND (@Search IS NULL OR CONVERT(nvarchar(20), document.id_phieu_trans) LIKE N'%' + @Search + N'%'
           OR CONVERT(nvarchar(20), request.id_phieu_yeucau) LIKE N'%' + @Search + N'%'
           OR request.nguoi_lap_phieu LIKE N'%' + @Search + N'%')
    ORDER BY document.id_phieu_trans DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT TotalCount = COUNT_BIG(*)
    FROM dbo.tbl_phieu_transaction AS document
    INNER JOIN dbo.tbl_phieu_yeucau AS request ON request.id_phieu_yeucau = document.ma_yeucau
    WHERE document.nghiep_vu = N'OUT_CON' AND ISNULL(document.trang_thai_phieu, N'0') <> N'0'
      AND (@Search IS NULL OR CONVERT(nvarchar(20), document.id_phieu_trans) LIKE N'%' + @Search + N'%'
           OR CONVERT(nvarchar(20), request.id_phieu_yeucau) LIKE N'%' + @Search + N'%'
           OR request.nguoi_lap_phieu LIKE N'%' + @Search + N'%');
END;
