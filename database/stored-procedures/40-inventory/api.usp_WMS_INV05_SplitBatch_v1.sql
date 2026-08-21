CREATE OR ALTER PROCEDURE api.usp_WMS_INV05_SplitBatch_v1
    @UserId nvarchar(50),
    @BatchId int,
    @SplitQuantity decimal(19,4),
    @ExpectedQuantity decimal(19,4)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_nhapkho_tachbatch_intem')
        THROW 51001, N'Không có quyền tách batch.', 1;
    IF @SplitQuantity <= 0 OR @SplitQuantity >= @ExpectedQuantity THROW 51002, N'Số lượng tách phải lớn hơn 0 và nhỏ hơn tồn batch.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_nghiepvu_kho WHERE ma_nghiepvu = N'ADJ_UP' AND TRY_CONVERT(int, logic) = 1)
      OR NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_nghiepvu_kho WHERE ma_nghiepvu = N'ADJ_DWN' AND TRY_CONVERT(int, logic) = -1)
        THROW 51022, N'Danh mục ADJ_UP/ADJ_DWN chưa cấu hình đúng.', 1;

    DECLARE @Now datetime = GETDATE(), @DocumentId int, @NewBatchId int;
    DECLARE @CurrentQuantity decimal(19,4), @TransactionBalance decimal(19,4);
    DECLARE @ReceivingLineId int, @WarehouseCode nvarchar(50), @MaterialId nvarchar(50),
        @BravoId nvarchar(50), @MaterialName nvarchar(255), @Unit nvarchar(20);
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @CurrentQuantity = CONVERT(decimal(19,4), so_luong), @ReceivingLineId = id_nhanhang,
            @WarehouseCode = ma_kho, @MaterialId = id_vattu, @BravoId = id_bravo,
            @MaterialName = ten_vattu, @Unit = unit
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK) WHERE id_batch = @BatchId AND trang_thai_ton = N'1';
        IF @CurrentQuantity IS NULL THROW 51004, N'Không tìm thấy batch đang hoạt động.', 1;
        IF @CurrentQuantity <> @ExpectedQuantity THROW 51009, N'Tồn batch đã thay đổi. Hãy tải lại.', 1;

        SELECT @TransactionBalance = CONVERT(decimal(19,4), ISNULL(SUM(CASE TRY_CONVERT(int, operation.logic)
            WHEN 1 THEN movement.so_luong WHEN -1 THEN -movement.so_luong ELSE 0 END), 0))
        FROM dbo.tbl_transaction AS movement WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.tbl_dm_nghiepvu_kho AS operation ON operation.ma_nghiepvu = movement.nghiep_vu
        WHERE movement.id_batch = @BatchId;
        IF ABS(@TransactionBalance - @CurrentQuantity) > 0.0001
            THROW 51022, N'Tồn batch lệch lịch sử transaction, không thể tách.', 1;

        INSERT dbo.tbl_phieu_transaction (nghiep_vu, ma_kho_from, ma_kho_to, user_cre, time_cre, trang_thai_phieu)
        VALUES (N'SPLIT_BATCH', @WarehouseCode, @WarehouseCode, @UserId, @Now, N'2');
        SET @DocumentId = CONVERT(int, SCOPE_IDENTITY());

        UPDATE dbo.tbl_batch_inv SET so_luong = CONVERT(float, @CurrentQuantity - @SplitQuantity),
            user_up = LEFT(@UserId, 20), time_up = @Now, ma_event_up = N'5'
        WHERE id_batch = @BatchId;
        INSERT dbo.tbl_transaction (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
            ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@BatchId, @DocumentId, N'ADJ_DWN', @MaterialId, @BravoId, @MaterialName,
            CONVERT(float, @SplitQuantity), @Unit, @Now, N'2');

        INSERT dbo.tbl_batch_inv (id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu, so_luong,
            unit, time_cre, user_up, time_up, location_event_up, ma_event_up, trang_thai_ton)
        VALUES (@ReceivingLineId, @WarehouseCode, @MaterialId, @BravoId, @MaterialName,
            CONVERT(float, @SplitQuantity), @Unit, @Now, LEFT(@UserId, 20), @Now, N'0', N'5', N'1');
        SET @NewBatchId = CONVERT(int, SCOPE_IDENTITY());
        INSERT dbo.tbl_transaction (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
            ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@NewBatchId, @DocumentId, N'ADJ_UP', @MaterialId, @BravoId, @MaterialName,
            CONVERT(float, @SplitQuantity), @Unit, @Now, N'2');

        COMMIT TRANSACTION;
        SELECT SourceBatchId = @BatchId, NewBatchId = @NewBatchId,
            TransactionDocumentId = @DocumentId, SourceQuantity = @CurrentQuantity - @SplitQuantity,
            NewQuantity = @SplitQuantity, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

