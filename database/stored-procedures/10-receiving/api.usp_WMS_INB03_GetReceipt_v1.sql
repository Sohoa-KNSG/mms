CREATE OR ALTER PROCEDURE api.usp_WMS_INB03_GetReceipt_v1
    @UserId nvarchar(50),
    @ReceiptId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_nhanhang_po', N'scr_nhanhang_log', N'scr_nhanhang_po_edit', N'scr_nhanhang_po_nhapmoi', N'scr_tam_nhanhang')
    )
        THROW 51001, N'Không có quyền xem hoặc sửa phiếu nhận.', 1;

    SELECT ReceiptId = receipt.ma_phieu, WarehouseCode = receipt.kho,
        CustomerName = receipt.khach_hang, PurchaseOrder = receipt.ma_po,
        StatusCode = receipt.status_nhap, CreatedBy = receipt.user_cre,
        CreatedAt = receipt.time_cre,
        CanEdit = CONVERT(bit, CASE WHEN receipt.status_nhap IN (N'1', N'2')
            AND NOT EXISTS (SELECT 1 FROM dbo.tbl_batch_inv AS batch WHERE batch.id_nhanhang IN
                (SELECT id_nhanhang FROM dbo.tbl_chitiet_nhanhang WHERE ma_phieu = receipt.ma_phieu))
            THEN 1 ELSE 0 END),
        ChangedAt = COALESCE((SELECT MAX(history.audit_time) FROM dbo.tbl_his_phieunhap AS history
            WHERE TRY_CONVERT(int, history.ma_phieu) = receipt.ma_phieu), receipt.time_cre)
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    WHERE receipt.ma_phieu = @ReceiptId;

    SELECT ReceivingLineId = line.id_nhanhang, ReceiptId = line.ma_phieu,
        PurchaseOrderKey = line.ma_khoa_chinh, MaterialId = line.ma_hang,
        MaterialName = material.ten_vattu,
        DocumentQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_chungtu, 0)),
        ReceivedQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        Unit = line.unit, DeliveryDate = line.ngay_giao_hang,
        LineStatusCode = line.status_nhanhang, QcResultCode = line.ket_qua_qc
    FROM dbo.tbl_chitiet_nhanhang AS line
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    WHERE line.ma_phieu = @ReceiptId AND ISNULL(line.status, N'1') <> N'0'
    ORDER BY line.id_nhanhang;

    SELECT ImageId = image.id, Category = image.phan_loai,
        ImageLink = image.link_anh, CreatedAt = image.time_cre
    FROM dbo.tbl_phieu_nhan_hang_image AS image
    WHERE TRY_CONVERT(int, image.ma_phieu) = @ReceiptId
    ORDER BY image.id;
END;
