# Phân tích Thiết kế Logic UC-03 (INB-01) - Tiếp Nhận Đơn Hàng Nhập Kho Theo PO Bravo

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Tiếp Nhận Đơn Hàng Theo PO Bravo (INB-01)** của Nhân viên tiếp nhận kho và Kế toán kho.

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
- Bảng danh sách PO Bravo trực quan, hiển thị tỷ lệ đã nhập (% Received), nút mở phiên tiếp nhận màu xanh Emerald.

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
| `dbo.WMS_UC03_ScanLog` / `tbl_scan_log` | - | **X** | **X** | - | Đọc log `VALID`, Cập nhật `TrangThaiScan = 'CONFIRMED'` |
| `dbo.tbl_po_bravo` | - | **X** | **X** | - | Cập nhật `TrangThaiPO = 'COMPLETED'` để ẩn khỏi hàng chờ nhập |
| `dbo.tbl_map_nhapkho` | **X** | **X** | **X** | - | Sinh bản ghi tồn kho vật lý (`status_kho = 'STORED'`, `status_qc = 'PASS'`) |
| `dbo.tbl_phieu_transaction` | **X** | **X** | - | - | Ghi Header chứng từ nhập kho Sổ Cái Kép (`nghiep_vu = 'INB_PO'`) |
| `dbo.inventory_ledger` / `tbl_transaction` | **X** | **X** | - | - | Ghi Detail hạch toán kho cấp Thùng/Lô |
| `dbo.item_ledger` | **X** | **X** | - | - | Ghi Detail hạch toán kho cấp Mã hàng SKU |
| `dbo.audit_log` | **X** | **X** | - | - | Ghi vết nhật ký truy cập kiểm toán hệ thống |

### 4.2. Định nghĩa Trạng thái (Conceptual State Model)

| Cột / Biến | Kiểu Dữ Liệu | Giá Trị Sau Confirm | Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `TrangThaiScan` (trong `tbl_scan_log`) | `NVARCHAR(30)` | `'CONFIRMED'` | Khóa cứng bản ghi log quét tạm, chuyển từ tạm thu sang chính thức |
| `TrangThaiPhieu` (trong `tbl_po_bravo`) | `NVARCHAR(50)` | `'COMPLETED'` | Đánh dấu hoàn tất dòng phiếu trên WMS, ẩn phiếu khỏi danh sách chờ nhập |
| `status_kho` (trong `tbl_map_nhapkho`) | `VARCHAR(20)` | `'STORED'` / `'AVAILABLE'` | Tồn kho vật lý sẵn sàng cho xuất hàng / phân bổ |
| `status_qc` (trong `tbl_map_nhapkho`) | `VARCHAR(20)` | `'PASS'` | Lô hàng đã được QC kiểm định đạt chuẩn |
| `stock_type` | `VARCHAR(20)` | `'UNRESTRICTED'` | Loại kho tự do sử dụng (không bị giữ quarantine/hỏng) |

### 4.3. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
erDiagram
    tbl_po_bravo ||--|{ tbl_map_nhapkho : "Tiep Nhan Lo Hang"
    tbl_dm_vattu ||--o{ tbl_map_nhapkho : "Thuoc SKU"
    tbl_dm_vitri_khe ||--o{ tbl_map_nhapkho : "Cat Vao Ke"
    tbl_phieu_transaction ||--|{ tbl_transaction : "Chung Tu Nhap"
    tbl_map_nhapkho ||--o{ tbl_transaction : "Phat Sinh Nhap"
```

- **Bảng Tiếp Nhận & Lô (`dbo.tbl_map_nhapkho`):**
  - Khóa chính: `id_nhapkho` (INT IDENTITY).
  - Trạng thái tiếp nhận: `status_kho` (`'RECEIVING'` $ightarrow$ `'ON_RACK'` $ightarrow$ `'STORED'`).
  - Trạng thái kiểm tra: `status_qc` (`'PENDING'` $ightarrow$ `'PASS'` / `'REJECT'`).

### 4.2. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
flowchart TD
    Start(["Thủ Kho Bấm: Xác Nhận Nhập Kho"]) --> Lock["BEGIN SQL TRANSACTION &<br/>Lock ScanLog WITH (UPDLOCK, HOLDLOCK)"]
    Lock --> Check1{"1. SoLuongDaQuetHopLe<br/>== SoLuongCanNhap?"}
    
    Check1 -- Không khớp --> Err1["Rollback & Return 400:<br/>Không đủ số lượng tiếp nhận"]
    Check1 -- Khớp 100% --> Check2{"2. Tất cả Lô hàng<br/>đạt status_qc == PASS?"}
    
    Check2 -- Chưa đạt --> Err2["Rollback & Return 400:<br/>Còn Lô chưa hoàn tất kiểm định QC"]
    Check2 -- Đạt 100% --> Check3{"3. Tất cả Lô hàng<br/>đã cất kệ status_kho == ON_RACK?"}
    
    Check3 -- Chưa cất --> Err3["Rollback & Return 400:<br/>Còn Lô chưa cất vào vị trí Ô kệ"]
    Check3 -- Đã cất kệ --> UpdStatus["Update tbl_map_nhapkho<br/>SET status_kho = 'STORED'"]
    
    UpdStatus --> PostLedger["Hạch toán Sổ Cái Kép<br/>Insert tbl_transaction (INB_PO)"]
    PostLedger --> ClosePO["Cập nhật số lượng nhập vào PO Bravo"]
    ClosePO --> Commit["COMMIT TRANSACTION &<br/>Return 200: InboundSuccess"]
    
    style Err1 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Err2 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Err3 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Commit fill:#d1fae5,stroke:#10b981,color:#065f46
    style Lock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)

### 5.1. Sơ Đồ Tuần Tự (Sequence Diagram)

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân Viên Tiếp Nhận
    participant UI as Receiving Web UI
    participant API as .NET 8 Web API
    participant DB as SQL Server (MMS DB)

    Staff->>UI: Quét số PO Bravo (PO-2026-088)
    UI->>API: GET /api/v1/receiving/po-orders/PO-2026-088
    API->>DB: EXEC api.usp_WMS_INB01_GetPoDetail_v1
    DB-->>API: Danh mục vật tư PO
    API-->>UI: 200 OK + PO Detail
    Staff->>UI: Bấm "Bắt đầu tiếp nhận"
    UI->>API: POST /api/v1/receiving/start-session
    API->>DB: Khởi tạo phiên tiếp nhận
    DB-->>API: SessionId=105, Status='RECEIVING'
    API-->>UI: 200 OK
    UI-->>Staff: Chuyển sang quét kiểm đếm & In tem nhãn (INB-03)
```

---

### 5.2. Data Flow Diagram: Luồng Xác Nhận Nhập Kho & Hạch Toán Sổ Cái (INB-06)

```mermaid
flowchart TD
    User["Thủ Kho Tiếp Nhận"]
    ReactUI["React UI (ReceivingConfirmModal.tsx)"]
    BackendAPI["Backend API (.NET 8)"]
    AuthCheck{"Token hợp lệ & Quyền quản lý nhập kho?"}
    PoCheck{"Đủ số lượng đã quét, status_qc == PASS & status_kho == ON_RACK?"}
    Http403["HTTP 403 Forbidden"]
    Http400["HTTP 400: Còn Lô chưa đạt QC / chưa cất kệ"]
    ProcessLock["Khóa ScanLog (UPDLOCK)<br/>Update status_kho = STORED & Hạch toán Sổ Cái Kép"]
    DB[("SQL Server (MMS DB)")]

    User -->|"1. Đối chiếu sản lượng thực nhận vs PO Bravo & Bấm Xác nhận"| ReactUI
    ReactUI -->|"2. Client check 100% khớp & Lock submitting"| ReactUI
    ReactUI -->|"3. Gọi API POST /api/v1/receiving/confirm-official"| BackendAPI
    
    BackendAPI -->|"4. Kiểm tra Auth"| AuthCheck
    AuthCheck -- Không --> Http403
    AuthCheck -- Có --> PoCheck
    
    PoCheck -- Không --> Http400
    PoCheck -- Hợp lệ --> ProcessLock
    
    ProcessLock -->|"5. Execute SP usp_WMS_INB06_ConfirmOfficialReceipt_v1"| DB
    DB -->|"6. COMMIT Transaction: Ghi Nợ/Có Sổ Cái Kép (INB_PO)"| DB
    DB -->|"7. Trả kết quả (ReceiptDocId, Status = STORED)"| BackendAPI
    
    BackendAPI -->|"8. Trả HTTP 200 OK"| ReactUI
    ReactUI -->|"9. Hiển thị Toast thành công & Bật cửa sổ in Phiếu Nhập Kho (PNK)"| User

    style Http403 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Http400 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style DB fill:#f3e8ff,stroke:#a855f7,color:#6b21a8
    style ProcessLock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```
