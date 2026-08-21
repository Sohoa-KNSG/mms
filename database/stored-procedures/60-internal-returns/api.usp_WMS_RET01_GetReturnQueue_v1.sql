CREATE OR ALTER PROCEDURE api.usp_WMS_RET01_GetReturnQueue_v1
    @UserId nvarchar(50), @Search nvarchar(200) = NULL, @Status nvarchar(20) = NULL,
    @Page int = 1, @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N''); SET @Status = NULLIF(LTRIM(RTRIM(@Status)), N'');
    IF @Page < 1 SET @Page = 1; IF @PageSize < 1 OR @PageSize > 200 SET @PageSize = 50;
    IF @Status IS NOT NULL AND @Status NOT IN (N'1', N'2', N'3', N'4') THROW 51002, N'Trang thai phieu khong hop le.', 1;
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
        LineCount = CONVERT(int, ISNULL(summary.LineCount, 0)),
        TotalQuantity = CONVERT(decimal(18,4), ISNULL(summary.TotalQuantity, 0))
    FROM dbo.tbl_phieu_nhap_noibo AS header
    OUTER APPLY (SELECT LineCount = COUNT_BIG(*), TotalQuantity = SUM(ISNULL(line.so_luong, 0)) FROM dbo.tbl_chitiet_nhap_noibo AS line WHERE line.id_phieu_noibo = header.id_phieu_noibo) AS summary
    WHERE header.status_phieu <> N'0' AND (@CanWarehouse = 1 OR header.bo_phan = @DepartmentCode)
      AND (@Status IS NULL OR header.status_phieu = @Status)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), header.id_phieu_noibo) LIKE N'%' + @Search + N'%' OR header.user_cre LIKE N'%' + @Search + N'%' OR header.ten_bravo_bophan LIKE N'%' + @Search + N'%')
    ORDER BY CASE header.status_phieu WHEN N'1' THEN 0 ELSE 1 END, header.time_cre DESC, header.id_phieu_noibo DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;
    SELECT TotalCount = COUNT_BIG(*) FROM dbo.tbl_phieu_nhap_noibo AS header
    WHERE header.status_phieu <> N'0' AND (@CanWarehouse = 1 OR header.bo_phan = @DepartmentCode)
      AND (@Status IS NULL OR header.status_phieu = @Status)
      AND (@Search IS NULL OR CONVERT(nvarchar(20), header.id_phieu_noibo) LIKE N'%' + @Search + N'%' OR header.user_cre LIKE N'%' + @Search + N'%' OR header.ten_bravo_bophan LIKE N'%' + @Search + N'%');
END;
