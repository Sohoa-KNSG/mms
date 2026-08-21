-- ============================================================================
-- SCRIPT: KHỞI TẠO BẢNG & STORED PROCEDURES CHO UC-18 (INV-06)
-- KIỂM KÊ THEO BATCH: TRƯỞNG PHÒNG KHO LẬP KẾ HOẠCH & DUYỆT CHỐT LỆCH GIAI TRÌNH
-- ============================================================================

USE [MMS];
GO

SET XACT_ABORT ON;
GO

-- 1. Bảng lưu Kế hoạch kiểm kê theo Batch
IF OBJECT_ID(N'dbo.tbl_kiemke_batch_kh', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_kiemke_batch_kh
    (
        id_kh_batch         INT IDENTITY(1,1) PRIMARY KEY,
        ten_kehoach         NVARCHAR(255) NOT NULL,
        ma_kho              NVARCHAR(50) NOT NULL DEFAULT N'20020100',
        loai_kiemke         NVARCHAR(50) NOT NULL DEFAULT N'BATCH_LIST', -- BATCH_LIST, LOCATION, MATERIAL, AGING
        trang_thai          INT NOT NULL DEFAULT 1, -- 1: Đang kiểm, 2: Đã duyệt hoàn tất, 0: Đã hủy
        tong_so_batch       INT NOT NULL DEFAULT 0,
        so_batch_da_kiem    INT NOT NULL DEFAULT 0,
        so_batch_lech       INT NOT NULL DEFAULT 0,
        tong_snapshot_qty   FLOAT NOT NULL DEFAULT 0,
        tong_thucte_qty     FLOAT NOT NULL DEFAULT 0,
        tong_lech_qty       FLOAT NOT NULL DEFAULT 0,
        user_cre            NVARCHAR(50) NOT NULL,
        time_cre            DATETIME NOT NULL DEFAULT GETDATE(),
        user_approve        NVARCHAR(50) NULL,
        time_approve        DATETIME NULL,
        ghi_chu_duyet       NVARCHAR(1000) NULL,
        ghi_chu             NVARCHAR(500) NULL
    );
END
GO

-- 2. Bảng lưu Chi tiết Lô snapshot và đối soát chênh lệch
IF OBJECT_ID(N'dbo.tbl_kiemke_batch_chitiet', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_kiemke_batch_chitiet
    (
        id_chitiet          INT IDENTITY(1,1) PRIMARY KEY,
        id_kh_batch         INT NOT NULL CONSTRAINT FK_kiemke_batch_kh REFERENCES dbo.tbl_kiemke_batch_kh(id_kh_batch),
        id_batch            INT NOT NULL,
        id_vattu            NVARCHAR(50) NOT NULL,
        id_bravo            NVARCHAR(50) NULL,
        ten_vattu           NVARCHAR(255) NULL,
        unit                NVARCHAR(50) NULL,
        location_snapshot   NVARCHAR(50) NULL,
        location_thucte     NVARCHAR(50) NULL,
        soluong_snapshot    FLOAT NOT NULL DEFAULT 0,
        soluong_thucte      FLOAT NULL,
        chenh_lech          FLOAT NULL,
        trang_thai_kiem     NVARCHAR(50) NOT NULL DEFAULT N'CHUA_KIEM', -- CHUA_KIEM, KHOP, LECH_THUA, LECH_THIEU, YEU_CAU_DEM_LAI
        ly_do_lech          NVARCHAR(500) NULL,
        user_dem_cuoi       NVARCHAR(50) NULL,
        time_dem_cuoi       DATETIME NULL
    );
    CREATE NONCLUSTERED INDEX IX_kiemke_batch_chitiet_kh_batch ON dbo.tbl_kiemke_batch_chitiet(id_kh_batch, id_batch);
END
GO

-- 3. Bảng lưu Nhật ký quét đếm PDA hiện trường
IF OBJECT_ID(N'dbo.tbl_kiemke_batch_log', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.tbl_kiemke_batch_log
    (
        id_log              INT IDENTITY(1,1) PRIMARY KEY,
        id_chitiet          INT NOT NULL CONSTRAINT FK_kiemke_batch_chitiet REFERENCES dbo.tbl_kiemke_batch_chitiet(id_chitiet),
        id_kh_batch         INT NOT NULL,
        id_batch            INT NOT NULL,
        so_luong_dem        FLOAT NOT NULL,
        unit                NVARCHAR(50) NULL,
        vi_tri_quet         NVARCHAR(50) NULL,
        ghi_chu             NVARCHAR(255) NULL,
        user_cre            NVARCHAR(50) NOT NULL,
        time_cre            DATETIME NOT NULL DEFAULT GETDATE()
    );
    CREATE NONCLUSTERED INDEX IX_kiemke_batch_log_kh ON dbo.tbl_kiemke_batch_log(id_kh_batch, id_batch);
END
GO

PRINT N'SUCCESS_CREATE_TABLES_UC18';
