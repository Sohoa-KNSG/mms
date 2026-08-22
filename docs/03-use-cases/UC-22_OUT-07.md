# Phân tích Thiết kế Logic UC-22 (OUT-07) - Quét Barcode & Soạn Hàng Theo Lô (Batch) Trên Thiết Bị Cầm Tay (PDA)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Quét Barcode & Soạn Hàng Theo Lô Tại Ô Kệ (OUT-07)** của Nhân viên kho sử dụng thiết bị cầm tay PDA.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Hướng dẫn nhân viên kho di chuyển chính xác đến từng vị trí Ô kệ (`locationCode`), quét Barcode Lô hàng (`BatchId`), kiểm tra tính hợp lệ về mặt chủng loại vật tư, trạng thái kiểm định QC (`PASS`) và số lượng khả dụng. Sau đó cho phép nhân viên nhập sản lượng lấy thực tế, ghi nhận giao dịch trừ tồn kho tức thời vào bảng `tbl_transaction` (`nghiep_vu = 'OUT_CON'`) và map với dòng đề nghị `tbl_map_xuatkho`.

- **Các quy tắc nghiệp vụ (Business Rules):**
  - `BR-OUT-07-01` **Xác thực mã vạch Lô hàng (Batch Barcode Verification):** Quét mã vạch trên thùng/pallet phải khớp 100% với mã SKU của món đang yêu cầu nhặt và đúng vị trí Ô kệ quy định.
  - `BR-OUT-07-02` **Kiểm soát chất lượng Lô xuất (QC Status Gate):** Tuyệt đối cấm nhặt các Lô có `status_qc = 'REJECT'`, `'PENDING'` hoặc Lô đang bị khóa kiểm kê (`trang_thai_ton <> '1'`).
  - `BR-OUT-07-03` **Kiểm soát số lượng lấy (Picking Quantity Constraints):** Số lượng lấy mỗi lần `<= Số lượng tồn thực tế của Lô` và `Tổng số lượng đã lấy <= Số lượng duyệt của phiếu đề nghị`.
  - `BR-OUT-07-04` **Ghi nhận giao dịch xuất kho nguyên tử (Atomic Inventory Deduction):** Trừ tồn `tbl_batch_inv`, chèn dòng `tbl_transaction` (`OUT_CON`), chèn liên kết `tbl_map_xuatkho` trong 1 Transaction khép kín.
  - `BR-OUT-07-05` **Chuyển tiếp lộ trình tự động (Seamless Step-by-step Route):** Sau khi nhặt đủ số lượng của món hiện tại, hệ thống tự động phát âm thanh hoàn thành và chuyển hướng sang vị trí Ô kệ của món tiếp theo.
  - `BR-OUT-07-06` **Chống xuất âm kho (Non-negative Stock Protection):** Nếu số lượng tồn của Lô không đủ để lấy, hệ thống từ chối và yêu cầu nhặt tiếp từ Lô phụ.
  - `BR-OUT-07-07` **Ghi vết thao tác quét (Scan Audit Trail):** Ghi nhận `UserId`, `DeviceId` của máy quét PDA và thời điểm quét chính xác từng giây.

- **Quy trình tương tác 5 bước (Interaction Flow):**
  - **Bước 1:** Nhân viên nhìn màn hình PDA (`HandheldPage.tsx`) để biết vị trí Ô kệ cần đến (ví dụ: `K01-T2-01`) và thông tin vật tư cần lấy.
  - **Bước 2:** Di chuyển đến Ô kệ, dùng đầu đọc laser PDA quét mã Barcode dán trên thùng/Lô.
  - **Bước 3:** PDA tự động điền thông tin Lô, hiển thị tồn khả dụng và tự động đề xuất số lượng cần lấy. Nhân viên điều chỉnh số lượng thực tế và bấm **"Xác Nhận Lấy Hàng"**.
  - **Bước 4:** Backend kiểm tra Fail-fast: (Verify JWT $ightarrow$ Verify Open Issue Doc $ightarrow$ Check SKU Match $ightarrow$ Check QC Status $ightarrow$ Check Available Batch Qty $ightarrow$ Deduct `tbl_batch_inv` $ightarrow$ Insert `tbl_transaction` $ightarrow$ Insert `tbl_map_xuatkho` $ightarrow$ Execute SP `usp_WMS_OUT07_PickBatch_v1`).
  - **Bước 5:** Backend cập nhật CSDL và trả về kết quả thành công. Frontend phát âm thanh `Success Beep`, cập nhật tiến độ nhặt hàng và chuyển sang món tiếp theo (hoặc kích hoạt OUT-08 nếu đã xong 100%).

---

## 2. Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)

- **Thiết bị đích:** Thiết bị cầm tay Handheld PDA (Honeywell / Zebra / Point Mobile), màn hình cảm ứng điện dung, hỗ trợ phím cứng quét mã vạch vật lý.
- **Yêu cầu trải nghiệm (UX Principles):**
  - **Chỉ dẫn vị trí trực quan cỡ lớn:** Vị trí Ô kệ mục tiêu (`📍 VỊ TRÍ KỆ: K01-T2-01`) được hiển thị với kích thước font 24px đậm, tương phản cao trên nền sáng/tối để nhân viên dễ đọc từ khoảng cách 1-2 mét.
  - **Thẻ thông tin vật tư sắc nét:** Hiển thị tên vật tư, mã SKU, quy cách, ảnh đại diện (nếu có), số lượng yêu cầu và thanh tiến độ hoàn thành dạng phần trăm (`Progress Bar`).
  - **Ô nhập số lượng thông minh:** Tự động Focus vào ô số lượng sau khi quét Barcode thành công; tích hợp 2 nút `[ - ]` và `[ + ]` cỡ lớn (touch target >= 48px) để thao tác bằng một tay khi đang đeo găng tay bảo hộ.
  - **Phản hồi âm thanh & Haptic:**
    - Âm thanh "Bíp" ngân cao + rung nhẹ khi quét đúng Lô.
    - Âm thanh "Buzz" trầm + rung giật 3 hồi khi quét sai Lô hoặc số lượng vượt quá tồn.

---

## 3. Programming Logic (Logic Lập Trình)

Quy trình xử lý mã lệnh được chia thành 2 lớp: **Frontend (React)** và **Backend (ASP.NET Core kết hợp SQL Stored Procedure)**.

### 3.1. Frontend (React - HandheldPage.tsx)
- **State Management & Step Progression:**
  - Quản lý trạng thái dòng nhặt hiện tại qua `pickingItemIndex`. Sau khi xác nhận nhặt thành công món $N$, hệ thống tự động tăng `pickingItemIndex + 1` và tự động điền số lượng cần lấy của món tiếp theo.
  - Tự động Focus vào ô nhập số lượng hoặc đầu đọc quét Barcode sau mỗi bước, loại bỏ thao tác chạm tay không cần thiết.
- **Audio Feedback & Visual Indicators:**
  - Tích hợp `soundManager.playSuccessBeep()` cho quét đúng và `soundManager.playErrorBuzzer()` cho quét sai Lô.

### 3.2. Backend (ASP.NET Core - OutboundPickingEndpoints.cs & SQL Server)
- **API POST /api/v1/outbound-picking/requests/{id}/lines/{lineId}/pick:**
  - C# đẩy toàn bộ logic trừ tồn và ghi nhật ký xuống SQL Stored Procedure `api.usp_WMS_OUT07_PickBatch_v1`.
  - SP thực thi trong khối `BEGIN TRANSACTION` với `UPDLOCK, HOLDLOCK`, tự động trừ tồn `tbl_batch_inv`, chèn `tbl_transaction` (`OUT_CON`) và map với `tbl_map_xuatkho`.

---

## 4. Data Logic (Thiết kế Dữ Liệu)

### 4.1. Ma trận phân quyền CRUD

| Bảng / Thực thể Dữ Liệu | Create (Tạo) | Read (Đọc) | Update (Cập nhật) | Delete (Xóa) | Ý nghĩa nghiệp vụ trong Use Case |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `dbo.tbl_phieu_yeucau` | - | **X** | **X** | - | Đọc thông tin đề nghị, Cập nhật `status_soanhang = '1'/'2'`, `time_cre`, `time_soan_xong` |
| `dbo.tbl_phieu_yeucau_chitiet` | - | **X** | - | - | Đọc danh mục vật tư SKU, quy cách và số lượng yêu cầu |
| `dbo.tbl_phieu_transaction` | **X** | **X** | **X** | - | Sinh Header chứng từ xuất kho Sổ Cái Kép (`nghiep_vu = 'OUT_CON'`), Cập nhật `trang_thai_phieu = '2'` |
| `dbo.tbl_batch_inv` / `tbl_map_nhapkho` | - | **X** | **X** | - | Trừ số lượng tồn kho vật lý khả dụng của Lô hàng (`so_luong = so_luong - @PickQty`) |
| `dbo.tbl_transaction` | **X** | **X** | - | - | Ghi Detail hạch toán xuất kho cấp Lô / Thùng vào Sổ Cái Kép |
| `dbo.tbl_map_xuatkho` | **X** | **X** | - | - | Ghi nhận quan hệ so khớp giữa dòng yêu cầu và bản ghi giao dịch xuất |
| `dbo.inventory_ledger` | **X** | **X** | - | - | Ghi Detail hạch toán kho cấp Thùng / Pallet |
| `dbo.item_ledger` | **X** | **X** | - | - | Ghi Detail hạch toán kho cấp Mã hàng SKU tổng hợp |
| `dbo.audit_log` | **X** | **X** | - | - | Ghi vết nhật ký truy cập kiểm toán hệ thống (`UserId`, `ClientIP`, `Time`) |

### 4.2. Định nghĩa Trạng thái (Conceptual State Model)

| Cột / Biến | Kiểu Dữ Liệu | Giá Trị Sau Confirm | Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `trang_thai_phieu` (trong `tbl_phieu_yeucau`) | `NVARCHAR(10)` | `'4'` / `'5'` | Đánh dấu phiếu đề nghị đã được phê duyệt hợp lệ, sẵn sàng chuyển cho Thủ kho soạn hàng |
| `status_soanhang` (trong `tbl_phieu_yeucau`) | `NVARCHAR(10)` | `'1'` (Đang soạn) / `'2'` (Đã soạn) | Hiển thị trạng thái soạn hàng realtime trên PDA và TV Dashboard |
| `trang_thai_phieu` (trong `tbl_phieu_transaction`) | `NVARCHAR(10)` | `'2'` (`'COMPLETED'`) | Khóa cứng chứng từ xuất kho WMS, đóng sổ không cho chèn thêm dòng |
| `status_qc` (trong `tbl_map_nhapkho`) | `VARCHAR(20)` | `'PASS'` / `'PASS_CHO_NHAP'` | Lô hàng đạt tiêu chuẩn chất lượng, mở khóa cho phép xuất dùng sản xuất |
| `trang_thai_ton` (trong `tbl_batch_inv`) | `NVARCHAR(10)` | `'1'` (`'AVAILABLE'`) | Tồn kho vật lý sẵn sàng cho xuất hàng / không bị khóa kiểm kê |
| `stock_type` | `VARCHAR(20)` | `'UNRESTRICTED'` | Loại kho tự do sử dụng (không bị giữ trong khu cách ly/quarantine) |

### 4.3. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
erDiagram
    tbl_phieu_yeucau ||--|{ tbl_phieu_yeucau_chitiet : "Chua Cac Dong Vat Tu"
    tbl_phieu_yeucau ||--o{ tbl_phieu_transaction : "Sinh Chung Tu Xuat"
    tbl_phieu_transaction ||--|{ tbl_transaction : "Ghi Nhat Ky Xuat"
    tbl_map_nhapkho ||--o{ tbl_transaction : "Tru Ton Kho Lo"
    tbl_phieu_yeucau_chitiet ||--o{ tbl_map_xuatkho : "So Khop San Luong"
    tbl_transaction ||--o{ tbl_map_xuatkho : "Map Giao Dich"
```

- **Bảng Header (`dbo.tbl_phieu_yeucau`):**
  - Khóa chính: `id_phieu_yeucau` (INT IDENTITY, Clustered Index).
  - Trạng thái duyệt: `trang_thai_phieu` (`'0'`: Hủy, `'1'`: Chờ duyệt, `'3'`: QĐ duyệt, `'4'`: Sẵn sàng xuất, `'5'`: Hoàn tất duyệt).
  - Trạng thái soạn hàng: `status_soanhang` (`'0'`: Chờ soạn, `'1'`: Đang soạn, `'2'`: Đã soạn xong, `'3'`: Đã nhận tại xưởng).
  - Chỉ mục: `IX_tbl_phieu_yeucau_status` on `(trang_thai_phieu, status_soanhang) INCLUDE (time_duyet, time_cre, bo_phan)`.
- **Bảng Chi tiết (`dbo.tbl_phieu_yeucau_chitiet`):**
  - Khóa chính: `id_chitiet_phieu` (INT IDENTITY), Khóa ngoại: `id_phieu_yeucau`, `id_vattu`.

### 4.2. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
flowchart TD
    Start(["Nhân Viên PDA: Bấm Xác Nhận Lấy Hàng"]) --> Lock["BEGIN SQL TRANSACTION &<br/>Lock tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)"]
    Lock --> Check1{"1. Mã Barcode Lô khớp 100%<br/>với mã SKU đang nhặt?"}
    
    Check1 -- Không khớp --> Err1["Rollback & Return 400:<br/>Sai mã vật tư Barcode"]
    Check1 -- Khớp SKU --> Check2{"2. status_qc == PASS &<br/>trang_thai_ton == 1?"}
    
    Check2 -- Không đạt --> Err2["Rollback & Return 400:<br/>Lô không đạt QC hoặc đang khóa"]
    Check2 -- Đạt chuẩn --> Check3{"3. Số lượng lấy <= Tồn khả dụng<br/>của Lô tại Ô kệ?"}
    
    Check3 -- Vượt tồn --> Err3["Rollback & Return 400:<br/>Không đủ tồn kho để lấy"]
    Check3 -- Hợp lệ --> StepDeduct["Trừ tồn kho Lô trong tbl_batch_inv<br/>SET so_luong = so_luong - @PickQty"]
    
    StepDeduct --> StepInsTrans["Insert tbl_transaction<br/>(nghiep_vu = 'OUT_CON', id_batch, so_luong)"]
    StepInsTrans --> StepInsMap["Insert tbl_map_xuatkho<br/>(id_trans, id_chitiet_phieu)"]
    StepInsMap --> Commit["COMMIT TRANSACTION &<br/>Return 200: PickSuccess"]
    
    style Err1 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Err2 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Err3 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Commit fill:#d1fae5,stroke:#10b981,color:#065f46
    style Lock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)

### 5.1. Sơ Đồ Tuần Tự (Sequence Diagram & SP Execution Flow)

```mermaid
sequenceDiagram
    autonumber
    actor User as Nhân Viên Quét PDA
    participant UI as React UI (Handheld Picking View)
    participant API as Backend API (.NET 8)
    participant DB as SQL Server (MMS DB)

    User->>UI: 1. Quét Barcode Lô & Nhập số lượng lấy thực tế
    UI->>UI: 2. Validate số lượng > 0 & Lock submit button
    UI->>API: 3. POST /api/v1/outbound-picking/.../pick (BatchId, PickQty)
    
    API->>API: 4. Verify Auth, Screen Access & Request Session
    API->>DB: 5. EXEC api.usp_WMS_OUT07_PickBatch_v1 @UserId, @RequestId, @LineId, @BatchId, @PickQty
    
    activate DB
    Note over DB: BƯỚC 1: SET XACT_ABORT ON & BEGIN TRANSACTION
    Note over DB: BƯỚC 2: Khóa dòng Lô tồn kho mục tiêu<br/>SELECT ... FROM dbo.tbl_batch_inv WITH (UPDLOCK, HOLDLOCK)
    Note over DB: BƯỚC 3: Kiểm tra SKU khớp, status_qc == PASS & Tồn đủ<br/>IF @AvailableQty < @PickQty THROW 51008, 'Khong du ton'...
    Note over DB: BƯỚC 4: Trừ tồn kho Lô vật lý<br/>UPDATE dbo.tbl_batch_inv SET so_luong = so_luong - @PickQty
    Note over DB: BƯỚC 5: Ghi Sổ Cái Kép xuất kho<br/>INSERT INTO dbo.tbl_transaction (nghiep_vu = 'OUT_CON')
    Note over DB: BƯỚC 6: Ghi nhận ánh xạ dòng yêu cầu<br/>INSERT INTO dbo.tbl_map_xuatkho (id_trans, id_chitiet_phieu)
    Note over DB: BƯỚC 7: COMMIT TRANSACTION & Trả kết quả thành công
    DB-->>API: 6. Recordset: TransactionId=8892, PickSuccess=1
    deactivate DB

    API-->>UI: 7. HTTP 200 OK (ApiResponse<PickResponse>)
    UI->>UI: 8. Phát Success Beep, cập nhật tiến độ dòng nhặt (+1)
    UI-->>User: 9. Chuyển vị trí Ô kệ tiếp theo / Kích hoạt hoàn tất
```

---

### 5.2. Data Flow Diagram: Luồng Quét Barcode & Trừ Tồn Kho Lô (OUT-07)

```mermaid
flowchart TD
    User["Nhân Viên Quét PDA"]
    ReactUI["React UI (Handheld Picking View)"]
    BackendAPI["Backend API (.NET 8)"]
    AuthCheck{"Token PDA hợp lệ & Thuộc ca làm việc?"}
    BatchCheck{"Lô quét khớp SKU, status_qc == PASS<br/>& Số lượng lấy <= Tồn khả dụng?"}
    Http403["HTTP 403 Forbidden"]
    Http400["HTTP 400 Bad Request: Sai Lô / Hết tồn"]
    ProcessLock["Khóa Lô tbl_batch_inv (UPDLOCK)<br/>Trừ tồn kho & Chèn tbl_transaction"]
    DB[("SQL Server (MMS DB)")]

    User -->|"1. Quét Barcode Lô & Nhập số lượng lấy"| ReactUI
    ReactUI -->|"2. Client check số lượng > 0 & Lock nút lấy"| ReactUI
    ReactUI -->|"3. Gọi API POST /api/v1/outbound-picking/.../pick"| BackendAPI
    
    BackendAPI -->|"4. Kiểm tra Auth & Request State"| AuthCheck
    AuthCheck -- Không --> Http403
    AuthCheck -- Có --> BatchCheck
    
    BatchCheck -- Không --> Http400
    BatchCheck -- Hợp lệ --> ProcessLock
    
    ProcessLock -->|"5. Execute SP usp_WMS_OUT07_PickBatch_v1"| DB
    DB -->|"6. COMMIT Transaction: Trừ tồn & Map tbl_map_xuatkho"| DB
    DB -->|"7. Trả kết quả (TransactionId, PickSuccess)"| BackendAPI
    
    BackendAPI -->|"8. Trả HTTP 200 OK"| ReactUI
    ReactUI -->|"9. Phát tiếng Beep, tăng số đếm & Chuyển vị trí tiếp theo"| User

    style Http403 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Http400 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style DB fill:#f3e8ff,stroke:#a855f7,color:#6b21a8
    style ProcessLock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```
