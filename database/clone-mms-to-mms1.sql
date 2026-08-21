-- ============================================================================
-- SCRIPT: Sao chép toàn bộ bảng dữ liệu vận hành từ MMS sang MMS1
-- và cấu hình hệ thống phân quyền mới cho người dùng
-- ============================================================================

USE [MMS1];
GO

-- 1. Đảm bảo schema [api] tồn tại trong MMS1
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'api')
BEGIN
    EXEC('CREATE SCHEMA api');
END
GO

-- 2. Sao chép toàn bộ các bảng vật lý và dữ liệu từ MMS sang MMS1
DECLARE @sql NVARCHAR(MAX) = N'';
DECLARE @tableName NVARCHAR(255);
DECLARE @tableCount INT = 0;

DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
SELECT TABLE_NAME 
FROM MMS.INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_SCHEMA = 'dbo'
ORDER BY TABLE_NAME;

OPEN cur;
FETCH NEXT FROM cur INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    -- Nếu bảng đã tồn tại trong MMS1 thì xóa trước để sao chép nguyên vẹn
    IF OBJECT_ID('MMS1.dbo.' + QUOTENAME(@tableName), 'U') IS NOT NULL
    BEGIN
        SET @sql = N'DROP TABLE MMS1.dbo.' + QUOTENAME(@tableName);
        EXEC sp_executesql @sql;
    END

    -- Sao chép bảng và dữ liệu từ MMS sang MMS1
    SET @sql = N'SELECT * INTO MMS1.dbo.' + QUOTENAME(@tableName) + N' FROM MMS.dbo.' + QUOTENAME(@tableName);
    EXEC sp_executesql @sql;

    SET @tableCount = @tableCount + 1;
    FETCH NEXT FROM cur INTO @tableName;
END

CLOSE cur;
DEALLOCATE cur;

PRINT N'Đã sao chép thành công ' + CAST(@tableCount AS NVARCHAR(10)) + N' bảng dữ liệu từ MMS sang MMS1!';
GO

-- 3. Tạo User-Defined Table Types trong schema [api] nếu có
IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = 'RolePermissionItem_v1' AND schema_id = SCHEMA_ID('api'))
BEGIN
    CREATE TYPE api.RolePermissionItem_v1 AS TABLE
    (
        ScreenCode NVARCHAR(50) NOT NULL,
        ScreenLabel NVARCHAR(100) NULL,
        AccessMode NVARCHAR(20) NULL
    );
END
GO

-- 4. Tạo Views trong schema [api]
CREATE OR ALTER VIEW api.vw_SEC_UserScreenAccess_v1
AS
SELECT
    UserId = u.user_n,
    RoleCode = u.ma_role,
    ScreenCode = COALESCE(NULLIF(s.name_screen, N''), s.text_screen),
    ScreenLabel = COALESCE(NULLIF(s.text_screen, N''), s.name_screen),
    AccessMode = rs.view_edit
FROM dbo.tbl_dm_user AS u
INNER JOIN dbo.tbl_role_screen AS rs ON rs.id_role_app = u.ma_role
INNER JOIN dbo.tbl_dm_screen_pc AS s
    ON COALESCE(NULLIF(s.name_screen, N''), s.text_screen)
       = COALESCE(NULLIF(rs.name_screen, N''), rs.text_screen)
WHERE u.status_active = 1
  AND rs.in_rs = 1
  AND COALESCE(NULLIF(s.name_screen, N''), s.text_screen) IS NOT NULL;
GO

-- 5. Chuẩn hóa bảng phân quyền mới trên MMS1
IF OBJECT_ID('dbo.tbl_app_role', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_app_role
    (
        role_code VARCHAR(50) NOT NULL PRIMARY KEY,
        role_name NVARCHAR(100) NOT NULL,
        description NVARCHAR(255) NULL,
        is_active BIT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT GETDATE(),
        updated_at DATETIME NOT NULL DEFAULT GETDATE()
    );
END
GO

IF OBJECT_ID('dbo.tbl_app_permission', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_app_permission
    (
        permission_code VARCHAR(100) NOT NULL PRIMARY KEY,
        module_group NVARCHAR(50) NOT NULL,
        permission_name NVARCHAR(150) NOT NULL,
        description NVARCHAR(255) NULL,
        display_order INT NOT NULL DEFAULT 0
    );
END
GO

IF OBJECT_ID('dbo.tbl_app_role_permission', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_app_role_permission
    (
        role_code VARCHAR(50) NOT NULL,
        permission_code VARCHAR(100) NOT NULL,
        is_granted BIT NOT NULL DEFAULT 1,
        updated_by NVARCHAR(50) NULL,
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_tbl_app_role_permission_mms1 PRIMARY KEY (role_code, permission_code)
    );
END
GO

-- Nạp 5 vai trò chuẩn
MERGE INTO dbo.tbl_app_role AS target
USING (VALUES
    ('admin', N'Admin Hệ Thống', N'Toàn quyền quản trị hệ thống, phân quyền vai trò và xem tất cả phân hệ', 1),
    ('truongphong_kho', N'Trưởng Phòng Kho', N'Phê duyệt đề nghị xuất kho, điều phối kho, theo dõi KPI & Báo cáo', 1),
    ('thukho', N'Thủ Kho', N'Quản lý nhập kho, tồn kho, vị trí kệ, thủ tục xuất nhập và in tem batch', 1),
    ('nhanvien', N'Nhân Viên Kho (PDA)', N'Soạn hàng FIFO, thao tác máy quét Laser PDA, quét cất/dời kệ thực địa', 1),
    ('qc', N'Kỹ Thuật QC/QA', N'Kiểm tra chất lượng vật tư, đánh giá Đạt/Không đạt và in tem kiểm định', 1)
) AS source (role_code, role_name, description, is_active)
ON target.role_code = source.role_code
WHEN MATCHED THEN
    UPDATE SET role_name = source.role_name, description = source.description, is_active = source.is_active, updated_at = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (role_code, role_name, description, is_active)
    VALUES (source.role_code, source.role_name, source.description, source.is_active);
GO

-- Nạp 19 quyền chức năng
MERGE INTO dbo.tbl_app_permission AS target
USING (VALUES
    -- Nhóm Nhập kho
    ('inbound.receive', N'Nhập kho', N'Quét & nhận hàng theo PO / Không PO', N'Tiếp nhận hàng hóa tại cửa kho', 10),
    ('inbound.update_po', N'Nhập kho', N'Cập nhật & đối soát số lượng PO', N'Đối chiếu số lượng thực nhận so với PO', 20),
    ('inbound.finalize', N'Nhập kho', N'Hoàn tất thủ tục nhập kho & sinh Batch', N'Chốt phiếu nhập và tạo lô hàng tồn kho', 30),
    ('inbound.print_label', N'Nhập kho', N'In tem nhãn Barcode / QR Batch', N'In tem mã vạch dán kiện hàng mới', 40),

    -- Nhóm Xuất kho
    ('outbound.request', N'Xuất kho', N'Tạo đề nghị xuất kho', N'Lập phiếu đề nghị xuất vật tư (Theo KH/Ngoài KH/Vượt mức)', 50),
    ('outbound.approve', N'Xuất kho', N'Phê duyệt / Từ chối đề nghị xuất', N'Ký duyệt phiếu xuất dành cho Quản lý/Trưởng phòng', 60),
    ('outbound.finalize', N'Xuất kho', N'Hoàn tất thủ tục xuất & in phiếu xuất', N'Trừ tồn kho chính thức và in phiếu xuất kho', 70),

    -- Nhóm Soạn hàng (PDA)
    ('picking.queue', N'Soạn hàng', N'Xem hàng đợi soạn hàng', N'Danh sách đơn hàng đã duyệt chờ soạn', 80),
    ('picking.fifo_scan', N'Soạn hàng', N'Quét soạn hàng theo lô ưu tiên FIFO', N'Gợi ý vị trí và quét xác nhận lô hàng FIFO', 90),
    ('picking.pda', N'Soạn hàng', N'Sử dụng Chế độ Máy quét cầm tay PDA', N'Giao diện tối ưu máy quét Laser công nghiệp', 100),

    -- Nhóm Tồn kho & Kệ
    ('inventory.view', N'Tồn kho & Kệ', N'Tra cứu tồn kho & Sơ đồ vị trí kệ', N'Xem thẻ kho, sơ đồ kệ và mức min/max', 110),
    ('inventory.putaway', N'Tồn kho & Kệ', N'Quét barcode cất kệ (Putaway)', N'Quét vị trí ô kệ để cất hàng', 120),
    ('inventory.transfer', N'Tồn kho & Kệ', N'Chuyển vị trí kệ & Hạ kệ', N'Dời hàng từ kệ này sang kệ khác hoặc hạ kệ', 130),
    ('inventory.split', N'Tồn kho & Kệ', N'Tách batch & Khai báo tồn kho', N'Chia nhỏ lô hàng hoặc nhập số dư ban đầu', 140),
    ('inventory.audit', N'Tồn kho & Kệ', N'Kiểm kê theo batch & vị trí kệ', N'Tạo đợt kiểm kê và đối soát số lượng thực tế', 150),

    -- Nhóm QC Kiểm định
    ('qc.evaluate', N'QC Kiểm định', N'Kiểm tra chất lượng Đạt / Không đạt', N'Đánh giá chất lượng lô hàng và in phiếu QC', 160),
    ('qc.config', N'QC Kiểm định', N'Khai báo bộ tiêu chuẩn QC', N'Thiết lập chỉ tiêu và nhóm kiểm tra', 170),

    -- Nhóm Quản trị & Báo cáo
    ('admin.roles', N'Quản trị & Báo cáo', N'Quản trị ma trận phân quyền vai trò', N'Phân quyền chức năng cho từng Role', 180),
    ('admin.dashboard', N'Quản trị & Báo cáo', N'Dashboard KPIs & Báo cáo tổng thể', N'Báo cáo xuất-nhập-tồn và giám sát vận hành', 190)
) AS source (permission_code, module_group, permission_name, description, display_order)
ON target.permission_code = source.permission_code
WHEN MATCHED THEN
    UPDATE SET module_group = source.module_group, permission_name = source.permission_name, description = source.description, display_order = source.display_order
WHEN NOT MATCHED THEN
    INSERT (permission_code, module_group, permission_name, description, display_order)
    VALUES (source.permission_code, source.module_group, source.permission_name, source.description, source.display_order);
GO

-- Gán quyền mặc định cho từng vai trò
DELETE FROM dbo.tbl_app_role_permission;
GO

INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
SELECT 'admin', permission_code, 1 FROM dbo.tbl_app_permission;

INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('truongphong_kho', 'outbound.request', 1),
    ('truongphong_kho', 'outbound.approve', 1),
    ('truongphong_kho', 'picking.queue', 1),
    ('truongphong_kho', 'inventory.view', 1),
    ('truongphong_kho', 'inventory.audit', 1),
    ('truongphong_kho', 'admin.dashboard', 1);

INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('thukho', 'inbound.receive', 1),
    ('thukho', 'inbound.update_po', 1),
    ('thukho', 'inbound.finalize', 1),
    ('thukho', 'inbound.print_label', 1),
    ('thukho', 'outbound.request', 1),
    ('thukho', 'outbound.finalize', 1),
    ('thukho', 'picking.queue', 1),
    ('thukho', 'picking.fifo_scan', 1),
    ('thukho', 'picking.pda', 1),
    ('thukho', 'inventory.view', 1),
    ('thukho', 'inventory.putaway', 1),
    ('thukho', 'inventory.transfer', 1),
    ('thukho', 'inventory.split', 1),
    ('thukho', 'inventory.audit', 1),
    ('thukho', 'admin.dashboard', 1);

INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('nhanvien', 'inbound.receive', 1),
    ('nhanvien', 'picking.queue', 1),
    ('nhanvien', 'picking.fifo_scan', 1),
    ('nhanvien', 'picking.pda', 1),
    ('nhanvien', 'inventory.view', 1),
    ('nhanvien', 'inventory.putaway', 1),
    ('nhanvien', 'inventory.transfer', 1);

INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('qc', 'qc.evaluate', 1),
    ('qc', 'qc.config', 1),
    ('qc', 'inventory.view', 1);
GO

-- 6. Điều chỉnh và chuẩn hóa phân quyền Người dùng trong dbo.tbl_dm_user
-- Đảm bảo user 00 (Nguyễn Đình Khương) là Quản Lý / Thủ Kho với mật khẩu 123
UPDATE dbo.tbl_dm_user
SET ma_role = 'thukho', password = '123', status_active = 1
WHERE user_n = '00';

-- Đảm bảo user 6797 (Lưu Minh Tuấn) và user 1 là Admin
UPDATE dbo.tbl_dm_user
SET ma_role = 'admin', password = '123', status_active = 1
WHERE user_n IN ('6797', '1');

-- Thêm các tài khoản chuẩn nếu chưa có
IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_user WHERE user_n = 'truongphong')
BEGIN
    INSERT INTO dbo.tbl_dm_user (user_n, msnv, ho_ten_nv, password, ma_role, chuc_danh, ma_bophan, status_active)
    VALUES ('truongphong', 'TP01', N'VŨ MẠNH CƯỜNG', '123', 'truongphong_kho', N'Trưởng Phòng Kho', 'KHO', 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_user WHERE user_n = 'nhanvien01')
BEGIN
    INSERT INTO dbo.tbl_dm_user (user_n, msnv, ho_ten_nv, password, ma_role, chuc_danh, ma_bophan, status_active)
    VALUES ('nhanvien01', 'NV01', N'TRẦN VĂN NAM', '123', 'nhanvien', N'Nhân Viên Kho (PDA)', 'KHO', 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_user WHERE user_n = 'qc01')
BEGIN
    INSERT INTO dbo.tbl_dm_user (user_n, msnv, ho_ten_nv, password, ma_role, chuc_danh, ma_bophan, status_active)
    VALUES ('qc01', 'QC01', N'LÊ THỊ THU THẢO', '123', 'qc', N'Kỹ Thuật QC/QA', 'QC', 1);
END
GO

PRINT N'Hoàn tất thiết lập cơ sở dữ liệu MMS1 và chuẩn hóa phân quyền người dùng!';
