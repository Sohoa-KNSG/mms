/*
  MMS React API - additive database contract foundation.
  This migration does not alter legacy tables, status values, views or procedures.
  Safe to run repeatedly on SQL Server 2016 SP1+.
*/
SET XACT_ABORT ON;
GO

IF SCHEMA_ID(N'api') IS NULL
    EXEC(N'CREATE SCHEMA api AUTHORIZATION dbo;');
GO

CREATE OR ALTER VIEW api.vw_SEC_UserScreenAccess_v1
AS
    SELECT DISTINCT
        UserId = u.user_n,
        RoleCode = u.ma_role,
        ScreenCode = COALESCE(NULLIF(rs.name_screen, N''), rs.text_screen),
        ScreenLabel = COALESCE(NULLIF(rs.text_screen, N''), rs.name_screen),
        AccessMode = rs.view_edit
    FROM dbo.tbl_dm_user AS u
    INNER JOIN dbo.tbl_role_screen AS rs
        ON rs.id_role_app = u.ma_role
    WHERE ISNULL(u.status_active, 0) = 1

    UNION

    SELECT DISTINCT
        UserId = u.user_ql,
        RoleCode = u.role_app_id,
        ScreenCode = COALESCE(NULLIF(rs.name_screen, N''), rs.text_screen),
        ScreenLabel = COALESCE(NULLIF(rs.text_screen, N''), rs.name_screen),
        AccessMode = rs.view_edit
    FROM dbo.tbl_user_ql AS u
    INNER JOIN dbo.tbl_role_screen AS rs
        ON rs.id_role_app = u.role_app_id;
GO

