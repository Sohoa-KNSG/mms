-- ============================================================================
-- SCRIPT: Triển khai Hệ thống Phân quyền Mới trên React (MMS Database)
-- Mô hình 4 vai trò chính: admin, truongphong_kho, thukho, nhanvien (+ qc)
-- 6 nhóm nghiệp vụ: Nhập kho, Xuất kho, Soạn hàng, Tồn kho & Kệ, QC, Quản trị
-- ============================================================================

USE [MMS];
GO

-- 1. Bảng danh mục Vai trò mới (Roles)
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

-- 2. Bảng danh mục Quyền nghiệp vụ React (Permissions)
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

-- 3. Bảng ma trận Gán quyền cho Vai trò (Role - Permission Mapping)
IF OBJECT_ID('dbo.tbl_app_role_permission', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_app_role_permission
    (
        role_code VARCHAR(50) NOT NULL,
        permission_code VARCHAR(100) NOT NULL,
        is_granted BIT NOT NULL DEFAULT 1,
        updated_by NVARCHAR(50) NULL,
        updated_at DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_tbl_app_role_permission PRIMARY KEY (role_code, permission_code)
    );
END
GO

-- 4. Nạp dữ liệu mặc định cho các Vai trò (Roles)
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
    UPDATE SET 
        role_name = source.role_name,
        description = source.description,
        is_active = source.is_active,
        updated_at = GETDATE()
WHEN NOT MATCHED THEN
    INSERT (role_code, role_name, description, is_active)
    VALUES (source.role_code, source.role_name, source.description, source.is_active);
GO

-- 5. Nạp danh mục Quyền nghiệp vụ React chuẩn (Permissions)
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
    UPDATE SET 
        module_group = source.module_group,
        permission_name = source.permission_name,
        description = source.description,
        display_order = source.display_order
WHEN NOT MATCHED THEN
    INSERT (permission_code, module_group, permission_name, description, display_order)
    VALUES (source.permission_code, source.module_group, source.permission_name, source.description, source.display_order);
GO

-- 6. Gán quyền mặc định cho từng Vai trò
DELETE FROM dbo.tbl_app_role_permission;
GO

-- Quyền Admin: Toàn bộ quyền
INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
SELECT 'admin', permission_code, 1 FROM dbo.tbl_app_permission;

-- Quyền Trưởng Phòng Kho: Duyệt xuất, Báo cáo, Dashboard, Tra cứu tồn kho, Xem hàng đợi
INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('truongphong_kho', 'outbound.request', 1),
    ('truongphong_kho', 'outbound.approve', 1),
    ('truongphong_kho', 'picking.queue', 1),
    ('truongphong_kho', 'inventory.view', 1),
    ('truongphong_kho', 'inventory.audit', 1),
    ('truongphong_kho', 'admin.dashboard', 1);

-- Quyền Thủ Kho: Nhập kho đầy đủ, Xuất kho, Tồn kho, Cất/Dời kệ, Tách batch, Soạn hàng
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

-- Quyền Nhân Viên Kho (PDA): Máy quét PDA, Soạn hàng FIFO, Quét cất/dời kệ thực địa
INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('nhanvien', 'inbound.receive', 1),
    ('nhanvien', 'picking.queue', 1),
    ('nhanvien', 'picking.fifo_scan', 1),
    ('nhanvien', 'picking.pda', 1),
    ('nhanvien', 'inventory.view', 1),
    ('nhanvien', 'inventory.putaway', 1),
    ('nhanvien', 'inventory.transfer', 1);

-- Quyền Kỹ Thuật QC/QA: Đánh giá QC, Cấu hình QC, Tra cứu tồn kho
INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted)
VALUES 
    ('qc', 'qc.evaluate', 1),
    ('qc', 'qc.config', 1),
    ('qc', 'inventory.view', 1);
GO

-- 7. Stored Procedure: Lấy danh sách quyền của người dùng hiện tại (UC-01 / UC-02)
CREATE OR ALTER PROCEDURE api.usp_SEC_AUTH02_GetUserPermissions_v2
    @UserId NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RoleCode VARCHAR(50);
    SELECT TOP 1 @RoleCode = ma_role FROM dbo.tbl_dm_user WHERE user_n = @UserId;

    -- Chuẩn hóa role code tương thích
    IF @RoleCode = 'ql_kho' SET @RoleCode = 'truongphong_kho';
    ELSE IF @RoleCode = 'nv_kho' SET @RoleCode = 'nhanvien';
    ELSE IF @RoleCode = 'qc_kho' SET @RoleCode = 'qc';
    ELSE IF @RoleCode IS NULL SET @RoleCode = 'nhanvien';

    SELECT 
        p.permission_code,
        p.module_group,
        p.permission_name,
        p.description,
        IsGranted = CONVERT(bit, COALESCE(rp.is_granted, 0))
    FROM dbo.tbl_app_permission AS p
    LEFT JOIN dbo.tbl_app_role_permission AS rp 
        ON rp.permission_code = p.permission_code AND rp.role_code = @RoleCode
    ORDER BY p.display_order;
END;
GO

-- 8. Stored Procedure: Lấy ma trận phân quyền để quản trị (UC-02 / ADM-01)
CREATE OR ALTER PROCEDURE api.usp_SEC_ADM01_GetPermissionMatrix_v2
    @UserId NVARCHAR(50),
    @RoleCode VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- 1. Trả danh sách các Vai trò
    SELECT 
        role_code,
        role_name,
        description,
        is_active,
        updated_at
    FROM dbo.tbl_app_role
    WHERE is_active = 1
    ORDER BY CASE role_code 
        WHEN 'admin' THEN 1 
        WHEN 'truongphong_kho' THEN 2 
        WHEN 'thukho' THEN 3 
        WHEN 'nhanvien' THEN 4 
        ELSE 5 END;

    -- 2. Trả danh sách quyền kèm trạng thái của role được chọn (hoặc tất cả)
    SET @RoleCode = NULLIF(LTRIM(RTRIM(@RoleCode)), '');
    IF @RoleCode IS NULL SET @RoleCode = 'admin';

    SELECT 
        p.permission_code,
        p.module_group,
        p.permission_name,
        p.description,
        p.display_order,
        IsGranted = CONVERT(bit, COALESCE(rp.is_granted, 0))
    FROM dbo.tbl_app_permission AS p
    LEFT JOIN dbo.tbl_app_role_permission AS rp 
        ON rp.permission_code = p.permission_code AND rp.role_code = @RoleCode
    ORDER BY p.display_order;
END;
GO

-- 9. Stored Procedure: Lưu cập nhật ma trận quyền cho Vai trò (UC-02 / ADM-01)
CREATE OR ALTER PROCEDURE api.usp_SEC_ADM01_SaveRolePermissions_v2
    @UserId NVARCHAR(50),
    @RoleCode VARCHAR(50),
    @PermissionCodesJson NVARCHAR(MAX) -- JSON Array: ["inbound.receive", "outbound.approve", ...]
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_app_role WHERE role_code = @RoleCode)
    BEGIN
        THROW 51002, N'Mã vai trò không tồn tại trong hệ thống.', 1;
    END

    BEGIN TRANSACTION;

    -- Xóa các quyền cũ của role
    DELETE FROM dbo.tbl_app_role_permission WHERE role_code = @RoleCode;

    -- Thêm các quyền mới từ JSON
    INSERT INTO dbo.tbl_app_role_permission (role_code, permission_code, is_granted, updated_by, updated_at)
    SELECT 
        @RoleCode,
        j.value,
        1,
        @UserId,
        GETDATE()
    FROM OPENJSON(@PermissionCodesJson) AS j
    INNER JOIN dbo.tbl_app_permission AS p ON p.permission_code = j.value;

    COMMIT TRANSACTION;

    SELECT 
        RoleCode = @RoleCode,
        UpdatedCount = @@ROWCOUNT,
        UpdatedAt = GETDATE();
END;
GO

PRINT N'Đã khởi tạo và triển khai thành công hệ thống phân quyền mới trên CSDL MMS!';
