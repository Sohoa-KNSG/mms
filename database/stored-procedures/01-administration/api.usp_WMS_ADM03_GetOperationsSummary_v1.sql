CREATE OR ALTER PROCEDURE api.usp_WMS_ADM03_GetOperationsSummary_v1
    @UserId nvarchar(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'operations_summary', N'scr_admin_role_app')
    )
        THROW 51001, N'Không có quyền xem giám sát vận hành.', 1;

    CREATE TABLE #Variance
    (
        MaterialId nvarchar(50) NOT NULL,
        Unit nvarchar(50) NOT NULL,
        Variance decimal(19,4) NOT NULL
    );

    ;WITH BatchBalance AS
    (
        SELECT id_vattu, unit,
            Quantity = CONVERT(decimal(19,4), SUM(CONVERT(decimal(19,4), so_luong)))
        FROM dbo.tbl_batch_inv
        GROUP BY id_vattu, unit
    ),
    LedgerBalance AS
    (
        SELECT t.id_vattu, t.unit,
            Quantity = CONVERT(decimal(19,4), SUM(
                CONVERT(decimal(19,4), ISNULL(t.so_luong, 0))
                * ISNULL(TRY_CONVERT(int, o.logic), 0)))
        FROM dbo.tbl_transaction AS t
        LEFT JOIN dbo.tbl_dm_nghiepvu_kho AS o ON o.ma_nghiepvu = t.nghiep_vu
        WHERE t.id_vattu IS NOT NULL AND t.unit IS NOT NULL
        GROUP BY t.id_vattu, t.unit
    )
    INSERT #Variance (MaterialId, Unit, Variance)
    SELECT
        COALESCE(b.id_vattu, l.id_vattu),
        COALESCE(b.unit, l.unit),
        ISNULL(b.Quantity, CONVERT(decimal(19,4), 0))
            - ISNULL(l.Quantity, CONVERT(decimal(19,4), 0))
    FROM BatchBalance AS b
    FULL OUTER JOIN LedgerBalance AS l
        ON l.id_vattu = b.id_vattu AND l.unit = b.unit;

    SELECT
        GeneratedAt = SYSDATETIME(),
        InventoryMaterialCount = (SELECT COUNT(DISTINCT id_vattu) FROM dbo.tbl_batch_inv),
        ActiveBatchCount =
        (
            SELECT COUNT(1)
            FROM dbo.tbl_batch_inv AS b
            LEFT JOIN dbo.tbl_dm_trangthai_ton AS s ON s.ma_trangthai = b.trang_thai_ton
            WHERE ISNULL(TRY_CONVERT(int, s.logic_ton), 1) <> 0
        ),
        UnlocatedBatchCount = (SELECT COUNT(1) FROM dbo.tbl_batch_inv WHERE location IS NULL),
        ReceiptCountToday =
        (
            SELECT COUNT(1) FROM dbo.tbl_phieu_nhan_hang
            WHERE time_cre >= CONVERT(date, SYSDATETIME())
              AND time_cre < DATEADD(day, 1, CONVERT(date, SYSDATETIME()))
        ),
        TransactionCountToday =
        (
            SELECT COUNT(1) FROM dbo.tbl_transaction
            WHERE time_cre >= CONVERT(date, SYSDATETIME())
              AND time_cre < DATEADD(day, 1, CONVERT(date, SYSDATETIME()))
        ),
        BalanceVarianceCount = (SELECT COUNT(1) FROM #Variance WHERE Variance <> 0),
        TotalAbsoluteVariance = ISNULL(
            (SELECT SUM(ABS(Variance)) FROM #Variance WHERE Variance <> 0),
            CONVERT(decimal(19,4), 0));

    SELECT Scope, StatusCode, StatusLabel, [Count]
    FROM
    (
        SELECT
            Scope = CONVERT(nvarchar(30), N'RECEIPT'),
            StatusCode = COALESCE(p.status_nhap, N'(NULL)'),
            StatusLabel = MAX(COALESCE(s.hien_thi, s.mo_ta)),
            [Count] = COUNT(1)
        FROM dbo.tbl_phieu_nhan_hang AS p
        LEFT JOIN dbo.tbl_dm_status_nhanhang AS s ON s.ma_status = p.status_nhap
        GROUP BY COALESCE(p.status_nhap, N'(NULL)')

        UNION ALL

        SELECT
            CONVERT(nvarchar(30), N'INVENTORY'),
            COALESCE(b.trang_thai_ton, N'(NULL)'),
            MAX(s.tentrangthai),
            COUNT(1)
        FROM dbo.tbl_batch_inv AS b
        LEFT JOIN dbo.tbl_dm_trangthai_ton AS s ON s.ma_trangthai = b.trang_thai_ton
        GROUP BY COALESCE(b.trang_thai_ton, N'(NULL)')
    ) AS counts
    ORDER BY Scope, StatusCode;
END;

