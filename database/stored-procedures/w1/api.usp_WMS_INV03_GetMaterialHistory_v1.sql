CREATE OR ALTER PROCEDURE api.usp_WMS_INV03_GetMaterialHistory_v1
    @UserId nvarchar(50),
    @MaterialId nvarchar(50),
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_his_vattu'
    )
        THROW 51001, N'Không có quyền xem lịch sử vật tư.', 1;

    SET @MaterialId = NULLIF(LTRIM(RTRIM(@MaterialId)), N'');
    IF @MaterialId IS NULL
        THROW 51022, N'Mã vật tư là bắt buộc.', 1;

    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    ;WITH BatchData AS
    (
        SELECT
            BravoId = MAX(b.id_bravo),
            MaterialName = MAX(b.ten_vattu),
            Unit = MAX(b.unit),
            CurrentBalance = CONVERT(decimal(19,4), SUM(CONVERT(decimal(19,4), b.so_luong))),
            HasBatch = COUNT_BIG(1)
        FROM dbo.tbl_batch_inv AS b
        WHERE b.id_vattu = @MaterialId
    ),
    TransactionData AS
    (
        SELECT
            BravoId = MAX(t.id_bravo),
            MaterialName = MAX(t.ten_vattu),
            Unit = MAX(t.unit),
            HasTransaction = COUNT_BIG(1)
        FROM dbo.tbl_transaction AS t
        WHERE t.id_vattu = @MaterialId
    )
    SELECT
        MaterialId = @MaterialId,
        BravoId = COALESCE(m.id_bravo, b.BravoId, t.BravoId),
        MaterialName = COALESCE(m.ten_vattu, b.MaterialName, t.MaterialName),
        Unit = COALESCE(m.unit, b.Unit, t.Unit),
        CurrentBalance = ISNULL(b.CurrentBalance, CONVERT(decimal(19,4), 0))
    FROM (VALUES (1)) AS seed(Id)
    LEFT JOIN dbo.tbl_dm_vattu AS m ON m.id_vattu = @MaterialId
    CROSS JOIN BatchData AS b
    CROSS JOIN TransactionData AS t
    WHERE m.id_vattu IS NOT NULL OR b.HasBatch > 0
       OR t.HasTransaction > 0;

    SELECT
        TransactionId = t.id_trans,
        BatchId = t.id_batch,
        DocumentId = t.id_phieu_trans,
        OperationCode = t.nghiep_vu,
        OperationName = o.ten_nghiepvu,
        Quantity = CONVERT(decimal(19,4), ISNULL(t.so_luong, 0)),
        SignedQuantity = CONVERT(decimal(19,4), ISNULL(t.so_luong, 0))
            * ISNULL(TRY_CONVERT(int, o.logic), 0),
        OccurredAt = t.time_cre,
        StatusCode = t.trang_thai
    FROM dbo.tbl_transaction AS t
    LEFT JOIN dbo.tbl_dm_nghiepvu_kho AS o ON o.ma_nghiepvu = t.nghiep_vu
    WHERE t.id_vattu = @MaterialId
    ORDER BY t.time_cre DESC, t.id_trans DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_transaction
    WHERE id_vattu = @MaterialId;
END;
