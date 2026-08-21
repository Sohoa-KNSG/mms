CREATE OR ALTER PROCEDURE api.usp_WMS_OUT07_PickBatch_v1
    @UserId nvarchar(50), @RequestId int, @LineId int, @BatchId int,
    @Quantity decimal(18,4), @ExpectedBatchQuantity decimal(18,4),
    @ExpectedLocationCode nvarchar(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @ExpectedLocationCode = NULLIF(LTRIM(RTRIM(@ExpectedLocationCode)), N'');
    IF @Quantity <= 0 THROW 51002, N'So luong xuat phai lon hon 0.', 1;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN (N'scr_soanhang_batch', N'scr_soanhang_chitiet')
    ) THROW 51001, N'Khong co quyen soan theo batch.', 1;
    DECLARE @EmployeeCode nvarchar(50), @IssueDocumentId int, @MaterialId nvarchar(50),
        @BravoId nvarchar(50), @MaterialName nvarchar(100), @Unit nvarchar(20),
        @Requested decimal(18,4), @Issued decimal(18,4), @BatchQuantity decimal(18,4),
        @BatchMaterialId nvarchar(50), @BatchBravoId nvarchar(50), @BatchMaterialName nvarchar(255),
        @BatchUnit nvarchar(20), @BatchLocation nvarchar(50), @TransactionId int, @Now datetime = GETDATE();
    SELECT @EmployeeCode = CONVERT(nvarchar(50), msnv) FROM dbo.tbl_dm_user
    WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @EmployeeCode IS NULL THROW 51001, N'Tai khoan khong co ma nhan vien.', 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        IF NOT EXISTS
        (
            SELECT 1 FROM dbo.tbl_phieu_yeucau WITH (UPDLOCK, HOLDLOCK)
            WHERE id_phieu_yeucau = @RequestId AND trang_thai_phieu = N'4' AND status_soanhang = N'1'
        ) THROW 51009, N'Phieu chua bat dau soan hoac da hoan thanh.', 1;
        SELECT @MaterialId = id_vattu, @BravoId = id_bravo, @MaterialName = ten_vattu,
            @Unit = unit, @Requested = CONVERT(decimal(18,4), ISNULL(so_luong, 0))
        FROM dbo.tbl_phieu_yeucau_chitiet WITH (UPDLOCK, HOLDLOCK)
        WHERE id_chitiet_phieu = @LineId AND id_phieu_yeucau = @RequestId;
        IF @MaterialId IS NULL THROW 51004, N'Khong tim thay dong vat tu.', 1;
        SELECT TOP (1) @IssueDocumentId = id_phieu_trans
        FROM dbo.tbl_phieu_transaction WITH (UPDLOCK, HOLDLOCK)
        WHERE ma_yeucau = @RequestId AND nghiep_vu = N'OUT_CON' AND trang_thai_phieu = N'1'
        ORDER BY id_phieu_trans DESC;
        IF @IssueDocumentId IS NULL THROW 51009, N'Chua co phieu xuat dang hoat dong.', 1;
        SELECT @Issued = CONVERT(decimal(18,4), ISNULL(SUM(ISNULL(transactionLine.so_luong, 0)), 0))
        FROM dbo.tbl_map_xuatkho AS map WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.tbl_transaction AS transactionLine WITH (UPDLOCK, HOLDLOCK)
            ON transactionLine.id_trans = map.id_trans
        WHERE map.id_chitiet_phieu = @LineId AND transactionLine.id_phieu_trans = @IssueDocumentId
          AND transactionLine.nghiep_vu = N'OUT_CON';
        IF @Issued + @Quantity > @Requested + CONVERT(decimal(18,4), 0.0001)
            THROW 51022, N'So luong xuat vuot nhu cau con lai cua dong.', 1;
        SELECT @BatchQuantity = CONVERT(decimal(18,4), so_luong), @BatchMaterialId = id_vattu,
            @BatchBravoId = id_bravo, @BatchMaterialName = ten_vattu, @BatchUnit = unit,
            @BatchLocation = location
        FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
        WHERE id_batch = @BatchId AND trang_thai_ton = N'1';
        IF @BatchQuantity IS NULL THROW 51004, N'Khong tim thay batch ton kho hop le.', 1;
        IF @BatchMaterialId <> @MaterialId THROW 51022, N'Batch khong dung vat tu can soan.', 1;
        IF ABS(@BatchQuantity - @ExpectedBatchQuantity) > CONVERT(decimal(18,4), 0.0001)
            THROW 51009, N'Ton batch da thay doi; can tai lai du lieu.', 1;
        IF ISNULL(@BatchLocation, N'') <> ISNULL(@ExpectedLocationCode, N'')
            THROW 51009, N'Vi tri batch da thay doi; can tai lai du lieu.', 1;
        IF @Quantity > @BatchQuantity THROW 51022, N'So luong xuat vuot ton batch.', 1;
        UPDATE dbo.tbl_batch_inv SET so_luong = CONVERT(float, @BatchQuantity - @Quantity),
            user_up = LEFT(@EmployeeCode, 20), time_up = @Now, ma_event_up = N'2'
        WHERE id_batch = @BatchId;
        INSERT dbo.tbl_transaction
            (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo, ten_vattu,
             so_luong, unit, time_cre, trang_thai)
        VALUES (@BatchId, @IssueDocumentId, N'OUT_CON', @MaterialId,
            COALESCE(@BravoId, @BatchBravoId), LEFT(COALESCE(@MaterialName, @BatchMaterialName), 100),
            CONVERT(float, @Quantity), COALESCE(@Unit, @BatchUnit), @Now, N'3');
        SET @TransactionId = CONVERT(int, SCOPE_IDENTITY());
        INSERT dbo.tbl_map_xuatkho (id_trans, id_chitiet_phieu) VALUES (@TransactionId, @LineId);
        COMMIT TRANSACTION;
        SELECT RequestId = @RequestId, LineId = @LineId, BatchId = @BatchId,
            TransactionId = @TransactionId, IssueDocumentId = @IssueDocumentId,
            IssuedQuantity = @Quantity, RemainingLineQuantity = @Requested - @Issued - @Quantity,
            RemainingBatchQuantity = @BatchQuantity - @Quantity, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
