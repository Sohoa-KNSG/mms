CREATE OR ALTER PROCEDURE api.usp_WMS_OUT07_GetPickableBatches_v1
    @UserId nvarchar(50), @RequestId int, @LineId int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN (N'scr_soanhang_batch', N'scr_soanhang_chitiet', N'scr_soanhang', N'scr_mob_soanhang')
    ) THROW 51001, N'Khong co quyen soan theo batch.', 1;

    DECLARE @MaterialId nvarchar(50);
    SELECT @MaterialId = LTRIM(RTRIM(line.id_vattu))
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    WHERE line.id_chitiet_phieu = @LineId AND line.id_phieu_yeucau = @RequestId;

    IF @MaterialId IS NULL
    BEGIN
        SELECT TOP (1) @MaterialId = LTRIM(RTRIM(line.id_vattu))
        FROM dbo.tbl_phieu_yeucau_chitiet AS line
        WHERE line.id_chitiet_phieu = @LineId;
    END;

    IF @MaterialId IS NULL
    BEGIN
        SELECT TOP (1) @MaterialId = LTRIM(RTRIM(line.id_vattu))
        FROM dbo.tbl_phieu_yeucau_chitiet AS line
        WHERE line.id_phieu_yeucau = @RequestId;
    END;

    IF @MaterialId IS NULL THROW 51004, N'Khong tim thay dong vat tu can soan.', 1;

    SELECT BatchId = batch.id_batch, 
        MaterialId = batch.id_vattu, 
        BravoId = batch.id_bravo,
        MaterialName = batch.ten_vattu, 
        AvailableQuantity = CONVERT(decimal(18,4), ISNULL(batch.so_luong, 0)),
        Unit = batch.unit, 
        LocationCode = batch.location, 
        LocationName = COALESCE(location.mo_ta, batch.location, N'Khu Lưu Trữ (Chưa gán kệ)'),
        ReceivedAt = batch.time_cre, 
        ChangedAt = batch.time_up
    FROM dbo.tbl_batch_inv AS batch
    LEFT JOIN dbo.tbl_dm_location AS location ON location.ma_location = batch.location
    WHERE (batch.id_vattu = @MaterialId OR LTRIM(RTRIM(batch.id_vattu)) = @MaterialId)
      AND (batch.trang_thai_ton = 1 OR batch.trang_thai_ton = N'1' OR TRY_CONVERT(int, batch.trang_thai_ton) = 1)
      AND batch.so_luong > 0
    ORDER BY ISNULL(batch.time_cre, '1900-01-01') ASC, batch.id_batch ASC;
END;
