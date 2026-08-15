CREATE OR ALTER PROCEDURE api.usp_WMS_INB06_GetPurchaseOrderMatches_v1
    @UserId nvarchar(50),
    @ReceiptId int,
    @Search nvarchar(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_nhapkho_update_nhieu_po'
    )
        THROW 51001, N'Không có quyền cập nhật nhiều PO.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    IF NOT EXISTS
    (
        SELECT 1 FROM dbo.tbl_phieu_nhan_hang
        WHERE ma_phieu = @ReceiptId AND ma_po = N'khong_po' AND status_nhap = N'2'
    )
        THROW 51004, N'Không tìm thấy phiếu không PO đang chờ kiểm.', 1;

    SELECT ReceivingLineId = line.id_nhanhang, MaterialId = line.ma_hang,
        MaterialName = material.ten_vattu,
        ReceivedQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        Unit = COALESCE(line.unit, material.unit)
    FROM dbo.tbl_chitiet_nhanhang AS line
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    WHERE line.ma_phieu = @ReceiptId AND ISNULL(line.status, N'1') <> N'0'
    ORDER BY line.id_nhanhang;

    SELECT ReceivingLineId = line.id_nhanhang, PurchaseOrder = po.So_DDH_HD,
        PurchaseOrderKey = po.Ma_khoa_chinh, CustomerCode = po.Ma_khach_hang,
        MaterialId = po.Ma_hang_hoa, MaterialName = po.Ten_hang_hoa,
        Unit = material.unit,
        RemainingQuantity = CONVERT(decimal(19,4),
            ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0)),
        DeliveryDate = CONVERT(date, po.Ngay_giao_DDH)
    FROM dbo.tbl_chitiet_nhanhang AS line
    INNER JOIN dbo.tbl_ChiTietDDH AS po ON po.Ma_hang_hoa = line.ma_hang
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = po.Ma_hang_hoa
    OUTER APPLY
    (
        SELECT ReceivedQuantity = SUM(ISNULL(otherLine.soluong_thucnhan, 0))
        FROM dbo.tbl_chitiet_nhanhang AS otherLine
        WHERE otherLine.ma_khoa_chinh = po.Ma_khoa_chinh
          AND otherLine.ma_phieu <> @ReceiptId AND ISNULL(otherLine.status, N'1') <> N'0'
    ) AS received
    WHERE line.ma_phieu = @ReceiptId AND ISNULL(line.status, N'1') <> N'0'
      AND ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0) >= ISNULL(line.soluong_thucnhan, 0)
      AND (@Search IS NULL OR po.So_DDH_HD LIKE N'%' + @Search + N'%'
        OR po.Ma_khach_hang LIKE N'%' + @Search + N'%')
    ORDER BY line.id_nhanhang, po.Ngay_giao_DDH, po.So_DDH_HD;
END;

