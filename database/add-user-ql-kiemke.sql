USE MMS1;
GO

-- 1. Thêm hoặc cập nhật vai trò ql_kiemke trong tbl_role
IF NOT EXISTS (SELECT 1 FROM dbo.tbl_role WHERE ma_role = 'ql_kiemke')
BEGIN
    INSERT INTO dbo.tbl_role (ma_role, ten_phan_quyen, screen_view, screen_edit, time_cre)
    VALUES ('ql_kiemke', N'Quản Lý Kiểm Kê Kho', 'inventory,cycle_count', 'inventory,cycle_count', GETDATE());
END
ELSE
BEGIN
    UPDATE dbo.tbl_role
    SET ten_phan_quyen = N'Quản Lý Kiểm Kê Kho',
        screen_view = 'inventory,cycle_count',
        screen_edit = 'inventory,cycle_count'
    WHERE ma_role = 'ql_kiemke';
END
GO

-- 2. Thêm hoặc cập nhật người dùng ql_kiemke trong tbl_dm_user
IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_user WHERE user_n = 'ql_kiemke')
BEGIN
    INSERT INTO dbo.tbl_dm_user (
        user_n, 
        ho_ten_nv, 
        [password], 
        ma_role, 
        chuc_danh, 
        ma_bophan, 
        ma_bravo_bophan, 
        ten_bravo_bophan, 
        status_active
    )
    VALUES (
        'ql_kiemke', 
        N'Nguyễn Văn Kiểm Kê', 
        '123', 
        'ql_kiemke', 
        N'Chuyên Viên Quản Lý Kiểm Kê', 
        '20020100', 
        '20020100', 
        N'Kho Vật Tư KNSG', 
        1
    );
END
ELSE
BEGIN
    UPDATE dbo.tbl_dm_user
    SET ho_ten_nv = N'Nguyễn Văn Kiểm Kê',
        [password] = '123',
        ma_role = 'ql_kiemke',
        chuc_danh = N'Chuyên Viên Quản Lý Kiểm Kê',
        ma_bophan = '20020100',
        ma_bravo_bophan = '20020100',
        ten_bravo_bophan = N'Kho Vật Tư KNSG',
        status_active = 1
    WHERE user_n = 'ql_kiemke';
END
GO

-- 3. Kiểm tra kết quả
SELECT u.user_n, u.ho_ten_nv, u.[password], u.ma_role, r.ten_phan_quyen, u.status_active
FROM dbo.tbl_dm_user u
LEFT JOIN dbo.tbl_role r ON u.ma_role = r.ma_role
WHERE u.user_n = 'ql_kiemke';
GO
