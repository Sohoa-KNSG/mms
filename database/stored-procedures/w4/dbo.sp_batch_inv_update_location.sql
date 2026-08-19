USE [MMS1]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ============================================================================
-- Procedure: dbo.sp_batch_inv_update_location
-- Purpose  : Thay thế trigger [trg_tbl_location_event].
--            Cập nhật vị trí ô kệ (location) của lô hàng trong [tbl_batch_inv]
--            và tự động ghi nhật ký chuyển dịch vào [tbl_location_event].
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_batch_inv_update_location
    @id_batch           int,
    @new_location       nvarchar(50),              -- Vị trí ô kệ đích mới (vd: '01-01011')
    @location_event_up  nvarchar(50) = N'1',       -- '1': Vào kệ / Nhập kho, '2': Rời kệ / Hạ kệ, '3': Điều chuyển
    @user_up            nvarchar(50) = N'system',
    @log_old_exit       bit = 1                    -- 1: Ghi thêm 1 event '2' (Rời kệ cũ) nếu vị trí cũ có giá trị
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Khóa bản ghi lô hàng
        DECLARE @old_location nvarchar(50);

        SELECT @old_location = location
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_batch = @id_batch;

        IF @old_location IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.tbl_batch_inv WHERE id_batch = @id_batch)
            THROW 50001, N'Không tìm thấy lô hàng với id_batch đã chỉ định.', 1;

        -- 1. Nếu lô hàng đang ở một vị trí cũ và chuyển sang vị trí mới, ghi nhận sự kiện rời kệ cũ (nếu bật cờ @log_old_exit)
        IF @log_old_exit = 1 
           AND @old_location IS NOT NULL 
           AND LTRIM(RTRIM(@old_location)) <> '' 
           AND @old_location <> @new_location
        BEGIN
            INSERT INTO dbo.tbl_location_event (
                ma_location,
                id_batch,
                location_event,
                user_cre,
                time_cre
            )
            VALUES (
                @old_location,
                @id_batch,
                N'2', -- '2': Rời khỏi vị trí kệ cũ
                @user_up,
                @Now
            );
        END;

        -- 2. Cập nhật vị trí mới trên tbl_batch_inv
        UPDATE dbo.tbl_batch_inv
        SET 
            location          = @new_location,
            location_event_up = @location_event_up,
            user_up           = @user_up,
            time_up           = @Now
        WHERE id_batch = @id_batch;

        -- 3. Ghi nhận sự kiện vào vị trí kệ đích mới trong tbl_location_event
        IF @new_location IS NOT NULL AND LTRIM(RTRIM(@new_location)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_location_event (
                ma_location,
                id_batch,
                location_event,
                user_cre,
                time_cre
            )
            VALUES (
                @new_location,
                @id_batch,
                @location_event_up,
                @user_up,
                @Now
            );
        END;

        COMMIT TRANSACTION;

        -- Trả về kết quả
        SELECT 
            id_batch          = @id_batch,
            old_location      = @old_location,
            new_location      = @new_location,
            location_event_up = @location_event_up,
            user_up           = @user_up,
            time_up           = @Now,
            Status            = N'SUCCESS',
            Message           = N'Cập nhật vị trí ô kệ và ghi nhật ký location_event thành công.';
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
