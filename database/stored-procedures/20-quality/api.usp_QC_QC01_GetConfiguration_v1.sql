CREATE OR ALTER PROCEDURE api.usp_QC_QC01_GetConfiguration_v1
    @UserId nvarchar(50),
    @CheckId int = NULL
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

    SELECT GroupCode = id_nhom_qc, GroupName = ten_nhom_qc, ChangedAt = time_cre
    FROM dbo.tbl_nhom_qc
    ORDER BY GroupCode;

    SELECT
        CheckId = c.id_ma_kiem,
        DeclarationLevel = TRY_CONVERT(int, c.cap_khaibao),
        MaterialId = c.id_vattu,
        QcGroupCode = c.nhom_vattu,
        QcGroupName = g.ten_nhom_qc,
        MaterialGroupCode = mg.ma_nhom_vattu,
        ChangedAt = c.time_cre
    FROM dbo.tbl_khaibao_qc AS c
    LEFT JOIN dbo.tbl_nhom_qc AS g ON g.id_nhom_qc = c.nhom_vattu
    OUTER APPLY
    (
        SELECT TOP (1) map.ma_nhom_vattu
        FROM dbo.tbl_nhom_vattu_qc AS map
        WHERE map.ma_nhom_qc = c.nhom_vattu
        ORDER BY map.id_vattu_qc
    ) AS mg
    WHERE @CheckId IS NULL OR c.id_ma_kiem = @CheckId
    ORDER BY c.id_ma_kiem;

    SELECT
        CriterionId = c.id_tc_kiem,
        CheckId = c.ma_kiem,
        CriterionCode = c.tieu_chi,
        CriterionName = c.mo_ta,
        Specification = c.thong_so,
        SampleImage = c.hinh_mau,
        ChangedAt = c.time_cre
    FROM dbo.tbl_tieuchi_kiem AS c
    WHERE @CheckId IS NULL OR c.ma_kiem = @CheckId
    ORDER BY c.ma_kiem, c.id_tc_kiem;

    SELECT
        DefinitionId = id_tieuchi,
        CriterionCode = ma_tieuchi,
        CriterionName = ten_tieuchi,
        IsActive = CONVERT(bit, ISNULL(status, 0)),
        ChangedAt = time_cre
    FROM dbo.tbl_dm_tieuchi_kiem
    ORDER BY CriterionCode, DefinitionId;
END;

