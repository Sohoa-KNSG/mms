CREATE OR ALTER PROCEDURE api.usp_WMS_RET01_GetInternalReturn_v1
    @UserId nvarchar(50), @ReturnId int
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DepartmentCode nvarchar(50), @CanWarehouse bit = 0;
    SELECT @DepartmentCode = ma_bophan FROM dbo.tbl_dm_user WHERE user_n = @UserId AND ISNULL(status_active, 0) = 1;
    IF EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_thukho_xacnhan_noibo') SET @CanWarehouse = 1;
    IF @CanWarehouse = 0 AND NOT EXISTS (SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1 WHERE UserId = @UserId AND ScreenCode = N'scr_phieutra_noibo')
        THROW 51001, N'Khong co quyen xem phieu tra noi bo.', 1;
    SELECT ReturnId = header.id_phieu_noibo, WarehouseCode = header.ma_kho,
        DestinationBravoCode = header.ma_bravo_bophan, DestinationName = header.ten_bravo_bophan,
        QualityCode = header.phan_loai_tra, WarehouseResultCode = header.nhap_kho,
        Note = header.ghi_chu, CreatedBy = header.user_cre, ReturnAt = header.time_tra,
        CreatedAt = header.time_cre, StatusCode = header.status_phieu, DepartmentCode = header.bo_phan,
        CanConfirm = CONVERT(bit, CASE WHEN @CanWarehouse = 1 AND header.status_phieu = N'1' THEN 1 ELSE 0 END)
    FROM dbo.tbl_phieu_nhap_noibo AS header WHERE header.id_phieu_noibo = @ReturnId
      AND header.status_phieu <> N'0' AND (@CanWarehouse = 1 OR header.bo_phan = @DepartmentCode);
    SELECT LineId = line.id_nhan_noibo, MaterialId = line.id_vattu, BravoId = line.id_bravo,
        MaterialName = line.ten_vattu, Unit = line.unit,
        Quantity = CONVERT(decimal(18,4), ISNULL(line.so_luong, 0)), Note = line.ghi_chu
    FROM dbo.tbl_chitiet_nhap_noibo AS line WHERE line.id_phieu_noibo = @ReturnId ORDER BY line.id_nhan_noibo;
END;
