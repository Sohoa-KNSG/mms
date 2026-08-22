# Phân tích Thiết kế Logic UC-11 (LOC-02) - Sơ Đồ Trực Quan 2D Mặt Đứng Kho Theo Ô Kệ (2D Warehouse Elevation Map)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Sơ Đồ 2D Trực Quan Mặt Đứng Kho (LOC-02)** của Thủ kho và Ban Giám Đốc.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Trực quan hóa toàn bộ 540 ô kệ thành bản đồ 2D mặt đứng tương tác (Interactive Elevation Grid) theo từng Dãy kệ (Dãy A, Dãy B, Dãy C...). Thể hiện trực quan theo mã màu heatmap: Ô còn trống (Xanh lá), Ô chứa 50-80% (Vàng), Ô đầy tải 100% (Đỏ), Ô bị khóa (Xám). Cho phép click vào từng ô trên sơ đồ để xem danh sách các Lô hàng và SKU đang nằm bên trong.
- **Endpoint:** `GET /api/v1/locations/elevation-map`
- **SP:** `api.usp_WMS_LOC02_GetElevationMap_v1`

---

## 4. Data Logic & Schema Model (Thiết kế Dữ Liệu Chuyên Sâu)

### 4.1. Entity Relationship Diagram (ERD) & Schema Details
```mermaid
erDiagram
    tbl_dm_vitri_khe ||--o{ tbl_map_nhapkho : "Chua Cac Lo Hang"
    tbl_dm_vitri_khe {
        varchar id_vitri_khe PK "Ma O ke K01-T2-01"
        nvarchar khu_vuc "Khu K"
        int day "Day 01"
        int tang "Tang 2"
        int cot "Cot 01"
        decimal max_weight "Tai trong toi da kg"
        decimal max_volume "The tich toi da m3"
        int status_active "1:Hoat dong, 0:Khoa"
    }
```

### 4.2. Data Flow & Transaction Locking Matrix
- **Khóa Ô kệ bảo trì:** Khi khóa Ô kệ (`status_active = 0`), hệ thống khóa `UPDLOCK` để đảm bảo không có lệnh cất hàng hoặc lấy hàng nào đang ở trạng thái in-flight.

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái Ô Kệ | Thao Tác Kích Hoạt | Trạng Thái Sau | Ảnh Hưởng Thuật Toán Cất Kệ |
| :--- | :--- | :--- | :--- |
| **`ACTIVE (1)`** | Bấm Khóa bảo trì / Kiểm kê (LOC-04) | `LOCKED (0)` | Bị loại khỏi gợi ý cất kệ INB-04 |
| **`LOCKED (0)`** | Bấm Mở khóa hoạt động (LOC-04) | `ACTIVE (1)` | Sẵn sàng tiếp nhận hàng lưu trữ |
