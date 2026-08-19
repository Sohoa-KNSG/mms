USE [MMS1]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- ============================================================================
-- CẬP NHẬT TỔNG THỂ CÁC STORED PROCEDURE NGHIỆP VỤ ĐỂ GHI NHẬN EVENT ĐẦY ĐỦ
-- (Đảm bảo dữ liệu truy vết 100% sau khi vô hiệu hóa Trigger)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. NGHIỆP VỤ TÁCH BATCH (dbo.sp_wms_split_batch - UC-10 / INV-05)
-- ----------------------------------------------------------------------------
PRINT N'1. Cập nhật dbo.sp_wms_split_batch (Tách batch & ghi log batch_event + location_event)...';
GO

CREATE OR ALTER PROCEDURE dbo.sp_wms_split_batch
    @parent_id_batch INT,
    @split_quantity FLOAT,
    @new_location NVARCHAR(100) = NULL,
    @user_id NVARCHAR(50) = 'admin'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Validate parent batch
        DECLARE 
            @current_qty FLOAT,
            @material_id NVARCHAR(100),
            @bravo_id NVARCHAR(100),
            @material_name NVARCHAR(255),
            @unit NVARCHAR(50),
            @parent_loc NVARCHAR(100),
            @trang_thai_ton NVARCHAR(50);

        SELECT 
            @current_qty    = so_luong,
            @material_id    = id_vattu,
            @bravo_id       = id_bravo,
            @material_name  = ten_vattu,
            @unit           = unit,
            @parent_loc     = location,
            @trang_thai_ton = trang_thai_ton
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_batch = @parent_id_batch;

        IF @current_qty IS NULL
            THROW 51000, N'Batch cha không tồn tại.', 1;

        IF @current_qty < @split_quantity
            THROW 51001, N'Số lượng tách vượt quá số dư tồn của Batch cha.', 1;

        DECLARE @target_location NVARCHAR(100) = ISNULL(@new_location, @parent_loc);
        DECLARE @Now DATETIME = GETDATE();

        -- 2. Trừ số lượng batch cha
        UPDATE dbo.tbl_batch_inv
        SET 
            so_luong = so_luong - @split_quantity,
            ma_event_up = N'3', -- 3: Tách batch
            time_up = @Now,
            user_up = @user_id
        WHERE id_batch = @parent_id_batch;

        -- Ghi log batch_event cho Batch Cha
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        VALUES (
            @parent_id_batch, 3, @material_id, @current_qty - @split_quantity, @unit, @Now, @user_id, @trang_thai_ton
        );

        -- 3. Tạo batch con
        DECLARE @new_batch_id INT;

        INSERT INTO dbo.tbl_batch_inv (
            id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu, so_luong, unit, 
            time_cre, user_up, time_up, location_event_up, ma_event_up, trang_thai_ton, 
            epc, location, parent_id_batch
        )
        SELECT 
            id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu, @split_quantity, unit, 
            @Now, @user_id, @Now, N'1', N'3', trang_thai_ton, 
            epc, @target_location, @parent_id_batch
        FROM dbo.tbl_batch_inv
        WHERE id_batch = @parent_id_batch;

        SET @new_batch_id = SCOPE_IDENTITY();

        -- Ghi log batch_event cho Batch Con mới
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        VALUES (
            @new_batch_id, 3, @material_id, @split_quantity, @unit, @Now, @user_id, @trang_thai_ton
        );

        -- Ghi log location_event cho Batch Con nếu có vị trí kệ
        IF @target_location IS NOT NULL AND LTRIM(RTRIM(@target_location)) <> ''
        BEGIN
            INSERT INTO dbo.tbl_location_event (
                ma_location, id_batch, location_event, user_cre, time_cre
            )
            VALUES (
                @target_location, @new_batch_id, N'1', @user_id, @Now
            );
        END;

        -- 4. Ghi log transaction cho Batch Cha
        INSERT INTO dbo.tbl_transaction (
            id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai
        )
        VALUES (
            @parent_id_batch, N'SPLIT_OUT', @material_id, @bravo_id, @material_name, -@split_quantity, @unit, @Now, N'1'
        );

        -- 5. Ghi log transaction cho Batch Con
        INSERT INTO dbo.tbl_transaction (
            id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai
        )
        VALUES (
            @new_batch_id, N'SPLIT_IN', @material_id, @bravo_id, @material_name, @split_quantity, @unit, @Now, N'1'
        );

        COMMIT TRANSACTION;

        SELECT 
            1 AS IsSuccess,
            N'Tách lô thành công. Đã tạo Batch con ID: ' + CAST(@new_batch_id AS NVARCHAR) AS Message,
            @new_batch_id AS NewBatchId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO

-- ----------------------------------------------------------------------------
-- 2. NGHIỆP VỤ ĐẾM KIỂM KÊ TỪNG THÙNG (dbo.sp_wms_log_count_and_split - UC-27)
-- ----------------------------------------------------------------------------
PRINT N'2. Cập nhật dbo.sp_wms_log_count_and_split (Đếm kiểm kê & ghi log event)...';
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
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Lấy thông tin lô gốc
        DECLARE 
            @current_qty FLOAT,
            @material_id NVARCHAR(100),
            @bravo_id NVARCHAR(100),
            @material_name NVARCHAR(255),
            @ma_kho NVARCHAR(50),
            @location_event_up NVARCHAR(50),
            @ma_event_up NVARCHAR(50),
            @trang_thai_ton NVARCHAR(50),
            @Now DATETIME = GETDATE();

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
            
            -- Ghi nhận biến động TĂNG DO KIỂM KÊ
            INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
            VALUES (@batch_id, N'CC_ADJ_IN', @material_id, @bravo_id, @material_name, @diff, @unit, @Now, N'1');
            
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

        -- Ghi log batch_event cho lô cha
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        VALUES (
            @batch_id, 5, @material_id, @current_qty - @actual_quantity, @unit, @Now, @user, @trang_thai_ton
        );

        INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@batch_id, N'SPLIT_OUT', @material_id, @bravo_id, @material_name, -@actual_quantity, @unit, @Now, N'1');

        -- B. Tạo lô con mới (kế thừa parent_id_batch từ lô gốc)
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
        
        -- C. Ghi nhận giao dịch nhập lô con
        INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
        VALUES (@new_batch_id, N'SPLIT_IN', @material_id, @bravo_id, @material_name, @actual_quantity, @unit, @Now, N'1');

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

-- ----------------------------------------------------------------------------
-- 3. NGHIỆP VỤ ĐÓNG KẾ HOẠCH KIỂM KÊ (dbo.sp_wms_finish_cycle_count - UC-27)
-- ----------------------------------------------------------------------------
PRINT N'3. Cập nhật dbo.sp_wms_finish_cycle_count (Đóng kế hoạch & ghi log event)...';
GO

CREATE OR ALTER PROCEDURE dbo.sp_wms_finish_cycle_count
    @plan_id INT,
    @user NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Now DATETIME = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @status INT;
        SELECT @status = trang_thai FROM dbo.tbl_kiemke_kh WHERE id_kh_kiemke = @plan_id;
        
        IF @status IS NULL
            THROW 51000, N'Kế hoạch kiểm kê không tồn tại!', 1;

        IF @status = 1
            THROW 51001, N'Kế hoạch kiểm kê đã đóng!', 1;

        -- 1. Ghi log giao dịch GIẢM cho những lượng cặn dư
        INSERT INTO dbo.tbl_transaction (id_batch, nghiep_vu, id_vattu, id_bravo, ten_vattu, so_luong, unit, time_cre, trang_thai)
        SELECT 
            b.id_batch, 
            N'CC_ADJ_OUT', 
            b.id_vattu, 
            b.id_bravo, 
            b.ten_vattu, 
            -b.so_luong, 
            b.unit, 
            @Now,
            N'1'
        FROM dbo.tbl_kiemke_danhsach d
        INNER JOIN dbo.tbl_batch_inv b ON d.id_batch = b.id_batch
        WHERE d.id_kh_kiemke = @plan_id AND b.so_luong > 0;

        -- 2. Ghi nhật ký batch_event đưa số lượng cặn về 0
        INSERT INTO dbo.tbl_batch_event (
            id_batch, ma_event, id_vattu, so_luong, unit, time_up, user_up, trang_thai_ton
        )
        SELECT 
            b.id_batch, 
            5, -- 5: Điều chỉnh kiểm kê
            b.id_vattu, 
            0, 
            b.unit, 
            @Now, 
            @user, 
            N'0' -- 0: Đã xuất hết / Chốt kiểm kê
        FROM dbo.tbl_kiemke_danhsach d
        INNER JOIN dbo.tbl_batch_inv b ON d.id_batch = b.id_batch
        WHERE d.id_kh_kiemke = @plan_id AND b.so_luong > 0;

        -- 3. Đưa số lượng các lô gốc còn dư về 0
        UPDATE b
        SET 
            b.so_luong = 0,
            b.trang_thai_ton = N'0',
            b.ma_event_up = N'5',
            b.user_up = @user,
            b.time_up = @Now
        FROM dbo.tbl_kiemke_danhsach d
        INNER JOIN dbo.tbl_batch_inv b ON d.id_batch = b.id_batch
        WHERE d.id_kh_kiemke = @plan_id AND b.so_luong > 0;

        -- 4. Cập nhật trạng thái kế hoạch thành Hoàn thành (1)
        UPDATE dbo.tbl_kiemke_kh
        SET 
            trang_thai = 1,
            time_ketthuc = @Now,
            user_duyet = @user
        WHERE id_kh_kiemke = @plan_id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 
            ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
