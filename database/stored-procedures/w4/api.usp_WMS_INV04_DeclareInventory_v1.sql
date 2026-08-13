CREATE OR ALTER PROCEDURE api.usp_WMS_INV04_DeclareInventory_v1
    @UserId nvarchar(50),
    @WarehouseCode nvarchar(50),
    @Reason nvarchar(50),
    @Items api.InventoryDeclarationItem_v1 READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_tonkho_khaibao')
        THROW 51001, N'Không có quyền khai báo tồn kho.', 1;
    SET @WarehouseCode = NULLIF(LTRIM(RTRIM(@WarehouseCode)), N'');
    SET @Reason = NULLIF(LTRIM(RTRIM(@Reason)), N'');
    IF @WarehouseCode IS NULL OR @Reason IS NULL THROW 51002, N'Kho và căn cứ điều chỉnh là bắt buộc.', 1;
    IF NOT EXISTS (SELECT 1 FROM @Items) OR EXISTS (SELECT 1 FROM @Items WHERE Quantity <= 0)
        THROW 51002, N'Danh sách tồn và số lượng phải hợp lệ.', 1;
    IF EXISTS (SELECT 1 FROM @Items AS item LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId WHERE material.id_vattu IS NULL)
        THROW 51004, N'Có vật tư không tồn tại.', 1;
    IF EXISTS (SELECT 1 FROM @Items AS item LEFT JOIN dbo.tbl_dm_location AS location ON location.ma_location = item.LocationCode
        WHERE item.LocationCode IS NOT NULL AND location.ma_location IS NULL)
        THROW 51004, N'Có vị trí không tồn tại.', 1;
    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_nghiepvu_kho WHERE ma_nghiepvu = N'ADJ_UP' AND TRY_CONVERT(int, logic) = 1)
        THROW 51022, N'Danh mục nghiệp vụ ADJ_UP chưa được cấu hình tăng tồn.', 1;

    DECLARE @Now datetime = GETDATE();
    DECLARE @DocumentId int;
    DECLARE @Created TABLE (MaterialId nvarchar(50) NOT NULL, BatchId int NOT NULL);
    BEGIN TRY
        BEGIN TRANSACTION;
        INSERT dbo.tbl_phieu_transaction (nghiep_vu, ma_kho_to, user_cre, time_cre, trang_thai_phieu, ghi_chu_huy)
        VALUES (N'ADJ_UP', @WarehouseCode, @UserId, @Now, N'2', @Reason);
        SET @DocumentId = CONVERT(int, SCOPE_IDENTITY());

        MERGE dbo.tbl_batch_inv AS target
        USING (SELECT item.MaterialId, item.Quantity, item.LocationCode,
            COALESCE(NULLIF(item.Unit, N''), material.unit) AS Unit,
            material.id_bravo, material.ten_vattu
            FROM @Items AS item INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId) AS source
        ON 1 = 0
        WHEN NOT MATCHED THEN INSERT (id_nhanhang, ma_kho, id_vattu, id_bravo, ten_vattu,
            so_luong, unit, time_cre, user_up, time_up, location_event_up, ma_event_up, trang_thai_ton, location)
        VALUES (1, @WarehouseCode, source.MaterialId, source.id_bravo, source.ten_vattu,
            CONVERT(float, source.Quantity), source.Unit, @Now, LEFT(@UserId, 20), @Now,
            CASE WHEN source.LocationCode IS NULL THEN N'0' ELSE N'1' END, N'3', N'1', source.LocationCode)
        OUTPUT source.MaterialId, inserted.id_batch INTO @Created (MaterialId, BatchId);

        INSERT dbo.tbl_transaction (id_batch, id_phieu_trans, nghiep_vu, id_vattu, id_bravo,
            ten_vattu, so_luong, unit, time_cre, trang_thai)
        SELECT created.BatchId, @DocumentId, N'ADJ_UP', material.id_vattu, material.id_bravo,
            material.ten_vattu, CONVERT(float, item.Quantity), COALESCE(NULLIF(item.Unit, N''), material.unit), @Now, N'2'
        FROM @Created AS created INNER JOIN @Items AS item ON item.MaterialId = created.MaterialId
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = item.MaterialId;

        INSERT dbo.tbl_location_event (ma_location, id_batch, location_event, user_cre, time_cre)
        SELECT item.LocationCode, created.BatchId, N'1', @UserId, @Now
        FROM @Created AS created INNER JOIN @Items AS item ON item.MaterialId = created.MaterialId
        WHERE item.LocationCode IS NOT NULL;

        COMMIT TRANSACTION;
        SELECT TransactionDocumentId = @DocumentId, BatchCount = (SELECT COUNT(*) FROM @Created), CreatedAt = @Now;
        SELECT MaterialId, BatchId FROM @Created ORDER BY BatchId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;

