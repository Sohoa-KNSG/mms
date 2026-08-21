CREATE OR ALTER PROCEDURE api.usp_WMS_INB02_CreateReceiptWithoutPo_v1
    @UserId nvarchar(50),
    @SupplierName nvarchar(50),
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
        WHERE UserId = @UserId AND ScreenCode = N'scr_nhanhang_khong_po'
    )
        THROW 51001, N'Không có quyền nhận hàng không PO.', 1;

    SET @SupplierName = NULLIF(LTRIM(RTRIM(@SupplierName)), N'');
    SET @WarehouseCode = NULLIF(LTRIM(RTRIM(@WarehouseCode)), N'');
    IF @SupplierName IS NULL OR @WarehouseCode IS NULL THROW 51002, N'Nhà cung cấp và kho là bắt buộc.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Lines) THROW 51002, N'Phiếu nhận phải có ít nhất một dòng vật tư.', 1;
    IF EXISTS (SELECT 1 FROM @Lines WHERE ReceivedQuantity <= 0 OR DocumentQuantity <= 0)
        THROW 51002, N'Số lượng chứng từ và thực nhận phải lớn hơn 0.', 1;
    IF EXISTS (SELECT MaterialId FROM @Lines GROUP BY MaterialId HAVING COUNT(*) > 1)
        THROW 51002, N'Một vật tư không được lặp trong cùng phiếu.', 1;
    IF EXISTS
    (
        SELECT 1 FROM @Lines AS input
        LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = input.MaterialId
        WHERE material.id_vattu IS NULL
    )
        THROW 51004, N'Có vật tư không tồn tại trong danh mục.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @ReceiptId int;

    BEGIN TRY
        BEGIN TRANSACTION;

        INSERT dbo.tbl_phieu_nhan_hang (kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap)
        VALUES (@WarehouseCode, @SupplierName, @UserId, @Now, N'khong_po', NULL, N'2');
        SET @ReceiptId = CONVERT(int, SCOPE_IDENTITY());

        INSERT dbo.tbl_chitiet_nhanhang
            (status_nhanhang, ma_hang, soluong_chungtu, soluong_thucnhan, time_cre,
             status, ma_phieu, ma_khoa_chinh, unit, ngay_giao_hang)
        SELECT N'1', line.MaterialId, CONVERT(float, line.DocumentQuantity),
            CONVERT(float, line.ReceivedQuantity), @Now, N'1', @ReceiptId,
            LEFT(CONCAT(N'NOPO:', @ReceiptId, N':', line.MaterialId), 150),
            COALESCE(NULLIF(LTRIM(RTRIM(line.Unit)), N''), material.unit),
            COALESCE(line.DeliveryDate, CONVERT(date, @Now))
        FROM @Lines AS line
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.MaterialId;

        INSERT dbo.tbl_phieu_nhan_hang_image (ma_phieu, phan_loai, link_anh, time_cre)
        SELECT CONVERT(nvarchar(50), @ReceiptId), image.Category, image.ImageLink, @Now
        FROM @Images AS image
        WHERE NULLIF(LTRIM(RTRIM(image.ImageLink)), N'') IS NOT NULL;

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap, action_type, audit_time)
        VALUES (CONVERT(nvarchar(50), @ReceiptId), @WarehouseCode, @SupplierName, @UserId,
            @Now, N'khong_po', NULL, N'2', N'CREATE', @Now);

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

