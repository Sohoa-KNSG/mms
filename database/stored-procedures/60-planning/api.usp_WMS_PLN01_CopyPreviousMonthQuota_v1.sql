CREATE OR ALTER PROCEDURE api.usp_WMS_PLN01_CopyPreviousMonthQuota_v1
    @UserId nvarchar(50),
    @PlanningUnit nvarchar(50),
    @SourceMonth int,
    @SourceYear int,
    @TargetMonth int,
    @TargetYear int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @PlanningUnit = NULLIF(LTRIM(RTRIM(@PlanningUnit)), N'');
    IF @PlanningUnit IS NULL THROW 51009, N'Đơn vị kế hoạch không được để trống.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @SourceMonthStr nvarchar(10) = CAST(@SourceMonth AS nvarchar(10));
    DECLARE @SourceYearStr nvarchar(10) = CAST(@SourceYear AS nvarchar(10));
    DECLARE @TargetMonthStr nvarchar(10) = CAST(@TargetMonth AS nvarchar(10));
    DECLARE @TargetYearStr nvarchar(10) = CAST(@TargetYear AS nvarchar(10));

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Check if source month has items
        IF NOT EXISTS (
            SELECT 1 FROM dbo.tbl_dinhmuc 
            WHERE donvi_kehoach = @PlanningUnit 
              AND (thang = @SourceMonthStr OR TRY_CONVERT(int, thang) = @SourceMonth)
              AND (nam = @SourceYearStr OR TRY_CONVERT(int, nam) = @SourceYear)
              AND ISNULL(is_active, 1) = 1
        )
            THROW 51009, N'Tháng nguồn không có dữ liệu định mức hoạt động để sao chép.', 1;

        DECLARE @CopiedCount int = 0;

        -- Insert from Source to Target
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
            user_up,
            time_up
        )
        SELECT 
            src.donvi_kehoach,
            src.id_vattu,
            src.id_bravo,
            src.ten_vattu,
            src.unit,
            src.dinh_muc,
            @TargetMonthStr,
            @TargetYearStr,
            N'Sao chép từ tháng ' + CAST(@SourceMonth AS nvarchar(2)) + N'/' + CAST(@SourceYear AS nvarchar(4)),
            1,
            @UserId,
            @Now
        FROM dbo.tbl_dinhmuc AS src
        WHERE src.donvi_kehoach = @PlanningUnit
          AND (src.thang = @SourceMonthStr OR TRY_CONVERT(int, src.thang) = @SourceMonth)
          AND (src.nam = @SourceYearStr OR TRY_CONVERT(int, src.nam) = @SourceYear)
          AND ISNULL(src.is_active, 1) = 1
          AND NOT EXISTS
          (
              SELECT 1 FROM dbo.tbl_dinhmuc AS target
              WHERE target.donvi_kehoach = @PlanningUnit
                AND target.id_vattu = src.id_vattu
                AND (target.thang = @TargetMonthStr OR TRY_CONVERT(int, target.thang) = @TargetMonth)
                AND (target.nam = @TargetYearStr OR TRY_CONVERT(int, target.nam) = @TargetYear)
          );

        SET @CopiedCount = @@ROWCOUNT;

        COMMIT TRANSACTION;

        SELECT 
            IsSuccess = 1,
            PlanningUnit = @PlanningUnit,
            TargetMonth = @TargetMonth,
            TargetYear = @TargetYear,
            CopiedCount = @CopiedCount;

    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
