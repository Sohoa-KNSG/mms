# Phân tích Thiết kế Logic UC-11 (LOC-01) - Quản Lý Danh Mục 540 Vị Trí Ô Kệ, Dãy, Tầng & Cột Kho

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Quản Lý Danh Mục Vị Trí Ô Kệ (LOC-01)** của Quản trị hệ thống và Quản lý kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Đảm bảo thực thi quy trình nghiệp vụ chuẩn hóa, kiểm soát tính toàn vẹn của dữ liệu và tuân thủ các quy định vận hành kho vật tư & sản xuất của nhà máy Kềm Nghĩa.

- **Các quy tắc nghiệp vụ (Business Rules):**
  - `BR-GEN-01` **Ràng buộc xác thực & Phân quyền (Security & Access Control):** Người dùng bắt buộc phải có phiên đăng nhập hợp lệ và quyền màn hình tương ứng trong `api.vw_SEC_UserScreenAccess_v1`.
  - `BR-GEN-02` **Kiểm tra tính toàn vẹn dữ liệu đầu vào (Input Validation):** Mọi tham số gửi lên API đều phải được chuẩn hóa, trim khoảng trắng và kiểm tra định dạng trước khi thực thi.
  - `BR-GEN-03` **Tính nguyên tử của giao dịch (Atomic Transaction):** Mọi thao tác ghi biến động đều được thực thi trong khối `BEGIN TRANSACTION` với `SET XACT_ABORT ON`, tự động Rollback khi có lỗi.
  - `BR-GEN-04` **Khóa đồng thời chống xung đột dữ liệu (Concurrency Control):** Áp dụng gợi ý khóa `WITH (UPDLOCK, HOLDLOCK)` trên các bảng dữ liệu trọng yếu.
  - `BR-GEN-05` **Hạch toán biến động vào Sổ Cái Kép (Dual Ledger Posting):** Mọi biến động kho đều được ghi nhận vào sổ chi tiết `tbl_transaction` và cập nhật thẻ kho tổng hợp.
  - `BR-GEN-06` **Đồng bộ thời gian thực (Realtime Synchronization):** Đảm bảo tính nhất quán dữ liệu giữa Desktop Web, Handheld PDA và TV Wallboard.
  - `BR-GEN-07` **Ghi vết nhật ký kiểm toán (Audit Trail):** Tự động lưu vết người thực hiện, thời gian, IP và thiết bị cho mọi giao dịch quan trọng.

- **Quy trình tương tác 5 bước (Interaction Flow):**
  - **Bước 1:** Người dùng truy cập phân hệ chức năng tương ứng trên giao diện Web / PDA.
  - **Bước 2:** Nhập liệu các trường thông tin bắt buộc hoặc quét mã Barcode từ thiết bị.
  - **Bước 3:** Frontend validate client-side và gửi request API kèm Token xác thực.
  - **Bước 4:** Backend kiểm tra Fail-fast (Verify JWT $ightarrow$ Verify Screen Permission $ightarrow$ Validate Business Rules $ightarrow$ Execute SQL Stored Procedure trong khối Transaction).
  - **Bước 5:** Backend cập nhật CSDL và trả về kết quả; Frontend hiển thị thông báo thành công, phát âm thanh phản hồi và cập nhật giao diện.

---

## 2. Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)
- Bảng danh mục ô kệ đa tầng, hiển thị tỷ lệ lấp đầy dung tích (% Occupancy), nút in tem Barcode ô kệ.

---

## 3. Programming Logic (Logic Lập Trình)

Quy trình xử lý mã lệnh được chia thành 2 lớp rõ rệt: **Frontend (React)** và **Backend (ASP.NET Core kết hợp SQL Stored Procedure)**.

### 3.1. Frontend (React - Component View)
- **State Management & Local Processing:**
  - Gọi API kéo dữ liệu cần thiết vào React State.
  - Sử dụng các hàm mảng JavaScript (`filter`, `map`, `reduce`) để xử lý gom nhóm, lọc tìm kiếm in-memory, tối ưu hóa băng thông và tạo trải nghiệm mượt mà không độ trễ.
- **UI Interaction & Ergonomics:**
  - Sử dụng cấu trúc Collapse / Accordion / Modal xem trước để tối ưu không gian hiển thị trên màn hình Handheld PDA và Desktop Web.

### 3.2. Backend (ASP.NET Core & SQL Server Stored Procedure)
- **Thin API Gateway Pattern:**
  - ASP.NET Core Minimal API / Controller không xử lý logic tính toán nghiệp vụ mà chỉ làm cổng Gateway mỏng (Xác thực JWT Cookie, kiểm tra quyền màn hình `vw_SEC_UserScreenAccess_v1`) và ủy thác toàn bộ cho SQL Server Stored Procedure.
- **Tận Dụng Multi-Result Set & ACID Transaction:**
  - SQL Stored Procedure trả về đồng thời nhiều Result Sets (Header info, Summary KPIs, Detailed Lines) trong một lần truy vấn duy nhất.
  - Các lệnh ghi dữ liệu áp dụng `SET XACT_ABORT ON`, `BEGIN TRANSACTION` và khóa dòng dữ liệu `WITH (UPDLOCK, HOLDLOCK)` đảm bảo an toàn tuyệt đối.

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

### 4.2. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
flowchart TD
    Start(["Người Dùng Bấm: Xác Nhận Thao Tác"]) --> Lock["BEGIN SQL TRANSACTION &<br/>Lock Target Rows WITH (UPDLOCK, HOLDLOCK)"]
    Lock --> Check1{"1. Người dùng có quyền<br/>truy cập màn hình chức năng?"}
    
    Check1 -- Không có quyền --> Err1["Rollback & Return 403:<br/>Forbidden Access"]
    Check1 -- Hợp lệ --> Check2{"2. Dữ liệu đầu vào hợp lệ<br/>& đúng trạng thái nghiệp vụ?"}
    
    Check2 -- Không hợp lệ --> Err2["Rollback & Return 400:<br/>Invalid State / Data Constraint"]
    Check2 -- Hợp lệ --> Execute["Thực thi biến động dữ liệu &<br/>Ghi nhận nhật ký Sổ Cái Kép"]
    
    Execute --> Audit["Ghi nhật ký Audit Log (UserId, IP, Time)"]
    Audit --> Commit["COMMIT TRANSACTION &<br/>Return 200: OperationSuccess"]
    
    style Err1 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Err2 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Commit fill:#d1fae5,stroke:#10b981,color:#065f46
    style Lock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái Ô Kệ | Thao Tác Kích Hoạt | Trạng Thái Sau | Ảnh Hưởng Thuật Toán Cất Kệ |
| :--- | :--- | :--- | :--- |
| **`ACTIVE (1)`** | Bấm Khóa bảo trì / Kiểm kê (LOC-04) | `LOCKED (0)` | Bị loại khỏi gợi ý cất kệ INB-04 |
| **`LOCKED (0)`** | Bấm Mở khóa hoạt động (LOC-04) | `ACTIVE (1)` | Sẵn sàng tiếp nhận hàng lưu trữ |

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Quản Lý Kho
    participant UI as Locations Web UI
    participant API as .NET 8 Web API
    participant DB as SQL Server (MMS DB)

    Admin->>UI: Thêm mới / Chỉnh sửa thông số Ô kệ K01-T2-01
    UI->>API: POST /api/v1/locations
    API->>DB: EXEC api.usp_WMS_LOC01_SaveLocation_v1
    DB-->>API: 200 OK
    API-->>UI: 200 OK
    UI-->>Admin: Lưu thành công, cập nhật sơ đồ mặt đứng 2D
```
