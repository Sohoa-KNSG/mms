# Phân tích Thiết kế Logic UC-11 (LOC-04) - Khóa & Mở Khóa Vị Trí Ô Kệ Phục Vụ Bảo Trì & Kiểm Kê

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Khóa & Mở Khóa Ô Kệ (LOC-04)** của Quản trị kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Cho phép Quản trị kho thực hiện thao tác Khóa (Lock) hoặc Mở khóa (Unlock) một hoặc hàng loạt Ô kệ theo Dãy/Tầng. Khi Ô kệ bị khóa, hệ thống tự động vô hiệu hóa việc cất hàng mới và lấy hàng từ ô kệ đó, đồng thời hiển thị biểu tượng ổ khóa trên sơ đồ 2D.
- **Endpoint:** `POST /api/v1/locations/lock-unlock`
- **SP:** `api.usp_WMS_LOC04_SetLocationLock_v1`

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
