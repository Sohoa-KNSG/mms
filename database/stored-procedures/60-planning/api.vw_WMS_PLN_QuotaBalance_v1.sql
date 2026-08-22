CREATE OR ALTER VIEW api.vw_WMS_PLN_QuotaBalance_v1
AS
SELECT 
    planItem.id_kehoach,
    planItem.donvi_kehoach,
    planUnit.ten_kehoach AS ten_donvi_kehoach,
    planItem.id_vattu,
    planItem.id_bravo,
    planItem.ten_vattu,
    planItem.unit,
    planItem.thang,
    planItem.nam,
    planItem.dinh_muc AS LimitQuantity,
    ISNULL(usage.RequestedQuantity, 0) AS RequestedQuantity,
    ISNULL(usage.IssuedQuantity, 0) AS IssuedQuantity,
    CASE 
        WHEN planItem.dinh_muc > ISNULL(usage.RequestedQuantity, 0) 
        THEN planItem.dinh_muc - ISNULL(usage.RequestedQuantity, 0)
        ELSE 0 
    END AS RemainingQuantity,
    CASE 
        WHEN planItem.dinh_muc > 0 
        THEN ROUND((ISNULL(usage.RequestedQuantity, 0) * 100.0) / planItem.dinh_muc, 2)
        ELSE 0 
    END AS ConsumptionPercentage,
    planItem.is_active,
    planItem.ghi_chu,
    planItem.user_cre,
    planItem.time_cre,
    planItem.user_up,
    planItem.time_up
FROM dbo.tbl_dinhmuc AS planItem
LEFT JOIN dbo.tbl_dm_kehoach AS planUnit ON planUnit.donvi_kehoach = planItem.donvi_kehoach
OUTER APPLY
(
    SELECT 
        RequestedQuantity = SUM(ISNULL(line.so_luong, 0)),
        IssuedQuantity = SUM(CASE WHEN req.status_soanhang = N'2' THEN ISNULL(line.so_luong, 0) ELSE 0 END)
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    INNER JOIN dbo.tbl_phieu_yeucau AS req ON req.id_phieu_yeucau = line.id_phieu_yeucau
    WHERE line.id_kehoach = planItem.id_kehoach
      AND ISNULL(req.trang_thai_phieu, N'0') <> N'0'
      AND NOT EXISTS
      (
          SELECT 1 FROM dbo.tbl_his_pheduyet AS history
          WHERE history.id_phieu_yeucau = req.id_phieu_yeucau
            AND LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'reject'
      )
) AS usage;
