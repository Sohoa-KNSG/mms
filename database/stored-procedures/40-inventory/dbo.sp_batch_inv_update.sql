USE [MMS1]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- ============================================================================
-- Procedure: dbo.sp_batch_inv_update
-- Purpose  : Thay thế trigger [trg_tbl_batch_inv_update].
--            Cập nhật thông tin/số lượng/trạng thái của lô hàng trong [tbl_batch_inv]
--            và tự động ghi nhật ký trạng thái mới vào [tbl_batch_event].
-- ============================================================================
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

        -- Khóa bản ghi để đảm bảo nhất quán dữ liệu (concurrency safe)
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

        -- Xác định giá trị mới
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

        -- Trả về kết quả sau cập nhật
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
