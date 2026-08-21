CREATE OR ALTER PROCEDURE api.usp_WMS_LOC02_PutAwayBatches_v1
    @UserId nvarchar(50), @LocationCode nvarchar(50), @Batches api.BatchLocationItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode IN (N'scr_luukho_len_ke', N'scr_luukho_ql'))
        THROW 51001, N'Không có quyền đưa batch lên kệ.', 1;
    SET @LocationCode = NULLIF(LTRIM(RTRIM(@LocationCode)), N'');
    IF @LocationCode IS NULL OR NOT EXISTS (SELECT 1 FROM @Batches) THROW 51002, N'Vị trí và batch là bắt buộc.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_location WHERE ma_location = @LocationCode) THROW 51004, N'Không tìm thấy vị trí.', 1;
    DECLARE @Now datetime = GETDATE();
    BEGIN TRY
        BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM @Batches AS input LEFT JOIN dbo.tbl_batch_inv AS batch WITH (UPDLOCK, HOLDLOCK)
            ON batch.id_batch = input.BatchId WHERE batch.id_batch IS NULL OR batch.location IS NOT NULL
              OR batch.so_luong <= 0 OR batch.trang_thai_ton <> N'1' OR input.ExpectedLocationCode IS NOT NULL)
            THROW 51009, N'Có batch không tồn tại, đã có vị trí hoặc không còn hoạt động.', 1;
        UPDATE batch SET location = @LocationCode, location_event_up = N'1', user_up = LEFT(@UserId, 20), time_up = @Now
        FROM dbo.tbl_batch_inv AS batch INNER JOIN @Batches AS input ON input.BatchId = batch.id_batch;
        INSERT dbo.tbl_location_event (ma_location, id_batch, location_event, user_cre, time_cre)
        SELECT @LocationCode, BatchId, N'1', @UserId, @Now FROM @Batches;
        COMMIT TRANSACTION;
        SELECT LocationCode = @LocationCode, BatchCount = (SELECT COUNT(*) FROM @Batches), ChangedAt = @Now;
    END TRY
    BEGIN CATCH IF XACT_STATE() <> 0 ROLLBACK TRANSACTION; THROW; END CATCH;
END;

