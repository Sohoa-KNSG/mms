USE [MMS1]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ============================================================================
-- Procedure: dbo.sp_batch_inv_insert
-- Purpose  : Thay thế trigger [trg_after_insert_batch_inv].
--            Tạo mới lô hàng trong [tbl_batch_inv] và tự động ghi nhật ký vào
--            [tbl_batch_event] & [tbl_location_event] trong cùng transaction.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.sp_batch_inv_insert
    @id_nhanhang        int = NULL,
    @ma_kho             nvarchar(50),
    @id_vattu           nvarchar(50),
    @id_bravo           nvarchar(50) = NULL,
    @ten_vattu          nvarchar(255),
    @so_luong           float,
    @unit               nvarchar(20),
    @location           nvarchar(50) = NULL,
    @location_event_up  nvarchar(50) = N'1',       -- '1': Đưa vào ô kệ / Nhập kho
    @ma_event_up        int = 1,                   -- 1: Khởi tạo batch / Nhập kho
    @trang_thai_ton     nvarchar(50) = N'1',       -- '1': Tồn kho khả dụng
    @parent_id_batch    int = NULL,
    @epc                nvarchar(100) = NULL,
    @user_up            nvarchar(50) = N'system',
    @new_id_batch       int = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Chèn bản ghi mới vào tbl_batch_inv
        INSERT INTO dbo.tbl_batch_inv (
            id_nhanhang,
            ma_kho,
            id_vattu,
            id_bravo,
            ten_vattu,
            so_luong,
            unit,
            time_cre,
            user_up,
            time_up,
            location_event_up,
            ma_event_up,
            trang_thai_ton,
            epc,
            location,
            parent_id_batch
        )
        VALUES (
            @id_nhanhang,
            @ma_kho,
            @id_vattu,
            @id_bravo,
            @ten_vattu,
            @so_luong,
            @unit,
            @Now,
            @user_up,
            @Now,
            @location_event_up,
            CONVERT(nvarchar(50), @ma_event_up),
            @trang_thai_ton,
            @epc,
            @location,
            @parent_id_batch
        );

        SET @new_id_batch = SCOPE_IDENTITY();

        -- 2. Ghi nhật ký sự kiện vào tbl_batch_event
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
            @new_id_batch,
            @ma_event_up,
            @id_vattu,
            @so_luong,
            @unit,
            @Now,
            @user_up,
            @trang_thai_ton
        );

        -- 3. Ghi nhật ký sự kiện vị trí vào tbl_location_event (nếu có gán ô kệ)
        IF @location IS NOT NULL AND LTRIM(RTRIM(@location)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_location_event (
                ma_location,
                id_batch,
                location_event,
                user_cre,
                time_cre
            )
            VALUES (
                @location,
                @new_id_batch,
                @location_event_up,
                @user_up,
                @Now
            );
        END;

        COMMIT TRANSACTION;

        -- Trả về kết quả
        SELECT 
            id_batch       = @new_id_batch,
            ma_kho         = @ma_kho,
            id_vattu       = @id_vattu,
            so_luong       = @so_luong,
            unit           = @unit,
            location       = @location,
            trang_thai_ton = @trang_thai_ton,
            time_cre       = @Now,
            Status         = N'SUCCESS',
            Message        = N'Tạo batch và ghi log sự kiện thành công.';
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
