# Phân tích Thiết kế Logic UC04.1 - Nhập Lẻ & Sinh Thùng Ảo (Partial / Loose Receipt)

Tài liệu này đi sâu vào phân tích và thiết kế toàn diện hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Nhập Lẻ & Sinh Thùng Ảo (UC04.1)** - giải pháp tiếp nhận hàng hóa lẻ không nguyên thùng 60 trong Hệ thống WMS.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Cung cấp công cụ cho Thủ kho để khai báo và tiếp nhận số lượng hàng lẻ chưa có tem QR thùng vật lý từ xưởng sản xuất. Hệ thống đóng gói số lượng lẻ đó vào một **"Thùng 60 Ảo" (Virtual Box)** có mã định danh bắt đầu bằng `VIR-`, quản trị đồng nhất với các thùng vật lý nguyên đai nguyên kiện, và kích hoạt bút toán hạch toán **Sổ Cái Kép (Dual Ledger)** với loại giao dịch `RECEIPT_PARTIAL`.

- **Các quy tắc nghiệp vụ (Business Rules):**
  - `BR-UC04.1-01` **Ràng buộc kiểm tra số lượng khớp 100% (Strict Loose Qty Match):** Số lượng nhập lẻ (`@SoLuongLe`) do Thủ kho nhập vào phải là **SỐ NGUYÊN** lớn hơn 0 và **bắt buộc phải BẰNG ĐÚNG** số lượng còn thiếu của dòng chứng từ (`SoLuongCanNhap - SoLuongDaQuetHopLe`). Nghiêm cấm nhập dư, nhập thiếu hoặc nhập số thập phân.
  - `BR-UC04.1-02` **Kế thừa thông tin Đơn hàng OEM (Order Inheritance):** Mặc dù hàng lẻ không có tem vạch đóng gói từ xưởng, hệ thống tự động truy xuất và kế thừa thông tin `MaDonHang` OEM và `MaKhachHang` từ bảng ánh xạ UC02 (`WMS_PhieuNhap_DonHang_Map`). Thùng ảo sinh ra vẫn thuộc về đúng đơn hàng OEM giống như thùng thật.
  - `BR-UC04.1-03` **Định danh & Thực thể Thùng Ảo (Virtual Box Entity):** Thùng ảo sinh ra có `is_virtual = 1`, `unit_origin_type = 'RECEIPT_VIRTUAL'`, mã `id_60` dạng `VIR-[SoPhieuNhap]-[MaChiTietPhieu]-[HHmmss]`. Thùng ảo không tồn tại bên CSDL Packaging nhưng "sống" trong WMS để phục vụ quản lý tồn kho và xuất hàng sau này.
  - `BR-UC04.1-04` **Hạch toán Sổ Cái Kép (Dual Ledger Posting):** Thùng ảo sinh ra được hạch toán chính thức vào `stock_transaction_book` (`transaction_type = 'RECEIPT_PARTIAL'`), `inventory_ledger` (chi tiết thùng ảo), `item_ledger` (chi tiết sản phẩm SKU) và `thung60_event` (`OFFICIAL_RECEIPT_POSTED`).
  - `BR-UC04.1-05` **Đồng bộ ScanLog & Hoàn tất Dòng phiếu:** Tự động chèn 1 bản ghi vào `WMS_UC03_ScanLog` với trạng thái `CONFIRMED` đại diện cho thùng ảo, giúp thanh tiến độ dòng phiếu ngay lập tức đạt 100% để mở khóa cho Thủ kho chốt tổng toàn phiếu (UC04).
  - `BR-UC04.1-06` **Ràng buộc quản lý theo Phiếu & Mã Sản Phẩm (Document & SKU Binding):** Mọi thao tác Nhập lẻ tuyệt đối không xử lý tự do trôi nổi mà **luôn luôn gắn liền và được quản lý theo đúng Mã Phiếu Nhập Kho (`SoPhieuNhap`) và Mã Sản Phẩm (`MaSanPham`)** của dòng chứng từ tương ứng. Mã Thùng Ảo sinh ra tuân thủ cấu trúc định danh `VIR-[SoPhieuNhap]-[MaChiTietPhieu]-[HHmmss]`, đồng thời lưu vết `receipt_session_no = SoPhieuNhap`, `product_code = MaSanPham`, `current_oem_order_no = MaDonHang` để phục vụ truy xuất nguồn gốc (Traceability) 100% tới từng chứng từ giao kho.

- **Quy trình tương tác 5 bước (Interaction Flow):**
  - **Bước 1:** Thủ kho mở màn hình chi tiết phiếu chờ (`StorekeeperConfirmOverview.jsx`), phát hiện dòng hàng bị thiếu hụt số lượng do hàng lẻ.
  - **Bước 2:** Thủ kho bấm nút **"Nhập lẻ"** trên dòng chưa đủ số lượng.
  - **Bước 3:** Giao diện Modal hiển thị số lượng lẻ gợi ý còn thiếu (`SoLuongCanNhap - SoLuongDaQuetHopLe`) và yêu cầu nhập tên người đại diện giao/nhận.
  - **Bước 4:** Thủ kho đối chiếu và bấm **"Xác nhận nhập lẻ"**. Backend tiếp nhận `POST /api/v1/receipt/confirm-nhap-le` và thực thi SP `usp_WMS_UC04_1_ConfirmNhapLe`.
  - **Bước 5:** Backend kiểm tra số lượng khớp 100%, sinh thùng ảo `VIR-...`, chèn vào `tbl_thung60_kho`, hạch toán Sổ Cái Kép và trả về `SUCCESS`. Giao diện tự động cập nhật tiến độ dòng thành 100% (Xanh).

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

### 4.2. Data Flow & Transaction Locking Matrix
- **Xác thực phiên:** Truy vấn nhanh không khóa (`NOLOCK`) trên `vw_SEC_UserScreenAccess_v1` và ghi log an toàn vào `tbl_sec_audit_log`.

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái User | Thao Tác | Trạng Thái Sau | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **`ACTIVE (1)`** | Đăng nhập thành công (AUTH-01) | Sinh JWT Cookie (8h) | Truy cập các màn hình được cấp quyền |
| **`ACTIVE (1)`** | Khóa tài khoản (ADM-01) | `INACTIVE (0)` | Chặn đăng nhập và thu hồi token tức thì |
