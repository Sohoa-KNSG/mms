:on error exit
IF DB_NAME() <> N'MMS'
    THROW 51000, N'Parse W0 chi duoc chay khi database hien tai la MMS.', 1;
GO
SET PARSEONLY ON;
GO
:r .\migrations\0001_api_schema.sql
GO
:r .\stored-procedures\w0\api.usp_SEC_AUTH01_GetUserContext_v1.sql
GO
:r .\stored-procedures\w0\api.usp_SEC_AUTH02_GetNavigation_v1.sql
GO
:r .\security\0001_api_runtime_role.sql
GO
SET PARSEONLY OFF;
GO
SELECT ParseStatus = N'PASS', DatabaseName = DB_NAME();
GO
