CREATE OR ALTER PROCEDURE api.usp_WMS_INV01_GetInventoryBalance_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_tonkho_intem'
    )
        THROW 51001, N'Không có quyền xem tồn kho.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    CREATE TABLE #Balance
    (
        MaterialId nvarchar(50) NOT NULL,
        BravoId nvarchar(50) NULL,
        MaterialName nvarchar(255) NULL,
        Unit nvarchar(50) NOT NULL,
        BatchBalance decimal(19,4) NOT NULL,
        LedgerBalance decimal(19,4) NOT NULL
    );

    ;WITH BatchBalance AS
    (
        SELECT
            MaterialId = b.id_vattu,
            BravoId = MAX(b.id_bravo),
            MaterialName = MAX(b.ten_vattu),
            Unit = b.unit,
            Quantity = CONVERT(decimal(19,4), SUM(CONVERT(decimal(19,4), b.so_luong)))
        FROM dbo.tbl_batch_inv AS b
        GROUP BY b.id_vattu, b.unit
    ),
    LedgerBalance AS
    (
        SELECT
            MaterialId = t.id_vattu,
            BravoId = MAX(t.id_bravo),
            MaterialName = MAX(t.ten_vattu),
            Unit = t.unit,
            Quantity = CONVERT(decimal(19,4), SUM(
                CONVERT(decimal(19,4), ISNULL(t.so_luong, 0))
                * ISNULL(TRY_CONVERT(int, o.logic), 0)))
        FROM dbo.tbl_transaction AS t
        LEFT JOIN dbo.tbl_dm_nghiepvu_kho AS o ON o.ma_nghiepvu = t.nghiep_vu
        WHERE t.id_vattu IS NOT NULL AND t.unit IS NOT NULL
        GROUP BY t.id_vattu, t.unit
    )
    INSERT #Balance (MaterialId, BravoId, MaterialName, Unit, BatchBalance, LedgerBalance)
    SELECT
        COALESCE(b.MaterialId, l.MaterialId),
        COALESCE(b.BravoId, l.BravoId),
        COALESCE(b.MaterialName, l.MaterialName),
        COALESCE(b.Unit, l.Unit),
        ISNULL(b.Quantity, CONVERT(decimal(19,4), 0)),
        ISNULL(l.Quantity, CONVERT(decimal(19,4), 0))
    FROM BatchBalance AS b
    FULL OUTER JOIN LedgerBalance AS l
        ON l.MaterialId = b.MaterialId AND l.Unit = b.Unit;

    CREATE CLUSTERED INDEX IX_Balance_Material_Unit ON #Balance (MaterialId, Unit);

    SELECT
        MaterialId,
        BravoId,
        MaterialName,
        Unit,
        WarehouseCode = CONVERT(nvarchar(50), NULL),
        BatchBalance,
        LedgerBalance,
        Variance = BatchBalance - LedgerBalance
    FROM #Balance
    WHERE @Search IS NULL
       OR MaterialId LIKE N'%' + @Search + N'%'
       OR BravoId LIKE N'%' + @Search + N'%'
       OR MaterialName LIKE N'%' + @Search + N'%'
    ORDER BY MaterialId, Unit
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM #Balance
    WHERE @Search IS NULL
       OR MaterialId LIKE N'%' + @Search + N'%'
       OR BravoId LIKE N'%' + @Search + N'%'
       OR MaterialName LIKE N'%' + @Search + N'%';
END;

