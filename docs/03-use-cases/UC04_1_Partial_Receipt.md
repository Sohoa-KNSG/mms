# Phân tích Thiết kế Logic UC04.1 - Nhập Lẻ & Sinh Thùng Ảo (Partial / Loose Receipt)

Tài liệu này đi sâu vào phân tích và thiết kế toàn diện hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Nhập Lẻ & Sinh Thùng Ảo (UC04.1)** - giải pháp tiếp nhận hàng hóa lẻ không nguyên thùng 60 trong Hệ thống WMS.

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

- **Thiết bị đích:** Máy tính để bàn (Desktop Web UI) cho Thủ kho và Máy tính bảng Tablet.
- **Yêu cầu trải nghiệm (UX Principles):**
  - **Nút Nhập lẻ có điều kiện (Conditional Render):** Nút **"Nhập lẻ"** (Màu cam/tím) chỉ xuất hiện ở các dòng chứng từ có `SoLuongCanNhap > SoLuongDaQuetHopLe`. Nút ẩn khi dòng đã quét đủ 100%.
  - **Modal Khai Báo Số Lượng Lẻ:** Modal hiển thị rõ ràng:
    - *Số lượng yêu cầu (Requirement Qty).*
    - *Số lượng chẵn đã quét (Scanned Valid Qty).*
    - *Số lượng lẻ còn thiếu (Suggested Loose Qty)* $\rightarrow$ Ô nhập tự động điền sẵn con số này.
  - **Cảnh báo lỗi nhập sai:** Nếu nhập số lượng lẻ khác số dư còn thiếu hoặc gõ số âm/thập phân, ô nhập báo viền Đỏ kèm thông báo: *"Số lượng lẻ khai báo phải bằng đúng phần dư còn thiếu"*.
  - **Phản hồi hoàn tất:** Hiển thị Badge tag **[Thùng Ảo: VIR-...]** kèm Banner thông báo *"Nhập lẻ thành công! Đã tự động tạo Thùng Ảo và hạch toán Sổ Cái Kép"*.

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

| Bảng / Thực thể Dữ Liệu | Create (Tạo) | Read (Đọc) | Update (Cập nhật) | Delete (Xóa) | Ý nghĩa nghiệp vụ trong UC04.1 |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `tbl_thung60_kho` | **X** | **X** | - | - | Khởi tạo bản ghi Thùng Ảo (`is_virtual = 1`, `unit_origin_type = 'RECEIPT_VIRTUAL'`) |
| `WMS_UC03_ScanLog` | **X** | **X** | - | - | Chèn bản ghi log `CONFIRMED` để đồng bộ tiến độ UI dòng phiếu |
| `WMS_PhieuNhap_DonHang_Map` | - | **X** | - | - | Đọc kế thừa `MaDonHang` OEM đã map ở UC02 |
| `stock_transaction_book` | **X** | **X** | - | - | Ghi Header chứng từ nhập lẻ (`transaction_type = 'RECEIPT_PARTIAL'`) |
| `inventory_ledger` | **X** | **X** | - | - | Ghi Detail hạch toán kho cấp Thùng Ảo (`VIR-...`) |
| `item_ledger` | **X** | **X** | - | - | Ghi Detail hạch toán kho cấp Mã hàng SKU |
| `thung60_event` | **X** | **X** | - | - | Ghi vết sự kiện vòng đời đầu tiên cho Thùng Ảo |

### 4.2. Định nghĩa Trạng thái (Conceptual State Model)

| Cột / Biến | Kiểu Dữ Liệu | Giá Trị Gán Cho Thùng Ảo | Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `id_60` / `qr_60` | `NVARCHAR(50)` | `VIR-[Phieu]-[Dong]-[HHmmss]` | Mã định danh thùng ảo bắt đầu bằng tiền tố `VIR-` |
| `is_virtual` | `BIT` / `BOOLEAN` | `1` (True) | Cờ xác nhận đây là Thùng Ảo do WMS tự sinh ra |
| `unit_origin_type` | `VARCHAR(30)` | `'RECEIPT_VIRTUAL'` | Loại nguồn gốc thùng: Sinh ra từ tiến trình Nhập Lẻ WMS |
| `status` | `VARCHAR(20)` | `'AVAILABLE'` | Trạng thái tồn kho khả dụng sẵn sàng xuất hàng |
| `stock_type` | `VARCHAR(20)` | `'UNRESTRICTED'` | Loại tồn kho tự do sử dụng không bị phong tỏa |

### 4.3. Phân tích Chi tiết Hạch Toán Sổ Cái Kép cho Thùng Ảo (Dual Ledger Virtual Box Analysis)
Khi thực hiện Nhập Lẻ tại UC04.1, thùng ảo được coi như một thực thể tồn kho đầy đủ tư cách trong Sổ Cái Kép:
1. **Header Transaction (`stock_transaction_book`):** Đánh dấu loại giao dịch riêng biệt `RECEIPT_PARTIAL` để phục vụ báo cáo kiểm toán và phân tách tỷ lệ hàng nguyên thùng vs hàng lẻ.
2. **Operational Detail (`inventory_ledger`):** Đổ dữ liệu biến động kho cấp thùng theo mã `VIR-...` giúp phân hệ Pick/Pack xuất hàng (UC16) sau này có thể chọn xuất chính xác thùng ảo chứa hàng lẻ mà không bị tắc nghẽn logic.
3. **Financial Accounting Detail (`item_ledger`):** Tăng tổng số lượng tồn kho kế toán cấp mã sản phẩm SKU tương ứng.

---

## 5. Biểu Đồ Thiết Kế (Diagrams)

### 5.1. Sequence Diagram (Luồng Nhập Lẻ & Sinh Thùng Ảo)

```mermaid
sequenceDiagram
    autonumber
    actor TK as Thủ Kho (Storekeeper)
    participant UI as React Frontend (StorekeeperConfirmOverview)
    participant API as Web API (.NET 8 / Node.js)
    participant SP as SQL SP (usp_WMS_UC04_1_ConfirmNhapLe)
    participant WMS as CSDL WMS1 (Ledger & Stock)

    TK->>UI: Phát hiện dòng thiếu -> Bấm nút "Nhập lẻ"
    UI->>UI: Hiển thị Modal Nhập Lẻ (Gợi ý số dư còn thiếu)
    TK->>UI: Nhập tên người đại diện & Bấm "Xác nhận nhập lẻ"
    UI->>API: POST /api/v1/receipt/confirm-nhap-le { handoverNo, lineNo, looseQty, partnerName }
    API->>SP: EXEC usp_WMS_UC04_1_ConfirmNhapLe @SoPhieuNhap, @MaChiTietPhieu, @SoLuongLe, @UserName, @PartnerName

    rect rgb(240, 248, 255)
        Note over SP,WMS: SQL Transaction (Fail-fast & Virtual Box Ledger Posting)
        SP->>WMS: 1. Check SoLuongLe == (SoLuongCanNhap - SoLuongDaQuetHopLe)?
        SP->>WMS: 2. Query MaDonHang OEM từ WMS_PhieuNhap_DonHang_Map (UC02)
        SP->>SP: 3. Sinh Mã Thùng Ảo (VIR-SoPhieuNhap-MaChiTietPhieu-HHmmss)
    end

    alt Số lượng lẻ không khớp phần dư
        SP-->>API: RAISERROR (Hủy Transaction)
        API-->>UI: HTTP 400 Bad Request { message: "Số lượng lẻ không khớp phần dư còn thiếu" }
        UI-->>TK: Hiển thị Banner Đỏ báo lỗi
    else Số lượng lẻ hợp lệ 100%
        SP->>WMS: INSERT INTO tbl_thung60_kho (id_60='VIR-...', is_virtual=1, unit_origin_type='RECEIPT_VIRTUAL')
        SP->>WMS: INSERT INTO WMS_UC03_ScanLog (TrangThaiScan='CONFIRMED')
        SP->>WMS: INSERT INTO stock_transaction_book (Header TX-IN-LE-..., RECEIPT_PARTIAL)
        SP->>WMS: INSERT INTO inventory_ledger (Detail Thùng Ảo VIR-...)
        SP->>WMS: INSERT INTO item_ledger (Detail SKU)
        SP->>WMS: INSERT INTO thung60_event (Event OFFICIAL_RECEIPT_POSTED)
        SP-->>API: Transaction Committed (OK)
        API-->>UI: HTTP 200 OK { message: "Nhập lẻ thành công (đã sinh Thùng Ảo)" }
        UI->>UI: Tải lại dòng phiếu (Cập nhật tiến độ thành 100% Xanh)
        UI-->>TK: Hiển thị Toast Xanh thành công
    end
```

---

### 5.2. Data Layer Architecture (Data Flow & Virtual Box Posting)

```mermaid
flowchart TD
    Start([Thủ Kho Bấm: Xác Nhận Nhập Lẻ]) --> CheckInput{1. SoLuongLe == Số Lượng Cần Nhập - Số Lượng Đã Quét?}
    
    CheckInput -- Không khớp --> ERR1[Rollback & Return 400: Số lượng lẻ phải bằng phần dư còn thiếu]
    
    CheckInput -- Khớp 100% --> QueryOEM[Query MaDonHang OEM từ WMS_PhieuNhap_DonHang_Map]
    QueryOEM --> GenVirId[Generate Virtual Box ID: VIR-SoPhieuNhap-MaChiTietPhieu-HHmmss]
    
    GenVirId --> InsertVirStock[INSERT INTO tbl_thung60_kho:<br/>id_60 = VIR-...<br/>is_virtual = 1<br/>unit_origin_type = 'RECEIPT_VIRTUAL'<br/>status = 'AVAILABLE']
    
    InsertVirStock --> InsertScanLog[INSERT INTO WMS_UC03_ScanLog:<br/>TrangThaiScan = 'CONFIRMED']
    InsertScanLog --> PostTxHeader[INSERT INTO stock_transaction_book:<br/>transaction_type = 'RECEIPT_PARTIAL']
    
    PostTxHeader --> PostInvLedger[INSERT INTO inventory_ledger:<br/>id_60 = VIR-...]
    PostInvLedger --> PostItemLedger[INSERT INTO item_ledger:<br/>product_code = SKU]
    
    PostItemLedger --> PostEvent[INSERT INTO thung60_event:<br/>event_type = 'OFFICIAL_RECEIPT_POSTED']
    
    PostEvent --> CommitTx[COMMIT SQL TRANSACTION]
    CommitTx --> End([Return HTTP 200 OK: Sinh Thùng Ảo & Hạch Toán Sổ Cái Kép Hoàn Tất])

    classDef valid fill:#d4edda,stroke:#28a745,stroke-width:2px;
    classDef invalid fill:#f8d7da,stroke:#dc3545,stroke-width:2px;
    
    class End valid;
    class ERR1 invalid;
```

---

### 5.3. Entity Relationship & State Logic Map (ERD Map UC04.1)

```mermaid
erDiagram
    tbl_thung60_kho ||--o{ thung60_event : "sinh vết sự kiện vòng đời"
    stock_transaction_book ||--o{ inventory_ledger : "chứa chi tiết hạch toán thùng ảo"
    stock_transaction_book ||--o{ item_ledger : "chứa chi tiết hạch toán SKU"

    tbl_thung60_kho {
        string id_60 PK "VIR-[Phieu]-[Dong]-[HHmmss]"
        string qr_60 "VIR-[Phieu]-[Dong]-[HHmmss]"
        string product_code
        decimal current_qty "SoLuongLe"
        string status "'AVAILABLE'"
        string stock_type "'UNRESTRICTED'"
        boolean is_virtual "1 (Thùng Ảo)"
        string unit_origin_type "'RECEIPT_VIRTUAL'"
        string receipt_session_no
        string current_oem_order_no
    }

    WMS_UC03_ScanLog {
        bigint ScanLogID PK
        string SoPhieuNhap
        string MaChiTietPhieu
        string MaThung60 "VIR-..."
        string TrangThaiScan "'CONFIRMED'"
        datetime ConfirmedAt
        string ConfirmedBy
    }

    stock_transaction_book {
        string transaction_id PK "TX-IN-LE-..."
        string transaction_type "'RECEIPT_PARTIAL'"
        string document_no
        string partner_unit
        string posted_by
    }

    inventory_ledger {
        bigint ledger_id PK
        string id_60 FK "VIR-..."
        string product_code
        string transaction_id FK
        decimal quantity_change "SoLuongLe"
        string new_stock_type "'UNRESTRICTED'"
    }

    item_ledger {
        bigint item_ledger_id PK
        string product_code
        string transaction_id FK
        decimal total_quantity_change "SoLuongLe"
    }

    thung60_event {
        guid event_id PK
        string id_60 FK "VIR-..."
        string event_type "'OFFICIAL_RECEIPT_POSTED'"
        string new_status "'AVAILABLE'"
        decimal new_qty "SoLuongLe"
        string performed_by
    }
```

---

## 4. Data Logic & Schema Model (Thiết kế Dữ Liệu Chuyên Sâu)

### 4.1. Entity Relationship Diagram (ERD) & Schema Details
```mermaid
erDiagram
    tbl_dm_user ||--o{ tbl_sec_user_roles : "Co Vai Tro"
    tbl_sec_roles ||--|{ tbl_sec_role_screens : "Phan Quyen Man Hinh"
    tbl_dm_user ||--o{ tbl_sec_audit_log : "Ghi Vet Nhat Ky"
```

- **Bảng Người Dùng (`dbo.tbl_dm_user`):** `user_n` (PK), `msnv`, `hoten`, `matkhau`, `status_active`.
- **View Phân Quyền (`api.vw_SEC_UserScreenAccess_v1`):** Ánh xạ `UserId` $ightarrow$ `ScreenCode`.

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
| Trạng Thái User | Thao Tác | Trạng Thái Sau | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **`ACTIVE (1)`** | Đăng nhập thành công (AUTH-01) | Sinh JWT Cookie (8h) | Truy cập các màn hình được cấp quyền |
| **`ACTIVE (1)`** | Khóa tài khoản (ADM-01) | `INACTIVE (0)` | Chặn đăng nhập và thu hồi token tức thì |
