CREATE OR ALTER PROCEDURE api.usp_WMS_LOC03_RelocateBatches_v1
    @UserId nvarchar(50), @TargetLocationCode nvarchar(50), @Batches api.BatchLocationItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON; SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_luukho_doi_ke')
        THROW 51001, N'Không có quyền đổi vị trí kệ.', 1;
    SET @TargetLocationCode = NULLIF(LTRIM(RTRIM(@TargetLocationCode)), N'');
    IF @TargetLocationCode IS NULL OR NOT EXISTS (SELECT 1 FROM @Batches) THROW 51002, N'Vị trí đích và batch là bắt buộc.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_location WHERE ma_location = @TargetLocationCode) THROW 51004, N'Không tìm thấy vị trí đích.', 1;
    DECLARE @Now datetime = GETDATE();
    BEGIN TRY
        BEGIN TRANSACTION;
        IF EXISTS (SELECT 1 FROM @Batches AS input LEFT JOIN dbo.tbl_batch_inv AS batch WITH (UPDLOCK, HOLDLOCK)
            ON batch.id_batch = input.BatchId WHERE batch.id_batch IS NULL OR batch.location IS NULL
              OR batch.location <> input.ExpectedLocationCode OR batch.location = @TargetLocationCode
              OR batch.so_luong <= 0 OR batch.trang_thai_ton <> N'1')
            THROW 51009, N'Có batch đã đổi vị trí hoặc không còn hợp lệ.', 1;
        INSERT dbo.tbl_location_event (ma_location, id_batch, location_event, user_cre, time_cre)
        SELECT batch.location, batch.id_batch, N'2', @UserId, @Now FROM dbo.tbl_batch_inv AS batch
        INNER JOIN @Batches AS input ON input.BatchId = batch.id_batch;
        UPDATE batch SET location = @TargetLocationCode, location_event_up = N'1', user_up = LEFT(@UserId, 20), time_up = @Now
        FROM dbo.tbl_batch_inv AS batch INNER JOIN @Batches AS input ON input.BatchId = batch.id_batch;
        INSERT dbo.tbl_location_event (ma_location, id_batch, location_event, user_cre, time_cre)
        SELECT @TargetLocationCode, BatchId, N'1', @UserId, @Now FROM @Batches;
        COMMIT TRANSACTION;
        SELECT TargetLocationCode = @TargetLocationCode, BatchCount = (SELECT COUNT(*) FROM @Batches), ChangedAt = @Now;
    END TRY
    BEGIN CATCH IF XACT_STATE() <> 0 ROLLBACK TRANSACTION; THROW; END CATCH;
END;

