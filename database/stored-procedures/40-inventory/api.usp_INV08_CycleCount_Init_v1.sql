-- ================================================================
-- CƠ SỞ DỮ LIỆU: MMS1
-- TÍNH NĂNG: UC-27 (INV-08) - KIỂM KÊ CYCLE COUNT THEO VẬT TƯ (BƯỚC 1)
-- ================================================================

-- 1. BẢNG KẾ HOẠCH KIỂM KÊ (tbl_kiemke_kh)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_kiemke_kh')
BEGIN
    CREATE TABLE dbo.tbl_kiemke_kh (
        id_kh_kiemke     INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_vattu         NVARCHAR(50) NOT NULL,
        soluong_hethong  DECIMAL(18,4) NULL DEFAULT 0,
        soluong_sosach   DECIMAL(18,4) NULL DEFAULT 0,
        soluong_thucte   DECIMAL(18,4) NULL DEFAULT 0,
        time_batdau      DATETIME2(0) NULL,
        time_ketthuc     DATETIME2(0) NULL,
        ghi_chu          NVARCHAR(500) NULL,
        trang_thai       NVARCHAR(50) NULL DEFAULT N'0', -- '0': Đang kiểm, '1': Hoàn tất, '2': Hủy
        user_cre         NVARCHAR(50) NOT NULL,
        time_cre         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        user_duyet       NVARCHAR(50) NULL
    );
END;
GO

-- 2. BẢNG KẾ HOẠCH KIỂM CHI TIẾT THEO BATCH (tbl_kiemke_danhsach)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_kiemke_danhsach')
BEGIN
    CREATE TABLE dbo.tbl_kiemke_danhsach (
        id_kiemke        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_kh_kiemke     INT NOT NULL,
        id_batch         INT NOT NULL,
        so_luong         DECIMAL(18,4) NOT NULL DEFAULT 0,
        unit             NVARCHAR(20) NULL,
        vi_tri           NVARCHAR(100) NULL,
        time_cre         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_kiemke_danhsach_kh FOREIGN KEY (id_kh_kiemke) REFERENCES dbo.tbl_kiemke_kh(id_kh_kiemke)
    );
END;
GO

-- 3. BẢNG NHẬT KÝ GHI NHẬN KIỂM ĐẾM THỰC TẾ (tbl_kiemke_log)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'tbl_kiemke_log')
BEGIN
    CREATE TABLE dbo.tbl_kiemke_log (
        id_kiem          INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_kiemke        INT NOT NULL,
        id_batch         INT NOT NULL,
        so_luong         DECIMAL(18,4) NOT NULL DEFAULT 0,
        unit             NVARCHAR(20) NULL,
        vi_tri           NVARCHAR(100) NULL,
        user_cre         NVARCHAR(50) NOT NULL,
        time_cre         DATETIME2(7) NOT NULL DEFAULT SYSDATETIME()
    );
END;
GO

-- 4. STORED PROCEDURE: sp_kiemke_tao_kehoach
CREATE OR ALTER PROCEDURE dbo.sp_kiemke_tao_kehoach
(
    @id_vattu          NVARCHAR(50),
    @soluong_sosach    DECIMAL(18,4),
    @time_batdau       DATETIME2(0),
    @user_cre          NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    DECLARE
        @soluong_hethong DECIMAL(18,4),
        @id_kh_kiemke    INT,
        @so_batch        INT;
    BEGIN TRY
        BEGIN TRANSACTION;
        /* ========================================================
           B1.1: Tính tổng số lượng tồn hệ thống của vật tư
        ======================================================== */
        SELECT
            @soluong_hethong = ISNULL(SUM(CONVERT(DECIMAL(18,4), so_luong)), 0)
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_vattu = @id_vattu
          AND trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
          AND so_luong > 0;

        /* ========================================================
           B1.2: Tạo kế hoạch kiểm kê
        ======================================================== */
        INSERT INTO dbo.tbl_kiemke_kh
        (
            id_vattu,
            soluong_hethong,
            soluong_sosach,
            time_batdau,
            user_cre
        )
        VALUES
        (
            @id_vattu,
            @soluong_hethong,
            @soluong_sosach,
            @time_batdau,
            @user_cre
        );

        /* ========================================================
           B1.3: Lấy id_kh_kiemke vừa được tạo
        ======================================================== */
        SET @id_kh_kiemke = CONVERT(INT, SCOPE_IDENTITY());

        /* ========================================================
           B2 + B3: Lấy danh sách batch của vật tư và lưu trực tiếp
           vào tbl_kiemke_danhsach
        ======================================================== */
        INSERT INTO dbo.tbl_kiemke_danhsach
        (
            id_kh_kiemke,
            id_batch,
            so_luong,
            unit,
            vi_tri
        )
        SELECT
            @id_kh_kiemke,
            id_batch,
            CONVERT(DECIMAL(18,4), so_luong),
            unit,
            location
        FROM dbo.tbl_batch_inv
        WHERE id_vattu = @id_vattu
          AND trang_thai_ton NOT IN (N'0', N'2', N'5', N'00')
          AND so_luong > 0;

        SET @so_batch = @@ROWCOUNT;
        COMMIT TRANSACTION;

        SELECT
            CAST(1 AS BIT)       AS ok,
            N'Tạo kế hoạch kiểm kê thành công.' AS msg,
            @id_kh_kiemke        AS id_kh_kiemke,
            @id_vattu            AS id_vattu,
            @soluong_hethong     AS soluong_hethong,
            @soluong_sosach      AS soluong_sosach,
            @so_batch            AS so_batch;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT
            CAST(0 AS BIT)       AS ok,
            ERROR_MESSAGE()      AS msg,
            NULL                 AS id_kh_kiemke,
            @id_vattu            AS id_vattu,
            NULL                 AS soluong_hethong,
            @soluong_sosach      AS soluong_sosach,
            NULL                 AS so_batch;
    END CATCH;
END;
GO

-- 5. STORED PROCEDURE: sp_kiemke_soluong
CREATE OR ALTER PROCEDURE dbo.sp_kiemke_soluong
(
    @id_kiemke  INT,
    @id_batch   INT,
    @so_luong   DECIMAL(18,4),
    @unit       NVARCHAR(20),
    @vi_tri     NVARCHAR(100),
    @user_cre   NVARCHAR(50)
)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    BEGIN TRY
        INSERT INTO dbo.tbl_kiemke_log
        (
            id_kiemke,
            id_batch,
            so_luong,
            unit,
            vi_tri,
            user_cre
        )
        VALUES
        (
            @id_kiemke,
            @id_batch,
            @so_luong,
            @unit,
            @vi_tri,
            @user_cre
        );

        -- Tự động cập nhật tổng thực tế cho kế hoạch kiểm kê cha
        UPDATE kh
        SET soluong_thucte = (
            SELECT ISNULL(SUM(l.so_luong), 0)
            FROM dbo.tbl_kiemke_log l
            INNER JOIN dbo.tbl_kiemke_danhsach d ON d.id_kiemke = l.id_kiemke
            WHERE d.id_kh_kiemke = kh.id_kh_kiemke
        )
        FROM dbo.tbl_kiemke_kh kh
        INNER JOIN dbo.tbl_kiemke_danhsach ds ON ds.id_kh_kiemke = kh.id_kh_kiemke
        WHERE ds.id_kiemke = @id_kiemke;

        SELECT
            CAST(1 AS BIT) AS ok,
            N'Xác nhận số lượng kiểm kê thành công.' AS msg,
            @id_kiemke AS id_kiemke,
            @id_batch AS id_batch,
            @so_luong AS so_luong;
    END TRY
    BEGIN CATCH
        SELECT
            CAST(0 AS BIT) AS ok,
            ERROR_MESSAGE() AS msg,
            @id_kiemke AS id_kiemke,
            @id_batch AS id_batch,
            NULL AS so_luong;
    END CATCH;
END;
GO

-- 6. STORED PROCEDURE: sp_kiemke_danhsach_kh (Truy vấn danh sách kế hoạch kiểm)
CREATE OR ALTER PROCEDURE dbo.sp_kiemke_danhsach_kh
(
    @Search       NVARCHAR(200) = NULL,
    @TrangThai    NVARCHAR(50) = NULL
)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        kh.id_kh_kiemke,
        kh.id_vattu,
        vattu.ten_vattu,
        vattu.unit,
        kh.soluong_hethong,
        kh.soluong_sosach,
        kh.soluong_thucte,
        ChenhLech = ISNULL(kh.soluong_thucte, 0) - ISNULL(kh.soluong_hethong, 0),
        kh.time_batdau,
        kh.time_ketthuc,
        kh.ghi_chu,
        kh.trang_thai,
        kh.user_cre,
        kh.time_cre,
        kh.user_duyet,
        SoBatch = COUNT(DISTINCT ds.id_batch),
        SoLuotDem = COUNT(DISTINCT l.id_kiem)
    FROM dbo.tbl_kiemke_kh kh
    LEFT JOIN dbo.tbl_dm_vattu vattu ON vattu.id_vattu = kh.id_vattu
    LEFT JOIN dbo.tbl_kiemke_danhsach ds ON ds.id_kh_kiemke = kh.id_kh_kiemke
    LEFT JOIN dbo.tbl_kiemke_log l ON l.id_kiemke = ds.id_kiemke
    WHERE (@Search IS NULL OR kh.id_vattu LIKE N'%' + @Search + N'%' OR vattu.ten_vattu LIKE N'%' + @Search + N'%' OR CONVERT(NVARCHAR(50), kh.id_kh_kiemke) LIKE N'%' + @Search + N'%')
      AND (@TrangThai IS NULL OR kh.trang_thai = @TrangThai)
    GROUP BY
        kh.id_kh_kiemke, kh.id_vattu, vattu.ten_vattu, vattu.unit,
        kh.soluong_hethong, kh.soluong_sosach, kh.soluong_thucte,
        kh.time_batdau, kh.time_ketthuc, kh.ghi_chu, kh.trang_thai,
        kh.user_cre, kh.time_cre, kh.user_duyet
    ORDER BY kh.id_kh_kiemke DESC;
END;
GO

-- 7. STORED PROCEDURE: sp_kiemke_chitiet_kh (Truy vấn chi tiết các batch của kế hoạch)
CREATE OR ALTER PROCEDURE dbo.sp_kiemke_chitiet_kh
(
    @id_kh_kiemke INT
)
AS
BEGIN
    SET NOCOUNT ON;

    -- Kết quả 1: Thông tin đầu kế hoạch
    SELECT
        kh.id_kh_kiemke,
        kh.id_vattu,
        vattu.ten_vattu,
        vattu.unit,
        kh.soluong_hethong,
        kh.soluong_sosach,
        kh.soluong_thucte,
        kh.time_batdau,
        kh.time_ketthuc,
        kh.ghi_chu,
        kh.trang_thai,
        kh.user_cre,
        kh.time_cre
    FROM dbo.tbl_kiemke_kh kh
    LEFT JOIN dbo.tbl_dm_vattu vattu ON vattu.id_vattu = kh.id_vattu
    WHERE kh.id_kh_kiemke = @id_kh_kiemke;

    -- Kết quả 2: Danh sách các batch chi tiết
    SELECT
        ds.id_kiemke,
        ds.id_kh_kiemke,
        ds.id_batch,
        batch.id_bravo,
        ds.so_luong AS soluong_hethong_batch,
        ds.unit,
        ds.vi_tri,
        batch.time_cre AS batch_time_cre,
        TongThucTeBatch = ISNULL(SUM(l.so_luong), 0),
        SoLanDem = COUNT(l.id_kiem),
        DaKiem = CASE WHEN COUNT(l.id_kiem) > 0 THEN 1 ELSE 0 END
    FROM dbo.tbl_kiemke_danhsach ds
    LEFT JOIN dbo.tbl_batch_inv batch ON batch.id_batch = ds.id_batch
    LEFT JOIN dbo.tbl_kiemke_log l ON l.id_kiemke = ds.id_kiemke
    WHERE ds.id_kh_kiemke = @id_kh_kiemke
    GROUP BY
        ds.id_kiemke, ds.id_kh_kiemke, ds.id_batch, batch.id_bravo,
        ds.so_luong, ds.unit, ds.vi_tri, batch.time_cre
    ORDER BY ds.vi_tri, ds.id_batch;

    -- Kết quả 3: Toàn bộ nhật ký kiểm đếm thực tế của kế hoạch
    SELECT
        l.id_kiem,
        l.id_kiemke,
        l.id_batch,
        l.so_luong,
        l.unit,
        l.vi_tri,
        l.user_cre,
        l.time_cre
    FROM dbo.tbl_kiemke_log l
    INNER JOIN dbo.tbl_kiemke_danhsach ds ON ds.id_kiemke = l.id_kiemke
    WHERE ds.id_kh_kiemke = @id_kh_kiemke
    ORDER BY l.id_kiem DESC;
END;
GO
