CREATE OR ALTER PROCEDURE api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1
    @UserId nvarchar(50),
    @ReceiptId int,
    @ExpectedStatus nvarchar(50),
    @Assignments api.ReceiptPoAssignmentItem_v1 READONLY
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
    IF NOT EXISTS (SELECT 1 FROM @Assignments) THROW 51002, N'Ánh xạ PO là bắt buộc.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @CurrentStatus nvarchar(50);
    DECLARE @CustomerCode nvarchar(50);

    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @CurrentStatus = status_nhap
        FROM dbo.tbl_phieu_nhan_hang WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_phieu = @ReceiptId AND ma_po = N'khong_po';
        IF @CurrentStatus IS NULL THROW 51004, N'Không tìm thấy phiếu không PO.', 1;
        IF @CurrentStatus <> @ExpectedStatus THROW 51009, N'Phiếu đã thay đổi. Hãy tải lại.', 1;
        IF @CurrentStatus <> N'2' THROW 51022, N'Chỉ phiếu chờ kiểm mới được cập nhật PO.', 1;

        IF EXISTS
        (
            SELECT 1 FROM dbo.tbl_chitiet_nhanhang AS line
            WHERE line.ma_phieu = @ReceiptId AND ISNULL(line.status, N'1') <> N'0'
              AND NOT EXISTS (SELECT 1 FROM @Assignments AS assignment WHERE assignment.ReceivingLineId = line.id_nhanhang)
        )
            THROW 51022, N'Mọi dòng phải được ánh xạ PO.', 1;

        IF EXISTS
        (
            SELECT 1
            FROM @Assignments AS assignment
            LEFT JOIN dbo.tbl_chitiet_nhanhang AS line WITH (UPDLOCK, HOLDLOCK)
              ON line.id_nhanhang = assignment.ReceivingLineId AND line.ma_phieu = @ReceiptId
            LEFT JOIN dbo.tbl_ChiTietDDH AS po WITH (UPDLOCK, HOLDLOCK)
              ON po.Ma_khoa_chinh = assignment.PurchaseOrderKey AND po.Ma_hang_hoa = line.ma_hang
            LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = po.Ma_hang_hoa
            OUTER APPLY
            (
                SELECT ReceivedQuantity = SUM(ISNULL(otherLine.soluong_thucnhan, 0))
                FROM dbo.tbl_chitiet_nhanhang AS otherLine WITH (UPDLOCK, HOLDLOCK)
                WHERE otherLine.ma_khoa_chinh = assignment.PurchaseOrderKey
                  AND otherLine.ma_phieu <> @ReceiptId AND ISNULL(otherLine.status, N'1') <> N'0'
            ) AS received
            WHERE line.id_nhanhang IS NULL OR po.Ma_khoa_chinh IS NULL
               OR assignment.ReceivedQuantity <> CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0))
               OR assignment.ReceivedQuantity > CONVERT(decimal(19,4),
                  ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0))
               OR COALESCE(NULLIF(line.unit, N''), N'#') <> COALESCE(NULLIF(material.unit, N''), N'#')
        )
            THROW 51022, N'Ánh xạ PO sai vật tư, đơn vị hoặc vượt số lượng còn lại.', 1;

        IF (SELECT COUNT(DISTINCT po.So_DDH_HD)
            FROM @Assignments AS assignment
            INNER JOIN dbo.tbl_ChiTietDDH AS po ON po.Ma_khoa_chinh = assignment.PurchaseOrderKey) < 2
            THROW 51022, N'Use case nhiều PO yêu cầu ít nhất hai PO khác nhau.', 1;

        IF (SELECT COUNT(DISTINCT po.Ma_khach_hang)
            FROM @Assignments AS assignment
            INNER JOIN dbo.tbl_ChiTietDDH AS po ON po.Ma_khoa_chinh = assignment.PurchaseOrderKey) <> 1
            THROW 51022, N'Các PO phải thuộc cùng một nhà cung cấp.', 1;

        SELECT TOP (1) @CustomerCode = po.Ma_khach_hang
        FROM @Assignments AS assignment
        INNER JOIN dbo.tbl_ChiTietDDH AS po ON po.Ma_khoa_chinh = assignment.PurchaseOrderKey;

        UPDATE line SET ma_khoa_chinh = assignment.PurchaseOrderKey
        FROM dbo.tbl_chitiet_nhanhang AS line
        INNER JOIN @Assignments AS assignment ON assignment.ReceivingLineId = line.id_nhanhang
        WHERE line.ma_phieu = @ReceiptId;

        UPDATE dbo.tbl_phieu_nhan_hang
        SET ma_po = N'nhieu_po', khach_hang = @CustomerCode, status_nhap = N'2'
        WHERE ma_phieu = @ReceiptId;

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap, action_type, audit_time)
        SELECT CONVERT(nvarchar(50), ma_phieu), kho, khach_hang, @UserId, time_cre,
            ma_po, id_bv, status_nhap, N'MULTI_PO', @Now
        FROM dbo.tbl_phieu_nhan_hang WHERE ma_phieu = @ReceiptId;

        COMMIT TRANSACTION;
        SELECT ReceiptId = @ReceiptId, PurchaseOrder = N'nhieu_po',
            AssignmentCount = (SELECT COUNT(*) FROM @Assignments), ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

