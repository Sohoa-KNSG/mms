CREATE OR ALTER PROCEDURE api.usp_QC_QC03_GetInspectionCandidates_v1
    @UserId nvarchar(50),
    @Search nvarchar(200) = NULL,
    @ReceiptId int = NULL,
    @Page int = 1,
    @PageSize int = 50
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_qc_phieukiem', N'scr_qc_info_danhgia')
    )
        THROW 51001, N'Không có quyền lập phiếu kiểm.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    -- 1. Lọc và phân trang danh sách phiếu chờ kiểm
    DECLARE @PagedReceiptIds TABLE (ReceiptId INT PRIMARY KEY);

    ;WITH Candidates AS
    (
        SELECT
            ReceiptId = p.ma_phieu,
            PurchaseOrder = p.ma_po,
            CustomerName = p.khach_hang,
            WarehouseCode = p.kho,
            ReceiptStatus = p.status_nhap,
            ReceivedAt = p.time_cre,
            PendingMaterialCount = COUNT(DISTINCT line.id_nhanhang)
        FROM dbo.tbl_phieu_nhan_hang AS p
        INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.ma_phieu = p.ma_phieu
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        WHERE material.ma_kiem IS NOT NULL
          AND line.ket_qua_qc IS NULL
          AND ISNULL(line.status_nhanhang, N'') NOT IN (N'4', N'5')
          AND (@Search IS NULL
            OR CONVERT(nvarchar(50), p.ma_phieu) LIKE N'%' + @Search + N'%'
            OR p.ma_po LIKE N'%' + @Search + N'%'
            OR p.khach_hang LIKE N'%' + @Search + N'%')
        GROUP BY p.ma_phieu, p.ma_po, p.khach_hang, p.kho, p.status_nhap, p.time_cre
    )
    INSERT INTO @PagedReceiptIds (ReceiptId)
    SELECT ReceiptId
    FROM Candidates
    ORDER BY ReceivedAt DESC, ReceiptId DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Trả Result Set 1: Danh sách phiếu chờ kiểm phân trang
    SELECT
        ReceiptId = p.ma_phieu,
        PurchaseOrder = p.ma_po,
        CustomerName = p.khach_hang,
        WarehouseCode = p.kho,
        ReceiptStatus = p.status_nhap,
        ReceivedAt = p.time_cre,
        PendingMaterialCount = COUNT(DISTINCT line.id_nhanhang)
    FROM dbo.tbl_phieu_nhan_hang AS p
    INNER JOIN @PagedReceiptIds AS pr ON pr.ReceiptId = p.ma_phieu
    INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.ma_phieu = p.ma_phieu
    INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    WHERE material.ma_kiem IS NOT NULL
      AND line.ket_qua_qc IS NULL
      AND ISNULL(line.status_nhanhang, N'') NOT IN (N'4', N'5')
    GROUP BY p.ma_phieu, p.ma_po, p.khach_hang, p.kho, p.status_nhap, p.time_cre
    ORDER BY p.time_cre DESC, p.ma_phieu DESC;

    -- Trả Result Set 2: Tổng số phiếu chờ kiểm
    SELECT TotalCount = COUNT_BIG(1)
    FROM
    (
        SELECT p.ma_phieu
        FROM dbo.tbl_phieu_nhan_hang AS p
        INNER JOIN dbo.tbl_chitiet_nhanhang AS line ON line.ma_phieu = p.ma_phieu
        INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
        WHERE material.ma_kiem IS NOT NULL
          AND line.ket_qua_qc IS NULL
          AND ISNULL(line.status_nhanhang, N'') NOT IN (N'4', N'5')
          AND (@Search IS NULL
            OR CONVERT(nvarchar(50), p.ma_phieu) LIKE N'%' + @Search + N'%'
            OR p.ma_po LIKE N'%' + @Search + N'%'
            OR p.khach_hang LIKE N'%' + @Search + N'%')
        GROUP BY p.ma_phieu
    ) AS candidates;

    -- Trả Result Set 3: Danh sách dòng vật tư chi tiết cần kiểm (Nếu @ReceiptId có truyền thì lấy đúng phiếu đó, nếu NULL thì lấy của tất cả các phiếu trên trang)
    SELECT
        ReceivingLineId = line.id_nhanhang,
        ReceiptId = line.ma_phieu,
        MaterialId = line.ma_hang,
        MaterialName = material.ten_vattu,
        QuantityReceived = CONVERT(decimal(19,4), ISNULL(line.soluong_thucnhan, 0)),
        Unit = COALESCE(line.unit, material.unit),
        CheckId = material.ma_kiem,
        QcGroupCode = config.nhom_vattu,
        QcGroupName = qgroup.ten_nhom_qc
    FROM dbo.tbl_chitiet_nhanhang AS line
    INNER JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = line.ma_hang
    LEFT JOIN dbo.tbl_khaibao_qc AS config ON config.id_ma_kiem = material.ma_kiem
    LEFT JOIN dbo.tbl_nhom_qc AS qgroup ON qgroup.id_nhom_qc = config.nhom_vattu
    WHERE (
        (@ReceiptId IS NOT NULL AND line.ma_phieu = @ReceiptId)
        OR (@ReceiptId IS NULL AND line.ma_phieu IN (SELECT ReceiptId FROM @PagedReceiptIds))
    )
      AND material.ma_kiem IS NOT NULL
      AND line.ket_qua_qc IS NULL
    ORDER BY line.ma_phieu DESC, line.id_nhanhang ASC;
END;
GO
