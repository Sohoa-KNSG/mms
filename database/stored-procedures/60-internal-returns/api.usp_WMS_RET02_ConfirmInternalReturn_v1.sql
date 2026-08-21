CREATE OR ALTER PROCEDURE api.usp_WMS_RET02_ConfirmInternalReturn_v1
    @UserId nvarchar(50), @ReturnId int, @ResultCode int,
    @Note nvarchar(max) = NULL, @BravoDocumentNumber nvarchar(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET @Note = NULLIF(LTRIM(RTRIM(@Note)), N'');
    SET @BravoDocumentNumber = NULLIF(LTRIM(RTRIM(@BravoDocumentNumber)), N'');
    IF @ResultCode NOT IN (1, 2, 3) THROW 51002, N'Ket qua chi nhan 1, 2 hoac 3.', 1;
    IF @ResultCode = 3 AND @Note IS NULL THROW 51002, N'Ly do tu choi la bat buoc.', 1;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_thukho_xacnhan_noibo')
        THROW 51001, N'Khong co quyen xac nhan phieu tra noi bo.', 1;
    DECLARE @EmployeeCode nvarchar(20), @EmployeeName nvarchar(50), @WarehouseCode nvarchar(50),
        @DestinationCode nvarchar(50), @DestinationName nvarchar(50), @IssueDocumentId int,
        @InventoryStatus nvarchar(10), @WarehouseResult nvarchar(20), @Now datetime = GETDATE();
    SELECT @EmployeeCode = LEFT(CONVERT(nvarchar(50), msnv), 20), @EmployeeName = ho_ten_nv
    FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF @EmployeeCode IS NULL THROW 51001, N'Tai khoan khong co ma nhan vien.', 1;
    BEGIN TRY
        BEGIN TRANSACTION;
        SELECT @WarehouseCode = ma_kho, @DestinationCode = ma_bravo_bophan, @DestinationName = ten_bravo_bophan
        FROM dbo.tbl_phieu_nhap_noibo WITH (UPDLOCK, HOLDLOCK)
        WHERE id_phieu_noibo = @ReturnId AND status_phieu = N'1';
        IF @WarehouseCode IS NULL THROW 51009, N'Khong tim thay phieu dang cho kho xu ly.', 1;
        IF NOT EXISTS (SELECT 1 FROM dbo.tbl_chitiet_nhap_noibo WHERE id_phieu_noibo = @ReturnId AND ISNULL(so_luong, 0) > 0)
            THROW 51022, N'Phieu khong co vat tu hop le.', 1;
        IF @ResultCode = 3
        BEGIN
            UPDATE dbo.tbl_phieu_nhap_noibo SET status_phieu = N'3', ghi_chu = @Note
            WHERE id_phieu_noibo = @ReturnId;
            COMMIT TRANSACTION;
            SELECT ReturnId = @ReturnId, ResultCode = @ResultCode, StatusCode = N'3',
                WarehouseResultCode = CONVERT(nvarchar(20), NULL), TransactionDocumentId = CONVERT(int, NULL),
                CreatedBatchCount = 0, ChangedAt = @Now;
            RETURN;
        END;
        SET @InventoryStatus = CASE WHEN @ResultCode = 1 THEN N'1' ELSE N'3' END;
        SET @WarehouseResult = CASE WHEN @ResultCode = 1 THEN N'1' ELSE N'2' END;
        INSERT dbo.tbl_phieu_transaction
            (nghiep_vu, ma_kho_from, ma_kho_to, nguoi_nhan, user_cre, so_ct_bravo,
             time_cre, trang_thai_phieu, ma_yeucau)
        VALUES (N'IN_PROD', N'20020100', LEFT(@DestinationCode, 20), @EmployeeName, @EmployeeCode,
            @BravoDocumentNumber, @Now, N'2', @ReturnId);
        SET @IssueDocumentId = CONVERT(int, SCOPE_IDENTITY());
        DECLARE @CreatedBatches TABLE (LineId int NOT NULL, BatchId int NOT NULL);
        MERGE dbo.tbl_batch_inv AS target
        USING
        (
            SELECT LineId = line.id_nhan_noibo, line.id_vattu, line.id_bravo,
                line.ten_vattu, line.so_luong, line.unit
            FROM dbo.tbl_chitiet_nhap_noibo AS line WITH (UPDLOCK, HOLDLOCK)
            WHERE line.id_phieu_noibo = @ReturnId AND ISNULL(line.so_luong, 0) > 0
        ) AS source ON 1 = 0
        WHEN NOT MATCHED THEN INSERT
            (id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu, so_luong, unit,
             time_cre, user_up, time_up, location_event_up, ma_event_up, trang_thai_ton)
        VALUES (NULL, N'20020100', source.id_vattu, source.id_bravo, source.ten_vattu,
            source.so_luong, source.unit, @Now, @EmployeeCode, @Now, N'0', N'1', @InventoryStatus)
        OUTPUT source.LineId, inserted.id_batch INTO @CreatedBatches (LineId, BatchId);
        INSERT dbo.tbl_transaction
            (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo, ten_vattu,
             so_luong, unit, time_cre, trang_thai)
        SELECT created.BatchId, @IssueDocumentId, N'IN_PROD', line.id_vattu, line.id_bravo,
            LEFT(line.ten_vattu, 100), line.so_luong, line.unit, @Now, N'1'
        FROM @CreatedBatches AS created INNER JOIN dbo.tbl_chitiet_nhap_noibo AS line
            ON line.id_nhan_noibo = created.LineId;
        UPDATE dbo.tbl_phieu_nhap_noibo SET status_phieu = N'4', nhap_kho = @WarehouseResult,
            ghi_chu = COALESCE(@Note, ghi_chu) WHERE id_phieu_noibo = @ReturnId;
        DECLARE @CreatedBatchCount int = (SELECT COUNT(*) FROM @CreatedBatches);
        COMMIT TRANSACTION;
        SELECT ReturnId = @ReturnId, ResultCode = @ResultCode, StatusCode = N'4',
            WarehouseResultCode = @WarehouseResult, TransactionDocumentId = @IssueDocumentId,
            CreatedBatchCount = @CreatedBatchCount, ChangedAt = @Now;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
