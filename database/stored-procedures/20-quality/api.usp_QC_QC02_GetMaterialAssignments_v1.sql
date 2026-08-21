CREATE OR ALTER PROCEDURE api.usp_QC_QC02_GetMaterialAssignments_v1
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
        WHERE UserId = @UserId AND ScreenCode = N'scr_qc_update_vattu'
    )
        THROW 51001, N'Không có quyền gán cấu hình QC cho vật tư.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT
        MaterialId = m.id_vattu,
        BravoId = m.id_bravo,
        MaterialName = m.ten_vattu,
        Unit = m.unit,
        MaterialGroupCode = m.nhom_vattu,
        CheckId = m.ma_kiem,
        QcGroupCode = c.nhom_vattu,
        QcGroupName = g.ten_nhom_qc
    FROM dbo.tbl_dm_vattu AS m
    LEFT JOIN dbo.tbl_khaibao_qc AS c ON c.id_ma_kiem = m.ma_kiem
    LEFT JOIN dbo.tbl_nhom_qc AS g ON g.id_nhom_qc = c.nhom_vattu
    WHERE @Search IS NULL
       OR m.id_vattu LIKE N'%' + @Search + N'%'
       OR m.id_bravo LIKE N'%' + @Search + N'%'
       OR m.ten_vattu LIKE N'%' + @Search + N'%'
    ORDER BY m.id_vattu
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_dm_vattu AS m
    WHERE @Search IS NULL
       OR m.id_vattu LIKE N'%' + @Search + N'%'
       OR m.id_bravo LIKE N'%' + @Search + N'%'
       OR m.ten_vattu LIKE N'%' + @Search + N'%';

    SELECT
        CheckId = c.id_ma_kiem,
        DeclarationLevel = TRY_CONVERT(int, c.cap_khaibao),
        MaterialId = c.id_vattu,
        QcGroupCode = c.nhom_vattu,
        QcGroupName = g.ten_nhom_qc
    FROM dbo.tbl_khaibao_qc AS c
    LEFT JOIN dbo.tbl_nhom_qc AS g ON g.id_nhom_qc = c.nhom_vattu
    ORDER BY g.ten_nhom_qc, c.id_ma_kiem;
END;

