CREATE OR ALTER PROCEDURE api.usp_WMS_OUT09_GetIssuePrintData_v1
    @UserId nvarchar(50), @IssueDocumentId int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN
            (N'scr_xuatkho_thutuc', N'scr_xuatkho_phieu_print', N'scr_xuatkho_phieu_print_20')
    ) THROW 51001, N'Khong co quyen in phieu xuat kho.', 1;
    SELECT IssueDocumentId = document.id_phieu_trans, RequestId = request.id_phieu_yeucau,
        OperationCode = document.nghiep_vu, WarehouseFrom = document.ma_kho_from,
        WarehouseTo = document.ma_kho_to, ReceiverName = document.nguoi_nhan,
        CreatedBy = document.user_cre, BravoDocumentNumber = document.so_ct_bravo,
        CreatedAt = document.time_cre, IssueDocumentStatusCode = document.trang_thai_phieu,
        RequesterName = request.nguoi_lap_phieu, DepartmentCode = request.bo_phan,
        DestinationBravoCode = request.ma_bravo_bophan, DestinationName = request.ten_bravo_bophan,
        NeededAt = request.thoi_gian_can
    FROM dbo.tbl_phieu_transaction AS document
    INNER JOIN dbo.tbl_phieu_yeucau AS request ON request.id_phieu_yeucau = document.ma_yeucau
    WHERE document.id_phieu_trans = @IssueDocumentId AND document.nghiep_vu = N'OUT_CON'
      AND ISNULL(document.trang_thai_phieu, N'0') <> N'0';
    SELECT LineId = line.id_chitiet_phieu, MaterialId = line.id_vattu, BravoId = line.id_bravo,
        MaterialName = line.ten_vattu,
        RequestedQuantity = CONVERT(decimal(18,4), ISNULL(line.so_luong, 0)),
        IssuedQuantity = CONVERT(decimal(18,4), ISNULL(issued.IssuedQuantity, 0)),
        Unit = line.unit, Note = line.ghi_chu
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    INNER JOIN dbo.tbl_phieu_transaction AS document ON document.ma_yeucau = line.id_phieu_yeucau
    OUTER APPLY
    (
        SELECT IssuedQuantity = SUM(ISNULL(transactionLine.so_luong, 0))
        FROM dbo.tbl_map_xuatkho AS map
        INNER JOIN dbo.tbl_transaction AS transactionLine ON transactionLine.id_trans = map.id_trans
        WHERE map.id_chitiet_phieu = line.id_chitiet_phieu
          AND transactionLine.id_phieu_trans = @IssueDocumentId AND transactionLine.nghiep_vu = N'OUT_CON'
    ) AS issued
    WHERE document.id_phieu_trans = @IssueDocumentId ORDER BY line.id_chitiet_phieu;
    SELECT TransactionId = transactionLine.id_trans, BatchId = transactionLine.id_batch,
        LineId = map.id_chitiet_phieu, MaterialId = transactionLine.id_vattu,
        MaterialName = transactionLine.ten_vattu,
        Quantity = CONVERT(decimal(18,4), ISNULL(transactionLine.so_luong, 0)),
        Unit = transactionLine.unit, LocationCode = batch.location, CreatedAt = transactionLine.time_cre
    FROM dbo.tbl_transaction AS transactionLine
    INNER JOIN dbo.tbl_map_xuatkho AS map ON map.id_trans = transactionLine.id_trans
    LEFT JOIN dbo.tbl_batch_inv AS batch ON batch.id_batch = transactionLine.id_batch
    WHERE transactionLine.id_phieu_trans = @IssueDocumentId AND transactionLine.nghiep_vu = N'OUT_CON'
    ORDER BY transactionLine.id_trans;
END;
