CREATE OR ALTER PROCEDURE api.usp_WMS_INB07_ProcessWarehouseReceipt_v1
    @UserId nvarchar(50),
    @ReceiptId int,
    @ExpectedStatus nvarchar(50),
    @Items api.WarehouseReceiptItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_nhapkho_thutuc', N'scr_nhapkho_ql')
    )
        THROW 51001, N'Không có quyền thực hiện nhập kho.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Items) THROW 51002, N'Phải chọn ít nhất một dòng nhập kho.', 1;
    IF EXISTS (SELECT 1 FROM @Items WHERE Quantity <= 0) THROW 51002, N'Số lượng nhập kho phải lớn hơn 0.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @WarehouseCode nvarchar(50);
    DECLARE @CustomerName nvarchar(50);
    DECLARE @CurrentStatus nvarchar(50);
    DECLARE @TransactionDocumentId int;
    DECLARE @FinalStatus nvarchar(50);
    DECLARE @CreatedBatches TABLE (ReceivingLineId int NOT NULL, BatchId int NOT NULL);

    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @WarehouseCode = kho, @CustomerName = khach_hang, @CurrentStatus = status_nhap
        FROM dbo.tbl_phieu_nhan_hang WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_phieu = @ReceiptId;
        IF @CurrentStatus IS NULL THROW 51004, N'Không tìm thấy phiếu nhận.', 1;
        IF @CurrentStatus <> @ExpectedStatus THROW 51009, N'Phiếu đã thay đổi. Hãy tải lại.', 1;
        IF @CurrentStatus <> N'4' THROW 51022, N'Phiếu phải ở trạng thái đã kiểm trước khi nhập kho.', 1;

        IF EXISTS
        (
            SELECT 1
            FROM @Items AS item
            LEFT JOIN dbo.tbl_chitiet_nhanhang AS line WITH (UPDLOCK, HOLDLOCK)
              ON line.id_nhanhang = item.ReceivingLineId AND line.ma_phieu = @ReceiptId
            OUTER APPLY (SELECT Batched = SUM(ISNULL(batch.so_luong, 0))
                FROM dbo.tbl_batch_inv AS batch WITH (UPDLOCK, HOLDLOCK)
                WHERE batch.id_nhanhang = item.ReceivingLineId) AS inventory
            WHERE line.id_nhanhang IS NULL OR ISNULL(line.status, N'1') = N'0'
               OR item.Quantity > CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0) - ISNULL(inventory.Batched, 0))
               OR (line.kiem_tra_dau_vao IS NOT NULL AND line.ket_qua_qc IS NULL)
               OR line.ket_qua_qc = N'2'
               OR COALESCE(NULLIF(line.unit, N''), NULLIF((SELECT unit FROM dbo.tbl_dm_vattu WHERE id_vattu = line.ma_hang), N'')) IS NULL
        )
            THROW 51022, N'Dòng nhập không hợp lệ, vượt số lượng hoặc chưa đạt QC.', 1;

        INSERT dbo.tbl_phieu_transaction
            (nghiep_vu, ma_kho_from, ma_kho_to, nguoi_nhan, user_cre, time_cre, trang_thai_phieu)
        VALUES (N'IN_PO', @WarehouseCode, @CustomerName, @CustomerName, @UserId, @Now, N'1');
        SET @TransactionDocumentId = CONVERT(int, SCOPE_IDENTITY());

        MERGE dbo.tbl_batch_inv AS target
        USING
        (
            SELECT item.ReceivingLineId, item.Quantity, line.ma_hang,
                material.id_bravo, material.ten_vattu, COALESCE(line.unit, material.unit) AS unit
            FROM @Items AS item
            INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.id_nhanhang = item.ReceivingLineId
            INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        ) AS source
        ON 1 = 0
        WHEN NOT MATCHED THEN INSERT
            (id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu, so_luong, unit,
             time_cre, user_up, location_event_up, ma_event_up, trang_thai_ton)
        VALUES
            (source.ReceivingLineId, @WarehouseCode, source.ma_hang, source.id_bravo,
             source.ten_vattu, CONVERT(float, source.Quantity), source.unit,
             @Now, LEFT(@UserId, 20), N'0', N'1', N'1')
        OUTPUT source.ReceivingLineId, inserted.id_batch INTO @CreatedBatches (ReceivingLineId, BatchId);

        INSERT dbo.tbl_transaction
            (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo, ten_vattu,
             so_luong, unit, time_cre, trang_thai)
        SELECT created.BatchId, @TransactionDocumentId, N'IN_PO', material.id_vattu,
            material.id_bravo, material.ten_vattu, CONVERT(float, item.Quantity),
            COALESCE(line.unit, material.unit), @Now, N'1'
        FROM @CreatedBatches AS created
        INNER JOIN @Items AS item ON item.ReceivingLineId = created.ReceivingLineId
        INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.id_nhanhang = created.ReceivingLineId
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang;

        UPDATE line
        SET status_nhanhang = CASE WHEN ISNULL(inventory.Batched, 0) >= ISNULL(line.soluong_thucnhan, 0) THEN N'5' ELSE N'4' END
        FROM dbo.tbl_chitiet_nhanhang AS line
        OUTER APPLY (SELECT Batched = SUM(ISNULL(batch.so_luong, 0)) FROM dbo.tbl_batch_inv AS batch
            WHERE batch.id_nhanhang = line.id_nhanhang) AS inventory
        WHERE line.ma_phieu = @ReceiptId;

        SET @FinalStatus = CASE WHEN EXISTS
        (
            SELECT 1 FROM dbo.tbl_chitiet_nhanhang AS line
            WHERE line.ma_phieu = @ReceiptId AND ISNULL(line.status, N'1') <> N'0'
              AND line.status_nhanhang <> N'5'
        ) THEN N'4' ELSE N'5' END;

        UPDATE dbo.tbl_phieu_nhan_hang SET status_nhap = @FinalStatus WHERE ma_phieu = @ReceiptId;
        UPDATE dbo.tbl_phieu_transaction SET trang_thai_phieu = N'2' WHERE id_phieu_trans = @TransactionDocumentId;

        INSERT dbo.tbl_his_phieunhap
            (ma_phieu, kho, khach_hang, user_cre, time_cre, ma_po, id_bv, status_nhap, action_type, audit_time)
        SELECT CONVERT(nvarchar(50), ma_phieu), kho, khach_hang, @UserId, time_cre,
            ma_po, id_bv, status_nhap, N'WAREHOUSE', @Now
        FROM dbo.tbl_phieu_nhan_hang WHERE ma_phieu = @ReceiptId;

        INSERT dbo.tbl_his_chitiet_nhanhang
            (id_nhanhang, status_nhanhang, ma_hang, soluong_chungtu, soluong_thucnhan,
             time_cre, status, ma_phieu, ma_khoa_chinh, action_type, audit_time, unit)
        SELECT line.id_nhanhang, line.status_nhanhang, line.ma_hang, line.soluong_chungtu,
            line.soluong_thucnhan, line.time_cre, line.status, line.ma_phieu,
            COALESCE(line.ma_khoa_chinh, LEFT(CONCAT(N'NOPO:', @ReceiptId, N':', line.ma_hang), 150)),
            N'WAREHOUSE', @Now, line.unit
        FROM dbo.tbl_chitiet_nhanhang AS line
        WHERE line.id_nhanhang IN (SELECT ReceivingLineId FROM @Items);

        COMMIT TRANSACTION;
        SELECT ReceiptId = @ReceiptId, TransactionDocumentId = @TransactionDocumentId,
            StatusCode = @FinalStatus, BatchCount = (SELECT COUNT(*) FROM @CreatedBatches), ProcessedAt = @Now;
        SELECT ReceivingLineId = created.ReceivingLineId, BatchId = created.BatchId
        FROM @CreatedBatches AS created ORDER BY created.BatchId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
