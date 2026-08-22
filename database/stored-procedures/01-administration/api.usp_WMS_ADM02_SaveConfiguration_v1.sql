CREATE OR ALTER PROCEDURE api.usp_WMS_ADM02_SaveConfiguration_v1
    @UserId nvarchar(50),
    @CatalogCode nvarchar(40),
    @KeyCode nvarchar(50),
    @Name nvarchar(100),
    @Description nvarchar(255) = NULL,
    @LogicValue nvarchar(50) = NULL,
    @DisplayValue nvarchar(100) = NULL,
    @ExpectedChangedAt datetime2(7) = NULL
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
    SET @KeyCode = NULLIF(LTRIM(RTRIM(@KeyCode)), N'');
    SET @Name = NULLIF(LTRIM(RTRIM(@Name)), N'');
    SET @Description = NULLIF(LTRIM(RTRIM(@Description)), N'');
    SET @LogicValue = NULLIF(LTRIM(RTRIM(@LogicValue)), N'');
    SET @DisplayValue = NULLIF(LTRIM(RTRIM(@DisplayValue)), N'');

    IF @KeyCode IS NULL OR @Name IS NULL
        THROW 51022, N'Mã và tên danh mục là bắt buộc.', 1;
    IF @CatalogCode NOT IN
    (
        N'MATERIAL_GROUP', N'RECEIPT_STATUS', N'WAREHOUSE_OPERATION',
        N'INVENTORY_STATUS', N'BATCH_EVENT', N'LOCATION_EVENT'
    )
        THROW 51022, N'Danh mục không nằm trong whitelist quản trị.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @CurrentChangedAt datetime2(7);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @CatalogCode = N'MATERIAL_GROUP'
        BEGIN
            SELECT @CurrentChangedAt = CONVERT(datetime2(7), time_cre)
            FROM dbo.tbl_dm_nhom_vattu WITH (UPDLOCK, HOLDLOCK) WHERE id_nhom_vattu = @KeyCode;
            IF @ExpectedChangedAt IS NOT NULL AND (@CurrentChangedAt IS NULL OR @CurrentChangedAt <> @ExpectedChangedAt)
                THROW 51009, N'Danh mục đã được cập nhật. Hãy tải lại dữ liệu.', 1;
            IF EXISTS (SELECT 1 FROM dbo.tbl_dm_nhom_vattu WHERE id_nhom_vattu = @KeyCode)
                UPDATE dbo.tbl_dm_nhom_vattu SET nhom_vattu = @Name, user_cre = @UserId
                WHERE id_nhom_vattu = @KeyCode;
            ELSE
                INSERT dbo.tbl_dm_nhom_vattu (id_nhom_vattu, nhom_vattu, user_cre)
                VALUES (@KeyCode, @Name, @UserId);
        END
        ELSE IF @CatalogCode = N'RECEIPT_STATUS'
        BEGIN
            SELECT @CurrentChangedAt = CONVERT(datetime2(7), time_cre)
            FROM dbo.tbl_dm_status_nhanhang WITH (UPDLOCK, HOLDLOCK) WHERE ma_status = @KeyCode;
            IF @ExpectedChangedAt IS NOT NULL AND (@CurrentChangedAt IS NULL OR @CurrentChangedAt <> @ExpectedChangedAt)
                THROW 51009, N'Danh mục đã được cập nhật. Hãy tải lại dữ liệu.', 1;
            IF EXISTS (SELECT 1 FROM dbo.tbl_dm_status_nhanhang WHERE ma_status = @KeyCode)
                UPDATE dbo.tbl_dm_status_nhanhang
                SET mo_ta = @Name, hien_thi = COALESCE(@DisplayValue, @Name)
                WHERE ma_status = @KeyCode;
            ELSE
                INSERT dbo.tbl_dm_status_nhanhang (ma_status, mo_ta, hien_thi)
                VALUES (@KeyCode, @Name, COALESCE(@DisplayValue, @Name));
        END
        ELSE IF @CatalogCode = N'WAREHOUSE_OPERATION'
        BEGIN
            SELECT @CurrentChangedAt = CONVERT(datetime2(7), time_cre)
            FROM dbo.tbl_dm_nghiepvu_kho WITH (UPDLOCK, HOLDLOCK) WHERE ma_nghiepvu = @KeyCode;
            IF @ExpectedChangedAt IS NOT NULL AND (@CurrentChangedAt IS NULL OR @CurrentChangedAt <> @ExpectedChangedAt)
                THROW 51009, N'Danh mục đã được cập nhật. Hãy tải lại dữ liệu.', 1;
            IF @LogicValue IS NULL OR TRY_CONVERT(int, @LogicValue) NOT IN (-1, 0, 1)
                THROW 51022, N'Logic nghiệp vụ kho chỉ nhận -1, 0 hoặc 1.', 1;
            IF EXISTS (SELECT 1 FROM dbo.tbl_dm_nghiepvu_kho WHERE ma_nghiepvu = @KeyCode)
                UPDATE dbo.tbl_dm_nghiepvu_kho
                SET ten_nghiepvu = @Name, mo_ta_ton_kho = @Description,
                    logic = @LogicValue, nhom_nghiepvu = @DisplayValue
                WHERE ma_nghiepvu = @KeyCode;
            ELSE
                INSERT dbo.tbl_dm_nghiepvu_kho
                    (ma_nghiepvu, ten_nghiepvu, mo_ta_ton_kho, logic, nhom_nghiepvu)
                VALUES (@KeyCode, @Name, @Description, @LogicValue, @DisplayValue);
        END
        ELSE IF @CatalogCode = N'INVENTORY_STATUS'
        BEGIN
            SELECT 1 FROM dbo.tbl_dm_trangthai_ton WITH (UPDLOCK, HOLDLOCK) WHERE ma_trangthai = @KeyCode;
            IF @ExpectedChangedAt IS NOT NULL
                THROW 51022, N'Danh mục trạng thái tồn legacy không có thời điểm sửa để kiểm tra concurrency.', 1;
            IF @LogicValue IS NULL OR TRY_CONVERT(int, @LogicValue) NOT IN (-1, 0, 1)
                THROW 51022, N'Logic tồn chỉ nhận -1, 0 hoặc 1.', 1;
            IF EXISTS (SELECT 1 FROM dbo.tbl_dm_trangthai_ton WHERE ma_trangthai = @KeyCode)
                UPDATE dbo.tbl_dm_trangthai_ton
                SET tentrangthai = @Name, logic_ton = @LogicValue, user_up = @UserId
                WHERE ma_trangthai = @KeyCode;
            ELSE
                INSERT dbo.tbl_dm_trangthai_ton (ma_trangthai, tentrangthai, logic_ton, user_up)
                VALUES (@KeyCode, @Name, @LogicValue, @UserId);
        END
        ELSE IF @CatalogCode = N'BATCH_EVENT'
        BEGIN
            SELECT 1 FROM dbo.tbl_dm_batch_event WITH (UPDLOCK, HOLDLOCK) WHERE ma_event = @KeyCode;
            IF @ExpectedChangedAt IS NOT NULL
                THROW 51022, N'Danh mục sự kiện batch legacy không có thời điểm sửa để kiểm tra concurrency.', 1;
            IF EXISTS (SELECT 1 FROM dbo.tbl_dm_batch_event WHERE ma_event = @KeyCode)
                UPDATE dbo.tbl_dm_batch_event
                SET ten_event = @Name, logic_event = @LogicValue, user_up = @UserId
                WHERE ma_event = @KeyCode;
            ELSE
                INSERT dbo.tbl_dm_batch_event (ma_event, ten_event, logic_event, user_up)
                VALUES (@KeyCode, @Name, @LogicValue, @UserId);
        END
        ELSE IF @CatalogCode = N'LOCATION_EVENT'
        BEGIN
            SELECT @CurrentChangedAt = CONVERT(datetime2(7), time_up)
            FROM dbo.tbl_dm_location_event WITH (UPDLOCK, HOLDLOCK) WHERE location_event = @KeyCode;
            IF @ExpectedChangedAt IS NOT NULL AND (@CurrentChangedAt IS NULL OR @CurrentChangedAt <> @ExpectedChangedAt)
                THROW 51009, N'Danh mục đã được cập nhật. Hãy tải lại dữ liệu.', 1;
            IF EXISTS (SELECT 1 FROM dbo.tbl_dm_location_event WHERE location_event = @KeyCode)
                UPDATE dbo.tbl_dm_location_event
                SET ten_event = @Name, mo_ta = @Description, time_up = @Now, user_up = @UserId
                WHERE location_event = @KeyCode;
            ELSE
                INSERT dbo.tbl_dm_location_event (location_event, ten_event, mo_ta, time_up, user_up)
                VALUES (@KeyCode, @Name, @Description, @Now, @UserId);
        END;

        COMMIT TRANSACTION;

        SELECT CatalogCode = @CatalogCode, KeyCode = @KeyCode, Name = @Name,
            Description = @Description, LogicValue = @LogicValue,
            DisplayValue = @DisplayValue, ChangedAt = CONVERT(datetime2(7), @Now);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
