CREATE OR ALTER PROCEDURE api.usp_WMS_OUT07_GetPickableBatches_v1
    @UserId nvarchar(50), @RequestId int, @LineId int
AS
BEGIN
    SET NOCOUNT ON;
    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode IN (N'scr_soanhang_batch', N'scr_soanhang_chitiet')
    ) THROW 51001, N'Khong co quyen soan theo batch.', 1;
    DECLARE @MaterialId nvarchar(50);
    SELECT @MaterialId = line.id_vattu
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    INNER JOIN dbo.tbl_phieu_yeucau AS request ON request.id_phieu_yeucau = line.id_phieu_yeucau
    WHERE line.id_chitiet_phieu = @LineId AND line.id_phieu_yeucau = @RequestId
      AND request.trang_thai_phieu = N'4' AND request.status_soanhang IN (N'0', N'1');
    IF @MaterialId IS NULL THROW 51004, N'Khong tim thay dong vat tu can soan.', 1;
    SELECT BatchId = batch.id_batch, MaterialId = batch.id_vattu, BravoId = batch.id_bravo,
        MaterialName = batch.ten_vattu, AvailableQuantity = CONVERT(decimal(18,4), batch.so_luong),
        Unit = batch.unit, LocationCode = batch.location, LocationName = location.mo_ta,
        ReceivedAt = batch.time_cre, ChangedAt = batch.time_up
    FROM dbo.tbl_batch_inv AS batch
    LEFT JOIN dbo.tbl_dm_location AS location ON location.ma_location = batch.location
    WHERE batch.id_vattu = @MaterialId AND batch.trang_thai_ton = N'1' AND batch.so_luong > 0
    ORDER BY batch.time_cre, batch.id_batch;
END;
