# UC-31 (PLN-02) — THEO DÕI, CẢNH BÁO & QUẢN LÝ SỬ DỤNG ĐỊNH MỨC VẬT TƯ THỰC TẾ

## 0. Document Control

| Thuộc tính | Nội dung |
|---|---|
| Use Case ID | `UC-31 (PLN-02)` |
| Use Case Name | Theo Dõi, Cảnh Báo & Quản Lý Sử Dụng Định Mức Vật Tư Thực Tế (Quota Tracking & Monitoring) |
| Module | `WMS / Quota Consumption & Analytics (Quản Lý Sử Dụng Định Mức)` |
| Business Owner | Quản Đốc Phân Xưởng, Phòng Kế Hoạch & Trưởng Phòng Kho (KNSG) |
| Product Owner / BA | Đội Ngũ Phân Tích Nghiệp Vụ WMS |
| Technical Owner | Tech Lead / Database & Analytics Architecture Team |
| Version | `v1.0` |
| Status | `Approved / Specification Complete` |
| Last Updated | `2026-08-22` |

---

# A. BUSINESS SPECIFICATION — WHAT

## 1. Use Case Overview

### 1.1. Business Objective
Cung cấp màn hình giám sát và phân tích tiến độ tiêu hao định mức vật tư của từng Phân xưởng / Đơn vị kế hoạch theo thời gian thực (Realtime Quota Consumption Tracking).

Phân hệ giải quyết các bài toán quản trị trọng yếu:
1. **Minh bạch số liệu tiêu hao:** Giám sát liên tục 4 chỉ số cốt lõi của từng vật tư trong kỳ:
   $$\text{Định Mức Giao (A)} \quad \longrightarrow \quad \text{Đã Đề Nghị (B)} \quad \longrightarrow \quad \text{Thực Xuất (C)} \quad \longrightarrow \quad \text{Còn Lại (A - B)}$$
2. **Cảnh báo sớm & Phân cấp màu sắc (% Tiêu hao):**
   - 🟢 **Màu Xanh ($< 80\%$):** Mức tiêu hao bình thường, đảm bảo tiến độ sản xuất.
   - 🟡 **Màu Vàng ($80\% - 99\%$):** Cảnh báo sắp hết định mức trong tháng, nhắc nhở xưởng cân đối hoặc lập kế hoạch bổ sung.
   - 🔴 **Màu Đỏ ($\ge 100\%$):** Đã hết / vượt định mức, hệ thống tự động khóa luồng Đề nghị xuất theo kế hoạch (OUT-01) và chuyển hướng sang luồng Phê duyệt vượt mức (OUT-02).
3. **Truy vết chi tiết từng phiếu xuất (Audit Trail):** Cho phép bấm vào bất kỳ SKU nào để xem danh sách toàn bộ các Phiếu Yêu Cầu / Phiếu Xuất Kho đã trừ vào định mức của vật tư đó.
4. **Đối soát & Báo cáo cuối kỳ:** Xuất bảng tổng hợp so sánh phục vụ kiểm toán chi phí sản xuất và phân tích định mức BOM thực tế.

### 1.2. Primary Actors
- **Quản Đốc Phân Xưởng / Nhân viên Kế hoạch:** Theo dõi sản lượng vật tư xưởng mình đã dùng và hạn mức còn lại để đăng ký xuất tiếp.
- **Thủ Kho Trưởng / Nhân viên Kho:** Kiểm soát tiến độ cấp phát vật tư cho các đơn vị.
- **Trưởng Phòng Kho / Ban Giám Đốc:** Giám sát bức tranh tổng thể về tiêu hao vật tư toàn công ty, phát hiện các đơn vị có dấu hiệu lãng phí hoặc vượt định mức.

### 1.3. Preconditions
- Kỳ định mức tháng đã được khai báo và kích hoạt trong `dbo.tbl_dinhmuc`.
- Các phiếu Đề nghị xuất kho (`tbl_phieu_yeucau`) và Phiếu xuất thực tế (`tbl_phieu_transaction`) phát sinh trong kỳ.

---

## 2. Thiết Kế Giao Diện & Trực Quan Hóa (Screen Blueprint)

### 2.1. Thẻ Thống Kê Tổng Quan (KPI Metric Cards)
- 📊 **Tổng Định Mức Giao Trong Kỳ:** Tổng khối lượng / giá trị định mức được duyệt.
- 📤 **Tổng Sản Lượng Đã Xuất:** Lượng vật tư thực tế đã giao tới các xưởng.
- ⏳ **Lượng Đang Đề Nghị (Chờ xuất):** Lượng vật tư đang trong luồng duyệt / soạn hàng.
- ⚠️ **Cảnh Báo Vượt Định Mức:** Số lượng SKU / Đơn vị đã chạm ngưỡng đỏ ($\ge 100\%$).

### 2.2. Bảng Theo Dõi Chi Tiết Từng SKU (Realtime Monitoring Grid)

| Cột | Tên Cột | Diễn Giải & Định Dạng Hiển Thị |
|:---:|---|---|
| 1 | **Mã SKU / Vật Tư** | `id_vattu` (In đậm, kèm mã Bravo nếu có) |
| 2 | **Tên Vật Tư & ĐVT** | `ten_vattu` + Huy hiệu ĐVT (`Kg`, `Cái`, `Con`, `Mét`,...) |
| 3 | **Đơn Vị Kế Hoạch** | Tên Phân xưởng / Line sản xuất sử dụng |
| 4 | **Định Mức Cấp (A)** | Số lượng định mức tháng được phê duyệt |
| 5 | **Đã Đề Nghị (B)** | Tổng số lượng trên các phiếu yêu cầu hợp lệ |
| 6 | **Thực Xuất (C)** | Tổng số lượng thực tế đã trừ kho và giao hàng |
| 7 | **Còn Lại (A - B)** | Số dư định mức còn được phép đề nghị tiếp |
| 8 | **Tiến Độ Tiêu Hao (%)** | Thanh ProgressBar trực quan kèm % số liệu: <br>• 🟢 `< 80%` (Xanh lá) <br>• 🟡 `80% - 99%` (Vàng cam) <br>• 🔴 `≥ 100%` (Đỏ cảnh báo) |
| 9 | **Truy Vết (Audit)** | Nút bấm 👁️ Mở Modal xem chi tiết lịch sử từng phiếu xuất |

---

### 2.3. Modal Truy Vết Lịch Sử Cấp Phát Từng Dòng (Traceability Modal)
Khi bấm xem chi tiết của 1 mã vật tư, popup hiển thị danh sách tất cả các phiếu đã trừ vào định mức:
- `Mã Phiếu Yêu Cầu` (Ví dụ: `DNXK-8996`)
- `Ngày Đề Nghị` & `Người Lập Phiếu`
- `Số Lượng Yêu Cầu` vs `Số Lượng Thực Xuất`
- `Trạng Thái Phiếu` (Đã duyệt / Đang soạn hàng / Đã xuất chốt sổ)
- `Mã Chứng Từ Xuất Kho` (`id_phieu_trans`)

---

# B. TECHNICAL SPECIFICATION — HOW

## 1. SQL View Tính Toán Realtime: `api.vw_WMS_PLN_QuotaBalance_v1`

```sql
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
    planItem.ghi_chu
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
```

---

## 2. Stored Procedures Cho Phân Hệ Theo Dõi

1. **`api.usp_WMS_PLN02_GetQuotaMonitoring_v1`**:
   - Tham số: `@UserId`, `@PlanningUnit`, `@Month`, `@Year`, `@Search`, `@StatusFilter` (Tất cả / Sắp hết vàng / Vượt mức đỏ), `@Page`, `@PageSize`.
   - Trả về: Bảng dữ liệu theo dõi kèm phân trang và số liệu KPI tổng hợp.
2. **`api.usp_WMS_PLN02_GetQuotaUsageHistory_v1`**:
   - Tham số: `@UserId`, `@PlanId`.
   - Trả về: Danh sách chi tiết các phiếu đề nghị xuất đã trừ vào dòng định mức này.

---

## 3. API Endpoints

- `GET /api/v1/planning/monitoring`: Lấy bảng tổng hợp theo dõi định mức & % tiêu hao theo tháng.
- `GET /api/v1/planning/monitoring/{planId}/usage-history`: Lấy lịch sử chi tiết các phiếu xuất đã trừ vào định mức.
- `GET /api/v1/planning/monitoring/export-excel`: Xuất báo cáo đối soát định mức ra Excel.
