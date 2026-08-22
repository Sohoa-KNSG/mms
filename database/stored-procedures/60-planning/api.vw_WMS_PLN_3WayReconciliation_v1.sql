CREATE OR ALTER VIEW api.vw_WMS_PLN_3WayReconciliation_v1
AS
SELECT 
    m.id_vattu AS MaterialId,
    m.id_bravo AS BravoId,
    m.ten_vattu AS MaterialName,
    m.unit AS Unit,
    cal.thang AS PlanMonth,
    cal.nam AS PlanYear,
    
    -- 1. Kế hoạch định mức (Demand - A)
    CONVERT(decimal(19,4), ISNULL(planSum.TotalPlanQuantity, 0)) AS PlannedQuota,
    
    -- 2. Thực tế sử dụng (Consumption - B)
    CONVERT(decimal(19,4), ISNULL(useSum.TotalRequestedQuantity, 0)) AS RequestedQuantity,
    CONVERT(decimal(19,4), ISNULL(useSum.TotalIssuedQuantity, 0)) AS IssuedQuantity,
    CONVERT(decimal(19,4), 
        CASE 
            WHEN ISNULL(planSum.TotalPlanQuantity, 0) > ISNULL(useSum.TotalRequestedQuantity, 0)
            THEN ISNULL(planSum.TotalPlanQuantity, 0) - ISNULL(useSum.TotalRequestedQuantity, 0)
            ELSE 0 
        END
    ) AS RemainingQuota,
    
    -- 3. Tiến độ nhập mua PO (Procurement - C)
    CONVERT(decimal(19,4), ISNULL(poSum.PoOrderedQuantity, 0)) AS PoOrderedQuantity,
    CONVERT(decimal(19,4), ISNULL(inSum.ReceivedQuantity, 0)) AS ReceivedQuantity,
    CONVERT(decimal(19,4), 
        CASE 
            WHEN ISNULL(poSum.PoOrderedQuantity, 0) > ISNULL(inSum.ReceivedQuantity, 0)
            THEN ISNULL(poSum.PoOrderedQuantity, 0) - ISNULL(inSum.ReceivedQuantity, 0)
            ELSE 0 
        END
    ) AS InTransitQuantity,
    
    -- 4. Tồn kho khả dụng hiện tại (Inventory - D)
    CONVERT(decimal(19,4), ISNULL(invSum.AvailableInventory, 0)) AS AvailableInventory,
    
    -- 5. Đánh giá cân đối & Đề xuất mua hàng
    CONVERT(decimal(19,4), 
        CASE 
            WHEN ISNULL(planSum.TotalPlanQuantity, 0) > (ISNULL(invSum.AvailableInventory, 0) + ISNULL(poSum.PoOrderedQuantity, 0))
            THEN ISNULL(planSum.TotalPlanQuantity, 0) - (ISNULL(invSum.AvailableInventory, 0) + ISNULL(poSum.PoOrderedQuantity, 0))
            ELSE 0 
        END
    ) AS PurchaseRecommendationGap,
    
    CASE 
        WHEN (ISNULL(invSum.AvailableInventory, 0) + ISNULL(poSum.PoOrderedQuantity, 0)) < ISNULL(planSum.TotalPlanQuantity, 0) THEN N'SHORTAGE'
        WHEN ISNULL(invSum.AvailableInventory, 0) > (2 * ISNULL(planSum.TotalPlanQuantity, 0)) AND ISNULL(planSum.TotalPlanQuantity, 0) > 0 THEN N'OVERSTOCK'
        ELSE N'BALANCED'
    END AS BalanceStatusCode

FROM dbo.tbl_dm_vattu AS m
CROSS JOIN 
(
    SELECT DISTINCT 
        TRY_CONVERT(int, thang) AS thang, 
        TRY_CONVERT(int, nam) AS nam 
    FROM dbo.tbl_dinhmuc
    WHERE thang IS NOT NULL AND nam IS NOT NULL
) AS cal

-- 1. Aggregate Plan Quotas
LEFT JOIN 
(
    SELECT 
        id_vattu, 
        TRY_CONVERT(int, thang) AS thang, 
        TRY_CONVERT(int, nam) AS nam, 
        SUM(ISNULL(dinh_muc, 0)) AS TotalPlanQuantity
    FROM dbo.tbl_dinhmuc
    WHERE ISNULL(is_active, 1) = 1
    GROUP BY id_vattu, TRY_CONVERT(int, thang), TRY_CONVERT(int, nam)
) AS planSum ON planSum.id_vattu = m.id_vattu AND planSum.thang = cal.thang AND planSum.nam = cal.nam

-- 2. Aggregate Consumption
LEFT JOIN 
(
    SELECT 
        d.id_vattu,
        TRY_CONVERT(int, d.thang) AS thang,
        TRY_CONVERT(int, d.nam) AS nam,
        SUM(ISNULL(line.so_luong, 0)) AS TotalRequestedQuantity,
        SUM(CASE WHEN req.status_soanhang = N'2' THEN ISNULL(line.so_luong, 0) ELSE 0 END) AS TotalIssuedQuantity
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    INNER JOIN dbo.tbl_phieu_yeucau AS req ON req.id_phieu_yeucau = line.id_phieu_yeucau
    INNER JOIN dbo.tbl_dinhmuc AS d ON d.id_kehoach = line.id_kehoach
    WHERE ISNULL(req.trang_thai_phieu, N'0') <> N'0'
    GROUP BY d.id_vattu, TRY_CONVERT(int, d.thang), TRY_CONVERT(int, d.nam)
) AS useSum ON useSum.id_vattu = m.id_vattu AND useSum.thang = cal.thang AND useSum.nam = cal.nam

-- 3. Aggregate Inbound PO & Received from Views
LEFT JOIN 
(
    SELECT id_vattu, SUM(ISNULL(soluong_thucnhan, 0)) AS ReceivedQuantity
    FROM dbo.vw_chitietnhan_coPO
    GROUP BY id_vattu
) AS inSum ON inSum.id_vattu = m.id_vattu

LEFT JOIN 
(
    SELECT Ma_hang_hoa AS id_vattu, SUM(ISNULL(SL_dat, 0)) AS PoOrderedQuantity
    FROM dbo.vw_nhanhang_copo
    GROUP BY Ma_hang_hoa
) AS poSum ON poSum.id_vattu = m.id_vattu

-- 4. Aggregate Available Inventory
LEFT JOIN 
(
    SELECT id_vattu, SUM(ISNULL(so_luong, 0)) AS AvailableInventory
    FROM dbo.tbl_batch_inv
    WHERE (trang_thai_ton = 1 OR trang_thai_ton = N'1' OR TRY_CONVERT(int, trang_thai_ton) = 1) AND so_luong > 0
    GROUP BY id_vattu
) AS invSum ON invSum.id_vattu = m.id_vattu

WHERE ISNULL(planSum.TotalPlanQuantity, 0) > 0 
   OR ISNULL(useSum.TotalRequestedQuantity, 0) > 0 
   OR ISNULL(invSum.AvailableInventory, 0) > 0;
