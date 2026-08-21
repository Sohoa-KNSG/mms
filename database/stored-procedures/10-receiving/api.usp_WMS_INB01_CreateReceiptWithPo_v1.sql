CREATE OR ALTER PROCEDURE api.usp_WMS_INB01_CreateReceiptWithPo_v1
    @UserId nvarchar(50),
    @PurchaseOrder nvarchar(50),
    @WarehouseCode nvarchar(50),
    @Lines api.ReceivingLineItem_v1 READONLY,
    @Images api.ReceiptImageItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_nhanhang_po', N'scr_nhanhang_po_chitiet', N'scr_nhanhang_po_nhapmoi')
    )
        THROW 51001, N'Không có quyền nhận hàng theo PO.', 1;

    SET @PurchaseOrder = NULLIF(LTRIM(RTRIM(@PurchaseOrder)), N'');
    SET @WarehouseCode = NULLIF(LTRIM(RTRIM(@WarehouseCode)), N'');
    IF @PurchaseOrder IS NULL OR @WarehouseCode IS NULL THROW 51002, N'PO và kho là bắt buộc.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Lines) THROW 51002, N'Phiếu nhận phải có ít nhất một dòng.', 1;
    IF EXISTS (SELECT 1 FROM @Lines WHERE ReceivedQuantity <= 0 OR DocumentQuantity <= 0)
        THROW 51002, N'Số lượng chứng từ và thực nhận phải lớn hơn 0.', 1;
    IF EXISTS (SELECT PurchaseOrderKey FROM @Lines GROUP BY PurchaseOrderKey HAVING COUNT(*) > 1)
        THROW 51002, N'Mỗi dòng PO chỉ được nhận một lần trong yêu cầu.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @ReceiptId int;
    DECLARE @CustomerCode nvarchar(50);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT TOP (1) @CustomerCode = po.Ma_khach_hang
        FROM dbo.tbl_ChiTietDDH AS po WITH (UPDLOCK, HOLDLOCK)
        WHERE po.So_DDH_HD = @PurchaseOrder;
        IF @CustomerCode IS NULL THROW 51004, N'Không tìm thấy PO.', 1;

        IF EXISTS
        (
            SELECT 1
            FROM @Lines AS input
            LEFT JOIN dbo.tbl_ChiTietDDH AS po WITH (UPDLOCK, HOLDLOCK)
              ON po.Ma_khoa_chinh = input.PurchaseOrderKey
             AND po.So_DDH_HD = @PurchaseOrder
             AND po.Ma_hang_hoa = input.MaterialId
            OUTER APPLY
            (
                SELECT ReceivedQuantity = SUM(ISNULL(line.soluong_thucnhan, 0))
                FROM dbo.tbl_chitiet_nhanhang AS line WITH (UPDLOCK, HOLDLOCK)
                WHERE line.ma_khoa_chinh = input.PurchaseOrderKey
                  AND ISNULL(line.status, N'1') <> N'0'
            ) AS received
            WHERE po.Ma_khoa_chinh IS NULL
               OR input.ReceivedQuantity > CONVERT(decimal(19,4),
                    ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0))
        )
            THROW 51022, N'Dòng PO không hợp lệ hoặc số lượng nhận vượt số lượng còn lại.', 1;

        INSERT dbo.tbl_phieu_nhan_hang (kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap)
        VALUES (@WarehouseCode, @CustomerCode, @UserId, @Now, @PurchaseOrder, NULL, N'2');
        SET @ReceiptId = CONVERT(int, SCOPE_IDENTITY());

        INSERT dbo.tbl_chitiet_nhanhang
            (status_nhanhang, ma_hang, soluong_chungtu, soluong_thucnhan, time_cre,
             status, ma_phieu, ma_khoa_chinh, unit, ngay_giao_hang)
        SELECT N'1', line.MaterialId, CONVERT(float, line.DocumentQuantity),
            CONVERT(float, line.ReceivedQuantity), @Now, N'1', @ReceiptId,
            line.PurchaseOrderKey, NULLIF(LTRIM(RTRIM(line.Unit)), N''), COALESCE(line.DeliveryDate, CONVERT(date, @Now))
        FROM @Lines AS line;

        INSERT dbo.tbl_phieu_nhan_hang_image (ma_phieu, phan_loai, link_anh, time_cre)
        SELECT CONVERT(nvarchar(50), @ReceiptId), image.Category, image.ImageLink, @Now
        FROM @Images AS image
        WHERE NULLIF(LTRIM(RTRIM(image.ImageLink)), N'') IS NOT NULL;

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap, action_type, audit_time)
        VALUES (CONVERT(nvarchar(50), @ReceiptId), @WarehouseCode, @CustomerCode, @UserId,
            @Now, @PurchaseOrder, NULL, N'2', N'CREATE', @Now);

        INSERT dbo.tbl_his_chitiet_nhanhang
            (id_nhanhang, status_nhanhang, ma_hang, soluong_chungtu, soluong_thucnhan,
             time_cre, status, ma_phieu, ma_khoa_chinh, action_type, audit_time, unit)
        SELECT line.id_nhanhang, line.status_nhanhang, line.ma_hang, line.soluong_chungtu,
            line.soluong_thucnhan, line.time_cre, line.status, line.ma_phieu, line.ma_khoa_chinh,
            N'INSERT', @Now, line.unit
        FROM dbo.tbl_chitiet_nhanhang AS line
        WHERE line.ma_phieu = @ReceiptId;

        COMMIT TRANSACTION;
        SELECT ReceiptId = @ReceiptId, StatusCode = N'2', LineCount = (SELECT COUNT(*) FROM @Lines), CreatedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

