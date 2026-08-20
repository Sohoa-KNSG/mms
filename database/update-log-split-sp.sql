USE MMS1;
GO

-- ============================================================================
-- THỦ TỤC: dbo.sp_wms_log_count_and_split
-- NGHIỆP VỤ: Đếm kiểm kê từng thùng, tách lô & in tem dán thùng (UC-27)
-- GHI NHẬN: Tự động ghi nhận biến động giao dịch vào tbl_transaction:
--   - ADJ_UP:  Điều chỉnh tăng nếu đếm phát hiện thừa (@diff > 0, logic = 1)
--   - ADJ_DWN: Điều chỉnh giảm số lượng trên lô cha khi tách (@actual_quantity, logic = -1)
--   - ADJ_UP:  Điều chỉnh tăng số lượng vào lô con mới sinh (@actual_quantity, logic = 1)
-- ============================================================================

CREATE OR ALTER PROCEDURE dbo.sp_wms_log_count_and_split
    @id_kiemke INT,
    @batch_id INT,
    @actual_quantity FLOAT,
    @unit NVARCHAR(50),
    @location_code NVARCHAR(100),
    @user NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 0. Kiểm tra số lượng đếm phải > 0
        IF @actual_quantity IS NULL OR @actual_quantity <= 0
            THROW 51000, N'Số lượng kiểm đếm phải lớn hơn 0! (Lô không đếm hoặc bằng 0 sẽ được tự động xử lý khi Chốt Kiểm Kê)', 1;

        -- 1. Lấy thông tin lô gốc
        DECLARE 
            @current_qty       FLOAT,
            @material_id       NVARCHAR(100),
            @bravo_id          NVARCHAR(100),
            @material_name     NVARCHAR(255),
            @ma_kho            NVARCHAR(50),
            @location_event_up NVARCHAR(50),
            @ma_event_up       NVARCHAR(50),
            @trang_thai_ton    NVARCHAR(50),
            @Now               DATETIME = GETDATE();

        SELECT 
            @current_qty       = so_luong, 
            @material_id       = id_vattu, 
            @bravo_id          = id_bravo, 
            @material_name     = ten_vattu,
            @ma_kho            = ma_kho,
            @location_event_up = ISNULL(location_event_up, N'0'),
            @ma_event_up       = ISNULL(ma_event_up, N'1'),
            @trang_thai_ton    = ISNULL(trang_thai_ton, N'1')
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_batch = @batch_id;

        IF @current_qty IS NULL
            THROW 51000, N'Lô hàng không tồn tại trong hệ thống!', 1;

        -- 2. Xử lý Chênh lệch thừa: Nếu đếm thùng này > tồn khả dụng còn lại của lô cha
        IF @actual_quantity > @current_qty
        BEGIN
            DECLARE @diff FLOAT = @actual_quantity - @current_qty;
            
            -- Tăng tồn kho lô cha
            UPDATE dbo.tbl_batch_inv 
            SET 
                so_luong = so_luong + @diff,
                time_up = @Now,
                user_up = @user
            WHERE id_batch = @batch_id;
            
            -- Ghi nhận biến động TĂNG DO KIỂM KÊ (Mã chuẩn ADJ_UP, logic = 1)
            INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
            VALUES (@batch_id, N'ADJ_UP', @material_id, @bravo_id, @material_name, @diff, @unit, @Now, N'1');
            
            SET @current_qty = @actual_quantity;
        END;

        -- 3. Tách lô cho thùng thực tế vừa đếm
        -- A. Trừ số lượng trên lô gốc
        UPDATE dbo.tbl_batch_inv 
        SET 
            so_luong = so_luong - @actual_quantity,
            ma_event_up = N'5', -- 5: Đếm kiểm kê
            time_up = @Now,
            user_up = @user
        WHERE id_batch = @batch_id;

        -- Ghi log batch_event cho lô cha (audit trail)
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        VALUES (
            @batch_id, 5, @material_id, @current_qty - @actual_quantity, @unit, @Now, @user, @trang_thai_ton
        );

        -- Ghi nhận giao dịch giảm tồn lô cha (Mã chuẩn ADJ_DWN, logic = -1, số lượng luôn dương)
        IF @actual_quantity > 0
        BEGIN
            INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
            VALUES (@batch_id, N'ADJ_DWN', @material_id, @bravo_id, @material_name, @actual_quantity, @unit, @Now, N'1');
        END;

        -- B. Tạo lô con mới (kế thừa parent_id_batch từ lô gốc để in tem dán thùng)
        DECLARE @new_batch_id INT;
        INSERT INTO dbo.tbl_batch_inv (
            parent_id_batch, 
            ma_kho, 
            id_vattu, 
            id_bravo, 
            ten_vattu, 
            so_luong, 
            unit, 
            location, 
            location_event_up, 
            ma_event_up, 
            trang_thai_ton,
            time_cre,
            user_up,
            time_up
        )
        VALUES (
            @batch_id, 
            @ma_kho, 
            @material_id, 
            @bravo_id, 
            @material_name, 
            @actual_quantity, 
            @unit, 
            @location_code, 
            N'1', 
            N'5', 
            @trang_thai_ton,
            @Now,
            @user,
            @Now
        );
        
        SET @new_batch_id = SCOPE_IDENTITY();

        -- Ghi log batch_event cho Lô Con mới sinh
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        VALUES (
            @new_batch_id, 5, @material_id, @actual_quantity, @unit, @Now, @user, @trang_thai_ton
        );

        -- Ghi log location_event cho Lô Con mới
        IF @location_code IS NOT NULL AND LTRIM(RTRIM(@location_code)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_location_event (
                ma_location, id_batch, location_event, user_cre, time_cre
            )
            VALUES (
                @location_code, @new_batch_id, N'1', @user, @Now
            );
        END;

        -- C. Ghi nhận giao dịch tăng tồn lô con mới (Mã chuẩn ADJ_UP, logic = 1, số lượng luôn dương)
        IF @actual_quantity > 0
        BEGIN
            INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
            VALUES (@new_batch_id, N'ADJ_UP', @material_id, @bravo_id, @material_name, @actual_quantity, @unit, @Now, N'1');
        END;

        -- 4. Cập nhật tiến độ kiểm kê trong danh sách chi tiết
        UPDATE dbo.tbl_kiemke_danhsach
        SET 
            so_luong = ISNULL(so_luong, 0) + @actual_quantity,
            vi_tri = @location_code
        WHERE id_kiemke = @id_kiemke;

        -- 5. Ghi log kiểm kê gắn với ID LÔ CON vừa sinh ra
        INSERT INTO dbo.tbl_kiemke_log (id_kiemke, id_batch, so_luong, unit, vi_tri, user_cre, time_cre)
        VALUES (@id_kiemke, @new_batch_id, @actual_quantity, @unit, @location_code, @user, @Now);

        -- 6. Cập nhật tổng số lượng thực tế của kế hoạch
        DECLARE @id_kh_kiemke INT;
        SELECT @id_kh_kiemke = id_kh_kiemke FROM dbo.tbl_kiemke_danhsach WHERE id_kiemke = @id_kiemke;

        UPDATE dbo.tbl_kiemke_kh
        SET soluong_thucte = ISNULL(soluong_thucte, 0) + @actual_quantity
        WHERE id_kh_kiemke = @id_kh_kiemke;

        COMMIT TRANSACTION;
        
        -- Trả về NewBatchId phục vụ in tem tức thì
        SELECT @new_batch_id AS NewBatchId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
