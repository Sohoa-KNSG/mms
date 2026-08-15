/* Chạy trên TEST/UAT. Các command bên dưới được bọc transaction và rollback. */
DECLARE @UserId nvarchar(50) = N'__REPLACE_WITH_W2_TEST_USER__';

EXEC api.usp_SEC_ADM01_GetRoleMatrix_v1 @UserId = @UserId, @RoleCode = NULL;
EXEC api.usp_WMS_ADM02_GetConfigurationCatalog_v1 @UserId = @UserId, @CatalogCode = N'MATERIAL_GROUP';
EXEC api.usp_QC_QC01_GetConfiguration_v1 @UserId = @UserId, @CheckId = NULL;
EXEC api.usp_QC_QC02_GetMaterialAssignments_v1 @UserId = @UserId, @Page = 1, @PageSize = 5;
EXEC api.usp_QC_QC03_GetInspectionCandidates_v1 @UserId = @UserId, @Page = 1, @PageSize = 5;
EXEC api.usp_QC_QC05_GetInspectionHistory_v1 @UserId = @UserId, @Page = 1, @PageSize = 5;

DECLARE @InspectionId int =
    (SELECT TOP (1) id_phieukiem FROM dbo.tbl_qc_phieu_kiem ORDER BY id_phieukiem DESC);
IF @InspectionId IS NOT NULL
BEGIN
    EXEC api.usp_QC_QC04_GetEvaluation_v1 @UserId = @UserId, @InspectionId = @InspectionId;
    IF EXISTS (SELECT 1 FROM dbo.tbl_qc_kiem WHERE id_phieukiem = @InspectionId)
        EXEC api.usp_QC_QC06_GetInspectionPrintData_v1 @UserId = @UserId, @InspectionId = @InspectionId;
END;

