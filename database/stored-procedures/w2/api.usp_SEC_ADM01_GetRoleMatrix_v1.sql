CREATE OR ALTER PROCEDURE api.usp_SEC_ADM01_GetRoleMatrix_v1
    @UserId nvarchar(50),
    @RoleCode nvarchar(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_admin_role_app'
    )
        THROW 51001, N'Không có quyền quản trị vai trò.', 1;

    SET @RoleCode = NULLIF(LTRIM(RTRIM(@RoleCode)), N'');

    ;WITH RoleCodes AS
    (
        SELECT ma_role AS RoleCode FROM dbo.tbl_role WHERE ma_role IS NOT NULL
        UNION
        SELECT id_role_app FROM dbo.tbl_role_screen WHERE id_role_app IS NOT NULL
    )
    SELECT
        r.RoleCode,
        RoleName = MAX(role.ten_phan_quyen),
        ChangedAt = MAX(COALESCE(role.time_edit, role.time_cre))
    FROM RoleCodes AS r
    LEFT JOIN dbo.tbl_role AS role ON role.ma_role = r.RoleCode
    GROUP BY r.RoleCode
    ORDER BY r.RoleCode;

    SELECT
        ScreenCode = COALESCE(NULLIF(s.name_screen, N''), s.text_screen),
        ScreenLabel = COALESCE(NULLIF(s.text_screen, N''), s.name_screen),
        AccessMode = p.view_edit,
        IsGranted = CONVERT(bit, CASE WHEN p.in_rs IS NULL THEN 0 ELSE 1 END)
    FROM dbo.tbl_dm_screen_pc AS s
    OUTER APPLY
    (
        SELECT TOP (1) rs.in_rs, rs.view_edit
        FROM dbo.tbl_role_screen AS rs
        WHERE rs.id_role_app = @RoleCode
          AND COALESCE(NULLIF(rs.name_screen, N''), rs.text_screen)
              = COALESCE(NULLIF(s.name_screen, N''), s.text_screen)
        ORDER BY rs.in_rs DESC
    ) AS p
    WHERE COALESCE(NULLIF(s.name_screen, N''), s.text_screen) IS NOT NULL
    ORDER BY ScreenLabel, ScreenCode;
END;

