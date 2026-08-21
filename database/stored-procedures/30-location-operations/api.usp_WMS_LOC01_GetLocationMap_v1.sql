CREATE OR ALTER PROCEDURE api.usp_WMS_LOC01_GetLocationMap_v1
    @UserId nvarchar(50),
    @AreaCode nvarchar(10) = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_luukho_so_do', N'scr_luukho_vitri_ke')
    )
        THROW 51001, N'Không có quyền xem sơ đồ vị trí.', 1;

    SET @AreaCode = NULLIF(LTRIM(RTRIM(@AreaCode)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    ;WITH Occupancy AS
    (
        SELECT
            LocationCode = b.location,
            BatchCount = COUNT(1),
            TotalQuantity = CONVERT(decimal(19,4), SUM(CONVERT(decimal(19,4), b.so_luong)))
        FROM dbo.tbl_batch_inv AS b
        WHERE b.location IS NOT NULL
        GROUP BY b.location
    )
    SELECT
        LocationCode = l.ma_location,
        AreaCode = l.ma_khu_vuc,
        RackCode = l.ma_ke,
        ColumnNumber = l.ma_cot,
        LevelNumber = l.ma_tang,
        PositionNumber = l.vi_tri,
        Description = l.mo_ta,
        BatchCount = ISNULL(o.BatchCount, 0),
        TotalQuantity = ISNULL(o.TotalQuantity, CONVERT(decimal(19,4), 0))
    FROM dbo.tbl_dm_location AS l
    LEFT JOIN Occupancy AS o ON o.LocationCode = l.ma_location
    WHERE @AreaCode IS NULL OR l.ma_khu_vuc = @AreaCode
    ORDER BY l.ma_khu_vuc, l.ma_ke, l.ma_cot, l.ma_tang, l.vi_tri, l.ma_location
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_dm_location
    WHERE @AreaCode IS NULL OR ma_khu_vuc = @AreaCode;
END;

