CREATE OR ALTER PROCEDURE api.usp_SEC_AUTH01_GetUserContext_v1
    @UserId nvarchar(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @UserId = NULLIF(LTRIM(RTRIM(@UserId)), N'');
    IF @UserId IS NULL
        THROW 51001, N'Không xác định được người dùng.', 1;

    ;WITH UserCandidates AS
    (
        SELECT
            Priority = 1,
            UserId = u.user_n,
            DisplayName = COALESCE(NULLIF(u.ho_ten_nv, N''), u.user_n),
            RoleCode = u.ma_role,
            JobTitle = u.chuc_danh,
            DepartmentCode = u.ma_bophan,
            BravoDepartmentCode = u.ma_bravo_bophan,
            BravoDepartmentName = u.ten_bravo_bophan
        FROM dbo.tbl_dm_user AS u
        WHERE u.user_n = @UserId
          AND ISNULL(u.status_active, 0) = 1

        UNION ALL

        SELECT
            Priority = 2,
            UserId = u.user_ql,
            DisplayName = COALESCE(NULLIF(u.ho_ten, N''), u.user_ql),
            RoleCode = u.role_app_id,
            JobTitle = CONVERT(nvarchar(100), NULL),
            DepartmentCode = CONVERT(nvarchar(50), NULL),
            BravoDepartmentCode = CONVERT(nvarchar(50), NULL),
            BravoDepartmentName = CONVERT(nvarchar(50), NULL)
        FROM dbo.tbl_user_ql AS u
        WHERE u.user_ql = @UserId
    )
    SELECT TOP (1)
        c.UserId,
        c.DisplayName,
        RoleCode = COALESCE(NULLIF(c.RoleCode, N''), N'UNASSIGNED'),
        RoleName = r.ten_phan_quyen,
        c.JobTitle,
        c.DepartmentCode,
        c.BravoDepartmentCode,
        c.BravoDepartmentName
    FROM UserCandidates AS c
    OUTER APPLY
    (
        SELECT TOP (1) role.ten_phan_quyen
        FROM dbo.tbl_role AS role
        WHERE role.ma_role = c.RoleCode
        ORDER BY role.id_role
    ) AS r
    ORDER BY c.Priority;
END;

