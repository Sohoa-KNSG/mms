CREATE OR ALTER PROCEDURE api.usp_WMS_ADM02_GetConfigurationCatalog_v1
    @UserId nvarchar(50),
    @CatalogCode nvarchar(40)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_admin_role_app', N'scr_qc_update_nhom_admin')
    )
        THROW 51001, N'Không có quyền quản trị danh mục.', 1;

    SET @CatalogCode = UPPER(NULLIF(LTRIM(RTRIM(@CatalogCode)), N''));

    IF @CatalogCode = N'MATERIAL_GROUP'
        SELECT KeyCode = id_nhom_vattu, Name = nhom_vattu,
            Description = CONVERT(nvarchar(255), NULL), LogicValue = CONVERT(nvarchar(50), NULL),
            DisplayValue = CONVERT(nvarchar(100), NULL), ChangedAt = time_cre
        FROM dbo.tbl_dm_nhom_vattu ORDER BY KeyCode;
    ELSE IF @CatalogCode = N'RECEIPT_STATUS'
        SELECT KeyCode = ma_status, Name = mo_ta,
            Description = CONVERT(nvarchar(255), NULL), LogicValue = CONVERT(nvarchar(50), NULL),
            DisplayValue = hien_thi, ChangedAt = time_cre
        FROM dbo.tbl_dm_status_nhanhang ORDER BY KeyCode;
    ELSE IF @CatalogCode = N'WAREHOUSE_OPERATION'
        SELECT KeyCode = ma_nghiepvu, Name = ten_nghiepvu,
            Description = CONVERT(nvarchar(255), mo_ta_ton_kho), LogicValue = logic,
            DisplayValue = nhom_nghiepvu, ChangedAt = time_cre
        FROM dbo.tbl_dm_nghiepvu_kho ORDER BY KeyCode;
    ELSE IF @CatalogCode = N'INVENTORY_STATUS'
        SELECT KeyCode = ma_trangthai, Name = tentrangthai,
            Description = CONVERT(nvarchar(255), NULL), LogicValue = logic_ton,
            DisplayValue = CONVERT(nvarchar(100), NULL), ChangedAt = CONVERT(datetime, NULL)
        FROM dbo.tbl_dm_trangthai_ton ORDER BY KeyCode;
    ELSE IF @CatalogCode = N'BATCH_EVENT'
        SELECT KeyCode = ma_event, Name = ten_event,
            Description = CONVERT(nvarchar(255), NULL), LogicValue = logic_event,
            DisplayValue = CONVERT(nvarchar(100), NULL), ChangedAt = CONVERT(datetime, NULL)
        FROM dbo.tbl_dm_batch_event ORDER BY KeyCode;
    ELSE IF @CatalogCode = N'LOCATION_EVENT'
        SELECT KeyCode = location_event, Name = ten_event,
            Description = CONVERT(nvarchar(255), mo_ta), LogicValue = CONVERT(nvarchar(50), NULL),
            DisplayValue = CONVERT(nvarchar(100), NULL), ChangedAt = time_up
        FROM dbo.tbl_dm_location_event ORDER BY KeyCode;
    ELSE
        THROW 51022, N'Danh mục không nằm trong whitelist quản trị.', 1;
END;

