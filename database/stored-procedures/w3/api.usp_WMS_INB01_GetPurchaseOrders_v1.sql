CREATE OR ALTER PROCEDURE api.usp_WMS_INB01_GetPurchaseOrders_v1
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
        WHERE UserId = @UserId
          AND ScreenCode IN
          (
              N'scr_nhanhang_po',
              N'scr_nhanhang_po_chitiet',
              N'scr_nhanhang_po_nhapmoi',
              N'scr_nhapkho_update_po',
              N'scr_nhapkho_update_nhieu_po'
          )
    )
        THROW 51001, N'Không có quyền nhận hàng theo PO.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    DECLARE @Selected TABLE (PurchaseOrder nvarchar(50) NOT NULL PRIMARY KEY);

    ;WITH Remaining AS
    (
        SELECT po.So_DDH_HD, po.Ma_khach_hang,
            OrderDate = MIN(po.Ngay_dat), DeliveryDate = MAX(po.Ngay_giao_DDH),
            RemainingQuantity = SUM(CONVERT(decimal(19,4), ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0)
                - ISNULL(received.ReceivedQuantity, 0)))
        FROM dbo.tbl_ChiTietDDH AS po
        OUTER APPLY
        (
            SELECT ReceivedQuantity = SUM(ISNULL(line.soluong_thucnhan, 0))
            FROM dbo.tbl_chitiet_nhanhang AS line
            WHERE line.ma_khoa_chinh = po.Ma_khoa_chinh
              AND ISNULL(line.status, N'1') <> N'0'
        ) AS received
        WHERE @Search IS NULL
           OR po.So_DDH_HD LIKE N'%' + @Search + N'%'
           OR po.Ma_khach_hang LIKE N'%' + @Search + N'%'
           OR po.Ma_hang_hoa LIKE N'%' + @Search + N'%'
           OR po.Ten_hang_hoa LIKE N'%' + @Search + N'%'
        GROUP BY po.So_DDH_HD, po.Ma_khach_hang
        HAVING SUM(ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0)) > 0
    )
    INSERT @Selected (PurchaseOrder)
    SELECT So_DDH_HD
    FROM Remaining
    ORDER BY DeliveryDate DESC, So_DDH_HD
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT PurchaseOrder = po.So_DDH_HD, CustomerCode = MAX(po.Ma_khach_hang),
        OrderDate = MIN(po.Ngay_dat), DeliveryDate = MAX(po.Ngay_giao_DDH),
        RemainingQuantity = CONVERT(decimal(19,4), SUM(ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0)
            - ISNULL(received.ReceivedQuantity, 0)))
    FROM dbo.tbl_ChiTietDDH AS po
    INNER JOIN @Selected AS selected ON selected.PurchaseOrder = po.So_DDH_HD
    OUTER APPLY
    (
        SELECT ReceivedQuantity = SUM(ISNULL(line.soluong_thucnhan, 0))
        FROM dbo.tbl_chitiet_nhanhang AS line
        WHERE line.ma_khoa_chinh = po.Ma_khoa_chinh
          AND ISNULL(line.status, N'1') <> N'0'
    ) AS received
    GROUP BY po.So_DDH_HD
    ORDER BY DeliveryDate DESC, PurchaseOrder;

    SELECT PurchaseOrder = po.So_DDH_HD, PurchaseOrderKey = po.Ma_khoa_chinh,
        MaterialId = po.Ma_hang_hoa, BravoId = po.Ma_bravo,
        MaterialName = po.Ten_hang_hoa,
        OrderedQuantity = CONVERT(decimal(19,4), ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0)),
        ReceivedQuantity = CONVERT(decimal(19,4), ISNULL(received.ReceivedQuantity, 0)),
        RemainingQuantity = CONVERT(decimal(19,4),
            CASE WHEN ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0) < 0
                 THEN 0 ELSE ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0) END),
        Unit = material.unit, DeliveryDate = CONVERT(date, po.Ngay_giao_DDH)
    FROM dbo.tbl_ChiTietDDH AS po
    INNER JOIN @Selected AS selected ON selected.PurchaseOrder = po.So_DDH_HD
    LEFT JOIN dbo.tbl_dm_vattu AS material ON material.id_vattu = po.Ma_hang_hoa
    OUTER APPLY
    (
        SELECT ReceivedQuantity = SUM(ISNULL(line.soluong_thucnhan, 0))
        FROM dbo.tbl_chitiet_nhanhang AS line
        WHERE line.ma_khoa_chinh = po.Ma_khoa_chinh
          AND ISNULL(line.status, N'1') <> N'0'
    ) AS received
    WHERE ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0) > 0
    ORDER BY po.So_DDH_HD, po.Ten_hang_hoa, po.Ma_hang_hoa;

    SELECT TotalCount = COUNT_BIG(1)
    FROM
    (
        SELECT po.So_DDH_HD
        FROM dbo.tbl_ChiTietDDH AS po
        OUTER APPLY
        (
            SELECT ReceivedQuantity = SUM(ISNULL(line.soluong_thucnhan, 0))
            FROM dbo.tbl_chitiet_nhanhang AS line
            WHERE line.ma_khoa_chinh = po.Ma_khoa_chinh
              AND ISNULL(line.status, N'1') <> N'0'
        ) AS received
        WHERE (@Search IS NULL
           OR po.So_DDH_HD LIKE N'%' + @Search + N'%'
           OR po.Ma_khach_hang LIKE N'%' + @Search + N'%'
           OR po.Ma_hang_hoa LIKE N'%' + @Search + N'%'
           OR po.Ten_hang_hoa LIKE N'%' + @Search + N'%')
        GROUP BY po.So_DDH_HD
        HAVING SUM(ISNULL(po.Don_hang_KH, 0) + ISNULL(po.Don_hang_PS, 0) - ISNULL(received.ReceivedQuantity, 0)) > 0
    ) AS available;
END;
