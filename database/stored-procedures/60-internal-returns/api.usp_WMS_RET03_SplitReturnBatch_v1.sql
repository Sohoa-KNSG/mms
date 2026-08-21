CREATE OR ALTER PROCEDURE api.usp_WMS_RET03_SplitReturnBatch_v1
    @UserId nvarchar(50), @TransactionDocumentId int, @BatchId int,
    @SplitQuantity decimal(19,4), @ExpectedQuantity decimal(19,4)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF @SplitQuantity <= 0 OR @SplitQuantity >= @ExpectedQuantity
        THROW 51002, N'So luong tach phai lon hon 0 va nho hon ton batch.', 1;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_nhaptra_tachbatch_intem')
        THROW 51001, N'Khong co quyen tach batch nhap tra.', 1;
    DECLARE @EmployeeCode nvarchar(20), @CurrentQuantity decimal(19,4), @TransactionBalance decimal(19,4),
        @SourceTransactionId int, @SourceTransactionQuantity decimal(19,4), @OperationCode nvarchar(50),
        @TransactionStatus nvarchar(20), @ReceivingLineId int, @WarehouseCode nvarchar(50),
        @MaterialId nvarchar(50), @BravoId nvarchar(50), @MaterialName nvarchar(255), @Unit nvarchar(20),
        @InventoryStatus nvarchar(10), @NewBatchId int, @Now datetime = GETDATE();
    SELECT @EmployeeCode = LEFT(CONVERT(nvarchar(50), msnv), 20) FROM dbo.tbl_dm_user
    WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @EmployeeCode IS NULL THROW 51001, N'Tai khoan khong co ma nhan vien.', 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_phieu_transaction WITH (UPDLOCK, HOLDLOCK)
            WHERE id_phieu_trans = @TransactionDocumentId AND nghiep_vu = N'IN_PROD' AND trang_thai_phieu = N'2')
            THROW 51004, N'Khong tim thay phieu nhap tra hop le.', 1;
        SELECT @CurrentQuantity = CONVERT(decimal(19,4), so_luong), @ReceivingLineId = id_nhanhang,
            @WarehouseCode = ma_kho, @MaterialId = id_vattu, @BravoId = id_bravo,
            @MaterialName = ten_vattu, @Unit = unit, @InventoryStatus = trang_thai_ton
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK) WHERE id_batch = @BatchId;
        IF @CurrentQuantity IS NULL THROW 51004, N'Khong tim thay batch.', 1;
        IF ABS(@CurrentQuantity - @ExpectedQuantity) > CONVERT(decimal(19,4), 0.0001)
            THROW 51009, N'Ton batch da thay doi; can tai lai.', 1;
        SELECT @TransactionBalance = CONVERT(decimal(19,4), ISNULL(SUM(CASE TRY_CONVERT(int, operation.logic)
            WHEN 1 THEN movement.so_luong WHEN -1 THEN -movement.so_luong ELSE 0 END), 0))
        FROM dbo.tbl_transaction AS movement WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.tbl_dm_nghiepvu_kho AS operation ON operation.ma_nghiepvu = movement.nghiep_vu
        WHERE movement.id_batch = @BatchId;
        IF ABS(@TransactionBalance - @CurrentQuantity) > CONVERT(decimal(19,4), 0.0001)
            THROW 51022, N'Ton batch lech lich su transaction.', 1;
        SELECT @SourceTransactionId = MIN(movement.id_trans), @SourceTransactionQuantity = MIN(CONVERT(decimal(19,4), movement.so_luong)),
            @OperationCode = MIN(movement.nghiep_vu), @TransactionStatus = MIN(movement.trang_thai)
        FROM dbo.tbl_transaction AS movement WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.tbl_dm_nghiepvu_kho AS operation ON operation.ma_nghiepvu = movement.nghiep_vu
        WHERE movement.id_batch = @BatchId AND movement.id_phieu_trans = @TransactionDocumentId
          AND TRY_CONVERT(int, operation.logic) = 1 AND movement.so_luong > 0;
        IF @SourceTransactionId IS NULL OR @SourceTransactionQuantity < @SplitQuantity
            THROW 51022, N'Giao dich nguon khong du de tach batch.', 1;
        UPDATE dbo.tbl_batch_inv SET so_luong = CONVERT(float, @CurrentQuantity - @SplitQuantity),
            user_up = @EmployeeCode, time_up = @Now, ma_event_up = N'5' WHERE id_batch = @BatchId;
        UPDATE dbo.tbl_transaction SET so_luong = CONVERT(float, @SourceTransactionQuantity - @SplitQuantity)
        WHERE id_trans = @SourceTransactionId;
        INSERT dbo.tbl_batch_inv
            (id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu, so_luong, unit,
             time_cre, user_up, time_up, location_event_up, ma_event_up, trang_thai_ton)
        VALUES (@ReceivingLineId, @WarehouseCode, @MaterialId, @BravoId, @MaterialName,
            CONVERT(float, @SplitQuantity), @Unit, @Now, @EmployeeCode, @Now, N'0', N'5', @InventoryStatus);
        SET @NewBatchId = CONVERT(int, SCOPE_IDENTITY());
        INSERT dbo.tbl_transaction
            (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo, ten_vattu,
             so_luong, unit, time_cre, trang_thai)
        VALUES (@NewBatchId, @TransactionDocumentId, @OperationCode, @MaterialId, @BravoId,
            LEFT(@MaterialName, 100), CONVERT(float, @SplitQuantity), @Unit, @Now, @TransactionStatus);
        COMMIT TRANSACTION;
        SELECT TransactionDocumentId = @TransactionDocumentId, SourceBatchId = @BatchId,
            NewBatchId = @NewBatchId, SourceQuantity = @CurrentQuantity - @SplitQuantity,
            NewQuantity = @SplitQuantity, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
