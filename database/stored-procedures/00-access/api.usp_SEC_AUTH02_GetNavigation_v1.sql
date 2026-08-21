CREATE OR ALTER PROCEDURE api.usp_SEC_AUTH02_GetNavigation_v1
    @UserId nvarchar(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @UserId = NULLIF(LTRIM(RTRIM(@UserId)), N'');
    IF @UserId IS NULL
        THROW 51001, N'Không xác định được người dùng.', 1;

    IF NOT EXISTS
    (
        SELECT 1 FROM dbo.tbl_dm_user
        WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1
        UNION ALL
        SELECT 1 FROM dbo.tbl_user_ql WHERE user_ql = @UserId
    )
        THROW 51001, N'Người dùng không tồn tại hoặc đã bị khóa.', 1;

    SELECT
        ScreenCode,
        Label = MAX(ScreenLabel),
        AccessMode = MAX(AccessMode)
    FROM api.vw_SEC_UserScreenAccess_v1
    WHERE UserId = @UserId
      AND ScreenCode IS NOT NULL
    GROUP BY ScreenCode
    ORDER BY Label, ScreenCode;
END;

