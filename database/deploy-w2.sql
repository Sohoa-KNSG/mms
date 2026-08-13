:on error exit

IF DB_NAME() <> N'MMS'
    THROW 51000, N'Script W2 chỉ được chạy khi database hiện tại là MMS.', 1;
GO

:r .\migrations\0002_w2_table_types.sql

:r .\stored-procedures\w2\api.usp_SEC_ADM01_GetRoleMatrix_v1.sql
GO
:r .\stored-procedures\w2\api.usp_SEC_ADM01_SaveRolePermissions_v1.sql
GO
:r .\stored-procedures\w2\api.usp_WMS_ADM02_GetConfigurationCatalog_v1.sql
GO
:r .\stored-procedures\w2\api.usp_WMS_ADM02_SaveConfiguration_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC01_GetConfiguration_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC01_SaveCriteria_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC02_GetMaterialAssignments_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC02_AssignMaterialCheck_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC03_GetInspectionCandidates_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC03_CreateInspection_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC04_GetEvaluation_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC04_EvaluateMaterial_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC05_GetInspectionHistory_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC05_UpdateInspectionResult_v1.sql
GO
:r .\stored-procedures\w2\api.usp_QC_QC06_GetInspectionPrintData_v1.sql
GO

PRINT N'Đã triển khai contract database W2.';
GO

