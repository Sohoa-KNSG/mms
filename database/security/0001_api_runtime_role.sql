SET XACT_ABORT ON;
GO

IF DATABASE_PRINCIPAL_ID(N'mms_api_runtime') IS NULL
    CREATE ROLE mms_api_runtime AUTHORIZATION dbo;
GO

GRANT EXECUTE ON SCHEMA::api TO mms_api_runtime;
GRANT SELECT ON OBJECT::api.vw_SEC_UserScreenAccess_v1 TO mms_api_runtime;
GO

-- Sau khi tạo SQL user/service identity cho API:
-- ALTER ROLE mms_api_runtime ADD MEMBER [ten_user_runtime];

