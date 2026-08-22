CREATE OR ALTER PROCEDURE api.usp_QC_QC02_AssignMaterialCheck_v1
    @UserId nvarchar(50),
    @Scope nvarchar(20),
    @TargetCode nvarchar(50),
    @CheckId int = NULL,
    @ExpectedCheckId int = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_qc_update_vattu'
    )
        THROW 51001, N'Không có quyền gán cấu hình QC cho vật tư.', 1;

    SET @Scope = UPPER(NULLIF(LTRIM(RTRIM(@Scope)), N''));
    SET @TargetCode = NULLIF(LTRIM(RTRIM(@TargetCode)), N'');
    IF @Scope NOT IN (N'MATERIAL', N'MATERIAL_GROUP') OR @TargetCode IS NULL
        THROW 51022, N'Phạm vi gán QC không hợp lệ.', 1;
    IF @CheckId IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.tbl_khaibao_qc WHERE id_ma_kiem = @CheckId)
        THROW 51022, N'Mã kiểm không tồn tại.', 1;
    IF @Scope = N'MATERIAL_GROUP' AND @CheckId IS NOT NULL
       AND NOT EXISTS
       (
           SELECT 1 FROM dbo.tbl_khaibao_qc
           WHERE id_ma_kiem = @CheckId AND TRY_CONVERT(int, cap_khaibao) = 2
       )
        THROW 51022, N'Gán theo nhóm chỉ sử dụng mã kiểm cấp 2.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @Affected int = 0;
    DECLARE @QcGroupCode nvarchar(50) =
        (SELECT nhom_vattu FROM dbo.tbl_khaibao_qc WHERE id_ma_kiem = @CheckId);

    BEGIN TRY
        BEGIN TRANSACTION;

        IF @Scope = N'MATERIAL'
        BEGIN
            DECLARE @CurrentCheckId int;
            SELECT @CurrentCheckId = ma_kiem
            FROM dbo.tbl_dm_vattu WITH (UPDLOCK, HOLDLOCK)
            WHERE id_vattu = @TargetCode;

            IF @@ROWCOUNT = 0
                THROW 51004, N'Không tìm thấy vật tư.', 1;
            IF ISNULL(@CurrentCheckId, -1) <> ISNULL(@ExpectedCheckId, -1)
                THROW 51009, N'Cấu hình QC vật tư đã thay đổi. Hãy tải lại dữ liệu.', 1;

            UPDATE dbo.tbl_dm_vattu SET ma_kiem = @CheckId WHERE id_vattu = @TargetCode;
            SET @Affected = @@ROWCOUNT;
        END
        ELSE
        BEGIN
            IF NOT EXISTS
            (
                SELECT 1 FROM dbo.tbl_dm_nhom_vattu WITH (UPDLOCK, HOLDLOCK)
                WHERE id_nhom_vattu = @TargetCode
            )
                THROW 51004, N'Không tìm thấy nhóm vật tư.', 1;
            IF @ExpectedCheckId IS NOT NULL
                THROW 51022, N'Gán theo nhóm không sử dụng ExpectedCheckId.', 1;

            IF @CheckId IS NULL
                DELETE dbo.tbl_nhom_vattu_qc WHERE ma_nhom_vattu = @TargetCode;
            ELSE IF EXISTS (SELECT 1 FROM dbo.tbl_nhom_vattu_qc WHERE ma_nhom_vattu = @TargetCode)
                UPDATE dbo.tbl_nhom_vattu_qc
                SET ma_nhom_qc = @QcGroupCode
                WHERE ma_nhom_vattu = @TargetCode;
            ELSE
                INSERT dbo.tbl_nhom_vattu_qc (ma_nhom_vattu, ma_nhom_qc)
                VALUES (@TargetCode, @QcGroupCode);

            UPDATE dbo.tbl_dm_vattu SET ma_kiem = @CheckId WHERE nhom_vattu = @TargetCode;
            SET @Affected = @@ROWCOUNT;

            UPDATE material
            SET material.ma_kiem = config.id_ma_kiem
            FROM dbo.tbl_dm_vattu AS material
            INNER JOIN dbo.tbl_khaibao_qc AS config ON config.id_vattu = material.id_vattu
            WHERE material.nhom_vattu = @TargetCode
              AND TRY_CONVERT(int, config.cap_khaibao) = 3;
        END;

        UPDATE line
        SET kiem_tra_dau_vao = CASE WHEN material.ma_kiem IS NULL THEN N'0' ELSE N'1' END
        FROM dbo.tbl_chitiet_nhanhang AS line
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        WHERE (@Scope = N'MATERIAL' AND material.id_vattu = @TargetCode)
           OR (@Scope = N'MATERIAL_GROUP' AND material.nhom_vattu = @TargetCode);

        COMMIT TRANSACTION;

        SELECT Scope = @Scope, TargetCode = @TargetCode, CheckId = @CheckId,
            AffectedMaterialCount = @Affected, ChangedAt = CONVERT(datetime2(7), @Now);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
