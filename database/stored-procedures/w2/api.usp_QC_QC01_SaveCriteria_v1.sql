CREATE OR ALTER PROCEDURE api.usp_QC_QC01_SaveCriteria_v1
    @UserId nvarchar(50),
    @CheckId int = NULL,
    @QcGroupCode nvarchar(50),
    @QcGroupName nvarchar(100),
    @DeclarationLevel int,
    @MaterialGroupCode nvarchar(50) = NULL,
    @MaterialId nvarchar(50) = NULL,
    @ExpectedChangedAt datetime2(7) = NULL,
    @Criteria api.QcCriterionItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_qc_update_nhom_admin', N'scr_qc_info_tieuchi')
    )
        THROW 51001, N'Không có quyền quản trị cấu hình QC.', 1;

    SET @QcGroupCode = NULLIF(LTRIM(RTRIM(@QcGroupCode)), N'');
    SET @QcGroupName = NULLIF(LTRIM(RTRIM(@QcGroupName)), N'');
    SET @MaterialGroupCode = NULLIF(LTRIM(RTRIM(@MaterialGroupCode)), N'');
    SET @MaterialId = NULLIF(LTRIM(RTRIM(@MaterialId)), N'');

    IF @QcGroupCode IS NULL OR @QcGroupName IS NULL
        THROW 51022, N'Mã và tên nhóm QC là bắt buộc.', 1;
    IF @DeclarationLevel NOT IN (2, 3)
        THROW 51022, N'Cấp khai báo QC chỉ nhận 2 (nhóm vật tư) hoặc 3 (vật tư).', 1;
    IF @DeclarationLevel = 2 AND @MaterialGroupCode IS NULL
        THROW 51022, N'Cấp 2 yêu cầu nhóm vật tư.', 1;
    IF @DeclarationLevel = 3 AND @MaterialId IS NULL
        THROW 51022, N'Cấp 3 yêu cầu mã vật tư.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Criteria)
        THROW 51022, N'Cấu hình QC phải có ít nhất một tiêu chí.', 1;
    IF EXISTS
    (
        SELECT CriterionCode FROM @Criteria
        GROUP BY CriterionCode HAVING COUNT(1) > 1
    )
        THROW 51022, N'Mã tiêu chí bị trùng trong yêu cầu.', 1;
    IF EXISTS
    (
        SELECT CriterionId FROM @Criteria WHERE CriterionId IS NOT NULL
        GROUP BY CriterionId HAVING COUNT(1) > 1
    )
        THROW 51022, N'ID tiêu chí bị trùng trong yêu cầu.', 1;

    IF @DeclarationLevel = 2
       AND NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_nhom_vattu WHERE id_nhom_vattu = @MaterialGroupCode)
        THROW 51022, N'Nhóm vật tư không tồn tại.', 1;
    IF @DeclarationLevel = 3
       AND NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_vattu WHERE id_vattu = @MaterialId)
        THROW 51022, N'Vật tư không tồn tại.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @CurrentChangedAt datetime2(7);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.tbl_nhom_qc WITH (UPDLOCK, HOLDLOCK) WHERE id_nhom_qc = @QcGroupCode)
            UPDATE dbo.tbl_nhom_qc
            SET ten_nhom_qc = @QcGroupName, user_cre = @UserId, time_cre = @Now
            WHERE id_nhom_qc = @QcGroupCode;
        ELSE
            INSERT dbo.tbl_nhom_qc (id_nhom_qc, ten_nhom_qc, user_cre, time_cre)
            VALUES (@QcGroupCode, @QcGroupName, @UserId, @Now);

        IF @CheckId IS NULL
        BEGIN
            IF EXISTS
            (
                SELECT 1 FROM dbo.tbl_khaibao_qc WITH (UPDLOCK, HOLDLOCK)
                WHERE TRY_CONVERT(int, cap_khaibao) = @DeclarationLevel
                  AND ((@DeclarationLevel = 2 AND nhom_vattu = @QcGroupCode)
                    OR (@DeclarationLevel = 3 AND id_vattu = @MaterialId))
            )
                THROW 51009, N'Cấu hình QC cho phạm vi này đã tồn tại.', 1;

            INSERT dbo.tbl_khaibao_qc
                (cap_khaibao, id_vattu, nhom_vattu, user_cre, time_cre)
            VALUES
                (CONVERT(nvarchar(50), @DeclarationLevel),
                 CASE WHEN @DeclarationLevel = 3 THEN @MaterialId END,
                 @QcGroupCode, @UserId, @Now);
            SET @CheckId = CONVERT(int, SCOPE_IDENTITY());
        END
        ELSE
        BEGIN
            SELECT @CurrentChangedAt = CONVERT(datetime2(7), time_cre)
            FROM dbo.tbl_khaibao_qc WITH (UPDLOCK, HOLDLOCK)
            WHERE id_ma_kiem = @CheckId;
            IF @CurrentChangedAt IS NULL
                THROW 51004, N'Không tìm thấy cấu hình QC.', 1;
            IF @ExpectedChangedAt IS NOT NULL AND @CurrentChangedAt <> @ExpectedChangedAt
                THROW 51009, N'Cấu hình QC đã được cập nhật. Hãy tải lại dữ liệu.', 1;

            IF EXISTS
            (
                SELECT 1 FROM dbo.tbl_khaibao_qc
                WHERE id_ma_kiem <> @CheckId
                  AND TRY_CONVERT(int, cap_khaibao) = @DeclarationLevel
                  AND ((@DeclarationLevel = 2 AND nhom_vattu = @QcGroupCode)
                    OR (@DeclarationLevel = 3 AND id_vattu = @MaterialId))
            )
                THROW 51009, N'Cấu hình QC cho phạm vi này đã tồn tại.', 1;

            UPDATE dbo.tbl_khaibao_qc
            SET cap_khaibao = CONVERT(nvarchar(50), @DeclarationLevel),
                id_vattu = CASE WHEN @DeclarationLevel = 3 THEN @MaterialId END,
                nhom_vattu = @QcGroupCode, user_cre = @UserId, time_cre = @Now
            WHERE id_ma_kiem = @CheckId;
        END;

        IF @DeclarationLevel = 2
        BEGIN
            IF EXISTS
            (
                SELECT 1 FROM dbo.tbl_nhom_vattu_qc WITH (UPDLOCK, HOLDLOCK)
                WHERE ma_nhom_vattu = @MaterialGroupCode
            )
                UPDATE dbo.tbl_nhom_vattu_qc
                SET ma_nhom_qc = @QcGroupCode, time_cre = @Now
                WHERE ma_nhom_vattu = @MaterialGroupCode;
            ELSE
                INSERT dbo.tbl_nhom_vattu_qc (ma_nhom_vattu, ma_nhom_qc, time_cre)
                VALUES (@MaterialGroupCode, @QcGroupCode, @Now);
        END;

        IF EXISTS
        (
            SELECT 1 FROM @Criteria AS input
            WHERE input.CriterionId IS NOT NULL
              AND NOT EXISTS
              (
                  SELECT 1 FROM dbo.tbl_tieuchi_kiem AS criterion
                  WHERE criterion.id_tc_kiem = input.CriterionId AND criterion.ma_kiem = @CheckId
              )
        )
            THROW 51022, N'Tiêu chí cập nhật không thuộc cấu hình QC.', 1;

        UPDATE criterion
        SET criterion.tieu_chi = input.CriterionCode,
            criterion.mo_ta = input.CriterionName,
            criterion.thong_so = input.Specification,
            criterion.hinh_mau = input.SampleImage,
            criterion.user_cre = @UserId,
            criterion.time_cre = @Now
        FROM dbo.tbl_tieuchi_kiem AS criterion
        INNER JOIN @Criteria AS input ON input.CriterionId = criterion.id_tc_kiem
        WHERE criterion.ma_kiem = @CheckId;

        INSERT dbo.tbl_tieuchi_kiem
            (ma_kiem, tieu_chi, mo_ta, thong_so, hinh_mau, user_cre, time_cre)
        SELECT @CheckId, input.CriterionCode, input.CriterionName,
            input.Specification, input.SampleImage, @UserId, @Now
        FROM @Criteria AS input
        WHERE input.CriterionId IS NULL;

        UPDATE definition
        SET definition.ten_tieuchi = input.CriterionName,
            definition.user_cre = @UserId,
            definition.status = 1,
            definition.time_cre = @Now
        FROM dbo.tbl_dm_tieuchi_kiem AS definition
        INNER JOIN @Criteria AS input ON input.CriterionCode = definition.ma_tieuchi;

        INSERT dbo.tbl_dm_tieuchi_kiem
            (ma_tieuchi, ten_tieuchi, user_cre, status, time_cre)
        SELECT input.CriterionCode, MAX(input.CriterionName), @UserId, 1, @Now
        FROM @Criteria AS input
        WHERE NOT EXISTS
        (
            SELECT 1 FROM dbo.tbl_dm_tieuchi_kiem AS definition
            WHERE definition.ma_tieuchi = input.CriterionCode
        )
        GROUP BY input.CriterionCode;

        IF @DeclarationLevel = 2
            UPDATE dbo.tbl_dm_vattu
            SET ma_kiem = @CheckId
            WHERE nhom_vattu = @MaterialGroupCode;
        ELSE
            UPDATE dbo.tbl_dm_vattu SET ma_kiem = @CheckId WHERE id_vattu = @MaterialId;

        UPDATE material
        SET material.ma_kiem = config.id_ma_kiem
        FROM dbo.tbl_dm_vattu AS material
        INNER JOIN dbo.tbl_khaibao_qc AS config ON config.id_vattu = material.id_vattu
        WHERE TRY_CONVERT(int, config.cap_khaibao) = 3;

        UPDATE line
        SET kiem_tra_dau_vao = CASE WHEN material.ma_kiem IS NULL THEN N'0' ELSE N'1' END
        FROM dbo.tbl_chitiet_nhanhang AS line
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        WHERE (@DeclarationLevel = 2 AND material.nhom_vattu = @MaterialGroupCode)
           OR (@DeclarationLevel = 3 AND material.id_vattu = @MaterialId);

        COMMIT TRANSACTION;

        SELECT CheckId = @CheckId, QcGroupCode = @QcGroupCode,
            DeclarationLevel = @DeclarationLevel,
            MaterialGroupCode = @MaterialGroupCode, MaterialId = @MaterialId,
            ChangedAt = CONVERT(datetime2(7), @Now),
            CriterionCount = (SELECT COUNT(1) FROM @Criteria);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
