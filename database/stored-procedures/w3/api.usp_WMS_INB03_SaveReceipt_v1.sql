CREATE OR ALTER PROCEDURE api.usp_WMS_INB03_SaveReceipt_v1
    @UserId nvarchar(50),
    @ReceiptId int,
    @WarehouseCode nvarchar(50),
    @CustomerName nvarchar(50),
    @PurchaseOrder nvarchar(50),
    @Action nvarchar(20),
    @ExpectedStatus nvarchar(50),
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
          AND ScreenCode IN (N'scr_nhanhang_po', N'scr_nhanhang_log', N'scr_nhanhang_po_edit', N'scr_nhanhang_po_nhapmoi', N'scr_tam_nhanhang')
    )
        THROW 51001, N'Không có quyền sửa phiếu nhận.', 1;

    SET @Action = UPPER(NULLIF(LTRIM(RTRIM(@Action)), N''));
    SET @WarehouseCode = NULLIF(LTRIM(RTRIM(@WarehouseCode)), N'');
    SET @CustomerName = NULLIF(LTRIM(RTRIM(@CustomerName)), N'');
    SET @PurchaseOrder = NULLIF(LTRIM(RTRIM(@PurchaseOrder)), N'');
    IF @Action NOT IN (N'SAVE', N'CONFIRM', N'CANCEL') THROW 51002, N'Thao tác phiếu không hợp lệ.', 1;
    IF @Action <> N'CANCEL' AND (@WarehouseCode IS NULL OR @CustomerName IS NULL OR @PurchaseOrder IS NULL)
        THROW 51002, N'Kho, nhà cung cấp và loại PO là bắt buộc.', 1;
    IF @Action <> N'CANCEL' AND NOT EXISTS (SELECT 1 FROM @Lines)
        THROW 51002, N'Phiếu nhận phải có ít nhất một dòng.', 1;
    IF EXISTS (SELECT 1 FROM @Lines WHERE ReceivedQuantity <= 0 OR DocumentQuantity <= 0)
        THROW 51002, N'Số lượng phải lớn hơn 0.', 1;
    IF EXISTS (SELECT ReceivingLineId FROM @Lines WHERE ReceivingLineId IS NOT NULL GROUP BY ReceivingLineId HAVING COUNT(*) > 1)
        THROW 51002, N'Dòng nhận hàng bị lặp.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @CurrentStatus nvarchar(50);
    DECLARE @NewStatus nvarchar(50) = CASE @Action WHEN N'SAVE' THEN N'1' WHEN N'CONFIRM' THEN N'2' ELSE N'0' END;

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CurrentStatus = status_nhap
        FROM dbo.tbl_phieu_nhan_hang WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_phieu = @ReceiptId;
        IF @CurrentStatus IS NULL THROW 51004, N'Không tìm thấy phiếu nhận.', 1;
        IF @CurrentStatus <> @ExpectedStatus THROW 51009, N'Phiếu đã thay đổi. Hãy tải lại dữ liệu.', 1;
        IF @CurrentStatus NOT IN (N'1', N'2') THROW 51022, N'Chỉ phiếu nháp hoặc chờ kiểm mới được sửa.', 1;
        IF EXISTS
        (
            SELECT 1 FROM dbo.tbl_batch_inv AS batch
            WHERE batch.id_nhanhang IN (SELECT id_nhanhang FROM dbo.tbl_chitiet_nhanhang WHERE ma_phieu = @ReceiptId)
        )
            THROW 51022, N'Phiếu đã phát sinh batch nên không thể sửa.', 1;
        IF EXISTS
        (
            SELECT 1 FROM @Lines AS input
            WHERE input.ReceivingLineId IS NOT NULL
              AND NOT EXISTS (SELECT 1 FROM dbo.tbl_chitiet_nhanhang AS line
                  WHERE line.id_nhanhang = input.ReceivingLineId AND line.ma_phieu = @ReceiptId)
        )
            THROW 51004, N'Có dòng nhận hàng không thuộc phiếu.', 1;

        IF @Action <> N'CANCEL' AND @PurchaseOrder NOT IN (N'khong_po', N'nhieu_po') AND EXISTS
        (
            SELECT 1
            FROM @Lines AS input
            LEFT JOIN dbo.tbl_ChiTietDDH AS po WITH (UPDLOCK, HOLDLOCK)
              ON po.Ma_khoa_chinh = input.PurchaseOrderKey
             AND po.So_DDH_HD = @PurchaseOrder
             AND po.Ma_hang_hoa = input.MaterialId
            OUTER APPLY
            (
                SELECT ReceivedQuantity = SUM(ISNULL(otherLine.soluong_thucnhan, 0))
                FROM dbo.tbl_chitiet_nhanhang AS otherLine WITH (UPDLOCK, HOLDLOCK)
                WHERE otherLine.ma_khoa_chinh = input.PurchaseOrderKey
                  AND otherLine.ma_phieu <> @ReceiptId
                  AND ISNULL(otherLine.status, N'1') <> N'0'
            ) AS received
            WHERE po.Ma_khoa_chinh IS NULL
               OR input.ReceivedQuantity > CONVERT(decimal(19,4),
                  ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0))
        )
            THROW 51022, N'Dòng PO không hợp lệ hoặc số lượng vượt phần còn lại.', 1;

        IF @Action = N'CANCEL'
        BEGIN
            UPDATE dbo.tbl_chitiet_nhanhang SET status = N'0' WHERE ma_phieu = @ReceiptId;
        END
        ELSE
        BEGIN
            UPDATE target
            SET status_nhanhang = N'1', ma_hang = input.MaterialId,
                soluong_chungtu = CONVERT(float, input.DocumentQuantity),
                soluong_thucnhan = CONVERT(float, input.ReceivedQuantity), status = N'1',
                ma_khoa_chinh = COALESCE(input.PurchaseOrderKey,
                    LEFT(CONCAT(N'NOPO:', @ReceiptId, N':', input.MaterialId), 150)),
                unit = NULLIF(LTRIM(RTRIM(input.Unit)), N''),
                ngay_giao_hang = COALESCE(input.DeliveryDate, CONVERT(date, @Now))
            FROM dbo.tbl_chitiet_nhanhang AS target
            INNER JOIN @Lines AS input ON input.ReceivingLineId = target.id_nhanhang
            WHERE target.ma_phieu = @ReceiptId;

            INSERT dbo.tbl_chitiet_nhanhang
                (status_nhanhang, ma_hang, soluong_chungtu, soluong_thucnhan, time_cre,
                 status, ma_phieu, ma_khoa_chinh, unit, ngay_giao_hang)
            SELECT N'1', input.MaterialId, CONVERT(float, input.DocumentQuantity),
                CONVERT(float, input.ReceivedQuantity), @Now, N'1', @ReceiptId,
                COALESCE(input.PurchaseOrderKey, LEFT(CONCAT(N'NOPO:', @ReceiptId, N':', input.MaterialId), 150)),
                NULLIF(LTRIM(RTRIM(input.Unit)), N''), COALESCE(input.DeliveryDate, CONVERT(date, @Now))
            FROM @Lines AS input
            WHERE input.ReceivingLineId IS NULL;

            UPDATE target SET status = N'0'
            FROM dbo.tbl_chitiet_nhanhang AS target
            WHERE target.ma_phieu = @ReceiptId AND ISNULL(target.status, N'1') <> N'0'
              AND NOT EXISTS (SELECT 1 FROM @Lines AS input WHERE input.ReceivingLineId = target.id_nhanhang);
        END;

        UPDATE dbo.tbl_phieu_nhan_hang
        SET kho = COALESCE(@WarehouseCode, kho), khach_hang = COALESCE(@CustomerName, khach_hang),
            ma_po = COALESCE(@PurchaseOrder, ma_po), status_nhap = @NewStatus
        WHERE ma_phieu = @ReceiptId;

        INSERT dbo.tbl_phieu_nhan_hang_image (ma_phieu, phan_loai, link_anh, time_cre)
        SELECT CONVERT(nvarchar(50), @ReceiptId), image.Category, image.ImageLink, @Now
        FROM @Images AS image
        WHERE NULLIF(LTRIM(RTRIM(image.ImageLink)), N'') IS NOT NULL
          AND NOT EXISTS (SELECT 1 FROM dbo.tbl_phieu_nhan_hang_image AS existing
              WHERE TRY_CONVERT(int, existing.ma_phieu) = @ReceiptId AND existing.link_anh = image.ImageLink);

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap, action_type, audit_time)
        SELECT CONVERT(nvarchar(50), receipt.ma_phieu), receipt.kho, receipt.khach_hang,
            @UserId, receipt.time_cre, receipt.ma_po, receipt.id_bv, receipt.status_nhap,
            CASE @Action WHEN N'CANCEL' THEN N'CANCEL' ELSE N'UPDATE' END, @Now
        FROM dbo.tbl_phieu_nhan_hang AS receipt WHERE receipt.ma_phieu = @ReceiptId;

        INSERT dbo.tbl_his_chitiet_nhanhang
            (id_nhanhang, status_nhanhang, ma_hang, soluong_chungtu, soluong_thucnhan,
             time_cre, status, ma_phieu, ma_khoa_chinh, action_type, audit_time, unit)
        SELECT line.id_nhanhang, line.status_nhanhang, line.ma_hang, line.soluong_chungtu,
            line.soluong_thucnhan, line.time_cre, line.status, line.ma_phieu,
            COALESCE(line.ma_khoa_chinh, LEFT(CONCAT(N'NOPO:', @ReceiptId, N':', line.ma_hang), 150)),
            CASE @Action WHEN N'CANCEL' THEN N'CANCEL' ELSE N'UPDATE' END, @Now, line.unit
        FROM dbo.tbl_chitiet_nhanhang AS line WHERE line.ma_phieu = @ReceiptId;

        COMMIT TRANSACTION;
        SELECT ReceiptId = @ReceiptId, StatusCode = @NewStatus,
            LineCount = (SELECT COUNT(*) FROM @Lines), ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
