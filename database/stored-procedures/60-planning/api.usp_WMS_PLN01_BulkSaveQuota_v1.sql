CREATE OR ALTER PROCEDURE api.usp_WMS_PLN01_BulkSaveQuota_v1
    @UserId nvarchar(50),
    @PlanningUnit nvarchar(50),
    @Month int,
    @Year int,
    @ItemsJson nvarchar(max)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @PlanningUnit = NULLIF(LTRIM(RTRIM(@PlanningUnit)), N'');
    IF @PlanningUnit IS NULL THROW 51009, N'Đơn vị kế hoạch không được để trống.', 1;
    IF @Month < 1 OR @Month > 12 THROW 51009, N'Tháng áp dụng không hợp lệ (1-12).', 1;
    IF @Year < 2020 THROW 51009, N'Năm áp dụng không hợp lệ.', 1;

    IF @ItemsJson IS NULL OR ISJSON(@ItemsJson) = 0
        THROW 51009, N'Dữ liệu danh sách định mức không đúng định dạng JSON.', 1;

    DECLARE @Now datetime = GETDATE();

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Extract Raw Items from JSON
        DECLARE @RawItems TABLE
        (
            MaterialCode nvarchar(100),
            Quantity decimal(19,4),
            CustomUnit nvarchar(50),
            Note nvarchar(500)
        );

        INSERT INTO @RawItems (MaterialCode, Quantity, CustomUnit, Note)
        SELECT 
            LTRIM(RTRIM(JSON_VALUE(value, '$.materialId'))),
            TRY_CONVERT(decimal(19,4), JSON_VALUE(value, '$.quantity')),
            NULLIF(LTRIM(RTRIM(JSON_VALUE(value, '$.unit'))), N''),
            NULLIF(LTRIM(RTRIM(JSON_VALUE(value, '$.note'))), N'')
        FROM OPENJSON(@ItemsJson);

        -- Filter valid positive quantity items
        DELETE FROM @RawItems WHERE MaterialCode IS NULL OR MaterialCode = N'' OR Quantity IS NULL OR Quantity <= 0;

        -- Match with Material Catalog
        DECLARE @MatchedItems TABLE
        (
            MaterialId nvarchar(50),
            BravoId nvarchar(50),
            MaterialName nvarchar(250),
            Unit nvarchar(50),
            Quantity decimal(19,4),
            Note nvarchar(500)
        );

        INSERT INTO @MatchedItems (MaterialId, BravoId, MaterialName, Unit, Quantity, Note)
        SELECT 
            m.id_vattu,
            m.id_bravo,
            m.ten_vattu,
            ISNULL(raw.CustomUnit, m.unit),
            raw.Quantity,
            raw.Note
        FROM @RawItems AS raw
        INNER JOIN dbo.tbl_dm_vattu AS m 
           ON m.id_vattu = raw.MaterialCode 
           OR LTRIM(RTRIM(m.id_vattu)) = raw.MaterialCode
           OR m.id_bravo = raw.MaterialCode
           OR LTRIM(RTRIM(m.id_bravo)) = raw.MaterialCode;

        DECLARE @InsertedCount int = 0, @UpdatedCount int = 0;

        -- 1. UPDATE existing items in tbl_dinhmuc
        UPDATE target
        SET 
            target.dinh_muc = src.Quantity,
            target.ten_vattu = ISNULL(src.MaterialName, target.ten_vattu),
            target.id_bravo = ISNULL(src.BravoId, target.id_bravo),
            target.unit = ISNULL(src.Unit, target.unit),
            target.ghi_chu = ISNULL(src.Note, target.ghi_chu),
            target.is_active = 1,
            target.user_up = @UserId,
            target.time_up = @Now
        FROM dbo.tbl_dinhmuc AS target
        INNER JOIN @MatchedItems AS src ON src.MaterialId = target.id_vattu
        WHERE target.donvi_kehoach = @PlanningUnit
          AND target.thang = @Month
          AND target.nam = @Year;

        SET @UpdatedCount = @@ROWCOUNT;

        -- 2. INSERT new items into tbl_dinhmuc
        INSERT INTO dbo.tbl_dinhmuc
        (
            donvi_kehoach,
            id_vattu,
            id_bravo,
            ten_vattu,
            unit,
            dinh_muc,
            thang,
            nam,
            ghi_chu,
            is_active,
            user_cre,
            time_cre
        )
        SELECT 
            @PlanningUnit,
            src.MaterialId,
            src.BravoId,
            src.MaterialName,
            src.Unit,
            src.Quantity,
            @Month,
            @Year,
            src.Note,
            1,
            @UserId,
            @Now
        FROM @MatchedItems AS src
        WHERE NOT EXISTS
        (
            SELECT 1 FROM dbo.tbl_dinhmuc AS target
            WHERE target.donvi_kehoach = @PlanningUnit
              AND target.id_vattu = src.MaterialId
              AND target.thang = @Month
              AND target.nam = @Year
        );

        SET @InsertedCount = @@ROWCOUNT;

        COMMIT TRANSACTION;

        SELECT 
            IsSuccess = 1,
            PlanningUnit = @PlanningUnit,
            Month = @Month,
            Year = @Year,
            InsertedCount = @InsertedCount,
            UpdatedCount = @UpdatedCount,
            TotalProcessed = @InsertedCount + @UpdatedCount;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
