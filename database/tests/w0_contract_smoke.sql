SET NOCOUNT ON;
DECLARE @Expected TABLE (ObjectName sysname NOT NULL PRIMARY KEY, ObjectType char(2) NOT NULL);
INSERT @Expected VALUES
    (N'api.vw_SEC_UserScreenAccess_v1', N'V'),
    (N'api.usp_SEC_AUTH01_GetUserContext_v1', N'P'),
    (N'api.usp_SEC_AUTH02_GetNavigation_v1', N'P');
IF EXISTS (SELECT 1 FROM @Expected WHERE OBJECT_ID(ObjectName, ObjectType) IS NULL)
BEGIN
    SELECT MissingObject = ObjectName FROM @Expected WHERE OBJECT_ID(ObjectName, ObjectType) IS NULL;
    THROW 51200, N'Thieu contract W0.', 1;
END;
IF DATABASE_PRINCIPAL_ID(N'mms_api_runtime') IS NULL THROW 51201, N'Thieu role runtime.', 1;
EXEC api.usp_SEC_AUTH01_GetUserContext_v1 @UserId = N'00';
EXEC api.usp_SEC_AUTH02_GetNavigation_v1 @UserId = N'00';
SELECT ContractStatus = N'PASS', ObjectCount = COUNT(*) FROM @Expected;
