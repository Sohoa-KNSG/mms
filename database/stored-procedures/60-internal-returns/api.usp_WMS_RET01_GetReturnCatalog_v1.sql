CREATE OR ALTER PROCEDURE api.usp_WMS_RET01_GetReturnCatalog_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_phieutra_noibo')
        THROW 51001, N'Khong co quyen lap phieu tra noi bo.', 1;
    DECLARE @DepartmentCode nvarchar(50);
    SELECT @DepartmentCode = ma_bophan FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @DepartmentCode IS NULL THROW 51001, N'Tai khoan khong co bo phan.', 1;
    SELECT MaterialId = material.id_vattu, BravoId = material.id_bravo,
        MaterialName = material.ten_vattu, Unit = material.unit
    FROM dbo.tbl_dm_vattu AS material
    WHERE ISNULL(material.status_active, N'1') <> N'0'
      AND (@Search IS NULL OR material.id_vattu LIKE N'%' + @Search + N'%'
           OR material.id_bravo LIKE N'%' + @Search + N'%' OR material.ten_vattu LIKE N'%' + @Search + N'%')
    ORDER BY material.ten_vattu, material.id_vattu;
    SELECT DestinationBravoCode = destination.ma_bravo, DestinationName = destination.ten_bravo_bophan
    FROM dbo.tbl_sx_bravo AS destination
    WHERE destination.ma_ql = @DepartmentCode AND destination.ma_bravo IS NOT NULL
    ORDER BY destination.ten_bravo_bophan, destination.ma_bravo;
END;
