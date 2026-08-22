CREATE OR ALTER PROCEDURE api.usp_WMS_OUT06_GetPickingRequest_v1
    @UserId nvarchar(50), @RequestId int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN
            (N'scr_soanhang', N'scr_soanhang_chitiet', N'scr_soanhang_batch', N'scr_xuatkho_thutuc')
    ) THROW 51001, N'Khong co quyen xem chi tiet soan hang.', 1;

    SELECT RequestId = request.id_phieu_yeucau, DepartmentCode = request.bo_phan,
        RequesterName = request.nguoi_lap_phieu, NeededAt = request.thoi_gian_can,
        ApprovedAt = request.time_duyet, DestinationBravoCode = request.ma_bravo_bophan,
        DestinationName = request.ten_bravo_bophan, RequestStatusCode = request.trang_thai_phieu,
        PickingStatusCode = request.status_soanhang,
        IssueDocumentId = issue.id_phieu_trans, IssueDocumentStatusCode = issue.trang_thai_phieu,
        CanStart = CONVERT(bit, CASE WHEN request.trang_thai_phieu = N'4' AND request.status_soanhang = N'0' THEN 1 ELSE 0 END),
        CanPick = CONVERT(bit, CASE WHEN request.trang_thai_phieu = N'4' AND request.status_soanhang = N'1'
            AND issue.trang_thai_phieu = N'1' THEN 1 ELSE 0 END),
        CanComplete = CONVERT(bit, CASE WHEN request.trang_thai_phieu = N'4' AND request.status_soanhang = N'1'
            AND issue.trang_thai_phieu = N'1' THEN 1 ELSE 0 END),
        ChangedAt = request.time_cre
    FROM dbo.tbl_phieu_yeucau AS request
    OUTER APPLY
    (
        SELECT TOP (1) document.id_phieu_trans, document.trang_thai_phieu
        FROM dbo.tbl_phieu_transaction AS document
        WHERE document.ma_yeucau = request.id_phieu_yeucau AND document.nghiep_vu = N'OUT_CON'
          AND ISNULL(document.trang_thai_phieu, N'0') <> N'0'
        ORDER BY document.id_phieu_trans DESC
    ) AS issue
    WHERE request.id_phieu_yeucau = @RequestId AND request.trang_thai_phieu = N'4';

    SELECT LineId = line.id_chitiet_phieu, MaterialId = line.id_vattu,
        BravoId = line.id_bravo, MaterialName = line.ten_vattu,
        RequestedQuantity = CONVERT(decimal(18,4), ISNULL(line.so_luong, 0)),
        IssuedQuantity = CONVERT(decimal(18,4), ISNULL(issued.IssuedQuantity, 0)),
        RemainingQuantity = CONVERT(decimal(18,4), ISNULL(line.so_luong, 0) - ISNULL(issued.IssuedQuantity, 0)),
        AvailableQuantity = CONVERT(decimal(18,4), ISNULL(stock.AvailableQuantity, 0)),
        Unit = line.unit, DestinationBravoCode = line.bravo_bophan, Note = line.ghi_chu
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    OUTER APPLY
    (
        SELECT IssuedQuantity = SUM(ISNULL(transactionLine.so_luong, 0))
        FROM dbo.tbl_map_xuatkho AS map
        INNER JOIN dbo.tbl_transaction AS transactionLine ON transactionLine.id_trans = map.id_trans
        INNER JOIN dbo.tbl_phieu_transaction AS document ON document.id_phieu_trans = transactionLine.id_phieu_trans
        WHERE map.id_chitiet_phieu = line.id_chitiet_phieu
          AND document.ma_yeucau = @RequestId AND document.nghiep_vu = N'OUT_CON'
          AND ISNULL(document.trang_thai_phieu, N'0') <> N'0'
          AND transactionLine.nghiep_vu = N'OUT_CON'
    ) AS issued
    OUTER APPLY
    (
        SELECT AvailableQuantity = SUM(ISNULL(batch.so_luong, 0))
        FROM dbo.tbl_batch_inv AS batch
        WHERE batch.so_luong > 0
          AND (batch.trang_thai_ton NOT IN (N'0', N'2', N'5', N'00', N'REJECT', N'HOLD', N'HUY', N'LOCK') OR batch.trang_thai_ton IS NULL)
          AND (
              LTRIM(RTRIM(batch.id_vattu)) = LTRIM(RTRIM(line.id_vattu))
              OR (line.id_bravo IS NOT NULL AND LTRIM(RTRIM(batch.id_bravo)) = LTRIM(RTRIM(line.id_bravo)))
              OR (line.id_bravo IS NOT NULL AND LTRIM(RTRIM(batch.id_vattu)) = LTRIM(RTRIM(line.id_bravo)))
              OR (LTRIM(RTRIM(batch.id_bravo)) = LTRIM(RTRIM(line.id_vattu)))
              OR EXISTS (
                  SELECT 1 FROM dbo.tbl_dm_vattu v
                  WHERE (LTRIM(RTRIM(v.id_vattu)) = LTRIM(RTRIM(line.id_vattu)) OR LTRIM(RTRIM(v.id_bravo)) = LTRIM(RTRIM(line.id_vattu)) 
                         OR (line.id_bravo IS NOT NULL AND (LTRIM(RTRIM(v.id_vattu)) = LTRIM(RTRIM(line.id_bravo)) OR LTRIM(RTRIM(v.id_bravo)) = LTRIM(RTRIM(line.id_bravo)))))
                    AND (LTRIM(RTRIM(v.id_vattu)) = LTRIM(RTRIM(batch.id_vattu)) OR LTRIM(RTRIM(v.id_bravo)) = LTRIM(RTRIM(batch.id_bravo)) 
                         OR LTRIM(RTRIM(v.id_vattu)) = LTRIM(RTRIM(batch.id_bravo)) OR LTRIM(RTRIM(v.id_bravo)) = LTRIM(RTRIM(batch.id_vattu)))
              )
          )
    ) AS stock
    WHERE line.id_phieu_yeucau = @RequestId ORDER BY line.id_chitiet_phieu;

    SELECT TransactionId = transactionLine.id_trans, BatchId = transactionLine.id_batch,
        LineId = map.id_chitiet_phieu, MaterialId = transactionLine.id_vattu,
        Quantity = CONVERT(decimal(18,4), ISNULL(transactionLine.so_luong, 0)),
        Unit = transactionLine.unit, LocationCode = batch.location, CreatedAt = transactionLine.time_cre
    FROM dbo.tbl_transaction AS transactionLine
    INNER JOIN dbo.tbl_phieu_transaction AS document ON document.id_phieu_trans = transactionLine.id_phieu_trans
    INNER JOIN dbo.tbl_map_xuatkho AS map ON map.id_trans = transactionLine.id_trans
    LEFT JOIN dbo.tbl_batch_inv AS batch ON batch.id_batch = transactionLine.id_batch
    WHERE document.ma_yeucau = @RequestId AND document.nghiep_vu = N'OUT_CON'
      AND ISNULL(document.trang_thai_phieu, N'0') <> N'0' AND transactionLine.nghiep_vu = N'OUT_CON'
    ORDER BY transactionLine.id_trans DESC;
END;
