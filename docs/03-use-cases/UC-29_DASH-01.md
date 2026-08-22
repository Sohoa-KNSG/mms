---
title: "Phân tích Thiết kế Logic UC-29 / DASH-01 - Dashboard Trực Quan Vận Hành Kho Hiển Thị Tivi Giám Sát"
use_case_id: "UC-29"
system_use_case_id: "DASH-01"
version: "1.0"
date: "2026-08-22"
status: "Đã thiết kế & triển khai trên MMS1"
format: "Markdown - nguồn giao tiếp chuẩn"
---

# Phân tích Thiết kế Logic UC-29 (DASH-01) – Dashboard Trực Quan Vận Hành Kho Hiển Thị Tivi (Live WMS Operations TV Wallboard)

> **Mục tiêu tài liệu:** Đặc tả toàn diện 3 tầng logic (Business Logic, Programming Logic, Data Logic) của phân hệ Dashboard màn hình lớn / Tivi giám sát vận hành kho thời gian thực kết nối trực tiếp CSDL `MMS1`.

## Thông tin kiểm soát tài liệu

| Thuộc tính | Giá trị |
| :--- | :--- |
| **Mã Use Case Nghiệp Vụ** | `UC-29` |
| **Mã Quản Lý Triển Khai** | `DASH-01` (Live TV Operations Wallboard & Cockpit) |
| **Tên chức năng** | Dashboard trực quan toàn bộ vận hành kho hiển thị Tivi |
| **Tác nhân chính** | Ban Giám Đốc, Trưởng Phòng Kho, Quản Đốc Phân Xưởng, Thủ Kho, Nhân Viên Kho |
| **Mục đích sử dụng** | Trình chiếu 24/7 trên Tivi phòng điều hành, cửa kho và trung tâm xưởng |
| **Route React** | `/dashboard/tv` hoặc mở Modal Fullscreen TV Mode từ `/dashboard` |
| **Nhóm triển khai** | W0 - Core Visualization & Operations Cockpit |

---

## 1. Business Logic (Logic Nghiệp Vụ)

### 1.1. Bối cảnh & Mục đích
Tại nhà máy Kềm Nghĩa, hoạt động kho diễn ra liên tục với khối lượng giao dịch lớn giữa Kho Vật Tư Chính và các phân xưởng sản xuất (Rèn Dập, Cắt Dây CNC, Mài, Xi Mạ, Đóng Gói). Để đảm bảo dòng chảy thông tin thông suốt và phản ứng kịp thời với các điểm nghẽn, hệ thống cần một **Màn hình Tivi Giám Sát Vận Hành Kho Thời Gian Thực (TV Wallboard)**.

Màn hình này phục vụ các mục đích chính:
1. **Minh bạch hóa dòng vật tư**: Mọi nhân viên và cấp quản lý đều thấy được khối lượng công việc đang chờ (Chờ QC, Chờ cất kệ, Chờ duyệt đề nghị xuất, Đang soạn hàng).
2. **Cảnh báo điểm nghẽn tức thời (Live Bottlenecks)**: Phát hiện nhanh các đơn hàng tồn đọng quá lâu hoặc các kệ chứa sắp quá tải (> 90%).
3. **Theo dõi nhịp độ xuất nhập (Throughput)**: Thể hiện biểu đồ xuất nhập theo từng khung giờ trong ngày, giúp điều phối nhân sự linh hoạt giữa ca 1 và ca 2.
4. **Trực quan hóa độ lấp đầy kệ kho**: Nắm bắt tỷ lệ sử dụng không gian kho theo từng dãy kệ A, B, C, D, E.
5. **Dòng sự kiện thực địa liên tục (Live Activity Stream)**: Hiển thị các sự kiện nhập kho, quét tem PDA, xuất kho PXX vừa phát sinh.

### 1.2. 5 Trụ Cột Thông Tin Trên Màn Hình Tivi

```
+---------------------------------------------------------------------------------------------------+
|  [LOGO MMS]  KỀM NGHĨA WMS - BẢNG ĐIỀU HÀNH KHO VẬT TƯ (TV WALLBOARD)    [14:35:10 - CA 1] [LIVE] |
+---------------------------------------------------------------------------------------------------+
|  [ INBOUND / NHẬP KHO ]  |  [ OUTBOUND / XUẤT KHO ]  |  [ STORAGE / KỆ KHO ]  |  [ QC & KIỂM KÊ ] |
|  - Tổng phiếu hôm nay    |  - Tổng đề nghị hôm nay   |  - Tỷ lệ lấp đầy %     |  - Tỷ lệ QC Pass% |
|  - Chờ kiểm tra QC       |  - Chờ Quản đốc duyệt     |  - Vị trí kệ trống/đầy |  - Tiến độ kiểm kê|
|  - Chờ nhập vào kệ       |  - Đang soạn hàng (Pick)  |  - Cảnh báo tồn min/max|  - Lô đã kiểm đếm |
+---------------------------------------------------------------------------------------------------+
|  [ BIỂU ĐỒ XUẤT NHẬP THEO GIỜ ]                  |  [ MA TRẬN DÃY KỆ & CƠ CẤU TỒN KHO ]           |
|  - Cột Inbound vs Outbound qua các khung giờ     |  - Tỷ lệ lấp đầy Dãy A, B, C, D, E             |
|  - Xu hướng cao điểm trong ngày                  |  - Donut chart: Kim loại, Đá mài, Hóa chất...  |
+---------------------------------------------------------------------------------------------------+
|  [ DÒNG SỰ KIỆN GIAO DỊCH THỰC ĐỊA GẦN NHẤT (TICKER) ]                                            |
|  - 14:34: [XUẤT KHO] Soạn xong PXK-20260822-014 cho NM1_Rèn Dập (500 Kg Thép C45)               |
|  - 14:30: [NHẬP KHO] Tiếp nhận Lô hàng PO-88291 Nhà cung cấp Thép Việt Nhật (2.5 Tấn)            |
|  - 14:25: [QC PASS] Đạt chuẩn AQL 100% Lô Inox SUS420J2 (#BAT-20260822-09)                       |
+---------------------------------------------------------------------------------------------------+
```

### 1.3. Yêu Cầu Thiết Kế Chuyên Biệt Cho Tivi
- **Tối ưu hiển thị khoảng cách xa**: Chữ to, font số đậm (`font-mono font-extrabold`), độ tương phản cao trên nền tối than chì (`slate-950`).
- **Không cần thao tác (Zero-interaction)**: Tự động tải lại dữ liệu định kỳ mỗi 15 giây (Auto-refresh) không chớp màn hình.
- **Thanh trạng thái sống (Live Status Pulse)**: Có đèn tín hiệu nhấp nháy xanh thể hiện kết nối máy chủ CSDL MMS1 ổn định.
- **Hỗ trợ Fullscreen F11 1 chạm**: Nút chuyển chế độ toàn màn hình ẩn toàn bộ thanh cuộn, thanh địa chỉ duyệt web.

---

## 2. Programming Logic (Logic Lập Trình)

### 2.1. Kiến Trúc Backend (.NET Minimal API)

```
apps/api/Modules/Dashboard/
├── DashboardContracts.cs   # DTOs: TvDashboardOverview, HourlyThroughput, RackOccupancy, LiveEvent
├── DashboardGateway.cs     # SQL Aggregation Queries kết nối CSDL MMS
└── DashboardEndpoints.cs   # GET /api/v1/dashboard/tv-overview
```

### 2.2. API Contract Specification

#### `GET /api/v1/dashboard/tv-overview`
**Response Body:**
```json
{
  "serverTime": "2026-08-22T09:15:00+07:00",
  "shiftName": "Ca 1 (06:00 - 14:00)",
  "inbound": {
    "todayReceipts": 12,
    "pendingQc": 3,
    "pendingPutaway": 5,
    "completedToday": 4,
    "totalReceivedQty": 15420.5
  },
  "outbound": {
    "todayRequests": 28,
    "pendingApproval": 6,
    "pickingInProgress": 4,
    "issuedToday": 18,
    "totalIssuedQty": 8950.0
  },
  "storage": {
    "totalLocations": 450,
    "occupiedLocations": 368,
    "emptyLocations": 82,
    "occupancyRate": 81.8,
    "rackGroups": [
      { "groupCode": "A", "groupName": "Khu Kim Loại & Phôi", "total": 100, "occupied": 92, "rate": 92.0 },
      { "groupCode": "B", "groupName": "Khu Khuôn Gá & Đá Mài", "total": 120, "occupied": 98, "rate": 81.7 },
      { "groupCode": "C", "groupName": "Khu Hóa Chất & Xi Mạ", "total": 80, "occupied": 65, "rate": 81.3 },
      { "groupCode": "D", "groupName": "Khu Bao Bì & Đóng Gói", "total": 90, "occupied": 68, "rate": 75.6 },
      { "groupCode": "E", "groupName": "Khu Phụ Tùng Bảo Trì", "total": 60, "occupied": 45, "rate": 75.0 }
    ]
  },
  "quality": {
    "inspectionsToday": 8,
    "passedCount": 7,
    "rejectedCount": 1,
    "passRate": 87.5
  },
  "cycleCount": {
    "activePlans": 2,
    "countedBatchesToday": 45,
    "accuracyRate": 99.2
  },
  "hourlyThroughput": [
    { "hourLabel": "06:00", "inbound": 1200, "outbound": 450 },
    { "hourLabel": "08:00", "inbound": 3500, "outbound": 1800 },
    { "hourLabel": "10:00", "inbound": 4200, "outbound": 2600 },
    { "hourLabel": "12:00", "inbound": 1500, "outbound": 1100 },
    { "hourLabel": "14:00", "inbound": 5020, "outbound": 3000 }
  ],
  "recentActivities": [
    {
      "id": 10291,
      "type": "OUTBOUND",
      "title": "Xuất kho vật tư",
      "description": "Xuất 200 Kg Thép C45 cho [PX01] Rèn Dập",
      "badge": "PXK-9018",
      "time": "14:32",
      "actor": "Trần Quốc Hưng"
    }
  ]
}
```

---

## 3. Data Logic (Logic Dữ Liệu CSDL MMS1)

### 3.1. Các bảng CSDL tham chiếu
1. **Nhập kho**:
   - `dbo.tbl_phieu_nhanhang` (Phiếu nhận)
   - `dbo.tbl_chitiet_nhanhang` (Chi tiết & Trạng thái QC `ket_qua_qc`)
2. **Xuất kho**:
   - `dbo.tbl_phieu_yeucau` (Phiếu đề nghị xuất)
   - `dbo.tbl_phieu_yeucau_chitiet` (Chi tiết vật tư & số lượng)
3. **Vị trí Kệ & Tồn kho**:
   - `dbo.tbl_dm_location` (Danh mục vị trí kệ)
   - `dbo.tbl_batch_inv` (Tồn kho theo lô và vị trí)
4. **Biến động thực địa**:
   - `dbo.tbl_transaction` (Biến động xuất/nhập/tách lô)
   - `dbo.tbl_batch_event` (Nhật ký sự kiện lô)
