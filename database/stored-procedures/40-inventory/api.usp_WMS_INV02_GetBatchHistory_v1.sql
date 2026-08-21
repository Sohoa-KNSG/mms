CREATE OR ALTER PROCEDURE api.usp_WMS_INV02_GetBatchHistory_v1
    @UserId nvarchar(50),
    @BatchId int
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS
    (
        SELECT 1 FROM api.vw_SEC_UserScreenAccess_v1
        WHERE UserId = @UserId AND ScreenCode = N'scr_his_id_batch'
    )
        THROW 51001, N'Không có quyền xem lịch sử batch.', 1;

    SELECT
        BatchId = b.id_batch,
        MaterialId = b.id_vattu,
        MaterialName = b.ten_vattu,
        Quantity = CONVERT(decimal(19,4), b.so_luong),
        Unit = b.unit,
        WarehouseCode = b.ma_kho,
        LocationCode = b.location,
        InventoryStatus = COALESCE(s.tentrangthai, b.trang_thai_ton)
    FROM dbo.tbl_batch_inv AS b
    LEFT JOIN dbo.tbl_dm_trangthai_ton AS s ON s.ma_trangthai = b.trang_thai_ton
    WHERE b.id_batch = @BatchId;

    ;WITH Events AS
    (
        SELECT
            EventId = CONVERT(nvarchar(70), CONCAT(N'TRN:', t.id_trans)),
            EventType = CONVERT(nvarchar(30), N'TRANSACTION'),
            EventName = CONVERT(nvarchar(100), COALESCE(o.ten_nghiepvu, t.nghiep_vu)),
            Quantity = CONVERT(decimal(19,4), t.so_luong),
            ActorId = CONVERT(nvarchar(50), p.user_cre),
            OccurredAt = t.time_cre,
            Reference = CONVERT(nvarchar(100), t.id_phieu_trans)
        FROM dbo.tbl_transaction AS t
        LEFT JOIN dbo.tbl_dm_nghiepvu_kho AS o ON o.ma_nghiepvu = t.nghiep_vu
        LEFT JOIN dbo.tbl_phieu_transaction AS p ON p.id_phieu_trans = t.id_phieu_trans
        WHERE t.id_batch = @BatchId

        UNION ALL

        SELECT
            CONVERT(nvarchar(70), CONCAT(N'BAT:', e.id_batch_event)),
            CONVERT(nvarchar(30), N'BATCH'),
            CONVERT(nvarchar(100), COALESCE(d.ten_event, CONVERT(nvarchar(50), e.ma_event))),
            CONVERT(decimal(19,4), e.so_luong),
            CONVERT(nvarchar(50), e.user_up),
            e.time_up,
            CONVERT(nvarchar(100), e.trang_thai_ton)
        FROM dbo.tbl_batch_event AS e
        LEFT JOIN dbo.tbl_dm_batch_event AS d
            ON d.ma_event = CONVERT(nvarchar(50), e.ma_event)
        WHERE e.id_batch = @BatchId

        UNION ALL

        SELECT
            CONVERT(nvarchar(70), CONCAT(N'LOC:', e.id_event)),
            CONVERT(nvarchar(30), N'LOCATION'),
            CONVERT(nvarchar(100), COALESCE(d.ten_event, e.location_event)),
            CONVERT(decimal(19,4), NULL),
            CONVERT(nvarchar(50), e.user_cre),
            e.time_cre,
            CONVERT(nvarchar(100), e.ma_location)
        FROM dbo.tbl_location_event AS e
        LEFT JOIN dbo.tbl_dm_location_event AS d ON d.location_event = e.location_event
        WHERE e.id_batch = @BatchId
    )
    SELECT EventId, EventType, EventName, Quantity, ActorId, OccurredAt, Reference
    FROM Events
    ORDER BY OccurredAt DESC, EventId DESC;
END;

