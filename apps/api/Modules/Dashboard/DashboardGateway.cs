using System.Data;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Options;
using Mms.Api.Configuration;
using Mms.Api.Infrastructure.Sql;

namespace Mms.Api.Modules.Dashboard;

public sealed class DashboardGateway(
    ISqlConnectionFactory connectionFactory,
    IOptions<SqlOptions> options)
{
    private SqlCommand CreateTextCommand(SqlConnection connection, string sql) => new(sql, connection)
    {
        CommandType = CommandType.Text,
        CommandTimeout = options.Value.CommandTimeoutSeconds,
    };

    public async Task<TvDashboardOverview> GetTvDashboardOverviewAsync(CancellationToken cancellationToken)
    {
        await using var connection = await connectionFactory.OpenAsync(cancellationToken);

        var now = DateTime.Now;
        var todayStart = now.Date;

        // 1. Xác định ca làm việc
        var currentHour = now.Hour;
        string shiftName = currentHour switch
        {
            >= 6 and < 14 => "CA 1 (06:00 - 14:00)",
            >= 14 and < 22 => "CA 2 (14:00 - 22:00)",
            _ => "CA 3 (22:00 - 06:00)"
        };

        // 2. Query Inbound Live Summary & Bottlenecks (Loại trừ phiếu đã xóa status_nhap = '0')
        const string inboundSql = @"
            SELECT
                TotalReceipts = SUM(CASE WHEN status_nhap IS NOT NULL AND status_nhap <> N'0' THEN 1 ELSE 0 END),
                TodayReceipts = SUM(CASE WHEN time_cre >= @TodayStart AND status_nhap IS NOT NULL AND status_nhap <> N'0' THEN 1 ELSE 0 END),
                PendingQc = SUM(CASE WHEN status_nhap IN (N'1', N'2') THEN 1 ELSE 0 END),
                PendingQcOverdue1Day = SUM(CASE WHEN status_nhap IN (N'1', N'2') AND DATEDIFF(DAY, time_cre, @Now) >= 1 THEN 1 ELSE 0 END),
                QcPassedPendingPutaway = SUM(CASE WHEN status_nhap = N'4' THEN 1 ELSE 0 END),
                PutawayOverdue1Day = SUM(CASE WHEN status_nhap = N'4' AND DATEDIFF(DAY, time_cre, @Now) >= 1 THEN 1 ELSE 0 END),
                CompletedReceipts = SUM(CASE WHEN status_nhap = N'5' THEN 1 ELSE 0 END),
                TotalReceivedQty = ISNULL((
                    SELECT CAST(SUM(ISNULL(ct.soluong_thucnhan, 0)) AS DECIMAL(19,4))
                    FROM dbo.tbl_chitiet_nhanhang ct WITH (NOLOCK)
                    INNER JOIN dbo.tbl_phieu_nhan_hang pnh WITH (NOLOCK) ON pnh.ma_phieu = ct.ma_phieu
                    WHERE ct.time_cre >= @TodayStart AND pnh.status_nhap <> N'0'
                ), 0)
            FROM dbo.tbl_phieu_nhan_hang WITH (NOLOCK);

            -- Batches chưa lên kệ
            SELECT
                BatchesNotOnRack = COUNT(*),
                TotalQtyNotOnRack = CAST(ISNULL(SUM(so_luong), 0) AS DECIMAL(19,4))
            FROM dbo.tbl_batch_inv WITH (NOLOCK)
            WHERE (location IS NULL OR location = '' OR location LIKE 'TEMP%') AND so_luong > 0 AND trang_thai_ton <> '0';

            -- Phiếu QC kiểm không đạt chờ xử lý (loại trừ phiếu xóa)
            SELECT
                QcFailedPendingHandling = COUNT(DISTINCT ct.id_nhanhang)
            FROM dbo.tbl_chitiet_nhanhang ct WITH (NOLOCK)
            LEFT JOIN dbo.tbl_phieu_nhan_hang pnh WITH (NOLOCK) ON pnh.ma_phieu = ct.ma_phieu
            WHERE ct.ket_qua_qc IN (N'2', N'Không Đạt', N'0') 
              AND (pnh.status_nhap IS NULL OR pnh.status_nhap <> N'0');
        ";

        await using var inboundCmd = CreateTextCommand(connection, inboundSql);
        inboundCmd.Parameters.Add("@TodayStart", SqlDbType.DateTime).Value = todayStart;
        inboundCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var inReader = await inboundCmd.ExecuteReaderAsync(cancellationToken);

        int totalRec = 0, todayRec = 0, pendingQc = 0, pendingQcOverdue = 0, qcPassedPutaway = 0, putawayOverdue = 0, completedRec = 0;
        decimal totalRecQty = 0;
        if (await inReader.ReadAsync(cancellationToken))
        {
            totalRec = inReader.IsDBNull(inReader.GetOrdinal("TotalReceipts")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("TotalReceipts"));
            todayRec = inReader.IsDBNull(inReader.GetOrdinal("TodayReceipts")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("TodayReceipts"));
            pendingQc = inReader.IsDBNull(inReader.GetOrdinal("PendingQc")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("PendingQc"));
            pendingQcOverdue = inReader.IsDBNull(inReader.GetOrdinal("PendingQcOverdue1Day")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("PendingQcOverdue1Day"));
            qcPassedPutaway = inReader.IsDBNull(inReader.GetOrdinal("QcPassedPendingPutaway")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("QcPassedPendingPutaway"));
            putawayOverdue = inReader.IsDBNull(inReader.GetOrdinal("PutawayOverdue1Day")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("PutawayOverdue1Day"));
            completedRec = inReader.IsDBNull(inReader.GetOrdinal("CompletedReceipts")) ? 0 : inReader.GetInt32(inReader.GetOrdinal("CompletedReceipts"));
            totalRecQty = inReader.GetDecimal(inReader.GetOrdinal("TotalReceivedQty"));
        }

        int batchesNotOnRack = 0;
        decimal qtyNotOnRack = 0;
        if (await inReader.NextResultAsync(cancellationToken) && await inReader.ReadAsync(cancellationToken))
        {
            batchesNotOnRack = inReader.GetInt32(inReader.GetOrdinal("BatchesNotOnRack"));
            qtyNotOnRack = inReader.GetDecimal(inReader.GetOrdinal("TotalQtyNotOnRack"));
        }

        int qcFailedCount = 0;
        if (await inReader.NextResultAsync(cancellationToken) && await inReader.ReadAsync(cancellationToken))
        {
            qcFailedCount = inReader.GetInt32(inReader.GetOrdinal("QcFailedPendingHandling"));
        }
        await inReader.CloseAsync();

        var inbound = new InboundLiveDetail(
            totalRec,
            todayRec,
            pendingQc,
            pendingQcOverdue,
            qcPassedPutaway,
            putawayOverdue,
            batchesNotOnRack,
            qtyNotOnRack,
            qcFailedCount,
            completedRec,
            totalRecQty
        );

        // 3. Query Outbound Live Summary & Bottlenecks (Loại trừ phiếu xóa trang_thai_phieu = '0' và phiếu từ chối duyệt trang_thai_phieu = '3')
        const string outboundSql = @"
            SELECT
                TotalRequests = SUM(CASE WHEN trang_thai_phieu IS NOT NULL AND trang_thai_phieu NOT IN (N'0', N'3') THEN 1 ELSE 0 END),
                TodayRequests = SUM(CASE WHEN time_cre >= @TodayStart AND trang_thai_phieu IS NOT NULL AND trang_thai_phieu NOT IN (N'0', N'3') THEN 1 ELSE 0 END),
                PendingApproval = SUM(CASE WHEN trang_thai_phieu IN (N'1', N'2') AND (status_soanhang IS NULL OR status_soanhang = N'0') THEN 1 ELSE 0 END),
                WaitingPick = SUM(CASE WHEN trang_thai_phieu IN (N'4', N'5') AND (status_soanhang IS NULL OR status_soanhang = N'0') THEN 1 ELSE 0 END),
                WaitingPickOverdue1Day = SUM(CASE WHEN trang_thai_phieu IN (N'4', N'5') AND (status_soanhang IS NULL OR status_soanhang = N'0') AND DATEDIFF(DAY, time_cre, @Now) >= 1 THEN 1 ELSE 0 END),
                PickingInProgress = SUM(CASE WHEN trang_thai_phieu NOT IN (N'0', N'3') AND status_soanhang = N'1' THEN 1 ELSE 0 END),
                PickedCompleted = SUM(CASE WHEN trang_thai_phieu NOT IN (N'0', N'3') AND status_soanhang = N'2' THEN 1 ELSE 0 END),
                PickedOverdue2Hours = SUM(CASE WHEN trang_thai_phieu NOT IN (N'0', N'3') AND status_soanhang = N'2' AND DATEDIFF(HOUR, time_cre, @Now) >= 2 THEN 1 ELSE 0 END),
                ReceivedByWorkshop = SUM(CASE WHEN trang_thai_phieu NOT IN (N'0', N'3') AND (status_soanhang = N'3' OR time_nhan IS NOT NULL) THEN 1 ELSE 0 END),
                TotalIssuedQty = ISNULL((
                    SELECT CAST(SUM(ISNULL(ct.so_luong, 0)) AS DECIMAL(19,4))
                    FROM dbo.tbl_phieu_yeucau_chitiet ct WITH (NOLOCK)
                    INNER JOIN dbo.tbl_phieu_yeucau py WITH (NOLOCK) ON py.id_phieu_yeucau = ct.id_phieu_yeucau
                    WHERE py.time_cre >= @TodayStart AND py.trang_thai_phieu NOT IN (N'0', N'3') AND (py.status_soanhang = N'2' OR py.trang_thai_phieu IN (N'4', N'5'))
                ), 0)
            FROM dbo.tbl_phieu_yeucau WITH (NOLOCK);
        ";

        await using var outboundCmd = CreateTextCommand(connection, outboundSql);
        outboundCmd.Parameters.Add("@TodayStart", SqlDbType.DateTime).Value = todayStart;
        outboundCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var outReader = await outboundCmd.ExecuteReaderAsync(cancellationToken);

        OutboundLiveDetail outbound = new(0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        if (await outReader.ReadAsync(cancellationToken))
        {
            outbound = new OutboundLiveDetail(
                outReader.IsDBNull(outReader.GetOrdinal("TotalRequests")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("TotalRequests")),
                outReader.IsDBNull(outReader.GetOrdinal("TodayRequests")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("TodayRequests")),
                outReader.IsDBNull(outReader.GetOrdinal("PendingApproval")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("PendingApproval")),
                outReader.IsDBNull(outReader.GetOrdinal("WaitingPick")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("WaitingPick")),
                outReader.IsDBNull(outReader.GetOrdinal("WaitingPickOverdue1Day")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("WaitingPickOverdue1Day")),
                outReader.IsDBNull(outReader.GetOrdinal("PickingInProgress")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("PickingInProgress")),
                outReader.IsDBNull(outReader.GetOrdinal("PickedCompleted")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("PickedCompleted")),
                outReader.IsDBNull(outReader.GetOrdinal("PickedOverdue2Hours")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("PickedOverdue2Hours")),
                outReader.IsDBNull(outReader.GetOrdinal("ReceivedByWorkshop")) ? 0 : outReader.GetInt32(outReader.GetOrdinal("ReceivedByWorkshop")),
                outReader.GetDecimal(outReader.GetOrdinal("TotalIssuedQty"))
            );
        }
        await outReader.CloseAsync();

        // 4. Query Danh sách hàng đợi chờ xuất kho (Waiting Outbound Queue - Loại trừ trang_thai_phieu = '0' và '3')
        // Thông tin: Số phiếu - Đơn vị - Thời gian tiếp nhận (duyệt) - Thời gian chờ (từ thời điểm nhận đến now) - Thời gian soạn (now - time_lap_phieu)
        const string waitingQueueSql = @"
            SELECT TOP 30
                p.id_phieu_yeucau,
                DonVi = COALESCE(p.ten_bravo_bophan, p.bo_phan, N'Phân xưởng sản xuất'),
                ThoiGianTiepNhan = COALESCE(p.time_duyet, p.time_lap_phieu, p.time_cre),
                SoPhutCho = DATEDIFF(MINUTE, COALESCE(p.time_duyet, p.time_lap_phieu, p.time_cre), @Now),
                p.time_lap_phieu,
                SoPhutSoan = CASE 
                    WHEN p.status_soanhang = N'1' THEN DATEDIFF(MINUTE, COALESCE(p.time_lap_phieu, p.time_duyet, p.time_cre), @Now)
                    ELSE NULL
                END,
                TrangThaiSoan = CASE 
                    WHEN p.status_soanhang = N'1' THEN N'Đang soạn'
                    ELSE N'Chờ soạn'
                END,
                IsPicking = CASE WHEN p.status_soanhang = N'1' THEN 1 ELSE 0 END
            FROM dbo.tbl_phieu_yeucau p WITH (NOLOCK)
            WHERE p.trang_thai_phieu IS NOT NULL 
              AND p.trang_thai_phieu NOT IN (N'0', N'3')
              AND (p.status_soanhang IS NULL OR p.status_soanhang = N'0' OR p.status_soanhang = N'1')
            ORDER BY 
              CASE WHEN p.status_soanhang = N'1' THEN 0 ELSE 1 END,
              COALESCE(p.time_duyet, p.time_lap_phieu, p.time_cre) DESC;
        ";

        await using var waitCmd = CreateTextCommand(connection, waitingQueueSql);
        waitCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var waitReader = await waitCmd.ExecuteReaderAsync(cancellationToken);

        var waitingQueue = new List<WaitingOutboundQueueItem>();
        while (await waitReader.ReadAsync(cancellationToken))
        {
            var reqId = waitReader.GetInt32(waitReader.GetOrdinal("id_phieu_yeucau"));
            var donVi = waitReader.GetString(waitReader.GetOrdinal("DonVi")).Trim();
            var thoiGian = waitReader.IsDBNull(waitReader.GetOrdinal("ThoiGianTiepNhan")) ? now : waitReader.GetDateTime(waitReader.GetOrdinal("ThoiGianTiepNhan"));
            var phutCho = waitReader.IsDBNull(waitReader.GetOrdinal("SoPhutCho")) ? 0 : waitReader.GetInt32(waitReader.GetOrdinal("SoPhutCho"));
            var phutSoan = waitReader.IsDBNull(waitReader.GetOrdinal("SoPhutSoan")) ? (int?)null : waitReader.GetInt32(waitReader.GetOrdinal("SoPhutSoan"));
            var statusText = waitReader.GetString(waitReader.GetOrdinal("TrangThaiSoan"));
            var isPicking = waitReader.GetInt32(waitReader.GetOrdinal("IsPicking")) == 1;

            string waitDuration = phutCho < 60 ? $"{phutCho} phút"
                : phutCho < 1440 ? $"{phutCho / 60} giờ {phutCho % 60} phút"
                : $"{phutCho / 1440} ngày {(phutCho % 1440) / 60} giờ";

            string pickingDuration = "-";
            if (isPicking && phutSoan.HasValue)
            {
                var ps = Math.Max(0, phutSoan.Value);
                pickingDuration = ps < 60 ? $"{ps} phút"
                    : ps < 1440 ? $"{ps / 60} giờ {ps % 60} phút"
                    : $"{ps / 1440} ngày {(ps % 1440) / 60} giờ";
            }

            waitingQueue.Add(new WaitingOutboundQueueItem(
                reqId,
                $"DNXK-{reqId}",
                donVi,
                thoiGian.ToString("HH:mm dd/MM/yyyy"),
                waitDuration,
                phutCho,
                statusText,
                pickingDuration,
                isPicking
            ));
        }
        await waitReader.CloseAsync();

        // 5. Query Danh sách phiếu đã soạn chờ lấy (Picked - Waiting For Workshop Pickup - Loại trừ trang_thai_phieu = '0' và '3')
        // Thông tin: Số phiếu - Đơn vị - Thời gian soạn xong - Thời gian chờ (từ thời điểm soạn đến now) - Nhân viên soạn
        const string pickedQueueSql = @"
            SELECT TOP 30
                p.id_phieu_yeucau,
                DonVi = COALESCE(p.ten_bravo_bophan, p.bo_phan, N'Phân xưởng sản xuất'),
                ThoiGianSoanXong = COALESCE(p.time_lap_phieu, p.time_cre),
                SoPhutChoLay = DATEDIFF(MINUTE, COALESCE(p.time_lap_phieu, p.time_cre), @Now),
                NhanVienSoan = COALESCE(u.ho_ten_nv, p.nguoi_lap_phieu, N'Thủ kho')
            FROM dbo.tbl_phieu_yeucau p WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_user u WITH (NOLOCK) ON u.user_n = p.nguoi_lap_phieu
            WHERE p.trang_thai_phieu IS NOT NULL 
              AND p.trang_thai_phieu NOT IN (N'0', N'3')
              AND p.status_soanhang = N'2'
            ORDER BY COALESCE(p.time_lap_phieu, p.time_cre) DESC;
        ";

        await using var pickedCmd = CreateTextCommand(connection, pickedQueueSql);
        pickedCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var pickedReader = await pickedCmd.ExecuteReaderAsync(cancellationToken);

        var pickedQueue = new List<PickedWaitingPickupItem>();
        while (await pickedReader.ReadAsync(cancellationToken))
        {
            var reqId = pickedReader.GetInt32(pickedReader.GetOrdinal("id_phieu_yeucau"));
            var donVi = pickedReader.GetString(pickedReader.GetOrdinal("DonVi")).Trim();
            var thoiGian = pickedReader.IsDBNull(pickedReader.GetOrdinal("ThoiGianSoanXong")) ? now : pickedReader.GetDateTime(pickedReader.GetOrdinal("ThoiGianSoanXong"));
            var phutCho = pickedReader.IsDBNull(pickedReader.GetOrdinal("SoPhutChoLay")) ? 0 : pickedReader.GetInt32(pickedReader.GetOrdinal("SoPhutChoLay"));
            var nvSoan = pickedReader.GetString(pickedReader.GetOrdinal("NhanVienSoan")).Trim();

            string waitDuration = phutCho < 60 ? $"{phutCho} phút"
                : phutCho < 1440 ? $"{phutCho / 60} giờ {phutCho % 60} phút"
                : $"{phutCho / 1440} ngày {(phutCho % 1440) / 60} giờ";

            bool isOverdue2H = phutCho >= 120;

            pickedQueue.Add(new PickedWaitingPickupItem(
                reqId,
                $"DNXK-{reqId}",
                donVi,
                thoiGian.ToString("HH:mm dd/MM/yyyy"),
                waitDuration,
                phutCho,
                nvSoan,
                isOverdue2H
            ));
        }
        await pickedReader.CloseAsync();

        return new TvDashboardOverview(
            now,
            shiftName,
            inbound,
            outbound,
            waitingQueue,
            pickedQueue
        );
    }
}
