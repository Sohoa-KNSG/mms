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
            >= 6 and < 14 => "Ca 1 (06:00 - 14:00)",
            >= 14 and < 22 => "Ca 2 (14:00 - 22:00)",
            _ => "Ca 3 (22:00 - 06:00)"
        };

        // 2. Query Inbound Live Summary & Bottlenecks
        const string inboundSql = @"
            SELECT
                TotalReceipts = COUNT(*),
                TodayReceipts = SUM(CASE WHEN time_cre >= @TodayStart THEN 1 ELSE 0 END),
                PendingQc = SUM(CASE WHEN status_nhap IN (N'0', N'1', N'2') OR status_nhap IS NULL THEN 1 ELSE 0 END),
                PendingQcOverdue1Day = SUM(CASE WHEN (status_nhap IN (N'0', N'1', N'2') OR status_nhap IS NULL) AND DATEDIFF(DAY, time_cre, @Now) >= 1 THEN 1 ELSE 0 END),
                QcPassedPendingPutaway = SUM(CASE WHEN status_nhap = N'4' THEN 1 ELSE 0 END),
                PutawayOverdue1Day = SUM(CASE WHEN status_nhap = N'4' AND DATEDIFF(DAY, time_cre, @Now) >= 1 THEN 1 ELSE 0 END),
                CompletedReceipts = SUM(CASE WHEN status_nhap = N'5' THEN 1 ELSE 0 END),
                TotalReceivedQty = ISNULL((
                    SELECT CAST(SUM(ISNULL(ct.soluong_thucnhan, 0)) AS DECIMAL(19,4))
                    FROM dbo.tbl_chitiet_nhanhang ct WITH (NOLOCK)
                    WHERE ct.time_cre >= @TodayStart
                ), 0)
            FROM dbo.tbl_phieu_nhan_hang WITH (NOLOCK);

            -- Batches chưa lên kệ
            SELECT
                BatchesNotOnRack = COUNT(*),
                TotalQtyNotOnRack = CAST(ISNULL(SUM(so_luong), 0) AS DECIMAL(19,4))
            FROM dbo.tbl_batch_inv WITH (NOLOCK)
            WHERE (location IS NULL OR location = '' OR location LIKE 'TEMP%') AND so_luong > 0 AND trang_thai_ton <> '0';

            -- Phiếu QC kiểm không đạt chờ xử lý
            SELECT
                QcFailedPendingHandling = COUNT(DISTINCT id_nhanhang)
            FROM dbo.tbl_chitiet_nhanhang WITH (NOLOCK)
            WHERE ket_qua_qc IN (N'2', N'Không Đạt', N'0');
        ";

        await using var inboundCmd = CreateTextCommand(connection, inboundSql);
        inboundCmd.Parameters.Add("@TodayStart", SqlDbType.DateTime).Value = todayStart;
        inboundCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var inReader = await inboundCmd.ExecuteReaderAsync(cancellationToken);

        int totalRec = 0, todayRec = 0, pendingQc = 0, pendingQcOverdue = 0, qcPassedPutaway = 0, putawayOverdue = 0, completedRec = 0;
        decimal totalRecQty = 0;
        if (await inReader.ReadAsync(cancellationToken))
        {
            totalRec = inReader.GetInt32(inReader.GetOrdinal("TotalReceipts"));
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

        // 3. Query Outbound Live Summary & Bottlenecks
        const string outboundSql = @"
            SELECT
                TotalRequests = COUNT(*),
                TodayRequests = SUM(CASE WHEN time_cre >= @TodayStart THEN 1 ELSE 0 END),
                PendingApproval = SUM(CASE WHEN (trang_thai_phieu = N'1' OR trang_thai_phieu = N'2') AND (status_soanhang IS NULL OR status_soanhang = N'0') THEN 1 ELSE 0 END),
                WaitingPick = SUM(CASE WHEN (trang_thai_phieu = N'4' OR trang_thai_phieu = N'1') AND (status_soanhang IS NULL OR status_soanhang = N'0') THEN 1 ELSE 0 END),
                WaitingPickOverdue1Day = SUM(CASE WHEN (status_soanhang IS NULL OR status_soanhang = N'0') AND DATEDIFF(DAY, time_cre, @Now) >= 1 THEN 1 ELSE 0 END),
                PickingInProgress = SUM(CASE WHEN status_soanhang = N'1' THEN 1 ELSE 0 END),
                PickedCompleted = SUM(CASE WHEN status_soanhang = N'2' THEN 1 ELSE 0 END),
                PickedOverdue2Hours = SUM(CASE WHEN status_soanhang = N'2' AND DATEDIFF(HOUR, time_cre, @Now) >= 2 THEN 1 ELSE 0 END),
                ReceivedByWorkshop = SUM(CASE WHEN status_soanhang = N'3' OR time_nhan IS NOT NULL THEN 1 ELSE 0 END),
                TotalIssuedQty = ISNULL((
                    SELECT CAST(SUM(ISNULL(ct.so_luong, 0)) AS DECIMAL(19,4))
                    FROM dbo.tbl_phieu_yeucau_chitiet ct WITH (NOLOCK)
                    INNER JOIN dbo.tbl_phieu_yeucau py WITH (NOLOCK) ON py.id_phieu_yeucau = ct.id_phieu_yeucau
                    WHERE py.time_cre >= @TodayStart AND (py.status_soanhang = N'2' OR py.trang_thai_phieu = N'4')
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
                outReader.GetInt32(outReader.GetOrdinal("TotalRequests")),
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

        // 4. Query Storage & Rack Occupancy
        const string storageSql = @"
            SELECT
                TotalLocations = COUNT(DISTINCT l.ma_location),
                OccupiedLocations = COUNT(DISTINCT CASE WHEN b.so_luong > 0 AND b.trang_thai_ton <> N'0' THEN l.ma_location END),
                TotalActiveSkus = COUNT(DISTINCT CASE WHEN b.so_luong > 0 AND b.trang_thai_ton <> N'0' THEN b.id_vattu END),
                TotalStockQty = CAST(ISNULL(SUM(CASE WHEN b.trang_thai_ton <> N'0' THEN b.so_luong ELSE 0 END), 0) AS DECIMAL(19,4))
            FROM dbo.tbl_dm_location l WITH (NOLOCK)
            LEFT JOIN dbo.tbl_batch_inv b WITH (NOLOCK) ON b.location = l.ma_location;
        ";

        await using var storageCmd = CreateTextCommand(connection, storageSql);
        await using var storReader = await storageCmd.ExecuteReaderAsync(cancellationToken);

        int totalLocs = 0, occupiedLocs = 0, activeSkus = 0;
        decimal totalStockQty = 0;
        if (await storReader.ReadAsync(cancellationToken))
        {
            totalLocs = storReader.GetInt32(storReader.GetOrdinal("TotalLocations"));
            occupiedLocs = storReader.GetInt32(storReader.GetOrdinal("OccupiedLocations"));
            activeSkus = storReader.GetInt32(storReader.GetOrdinal("TotalActiveSkus"));
            totalStockQty = storReader.GetDecimal(storReader.GetOrdinal("TotalStockQty"));
        }
        await storReader.CloseAsync();

        var emptyLocs = Math.Max(0, totalLocs - occupiedLocs);
        var occupancyRate = totalLocs > 0 ? Math.Round((decimal)occupiedLocs / totalLocs * 100, 1) : 0;

        // Query Rack Groups (A, B, C, D, E, 0, 1, 2, etc.)
        const string rackGroupSql = @"
            SELECT
                GroupCode = UPPER(LEFT(l.ma_location, 1)),
                Total = COUNT(DISTINCT l.ma_location),
                Occupied = COUNT(DISTINCT CASE WHEN b.so_luong > 0 AND b.trang_thai_ton <> N'0' THEN l.ma_location END)
            FROM dbo.tbl_dm_location l WITH (NOLOCK)
            LEFT JOIN dbo.tbl_batch_inv b WITH (NOLOCK) ON b.location = l.ma_location
            WHERE l.ma_location IS NOT NULL AND LTRIM(RTRIM(l.ma_location)) <> ''
            GROUP BY UPPER(LEFT(l.ma_location, 1))
            ORDER BY GroupCode;
        ";

        await using var rackCmd = CreateTextCommand(connection, rackGroupSql);
        await using var rackReader = await rackCmd.ExecuteReaderAsync(cancellationToken);
        var rackGroups = new List<RackGroupOccupancy>();
        while (await rackReader.ReadAsync(cancellationToken))
        {
            var code = rackReader.GetString(rackReader.GetOrdinal("GroupCode"));
            var tot = rackReader.GetInt32(rackReader.GetOrdinal("Total"));
            var occ = rackReader.GetInt32(rackReader.GetOrdinal("Occupied"));
            var rate = tot > 0 ? Math.Round((decimal)occ / tot * 100, 1) : 0;
            string name = code switch
            {
                "0" => "Khu Vực Kệ Dãy 0 - Chính",
                "1" => "Khu Vực Kệ Dãy 1 - Phụ",
                "2" => "Khu Vực Kệ Dãy 2 - Tầng Cao",
                "3" => "Khu Vực Kệ Dãy 3 - Tạm",
                "A" => "Dãy A - Kim Loại & Phôi Thép",
                "B" => "Dãy B - Khuôn Gá & Đá Mài",
                "C" => "Dãy C - Hóa Chất & Xi Mạ",
                "D" => "Dãy D - Bao Bì & Đóng Gói",
                "E" => "Dãy E - Phụ Tùng Cơ Điện",
                "K" => "Dãy K - Kệ Lưu Kho Chính",
                _ => $"Khu Vực Kệ Dãy {code}"
            };
            rackGroups.Add(new RackGroupOccupancy(code, name, tot, occ, rate));
        }
        await rackReader.CloseAsync();

        var storage = new StorageLiveSummary(
            totalLocs,
            occupiedLocs,
            emptyLocs,
            occupancyRate,
            activeSkus,
            totalStockQty,
            rackGroups
        );

        // 5. Query Quality (QC) Live Summary
        const string qcSql = @"
            SELECT
                InspectionsToday = COUNT(DISTINCT id_phieukiem),
                PassedCount = SUM(CASE WHEN ket_qua_qc LIKE N'%Đạt%' OR ket_qua_qc = N'1' THEN 1 ELSE 0 END),
                RejectedCount = SUM(CASE WHEN ket_qua_qc LIKE N'%Không%' OR ket_qua_qc = N'0' THEN 1 ELSE 0 END)
            FROM dbo.tbl_qc_kiem WITH (NOLOCK)
            WHERE time_cre >= @TodayStart;
        ";

        await using var qcCmd = CreateTextCommand(connection, qcSql);
        qcCmd.Parameters.Add("@TodayStart", SqlDbType.DateTime).Value = todayStart;
        await using var qcReader = await qcCmd.ExecuteReaderAsync(cancellationToken);

        QualityLiveSummary quality = new(0, 0, 0, 100);
        if (await qcReader.ReadAsync(cancellationToken))
        {
            var insp = qcReader.GetInt32(qcReader.GetOrdinal("InspectionsToday"));
            var pass = qcReader.IsDBNull(qcReader.GetOrdinal("PassedCount")) ? 0 : qcReader.GetInt32(qcReader.GetOrdinal("PassedCount"));
            var rej = qcReader.IsDBNull(qcReader.GetOrdinal("RejectedCount")) ? 0 : qcReader.GetInt32(qcReader.GetOrdinal("RejectedCount"));
            var totalChecks = pass + rej;
            var rate = totalChecks > 0 ? Math.Round((decimal)pass / totalChecks * 100, 1) : 100m;
            quality = new QualityLiveSummary(insp, pass, rej, rate);
        }
        await qcReader.CloseAsync();

        // 6. Query Cycle Count Live Summary
        const string ccSql = @"
            SELECT
                ActivePlans = COUNT(CASE WHEN ISNULL(trang_thai, 0) = 0 THEN 1 END),
                CountedBatchesToday = (
                    SELECT COUNT(*)
                    FROM dbo.tbl_kiemke_log WITH (NOLOCK)
                    WHERE time_cre >= @TodayStart
                )
            FROM dbo.tbl_kiemke_kh WITH (NOLOCK);
        ";

        await using var ccCmd = CreateTextCommand(connection, ccSql);
        ccCmd.Parameters.Add("@TodayStart", SqlDbType.DateTime).Value = todayStart;
        await using var ccReader = await ccCmd.ExecuteReaderAsync(cancellationToken);

        CycleCountLiveSummary cycleCount = new(0, 0, 99.4m);
        if (await ccReader.ReadAsync(cancellationToken))
        {
            var active = ccReader.IsDBNull(ccReader.GetOrdinal("ActivePlans")) ? 0 : ccReader.GetInt32(ccReader.GetOrdinal("ActivePlans"));
            var batches = ccReader.IsDBNull(ccReader.GetOrdinal("CountedBatchesToday")) ? 0 : ccReader.GetInt32(ccReader.GetOrdinal("CountedBatchesToday"));
            cycleCount = new CycleCountLiveSummary(active, batches, 99.4m);
        }
        await ccReader.CloseAsync();

        // 7. Query Hourly Throughput Today (06:00 to 22:00)
        const string hourlySql = @"
            SELECT
                HourBlock = DATEPART(HOUR, time_cre),
                InboundQty = CAST(SUM(CASE WHEN nghiep_vu IN (N'NHAP_PO', N'INB_PO', N'INB_NO_PO', N'SPLIT_IN', N'ADJ_UP') THEN ISNULL(so_luong, 0) ELSE 0 END) AS DECIMAL(19,4)),
                OutboundQty = CAST(SUM(CASE WHEN nghiep_vu IN (N'XUAT_BOM', N'OUT_BOM', N'OUT_UNPLANNED', N'SPLIT_OUT', N'ADJ_DWN') THEN ISNULL(so_luong, 0) ELSE 0 END) AS DECIMAL(19,4))
            FROM dbo.tbl_transaction WITH (NOLOCK)
            WHERE time_cre >= @TodayStart
            GROUP BY DATEPART(HOUR, time_cre)
            ORDER BY HourBlock;
        ";

        await using var hourlyCmd = CreateTextCommand(connection, hourlySql);
        hourlyCmd.Parameters.Add("@TodayStart", SqlDbType.DateTime).Value = todayStart;
        await using var hrReader = await hourlyCmd.ExecuteReaderAsync(cancellationToken);

        var hourlyMap = new Dictionary<int, (decimal Inbound, decimal Outbound)>();
        while (await hrReader.ReadAsync(cancellationToken))
        {
            var h = hrReader.GetInt32(hrReader.GetOrdinal("HourBlock"));
            var inb = hrReader.GetDecimal(hrReader.GetOrdinal("InboundQty"));
            var outb = hrReader.GetDecimal(hrReader.GetOrdinal("OutboundQty"));
            hourlyMap[h] = (inb, outb);
        }
        await hrReader.CloseAsync();

        var hourlyList = new List<HourlyThroughputItem>();
        for (int h = 6; h <= Math.Max(18, now.Hour); h += 2)
        {
            var inQty = (hourlyMap.TryGetValue(h, out var v1) ? v1.Inbound : 0) + (hourlyMap.TryGetValue(h + 1, out var v2) ? v2.Inbound : 0);
            var outQty = (hourlyMap.TryGetValue(h, out var v3) ? v3.Outbound : 0) + (hourlyMap.TryGetValue(h + 1, out var v4) ? v4.Outbound : 0);
            hourlyList.Add(new HourlyThroughputItem($"{h:D2}:00", inQty, outQty));
        }

        // 8. Query 10 Recent Real-time Activities
        const string recentSql = @"
            SELECT TOP 12
                Id = t.id_trans,
                NghiepVu = ISNULL(t.nghiep_vu, N'GIAO_DICH'),
                MaterialId = ISNULL(t.id_vattu, N''),
                MaterialName = ISNULL(t.ten_vattu, N'Vật tư'),
                Quantity = CAST(ISNULL(t.so_luong, 0) AS DECIMAL(19,4)),
                Unit = ISNULL(t.unit, N''),
                CreatedAt = t.time_cre,
                BatchId = t.id_batch
            FROM dbo.tbl_transaction t WITH (NOLOCK)
            ORDER BY t.id_trans DESC;
        ";

        await using var recentCmd = CreateTextCommand(connection, recentSql);
        await using var recReader = await recentCmd.ExecuteReaderAsync(cancellationToken);

        var recentActivities = new List<LiveActivityItem>();
        while (await recReader.ReadAsync(cancellationToken))
        {
            var id = recReader.GetInt32(recReader.GetOrdinal("Id"));
            var nv = recReader.GetString(recReader.GetOrdinal("NghiepVu"));
            var matName = recReader.GetString(recReader.GetOrdinal("MaterialName"));
            var qty = recReader.GetDecimal(recReader.GetOrdinal("Quantity"));
            var unit = recReader.GetString(recReader.GetOrdinal("Unit"));
            var created = recReader.GetDateTime(recReader.GetOrdinal("CreatedAt"));
            var batchId = recReader.IsDBNull(recReader.GetOrdinal("BatchId")) ? (int?)null : recReader.GetInt32(recReader.GetOrdinal("BatchId"));

            var diff = now - created;
            string timeAgo = diff.TotalMinutes < 1 ? "Vừa xong"
                : diff.TotalMinutes < 60 ? $"{Math.Max(1, (int)diff.TotalMinutes)} phút trước"
                : $"{Math.Max(1, (int)diff.TotalHours)} giờ trước";

            string type = "INBOUND";
            string title = "Giao dịch kho";
            string desc = $"{matName} ({qty:N0} {unit})";

            if (nv.Contains("NHAP") || nv.Contains("INB"))
            {
                type = "INBOUND";
                title = "Tiếp nhận vật tư nhập kho";
                desc = $"Nhập kho: {matName} ({qty:N0} {unit})";
            }
            else if (nv.Contains("XUAT") || nv.Contains("OUT"))
            {
                type = "OUTBOUND";
                title = "Soạn xuất vật tư sản xuất";
                desc = $"Xuất xưởng: {matName} ({qty:N0} {unit})";
            }
            else if (nv.Contains("SPLIT"))
            {
                type = "TRANSFER";
                title = "Tách lô kiểm kê / In tem";
                desc = $"Tách thùng: {matName} ({qty:N0} {unit})";
            }
            else if (nv.Contains("ADJ"))
            {
                type = "COUNT";
                title = "Điều chỉnh kiểm đếm";
                desc = $"Kiểm kê: {matName} ({qty:N0} {unit})";
            }

            recentActivities.Add(new LiveActivityItem(
                id,
                type,
                title,
                desc,
                batchId.HasValue ? $"Lô #{batchId}" : $"GD #{id}",
                timeAgo,
                "Kho Vật Tư"
            ));
        }
        await recReader.CloseAsync();

        // 9. Query Top Pickers & Top Receivers (Staff KPI)
        const string staffKpiSql = @"
            -- Top Receivers (Nhân sự nhận hàng tại phân xưởng)
            SELECT TOP 5
                StaffCode = ISNULL(p.nguoi_nhan, N'UNKNOWN'),
                StaffName = COALESCE(u.ho_ten_nv, p.nguoi_nhan, N'Nhân viên nhận'),
                Dept = COALESCE(p.ten_bravo_bophan, p.bo_phan, N'Phân xưởng sản xuất'),
                CompletedCount = COUNT(DISTINCT p.id_phieu_yeucau),
                TotalQuantity = CAST(ISNULL(SUM(c.so_luong), 0) AS DECIMAL(19,2))
            FROM dbo.tbl_phieu_yeucau p WITH (NOLOCK)
            LEFT JOIN dbo.tbl_dm_user u WITH (NOLOCK) ON u.user_n = p.nguoi_nhan OR CONVERT(nvarchar(50), u.msnv) = p.nguoi_nhan
            LEFT JOIN dbo.tbl_phieu_yeucau_chitiet c WITH (NOLOCK) ON c.id_phieu_yeucau = p.id_phieu_yeucau
            WHERE p.status_soanhang = '3' OR p.time_nhan IS NOT NULL
            GROUP BY p.nguoi_nhan, u.ho_ten_nv, p.ten_bravo_bophan, p.bo_phan
            ORDER BY CompletedCount DESC;

            -- Top Requesters / Pickers
            SELECT TOP 5
                StaffCode = ISNULL(p.nguoi_lap_phieu, N'UNKNOWN'),
                StaffName = ISNULL(p.nguoi_lap_phieu, N'Thủ kho / Nhân viên'),
                Dept = COALESCE(p.ten_bravo_bophan, p.bo_phan, N'Kho Vật Tư'),
                CompletedCount = COUNT(DISTINCT p.id_phieu_yeucau),
                TotalQuantity = CAST(ISNULL(SUM(c.so_luong), 0) AS DECIMAL(19,2))
            FROM dbo.tbl_phieu_yeucau p WITH (NOLOCK)
            LEFT JOIN dbo.tbl_phieu_yeucau_chitiet c WITH (NOLOCK) ON c.id_phieu_yeucau = p.id_phieu_yeucau
            WHERE p.status_soanhang IN ('2', '3')
            GROUP BY p.nguoi_lap_phieu, p.ten_bravo_bophan, p.bo_phan
            ORDER BY CompletedCount DESC;
        ";

        await using var staffCmd = CreateTextCommand(connection, staffKpiSql);
        await using var staffReader = await staffCmd.ExecuteReaderAsync(cancellationToken);

        var topReceivers = new List<StaffKpiItem>();
        while (await staffReader.ReadAsync(cancellationToken))
        {
            topReceivers.Add(new StaffKpiItem(
                staffReader.GetString(staffReader.GetOrdinal("StaffCode")),
                staffReader.GetString(staffReader.GetOrdinal("StaffName")),
                staffReader.GetString(staffReader.GetOrdinal("Dept")),
                staffReader.GetInt32(staffReader.GetOrdinal("CompletedCount")),
                staffReader.GetDecimal(staffReader.GetOrdinal("TotalQuantity"))
            ));
        }

        var topPickers = new List<StaffKpiItem>();
        if (await staffReader.NextResultAsync(cancellationToken))
        {
            while (await staffReader.ReadAsync(cancellationToken))
            {
                topPickers.Add(new StaffKpiItem(
                    staffReader.GetString(staffReader.GetOrdinal("StaffCode")),
                    staffReader.GetString(staffReader.GetOrdinal("StaffName")),
                    staffReader.GetString(staffReader.GetOrdinal("Dept")),
                    staffReader.GetInt32(staffReader.GetOrdinal("CompletedCount")),
                    staffReader.GetDecimal(staffReader.GetOrdinal("TotalQuantity"))
                ));
            }
        }
        await staffReader.CloseAsync();

        // 10. Query Top Critical Bottleneck Alerts
        const string alertsSql = @"
            -- Top phiếu quá hạn QC (> 1 ngày)
            SELECT TOP 3
                AlertType = 'QC_OVERDUE',
                Severity = 'CRITICAL',
                Title = N'Phiếu nhận hàng quá 24h chưa kiểm tra QC',
                ReferenceCode = N'PNH-' + CONVERT(nvarchar(20), ma_phieu),
                DepartmentOrSupplier = ISNULL(khach_hang, N'Nhà cung cấp'),
                TimeOverdue = CONVERT(nvarchar(10), DATEDIFF(DAY, time_cre, @Now)) + N' ngày'
            FROM dbo.tbl_phieu_nhan_hang WITH (NOLOCK)
            WHERE (status_nhap IN (N'0', N'1', N'2') OR status_nhap IS NULL) AND DATEDIFF(DAY, time_cre, @Now) >= 1
            ORDER BY time_cre ASC;

            -- Top phiếu quá hạn cất kệ (> 1 ngày)
            SELECT TOP 3
                AlertType = 'PUTAWAY_OVERDUE',
                Severity = 'WARNING',
                Title = N'Phiếu đã QC Pass quá 24h chưa cất vào vị trí kệ',
                ReferenceCode = N'PNH-' + CONVERT(nvarchar(20), ma_phieu),
                DepartmentOrSupplier = ISNULL(khach_hang, N'Nhà cung cấp'),
                TimeOverdue = CONVERT(nvarchar(10), DATEDIFF(DAY, time_cre, @Now)) + N' ngày'
            FROM dbo.tbl_phieu_nhan_hang WITH (NOLOCK)
            WHERE status_nhap = N'4' AND DATEDIFF(DAY, time_cre, @Now) >= 1
            ORDER BY time_cre ASC;

            -- Top phiếu xuất đã soạn quá 2h chưa nhận
            SELECT TOP 4
                AlertType = 'RECEIVE_OVERDUE',
                Severity = 'CRITICAL',
                Title = N'Hàng đã soạn xong quá 2h xưởng chưa đến nhận',
                ReferenceCode = N'DNXK-' + CONVERT(nvarchar(20), id_phieu_yeucau),
                DepartmentOrSupplier = COALESCE(ten_bravo_bophan, bo_phan, N'Phân xưởng'),
                TimeOverdue = CONVERT(nvarchar(10), DATEDIFF(HOUR, time_cre, @Now)) + N' giờ'
            FROM dbo.tbl_phieu_yeucau WITH (NOLOCK)
            WHERE status_soanhang = N'2' AND DATEDIFF(HOUR, time_cre, @Now) >= 2
            ORDER BY time_cre ASC;
        ";

        await using var alertCmd = CreateTextCommand(connection, alertsSql);
        alertCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var alertReader = await alertCmd.ExecuteReaderAsync(cancellationToken);

        var criticalAlerts = new List<CriticalAlertItem>();
        while (await alertReader.ReadAsync(cancellationToken))
        {
            criticalAlerts.Add(new CriticalAlertItem(
                alertReader.GetString(alertReader.GetOrdinal("AlertType")),
                alertReader.GetString(alertReader.GetOrdinal("Severity")),
                alertReader.GetString(alertReader.GetOrdinal("Title")),
                alertReader.GetString(alertReader.GetOrdinal("ReferenceCode")),
                alertReader.GetString(alertReader.GetOrdinal("DepartmentOrSupplier")),
                alertReader.GetString(alertReader.GetOrdinal("TimeOverdue"))
            ));
        }

        if (await alertReader.NextResultAsync(cancellationToken))
        {
            while (await alertReader.ReadAsync(cancellationToken))
            {
                criticalAlerts.Add(new CriticalAlertItem(
                    alertReader.GetString(alertReader.GetOrdinal("AlertType")),
                    alertReader.GetString(alertReader.GetOrdinal("Severity")),
                    alertReader.GetString(alertReader.GetOrdinal("Title")),
                    alertReader.GetString(alertReader.GetOrdinal("ReferenceCode")),
                    alertReader.GetString(alertReader.GetOrdinal("DepartmentOrSupplier")),
                    alertReader.GetString(alertReader.GetOrdinal("TimeOverdue"))
                ));
            }
        }

        if (await alertReader.NextResultAsync(cancellationToken))
        {
            while (await alertReader.ReadAsync(cancellationToken))
            {
                criticalAlerts.Add(new CriticalAlertItem(
                    alertReader.GetString(alertReader.GetOrdinal("AlertType")),
                    alertReader.GetString(alertReader.GetOrdinal("Severity")),
                    alertReader.GetString(alertReader.GetOrdinal("Title")),
                    alertReader.GetString(alertReader.GetOrdinal("ReferenceCode")),
                    alertReader.GetString(alertReader.GetOrdinal("DepartmentOrSupplier")),
                    alertReader.GetString(alertReader.GetOrdinal("TimeOverdue"))
                ));
            }
        }
        await alertReader.CloseAsync();

        // 11. Query Pending Workshops (Đơn vị / Phân xưởng cần soạn hàng)
        const string workshopSql = @"
            SELECT TOP 8
                DeptCode = ISNULL(p.bo_phan, N'OTHER'),
                DepartmentName = COALESCE(p.ten_bravo_bophan, p.bo_phan, N'Phân xưởng khác'),
                PendingOrders = COUNT(DISTINCT p.id_phieu_yeucau),
                TotalQuantity = CAST(ISNULL(SUM(c.so_luong), 0) AS DECIMAL(19,2)),
                EarliestNeededTime = MIN(COALESCE(p.thoi_gian_can, p.time_cre)),
                UrgentCount = SUM(CASE WHEN p.thoi_gian_can <= DATEADD(HOUR, 2, @Now) THEN 1 ELSE 0 END)
            FROM dbo.tbl_phieu_yeucau p WITH (NOLOCK)
            LEFT JOIN dbo.tbl_phieu_yeucau_chitiet c WITH (NOLOCK) ON c.id_phieu_yeucau = p.id_phieu_yeucau
            WHERE p.status_soanhang IN (N'0', N'1') OR (p.trang_thai_phieu = N'4' AND (p.status_soanhang IS NULL OR p.status_soanhang = N'0'))
            GROUP BY p.ten_bravo_bophan, p.bo_phan
            ORDER BY UrgentCount DESC, PendingOrders DESC;
        ";

        await using var wsCmd = CreateTextCommand(connection, workshopSql);
        wsCmd.Parameters.Add("@Now", SqlDbType.DateTime).Value = now;
        await using var wsReader = await wsCmd.ExecuteReaderAsync(cancellationToken);

        var pendingWorkshops = new List<PendingWorkshopPickingItem>();
        while (await wsReader.ReadAsync(cancellationToken))
        {
            var deptCode = wsReader.GetString(wsReader.GetOrdinal("DeptCode"));
            var deptName = wsReader.GetString(wsReader.GetOrdinal("DepartmentName")).Trim();
            var pendingOrders = wsReader.GetInt32(wsReader.GetOrdinal("PendingOrders"));
            var totalQty = wsReader.GetDecimal(wsReader.GetOrdinal("TotalQuantity"));
            var earliest = wsReader.IsDBNull(wsReader.GetOrdinal("EarliestNeededTime")) ? now : wsReader.GetDateTime(wsReader.GetOrdinal("EarliestNeededTime"));
            var urgent = wsReader.GetInt32(wsReader.GetOrdinal("UrgentCount"));

            string priority = urgent > 0 ? "URGENT" : (earliest.Date == todayStart ? "TODAY" : "NORMAL");

            pendingWorkshops.Add(new PendingWorkshopPickingItem(
                deptCode,
                deptName,
                pendingOrders,
                totalQty,
                earliest.ToString("HH:mm dd/MM"),
                priority
            ));
        }
        await wsReader.CloseAsync();

        return new TvDashboardOverview(
            now,
            shiftName,
            inbound,
            outbound,
            storage,
            quality,
            cycleCount,
            hourlyList,
            recentActivities,
            topPickers,
            topReceivers,
            criticalAlerts,
            pendingWorkshops
        );
    }
}
