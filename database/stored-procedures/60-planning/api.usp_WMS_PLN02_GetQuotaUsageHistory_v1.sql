CREATE OR ALTER PROCEDURE api.usp_WMS_PLN02_GetQuotaUsageHistory_v1
    @UserId nvarchar(50),
    @PlanId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @PlanId <= 0 THROW 51009, N'Mã định mức không hợp lệ.', 1;

    -- 1. Get Plan Item Info
    SELECT 
        id_kehoach,
        donvi_kehoach,
        ten_donvi_kehoach,
        id_vattu,
        id_bravo,
        ten_vattu,
        unit,
        thang,
        nam,
        LimitQuantity,
        RequestedQuantity,
        IssuedQuantity,
        RemainingQuantity,
        ConsumptionPercentage,
        is_active,
        ghi_chu
    FROM api.vw_WMS_PLN_QuotaBalance_v1
    WHERE id_kehoach = @PlanId;

    -- 2. Get Related Request Lines & Issue Status
    SELECT 
        RequestId = req.id_phieu_yeucau,
        RequestCode = ISNULL(req.ma_bravo_bophan, N'') + N'-' + CAST(req.id_phieu_yeucau AS nvarchar(20)),
        RequestLineId = line.id_chitiet_phieu,
        RequestedQuantity = CONVERT(decimal(19,4), ISNULL(line.so_luong, 0)),
        Unit = line.unit,
        Requester = req.nguoi_lap_phieu,
        DepartmentCode = req.ma_bravo_bophan,
        RequestDate = req.time_lap_phieu,
        RequestStatus = req.trang_thai_phieu,
        PickingStatus = req.status_soanhang,
        IssueDocumentId = trans.id_phieu_trans,
        IssuedQuantity = CONVERT(decimal(19,4), CASE WHEN req.status_soanhang = N'2' THEN ISNULL(line.so_luong, 0) ELSE 0 END),
        Note = req.ghi_chu_huy
    FROM dbo.tbl_phieu_yeucau_chitiet AS line
    INNER JOIN dbo.tbl_phieu_yeucau AS req ON req.id_phieu_yeucau = line.id_phieu_yeucau
    LEFT JOIN dbo.tbl_phieu_transaction AS trans ON trans.ma_yeucau = req.id_phieu_yeucau AND trans.nghiep_vu = N'OUT_CON'
    WHERE line.id_kehoach = @PlanId
      AND ISNULL(req.trang_thai_phieu, N'0') <> N'0'
      AND NOT EXISTS
      (
          SELECT 1 FROM dbo.tbl_his_pheduyet AS history
          WHERE history.id_phieu_yeucau = req.id_phieu_yeucau
            AND LOWER(ISNULL(history.trangthai_pheduyet, N'')) = N'reject'
      )
    ORDER BY req.id_phieu_yeucau DESC;
END;
