CREATE OR ALTER PROCEDURE api.usp_WMS_INB05_GetUnmatchedReceipts_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_nhapkho_update_po'
    )
        THROW 51001, N'Không có quyền cập nhật PO cho phiếu nhận.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    DECLARE @Selected TABLE (ReceiptId int NOT NULL PRIMARY KEY);
    INSERT @Selected (ReceiptId)
    SELECT receipt.ma_phieu
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    WHERE receipt.ma_po = N'khong_po' AND receipt.status_nhap = N'2'
      AND (@Search IS NULL OR CONVERT(nvarchar(20), receipt.ma_phieu) LIKE N'%' + @Search + N'%'
        OR receipt.khach_hang LIKE N'%' + @Search + N'%'
        OR receipt.kho LIKE N'%' + @Search + N'%')
    ORDER BY receipt.time_cre DESC, receipt.ma_phieu DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT ReceiptId = receipt.ma_phieu, WarehouseCode = receipt.kho,
        CustomerName = receipt.khach_hang, StatusCode = receipt.status_nhap,
        CreatedBy = receipt.user_cre, CreatedAt = receipt.time_cre,
        LineCount = (SELECT COUNT(*) FROM dbo.tbl_chitiet_nhanhang AS line
            WHERE line.ma_phieu = receipt.ma_phieu AND ISNULL(line.status, N'1') <> N'0')
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    INNER JOIN @Selected AS selected ON selected.ReceiptId = receipt.ma_phieu
    ORDER BY receipt.time_cre DESC, receipt.ma_phieu DESC;

    SELECT ReceivingLineId = line.id_nhanhang, ReceiptId = line.ma_phieu,
        MaterialId = line.ma_hang, MaterialName = material.ten_vattu,
        ReceivedQuantity = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        Unit = COALESCE(line.unit, material.unit)
    FROM dbo.tbl_chitiet_nhanhang AS line
    INNER JOIN @Selected AS selected ON selected.ReceiptId = line.ma_phieu
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    WHERE ISNULL(line.status, N'1') <> N'0'
    ORDER BY line.ma_phieu, line.id_nhanhang;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_phieu_nhan_hang AS receipt
    WHERE receipt.ma_po = N'khong_po' AND receipt.status_nhap = N'2'
      AND (@Search IS NULL OR CONVERT(nvarchar(20), receipt.ma_phieu) LIKE N'%' + @Search + N'%'
        OR receipt.khach_hang LIKE N'%' + @Search + N'%'
        OR receipt.kho LIKE N'%' + @Search + N'%');
END;

