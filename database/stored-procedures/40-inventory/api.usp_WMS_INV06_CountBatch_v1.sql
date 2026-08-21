CREATE OR ALTER PROCEDURE api.usp_WMS_INV06_CountBatch_v1
    @UserId nvarchar(50),
    @BatchId int,
    @ActualQuantity decimal(19,4),
    @ExpectedQuantity decimal(19,4),
    @Reason nvarchar(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_kiemke_batch')
        THROW 51001, N'Không có quyền kiểm kê batch.', 1;
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), N'');
    IF @ActualQuantity < 0 OR @Reason IS NULL THROW 51002, N'Số lượng thực tế và căn cứ kiểm kê là bắt buộc.', 1;
    DECLARE @Now datetime = GETDATE(), @DocumentId int, @Delta decimal(19,4), @CurrentQuantity decimal(19,4);
    DECLARE @MaterialId nvarchar(50), @BravoId nvarchar(50), @MaterialName nvarchar(255), @Unit nvarchar(20), @WarehouseCode nvarchar(50);
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @CurrentQuantity = CONVERT(decimal(19,4), so_luong), @MaterialId = id_vattu,
            @BravoId = id_bravo, @MaterialName = ten_vattu, @Unit = unit, @WarehouseCode = ma_kho
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK) WHERE id_batch = @BatchId AND trang_thai_ton = N'1';
        IF @CurrentQuantity IS NULL THROW 51004, N'Không tìm thấy batch đang hoạt động.', 1;
        IF @CurrentQuantity <> @ExpectedQuantity THROW 51009, N'Tồn batch đã thay đổi. Hãy tải lại.', 1;
        SET @Delta = @ActualQuantity - @CurrentQuantity;
        IF @Delta > 0 AND NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_nghiepvu_kho WHERE ma_nghiepvu = N'ADJ_UP' AND TRY_CONVERT(int, logic) = 1)
            THROW 51022, N'ADJ_UP chưa cấu hình đúng.', 1;
        IF @Delta < 0 AND NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_nghiepvu_kho WHERE ma_nghiepvu = N'ADJ_DWN' AND TRY_CONVERT(int, logic) = -1)
            THROW 51022, N'ADJ_DWN chưa cấu hình đúng.', 1;

        INSERT dbo.tbl_phieu_transaction (nghiep_vu, ma_kho_from, ma_kho_to, user_cre, time_cre, trang_thai_phieu, ghi_chu_huy)
        VALUES (N'INV_CNT', @WarehouseCode, @WarehouseCode, @UserId, @Now, N'2', @Reason);
        SET @DocumentId = CONVERT(int, SCOPE_IDENTITY());
        INSERT dbo.tbl_transaction (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
            ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@BatchId, @DocumentId, N'INV_CNT', @MaterialId, @BravoId, @MaterialName,
            CONVERT(float, @ActualQuantity), @Unit, @Now, N'2');
        IF @Delta <> 0
            INSERT dbo.tbl_transaction (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
                ten_vattu, so_luong, unit, time_cre, trang_thai)
            VALUES (@BatchId, @DocumentId, CASE WHEN @Delta > 0 THEN N'ADJ_UP' ELSE N'ADJ_DWN' END,
                @MaterialId, @BravoId, @MaterialName, CONVERT(float, ABS(@Delta)), @Unit, @Now, N'2');
        UPDATE dbo.tbl_batch_inv SET so_luong = CONVERT(float, @ActualQuantity), user_up = LEFT(@UserId, 20),
            time_up = @Now, ma_event_up = CASE WHEN @Delta > 0 THEN N'3' WHEN @Delta < 0 THEN N'4' ELSE ma_event_up END
        WHERE id_batch = @BatchId;
        COMMIT TRANSACTION;
        SELECT BatchId = @BatchId, TransactionDocumentId = @DocumentId,
            PreviousQuantity = @CurrentQuantity, ActualQuantity = @ActualQuantity,
            DifferenceQuantity = @Delta, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

