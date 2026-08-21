CREATE OR ALTER PROCEDURE api.usp_WMS_OUT06_GetPickingQueue_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL,
    @Status nvarchar(20) = NULL, @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Status = LOWER(NULLIF(LTRIM(RTRIM(@Status)), N''));
    IF @Page < 1 SET @Page = 1;
    IF @PageSize < 1 OR @PageSize > 200 SET @PageSize = 50;
    IF @Status IS NOT NULL AND @Status NOT IN (N'ready', N'picking', N'completed')
        THROW 51002, N'Trang thai soan hang khong hop le.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN
            (N'scr_soanhang', N'scr_soanhang_chitiet', N'scr_soanhang_batch')
    ) THROW 51001, N'Khong co quyen xem hang doi soan hang.', 1;

    SELECT RequestId = request.id_phieu_yeucau,
        DepartmentCode = request.bo_phan, RequesterName = request.nguoi_lap_phieu,
        NeededAt = request.thoi_gian_can, ApprovedAt = request.time_duyet,
        DestinationBravoCode = request.ma_bravo_bophan,
        DestinationName = request.ten_bravo_bophan,
        PickingStatusCode = request.status_soanhang,
        PickingStatus = CASE request.status_soanhang WHEN N'0' THEN N'ready'
            WHEN N'1' THEN N'picking' WHEN N'2' THEN N'completed' ELSE N'unknown' END,
        IssueDocumentId = issue.id_phieu_trans, IssueDocumentStatusCode = issue.trang_thai_phieu,
        LineCount = CONVERT(int, ISNULL(summary.LineCount, 0)),
        RequestedQuantity = CONVERT(decimal(18,4), ISNULL(summary.RequestedQuantity, 0)),
        IssuedQuantity = CONVERT(decimal(18,4), ISNULL(issued.IssuedQuantity, 0)),
        ChangedAt = request.time_cre
    FROM dbo.tbl_phieu_yeucau AS request
    OUTER APPLY
    (
        SELECT TOP (1) document.id_phieu_trans, document.trang_thai_phieu
        FROM dbo.tbl_phieu_transaction AS document
        WHERE document.ma_yeucau = request.id_phieu_yeucau
          AND document.nghiep_vu = N'OUT_CON' AND ISNULL(document.trang_thai_phieu, N'0') <> N'0'
        ORDER BY document.id_phieu_trans DESC
    ) AS issue
    OUTER APPLY
    (
        SELECT LineCount = COUNT_BIG(*), RequestedQuantity = SUM(ISNULL(line.so_luong, 0))
        FROM dbo.tbl_phieu_yeucau_chitiet AS line
        WHERE line.id_phieu_yeucau = request.id_phieu_yeucau
    ) AS summary
    OUTER APPLY
    (
        SELECT IssuedQuantity = SUM(ISNULL(transactionLine.so_luong, 0))
        FROM dbo.tbl_transaction AS transactionLine
        INNER JOIN dbo.tbl_phieu_transaction AS document
            ON document.id_phieu_trans = transactionLine.id_phieu_trans
        WHERE document.ma_yeucau = request.id_phieu_yeucau
          AND document.nghiep_vu = N'OUT_CON'
          AND ISNULL(document.trang_thai_phieu, N'0') <> N'0'
          AND transactionLine.nghiep_vu = N'OUT_CON'
    ) AS issued
    WHERE request.trang_thai_phieu = N'4'
      AND request.status_soanhang IN (N'0', N'1', N'2')
      AND (@Status IS NULL OR @Status = CASE request.status_soanhang
            WHEN N'0' THEN N'ready' WHEN N'1' THEN N'picking' WHEN N'2' THEN N'completed' END)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), request.id_phieu_yeucau) LIKE N'%' + @Search + N'%'
           OR request.nguoi_lap_phieu LIKE N'%' + @Search + N'%'
           OR request.ma_bravo_bophan LIKE N'%' + @Search + N'%'
           OR request.ten_bravo_bophan LIKE N'%' + @Search + N'%')
    ORDER BY CASE request.status_soanhang WHEN N'0' THEN 0 WHEN N'1' THEN 1 ELSE 2 END,
        request.time_duyet, request.id_phieu_yeucau
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(*)
    FROM dbo.tbl_phieu_yeucau AS request
    WHERE request.trang_thai_phieu = N'4' AND request.status_soanhang IN (N'0', N'1', N'2')
      AND (@Status IS NULL OR @Status = CASE request.status_soanhang
            WHEN N'0' THEN N'ready' WHEN N'1' THEN N'picking' WHEN N'2' THEN N'completed' END)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), request.id_phieu_yeucau) LIKE N'%' + @Search + N'%'
           OR request.nguoi_lap_phieu LIKE N'%' + @Search + N'%'
           OR request.ma_bravo_bophan LIKE N'%' + @Search + N'%'
           OR request.ten_bravo_bophan LIKE N'%' + @Search + N'%');
END;
