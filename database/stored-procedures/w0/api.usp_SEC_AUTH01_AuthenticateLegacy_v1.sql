CREATE OR ALTER PROCEDURE api.usp_SEC_AUTH01_AuthenticateLegacy_v1
    @UserName nvarchar(50), @Password nvarchar(255)
AS
BEGIN
    SET NOCOUNT ON;
    SET @UserName = NULLIF(LTRIM(RTRIM(@UserName)), N'');
    IF @UserName IS NULL OR @Password IS NULL RETURN;
    ;WITH C AS (
      SELECT 1 Priority, u.user_n UserId, COALESCE(NULLIF(u.ho_ten_nv,N''),u.user_n) DisplayName,
        u.ma_role RoleCode, u.ma_bophan DepartmentCode, u.ma_bravo_bophan BravoDepartmentCode, u.ten_bravo_bophan BravoDepartmentName
      FROM dbo.tbl_dm_user u WHERE u.user_n=@UserName AND u.[password]=@Password AND ISNULL(u.status_active,0)=1
    )
    SELECT TOP (1) c.UserId,c.DisplayName,RoleCode=COALESCE(NULLIF(c.RoleCode,N''),N'UNASSIGNED'),
      RoleName=r.ten_phan_quyen,c.DepartmentCode,c.BravoDepartmentCode,c.BravoDepartmentName
    FROM C c OUTER APPLY (SELECT TOP (1) x.ten_phan_quyen FROM dbo.tbl_role x WHERE x.ma_role=c.RoleCode ORDER BY x.id_role) r
    ORDER BY c.Priority;
END;
