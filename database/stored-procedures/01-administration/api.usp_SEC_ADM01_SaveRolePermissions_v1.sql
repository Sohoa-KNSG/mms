CREATE OR ALTER PROCEDURE api.usp_SEC_ADM01_SaveRolePermissions_v1
    @UserId nvarchar(50),
    @RoleCode nvarchar(50),
    @RoleName nvarchar(50),
    @ExpectedChangedAt datetime2(7) = NULL,
    @Permissions api.RolePermissionItem_v1 READONLY
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
    SET @RoleName = NULLIF(LTRIM(RTRIM(@RoleName)), N'');
    IF @RoleCode IS NULL OR @RoleName IS NULL
        THROW 51022, N'Mã vai trò và tên vai trò là bắt buộc.', 1;

    IF EXISTS
    (
        SELECT 1
        FROM @Permissions AS p
        WHERE NOT EXISTS
        (
            SELECT 1 FROM dbo.tbl_dm_screen_pc AS s
            WHERE COALESCE(NULLIF(s.name_screen, N''), s.text_screen) = p.ScreenCode
        )
    )
        THROW 51022, N'Danh sách quyền chứa màn hình không tồn tại.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @CurrentChangedAt datetime2(7);

    BEGIN TRY
        BEGIN TRANSACTION;

        SELECT @CurrentChangedAt = MAX(ChangedAt)
        FROM
        (
            SELECT CONVERT(datetime2(7), COALESCE(time_edit, time_cre)) AS ChangedAt
            FROM dbo.tbl_role WITH (UPDLOCK, HOLDLOCK)
            WHERE ma_role = @RoleCode
            UNION ALL
            SELECT CONVERT(datetime2(7), time_cre)
            FROM dbo.tbl_role_screen WITH (UPDLOCK, HOLDLOCK)
            WHERE id_role_app = @RoleCode
        ) AS changes;

        IF @ExpectedChangedAt IS NOT NULL
           AND (@CurrentChangedAt IS NULL OR @CurrentChangedAt <> @ExpectedChangedAt)
            THROW 51009, N'Vai trò đã được người khác cập nhật. Hãy tải lại dữ liệu.', 1;

        IF EXISTS (SELECT 1 FROM dbo.tbl_role WHERE ma_role = @RoleCode)
            UPDATE dbo.tbl_role
            SET ten_phan_quyen = @RoleName, time_edit = @Now
            WHERE ma_role = @RoleCode;
        ELSE
            INSERT dbo.tbl_role (ma_role, ten_phan_quyen, time_cre, time_edit)
            VALUES (@RoleCode, @RoleName, @Now, @Now);

        DELETE dbo.tbl_role_screen WHERE id_role_app = @RoleCode;

        INSERT dbo.tbl_role_screen
        (
            id_role_app, text_screen, name_screen, view_edit, time_cre
        )
        SELECT
            @RoleCode,
            COALESCE(NULLIF(p.ScreenLabel, N''), s.text_screen, p.ScreenCode),
            p.ScreenCode,
            COALESCE(NULLIF(p.AccessMode, N''), N'VIEW'),
            @Now
        FROM @Permissions AS p
        OUTER APPLY
        (
            SELECT TOP (1) screen.text_screen
            FROM dbo.tbl_dm_screen_pc AS screen
            WHERE COALESCE(NULLIF(screen.name_screen, N''), screen.text_screen) = p.ScreenCode
            ORDER BY screen.id_screen
        ) AS s;

        IF NOT EXISTS
        (
            SELECT 1
            FROM
            (
                SELECT u.ma_role AS RoleCode
                FROM dbo.tbl_dm_user AS u
                WHERE ISNULL(u.status_active, 0) = 1
                UNION ALL
                SELECT u.role_app_id FROM dbo.tbl_user_ql AS u
            ) AS users
            INNER JOIN dbo.tbl_role_screen AS rs ON rs.id_role_app = users.RoleCode
            WHERE COALESCE(NULLIF(rs.name_screen, N''), rs.text_screen) = N'scr_admin_role_app'
        )
            THROW 51022, N'Không thể xóa quyền của quản trị viên cuối cùng.', 1;

        COMMIT TRANSACTION;

        SELECT
            RoleCode = @RoleCode,
            RoleName = @RoleName,
            ChangedAt = CONVERT(datetime2(7), @Now),
            PermissionCount = (SELECT COUNT(1) FROM @Permissions);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

