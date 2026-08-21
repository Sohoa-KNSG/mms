CREATE OR ALTER PROCEDURE api.usp_WMS_INB04_GetReceiptLog_v1
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
        SELECT 1
        FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId
          AND ScreenCode IN (N'scr_tam_nhanhang_log', N'scr_nhanhang_log')
    )
        THROW 51001, N'Không có quyền xem nhật ký nhận hàng.', 1;

    SET @Search = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @Page = CASE WHEN @Page < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize < 1 THEN 50 WHEN @PageSize > 200 THEN 200 ELSE @PageSize END;

    SELECT
        HistoryId = h.his_id,
        ReceiptId = COALESCE(h.ma_phieu, N''),
        WarehouseCode = h.kho,
        CustomerName = h.khach_hang,
        PurchaseOrder = h.ma_po,
        StatusCode = h.status_nhap,
        StatusLabel = COALESCE(s.hien_thi, s.mo_ta),
        ActionType = h.action_type,
        ActorName = COALESCE(u.ho_ten_nv, uq.ho_ten, h.user_cre),
        AuditTime = h.audit_time
    FROM dbo.tbl_his_phieunhap AS h
    LEFT JOIN dbo.tbl_dm_status_nhanhang AS s ON s.ma_status = h.status_nhap
    LEFT JOIN dbo.tbl_dm_user AS u ON u.user_n = h.user_cre
    LEFT JOIN dbo.tbl_user_ql AS uq ON uq.user_ql = h.user_cre
    WHERE @Search IS NULL
       OR h.ma_phieu LIKE N'%' + @Search + N'%'
       OR h.ma_po LIKE N'%' + @Search + N'%'
       OR h.khach_hang LIKE N'%' + @Search + N'%'
       OR h.kho LIKE N'%' + @Search + N'%'
    ORDER BY h.audit_time DESC, h.his_id DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT TotalCount = COUNT_BIG(1)
    FROM dbo.tbl_his_phieunhap AS h
    WHERE @Search IS NULL
       OR h.ma_phieu LIKE N'%' + @Search + N'%'
       OR h.ma_po LIKE N'%' + @Search + N'%'
       OR h.khach_hang LIKE N'%' + @Search + N'%'
       OR h.kho LIKE N'%' + @Search + N'%';
END;

