USE MMS1;
GO

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
    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Lấy thông tin lô gốc
        DECLARE @current_qty FLOAT;
        DECLARE @material_id NVARCHAR(100);
        DECLARE @bravo_id NVARCHAR(100);
        DECLARE @material_name NVARCHAR(255);
        DECLARE @ma_kho NVARCHAR(50);
        DECLARE @location_event_up NVARCHAR(50);
        DECLARE @ma_event_up NVARCHAR(50);
        DECLARE @trang_thai_ton INT;

        SELECT 
            @current_qty = so_luong, 
            @material_id = id_vattu, 
            @bravo_id = id_bravo, 
            @material_name = ten_vattu,
            @ma_kho = ma_kho,
            @location_event_up = ISNULL(location_event_up, N'0'),
            @ma_event_up = ISNULL(ma_event_up, N'1'),
            @trang_thai_ton = ISNULL(trang_thai_ton, 1)
        FROM tbl_batch_inv 
        WHERE id_batch = @batch_id;

        IF @current_qty IS NULL
        BEGIN
            RAISERROR(N'Lô hàng không tồn tại trong hệ thống!', 16, 1);
            RETURN;
        END

        -- 2. Xử lý Chênh lệch thừa: Nếu đếm thùng này > tồn khả dụng còn lại của lô cha
        IF @actual_quantity > @current_qty
        BEGIN
            DECLARE @diff FLOAT = @actual_quantity - @current_qty;
            
            -- Tăng tồn kho lô cha
            UPDATE tbl_batch_inv 
            SET so_luong = so_luong + @diff,
                time_up = GETDATE(),
                user_up = @user
            WHERE id_batch = @batch_id;
            
            -- Ghi nhận biến động TĂNG DO KIỂM KÊ
            INSERT INTO tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
            VALUES (@batch_id, 'CC_ADJ_IN', @material_id, @bravo_id, @material_name, @diff, @unit, GETDATE(), 1);
            
            SET @current_qty = @actual_quantity;
        END

        -- 3. Tách lô cho thùng thực tế vừa đếm
        -- A. Trừ số lượng trên lô gốc
        UPDATE tbl_batch_inv 
        SET so_luong = so_luong - @actual_quantity,
            time_up = GETDATE(),
            user_up = @user
        WHERE id_batch = @batch_id;

        INSERT INTO tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@batch_id, 'SPLIT_OUT', @material_id, @bravo_id, @material_name, -@actual_quantity, @unit, GETDATE(), 1);

        -- B. Tạo lô con mới (kế thừa parent_id_batch từ lô gốc)
        DECLARE @new_batch_id INT;
        INSERT INTO tbl_batch_inv (
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
            @location_event_up, 
            @ma_event_up, 
            @trang_thai_ton,
            GETDATE(),
            @user,
            GETDATE()
        );
        
        SET @new_batch_id = SCOPE_IDENTITY();
        
        -- C. Ghi nhận giao dịch nhập lô con
        INSERT INTO tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@new_batch_id, 'SPLIT_IN', @material_id, @bravo_id, @material_name, @actual_quantity, @unit, GETDATE(), 1);

        -- 4. Cập nhật tiến độ kiểm kê trong danh sách chi tiết
        UPDATE tbl_kiemke_danhsach
        SET so_luong = ISNULL(so_luong, 0) + @actual_quantity,
            vi_tri = @location_code
        WHERE id_kiemke = @id_kiemke;

        -- 5. Ghi log kiểm kê gắn với ID LÔ CON vừa sinh ra
        INSERT INTO tbl_kiemke_log (id_kiemke, id_batch, so_luong, unit, vi_tri, user_cre, time_cre)
        VALUES (@id_kiemke, @new_batch_id, @actual_quantity, @unit, @location_code, @user, GETDATE());

        -- 6. Cập nhật tổng số lượng thực tế của kế hoạch
        DECLARE @id_kh_kiemke INT;
        SELECT @id_kh_kiemke = id_kh_kiemke FROM tbl_kiemke_danhsach WHERE id_kiemke = @id_kiemke;

        UPDATE tbl_kiemke_kh
        SET soluong_thucte = ISNULL(soluong_thucte, 0) + @actual_quantity
        WHERE id_kh_kiemke = @id_kh_kiemke;

        COMMIT TRANSACTION;
        
        -- Trả về NewBatchId phục vụ in tem tức thì
        SELECT @new_batch_id AS NewBatchId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        RAISERROR(@ErrorMessage, 16, 1);
    END CATCH
END;
GO
