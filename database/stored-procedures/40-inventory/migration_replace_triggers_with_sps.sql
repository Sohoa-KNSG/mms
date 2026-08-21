USE [MMS1]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================================
-- SCRIPT CHUYỂN ĐỔI: Thay thế các Trigger trên [tbl_batch_inv] bằng Stored Procedures
-- Danh sách trigger cũ:
--   1. [trg_after_insert_batch_inv] -> Thay bằng [dbo].[sp_batch_inv_insert]
--   2. [trg_tbl_batch_inv_update]   -> Thay bằng [dbo].[sp_batch_inv_update]
--   3. [trg_tbl_location_event]     -> Thay bằng [dbo].[sp_batch_inv_update_location]
-- ============================================================================

PRINT N'----------------------------------------------------------------------';
PRINT N'1. Tạo Stored Procedure dbo.sp_batch_inv_insert...';
PRINT N'----------------------------------------------------------------------';
GO

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

PRINT N'----------------------------------------------------------------------';
PRINT N'2. Tạo Stored Procedure dbo.sp_batch_inv_update...';
PRINT N'----------------------------------------------------------------------';
GO

CREATE OR ALTER PROCEDURE dbo.sp_batch_inv_update
    @id_batch           int,
    @so_luong           float = NULL,              -- Nếu NULL: giữ nguyên số lượng cũ
    @trang_thai_ton     nvarchar(50) = NULL,       -- Nếu NULL: giữ nguyên trạng thái cũ
    @ma_event_up        int = 2,                   -- Mã sự kiện (1: Tạo mới, 2: Cập nhật/Tách/Kiểm kê, 3: Xuất kho...)
    @user_up            nvarchar(50) = N'system',
    @id_nhanhang        int = NULL,                -- Tùy chọn cập nhật phiếu nhận
    @id_vattu           nvarchar(50) = NULL,       -- Tùy chọn cập nhật vật tư
    @ten_vattu          nvarchar(255) = NULL       -- Tùy chọn cập nhật tên vật tư
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE 
            @curr_id_vattu       nvarchar(50),
            @curr_id_bravo       nvarchar(50),
            @curr_ten_vattu      nvarchar(255),
            @curr_so_luong       float,
            @curr_unit           nvarchar(20),
            @curr_trang_thai     nvarchar(50),
            @curr_id_nhanhang    int;

        SELECT 
            @curr_id_vattu    = id_vattu,
            @curr_id_bravo    = id_bravo,
            @curr_ten_vattu   = ten_vattu,
            @curr_so_luong    = so_luong,
            @curr_unit        = unit,
            @curr_trang_thai  = trang_thai_ton,
            @curr_id_nhanhang = id_nhanhang
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_batch = @id_batch;

        IF @curr_id_vattu IS NULL
            THROW 50001, N'Không tìm thấy lô hàng với id_batch đã chỉ định.', 1;

        DECLARE @new_so_luong float           = ISNULL(@so_luong, @curr_so_luong);
        DECLARE @new_trang_thai nvarchar(50)  = ISNULL(@trang_thai_ton, @curr_trang_thai);
        DECLARE @new_id_vattu nvarchar(50)    = ISNULL(@id_vattu, @curr_id_vattu);
        DECLARE @new_ten_vattu nvarchar(255)  = ISNULL(@ten_vattu, @curr_ten_vattu);
        DECLARE @new_id_nhanhang int          = ISNULL(@id_nhanhang, @curr_id_nhanhang);

        -- 1. Cập nhật tbl_batch_inv
        UPDATE dbo.tbl_batch_inv
        SET 
            id_nhanhang    = @new_id_nhanhang,
            id_vattu       = @new_id_vattu,
            ten_vattu      = @new_ten_vattu,
            so_luong       = @new_so_luong,
            trang_thai_ton = @new_trang_thai,
            ma_event_up    = CONVERT(nvarchar(50), @ma_event_up),
            user_up        = @user_up,
            time_up        = @Now
        WHERE id_batch = @id_batch;

        -- 2. Ghi nhận trạng thái mới vào bảng lịch sử tbl_batch_event
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
            @ma_event_up,
            @new_id_vattu,
            @new_so_luong,
            @curr_unit,
            @Now,
            @user_up,
            @new_trang_thai
        );

        COMMIT TRANSACTION;

        SELECT 
            id_batch       = @id_batch,
            id_vattu       = @new_id_vattu,
            so_luong_cu    = @curr_so_luong,
            so_luong_moi   = @new_so_luong,
            trang_thai_ton = @new_trang_thai,
            ma_event_up    = @ma_event_up,
            user_up        = @user_up,
            time_up        = @Now,
            Status         = N'SUCCESS',
            Message        = N'Cập nhật lô hàng và ghi nhật ký sự kiện thành công.';
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

PRINT N'----------------------------------------------------------------------';
PRINT N'3. Tạo Stored Procedure dbo.sp_batch_inv_update_location...';
PRINT N'----------------------------------------------------------------------';
GO

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

        DECLARE @old_location nvarchar(50);

        SELECT @old_location = location
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_batch = @id_batch;

        IF @old_location IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.tbl_batch_inv WHERE id_batch = @id_batch)
            THROW 50001, N'Không tìm thấy lô hàng với id_batch đã chỉ định.', 1;

        -- 1. Nếu lô hàng đang ở một vị trí cũ và chuyển sang vị trí mới, ghi nhận sự kiện rời kệ cũ
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

PRINT N'----------------------------------------------------------------------';
PRINT N'4. Tắt/Vô hiệu hóa (hoặc Xóa) các Trigger cũ trên tbl_batch_inv...';
PRINT N'----------------------------------------------------------------------';
GO

-- Vô hiệu hóa Trigger cũ an toàn (có thể bật lại bất cứ lúc nào nếu cần)
IF OBJECT_ID('dbo.trg_after_insert_batch_inv', 'TR') IS NOT NULL
BEGIN
    DISABLE TRIGGER dbo.trg_after_insert_batch_inv ON dbo.tbl_batch_inv;
    PRINT N'-> Đã vô hiệu hóa trigger: [dbo].[trg_after_insert_batch_inv]';
END;

IF OBJECT_ID('dbo.trg_tbl_batch_inv_update', 'TR') IS NOT NULL
BEGIN
    DISABLE TRIGGER dbo.trg_tbl_batch_inv_update ON dbo.tbl_batch_inv;
    PRINT N'-> Đã vô hiệu hóa trigger: [dbo].[trg_tbl_batch_inv_update]';
END;

IF OBJECT_ID('dbo.trg_tbl_location_event', 'TR') IS NOT NULL
BEGIN
    DISABLE TRIGGER dbo.trg_tbl_location_event ON dbo.tbl_batch_inv;
    PRINT N'-> Đã vô hiệu hóa trigger: [dbo].[trg_tbl_location_event]';
END;
GO

PRINT N'----------------------------------------------------------------------';
PRINT N'5. Hoàn tất chuyển đổi Triggers sang Stored Procedures thành công 100%!';
PRINT N'----------------------------------------------------------------------';
GO
