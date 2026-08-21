USE [MMS1]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ============================================================================
-- Procedure: dbo.sp_batch_inv_log_events
-- Purpose  : Ghi trực tiếp nhật ký sự kiện vào [tbl_batch_event] và/hoặc
--            [tbl_location_event] cho một lô hàng cụ thể.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_batch_inv_log_events
    @id_batch           int,
    @ma_event           int = 1,
    @user_up            nvarchar(50) = N'system',
    @log_batch_event    bit = 1,
    @log_location_event bit = 1,
    @custom_location    nvarchar(50) = NULL,
    @custom_loc_event   nvarchar(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE 
            @id_vattu       nvarchar(50),
            @so_luong       float,
            @unit           nvarchar(20),
            @trang_thai_ton nvarchar(50),
            @location       nvarchar(50),
            @loc_event_up   nvarchar(50);

        SELECT 
            @id_vattu       = id_vattu,
            @so_luong       = so_luong,
            @unit           = unit,
            @trang_thai_ton = trang_thai_ton,
            @location       = location,
            @loc_event_up   = location_event_up
        FROM dbo.tbl_batch_inv WITH (NOLOCK)
        WHERE id_batch = @id_batch;

        IF @id_vattu IS NULL
            THROW 50001, N'Không tìm thấy lô hàng với id_batch đã chỉ định.', 1;

        -- 1. Ghi nhật ký batch_event
        IF @log_batch_event = 1
        BEGIN
            INSERT INTO dbo.tbl_batch_event (
                id_batch,
                ma_event,
                id_vattu,
                so_luong,
                unit,
                time_up,
                user_up,
                trang_thai_ton
            )
            VALUES (
                @id_batch,
                @ma_event,
                @id_vattu,
                @so_luong,
                @unit,
                @Now,
                @user_up,
                @trang_thai_ton
            );
        END;

        -- 2. Ghi nhật ký location_event
        IF @log_location_event = 1
        BEGIN
            DECLARE @target_loc nvarchar(50) = ISNULL(@custom_location, @location);
            DECLARE @target_event nvarchar(50) = ISNULL(@custom_loc_event, @loc_event_up);

            IF @target_loc IS NOT NULL AND LTRIM(RTRIM(@target_loc)) <> ''
            BEGIN
                INSERT INTO dbo.tbl_location_event (
                    ma_location,
                    id_batch,
                    location_event,
                    user_cre,
                    time_cre
                )
                VALUES (
                    @target_loc,
                    @id_batch,
                    ISNULL(@target_event, N'1'),
                    @user_up,
                    @Now
                );
            END;
        END;

        COMMIT TRANSACTION;

        SELECT 
            id_batch = @id_batch,
            Status   = N'SUCCESS',
            Message  = N'Đã ghi nhận sự kiện thành công.';
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
