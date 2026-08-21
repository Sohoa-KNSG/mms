CREATE OR ALTER PROCEDURE api.usp_WMS_INV07_GetLocationCount_v1
    @UserId nvarchar(50),
    @LocationCode nvarchar(50)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    IF NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_kiemke_vitri_ke')
        THROW 51001, N'Không có quyền kiểm kê vị trí.', 1;
    SET @LocationCode = NULLIF(LTRIM(RTRIM(@LocationCode)), N'');
    IF NOT EXISTS (SELECT 1 FROM dbo.tbl_dm_location WHERE ma_location = @LocationCode)
        THROW 51004, N'Không tìm thấy vị trí.', 1;
    SELECT LocationCode = location.ma_location, AreaCode = location.ma_khu_vuc,
        ShelfCode = location.ma_ke, ColumnNumber = location.ma_cot, FloorNumber = location.ma_tang,
        PositionNumber = location.vi_tri, Description = location.mo_ta
    FROM dbo.tbl_dm_location AS location WHERE location.ma_location = @LocationCode;
    SELECT BatchId = batch.id_batch, MaterialId = batch.id_vattu, MaterialName = batch.ten_vattu,
        SystemQuantity = CONVERT(decimal(19,4), batch.so_luong), Unit = batch.unit,
        LocationCode = batch.location, ChangedAt = COALESCE(batch.time_up, batch.time_cre)
    FROM dbo.tbl_batch_inv AS batch WHERE batch.location = @LocationCode AND batch.trang_thai_ton = N'1'
    ORDER BY batch.id_batch;
END;

