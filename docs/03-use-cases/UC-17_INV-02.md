# Phân tích Thiết kế Logic UC-17 (INV-02) - Tra Cứu Tồn Kho Chi Tiết Theo Lô (Batch) & Hạn Sử Dụng

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Tra Cứu Tồn Kho Chi Tiết Theo Lô (INV-02)** của Thủ kho và KCS/QC.

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

- **Thiết bị đích:** Máy tính Desktop Web & Thiết bị cầm tay Handheld PDA.
- **Yêu cầu trải nghiệm (UX Principles):**
  - **Badge trạng thái chất lượng sắc nét:**
    - `PASS`: Badge xanh lá đậm (`bg-emerald-100 text-emerald-800`).
    - `REJECT`: Badge đỏ (`bg-rose-100 text-rose-800`).
    - `PENDING`: Badge vàng cam (`bg-amber-100 text-amber-800`).

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

## 4. Data Logic (Thiết kế Dữ Liệu)

### 4.1. Ma trận phân quyền CRUD

| Bảng / Thực thể Dữ Liệu | Create (Tạo) | Read (Đọc) | Update (Cập nhật) | Delete (Xóa) | Ý nghĩa nghiệp vụ trong Use Case |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `dbo.tbl_map_nhapkho` (Lô Mẹ) | - | **X** | **X** | - | Đọc thông tin Lô gốc, Cập nhật trừ số lượng tách (`so_luong = so_luong - @SplitQty`) |
| `dbo.tbl_map_nhapkho` (Lô Con) | **X** | **X** | - | - | Sinh bản ghi Lô con mới (`parent_batch_id = Id_Lo_Me`, `status_qc = 'PASS'`) |
| `dbo.tbl_dm_vitri_khe` | - | **X** | **X** | - | Đọc vị trí Ô kệ, Cập nhật trạng thái khóa/mở khóa bảo trì |
| `dbo.tbl_kiemke_header` | **X** | **X** | **X** | - | Tạo đợt kiểm kê, Cập nhật trạng thái `status = 'IN_PROGRESS' / 'RECONCILED'` |
| `dbo.tbl_kiemke_detail` | **X** | **X** | **X** | - | Ghi nhận số thực đếm `actual_qty`, tính toán độ lệch `variance` |
| `dbo.tbl_transaction` | **X** | **X** | - | - | Ghi nhận bút toán biến động (`SPLIT_BATCH`, `TRANSFER`, `ADJUST_COUNT`) |
| `dbo.audit_log` | **X** | **X** | - | - | Ghi vết kiểm toán lịch sử tách Lô và chốt sổ cái kiểm kê |

### 4.2. Định nghĩa Trạng thái (Conceptual State Model)

| Cột / Biến | Kiểu Dữ Liệu | Giá Trị Sau Confirm | Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `parent_batch_id` (trong `tbl_map_nhapkho`) | `INT` | `ID_Lo_Me` | Liên kết phả hệ Lô Mẹ - Lô Con trong Cây Gia Phả (Genealogy Tree) |
| `status` (trong `tbl_kiemke_header`) | `NVARCHAR(20)` | `'IN_PROGRESS'` / `'RECONCILED'` | Trạng thái kỳ kiểm kê (Đang đếm mù thực địa / Đã chốt điều chỉnh Sổ Cái) |
| `trang_thai_ton` (trong `tbl_batch_inv`) | `NVARCHAR(10)` | `'1'` (`'AVAILABLE'`) | Tồn kho vật lý sẵn sàng cho xuất hàng / phân bổ |
| `status_qc` (trong `tbl_map_nhapkho`) | `VARCHAR(20)` | `'PASS'` | Trạng thái chất lượng đạt chuẩn |
| `status_kho` (trong `tbl_map_nhapkho`) | `VARCHAR(20)` | `'STORED'` | Đã lưu kho chính thức trên dầm kệ |

### 4.3. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
erDiagram
    tbl_dm_vattu ||--o{ tbl_map_nhapkho : "Quan Ly Ton Lo"
    tbl_dm_vitri_khe ||--o{ tbl_map_nhapkho : "Luu Tru Tai Ke"
    tbl_map_nhapkho ||--o{ tbl_transaction : "Phat Sinh Bien Dong"
    tbl_kiemke_header ||--|{ tbl_kiemke_detail : "Chua Chi Tiet Kiem Dem"
    tbl_map_nhapkho ||--o{ tbl_kiemke_detail : "Doi Soat Snapshot"
```

- **Bảng Quản Lý Tồn Lô (`dbo.tbl_map_nhapkho` / `dbo.tbl_batch_inv`):**
  - Khóa chính: `id_nhapkho` (INT IDENTITY, Clustered Index).
  - Tự tham chiếu Lô Mẹ: `parent_batch_id` (INT NULL) phục vụ dựng Cây Gia Phả.
  - Vị trí Ô kệ: `id_vitri_khe` (VARCHAR(20), FK).
  - Trạng thái kiểm định: `status_qc` (`'PASS'`, `'REJECT'`, `'PENDING'`).
  - Trạng thái lưu kho: `status_kho` (`'STORED'`, `'ON_RACK'`, `'QUARANTINE'`).
  - Chỉ mục: `IX_tbl_map_nhapkho_vattu` on `(id_vattu, status_qc, status_kho) INCLUDE (so_luong, id_vitri_khe)`.

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

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)

### 5.1. Sơ Đồ Tuần Tự (Sequence Diagram & SP Execution Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Người Dùng Hệ Thống
    participant UI as React UI Component
    participant API as Backend API (.NET 8)
    participant DB as SQL Server (MMS DB)

    User->>UI: 1. Thao tác trên giao diện & Bấm xác nhận
    UI->>UI: 2. Client-side validate & Lock submitting
    UI->>API: 3. Gửi Request API (HTTP POST/PUT/GET) kèm Token JWT
    
    API->>API: 4. Middleware Auth: Verify Token & Screen Access Claim
    API->>DB: 5. EXEC api.usp_WMS_Command_v1 @UserId, @Params
    
    activate DB
    Note over DB: BƯỚC 1: SET XACT_ABORT ON & Kiểm tra quyền màn hình
    Note over DB: BƯỚC 2: BEGIN TRANSACTION & Khóa dữ liệu mục tiêu (UPDLOCK, HOLDLOCK)
    Note over DB: BƯỚC 3: Kiểm tra điều kiện nghiệp vụ Fail-fast
    Note over DB: BƯỚC 4: Thực thi biến động CSDL & Ghi Sổ Cái Kép
    Note over DB: BƯỚC 5: Ghi nhật ký kiểm toán Audit Log (UserId, IP, Time)
    Note over DB: BƯỚC 6: COMMIT TRANSACTION & Trả Result Set
    DB-->>API: 6. Recordset: Status='SUCCESS', Data=JSON
    deactivate DB

    API-->>UI: 7. HTTP 200 OK (ApiResponse<T>)
    UI->>UI: 8. Phát âm thanh phản hồi, cập nhật State & Hiển thị thông báo
    UI-->>User: 9. Hoàn tất thao tác, điều hướng hoặc làm mới bảng dữ liệu
```

---

### 5.2. Data Flow Diagram: Luồng Xử Lý Dữ Liệu Khép Kín (Data Flow Diagram - DFD)

```mermaid
flowchart TD
    User["Người Dùng Hệ Thống"]
    ReactUI["React UI Component"]
    BackendAPI["Backend API (.NET 8)"]
    AuthCheck{"Token hợp lệ & Đúng quyền màn hình?"}
    ValidateCheck{"Dữ liệu đầu vào & Trạng thái nghiệp vụ hợp lệ?"}
    Http403["HTTP 403 Forbidden"]
    Http400["HTTP 400 Bad Request"]
    ProcessLock["Khóa dữ liệu mục tiêu (UPDLOCK)<br/>Thực thi biến động & Ghi Sổ Cái Kép"]
    DB[("SQL Server (MMS DB)")]

    User -->|"1. Thao tác nghiệp vụ trên giao diện"| ReactUI
    ReactUI -->|"2. Client validate & Lock submitting"| ReactUI
    ReactUI -->|"3. Gửi Request API (JSON DTO)"| BackendAPI
    
    BackendAPI -->|"4. Kiểm tra Middleware Auth & Screen Claim"| AuthCheck
    AuthCheck -- Không --> Http403
    AuthCheck -- Có --> ValidateCheck
    
    ValidateCheck -- Không --> Http400
    ValidateCheck -- Hợp lệ --> ProcessLock
    
    ProcessLock -->|"5. Bắt đầu DB Transaction & Execute SP"| DB
    DB -->|"6. COMMIT Transaction & Ghi Audit Log"| DB
    DB -->|"7. Trả kết quả (Recordset / StatusCode)"| BackendAPI
    
    BackendAPI -->|"8. Trả HTTP 200 OK"| ReactUI
    ReactUI -->|"9. Refresh dữ liệu, phát âm thanh & Hiển thị thông báo"| User

    style Http403 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Http400 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style DB fill:#f3e8ff,stroke:#a855f7,color:#6b21a8
    style ProcessLock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```
