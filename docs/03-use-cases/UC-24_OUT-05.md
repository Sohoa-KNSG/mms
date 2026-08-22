# Phân tích Thiết kế Logic UC-24 (OUT-05) - Phê Duyệt Đề Nghị Xuất Kho Đa Cấp (Quản Đốc / Ban Giám Đốc)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Phê Duyệt Đề Nghị Xuất Kho Đa Cấp (OUT-05)** của Quản Đốc Phân Xưởng, Trưởng Phòng Sản Xuất và Ban Giám Đốc.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Cung cấp phân hệ phê duyệt chuyên biệt dành cho cấp quản lý để thẩm định, xét duyệt hoặc từ chối các phiếu đề nghị xuất kho (`tbl_phieu_yeucau`). Hỗ trợ cơ chế phê duyệt 2 cấp linh hoạt: Cấp 1 (Quản đốc phân xưởng duyệt `trang_thai_phieu = '3'`) và Cấp 2 (Ban Giám Đốc phê duyệt cuối cùng `trang_thai_phieu = '4'` hoặc `'5'`). Khi được phê duyệt, phiếu lập tức xuất hiện trên hàng đợi soạn hàng của Thủ kho (`OUT-06`).

- **Các quy tắc nghiệp vụ (Business Rules):**
  - `BR-OUT-05-01` **Phân quyền phê duyệt theo vai trò (Role-based Approval Rights):**
    - Quản đốc phân xưởng (`role_manager`, `truongphong`): Phê duyệt các phiếu xuất trong định mức (`phan_loai = 'trong'`) và thẩm định bước 1 các phiếu xuất ngoài định mức/vượt định mức (`trang_thai_phieu = '3'`).
    - Ban Giám Đốc / Ban Tổng Giám Đốc (`role_director`, `bgd`): Phê duyệt cấp cuối cùng cho các phiếu vượt định mức (`phan_loai = 'vuot'`) hoặc phiếu xuất đột xuất giá trị lớn (`trang_thai_phieu = '4'` hoặc `'5'`).
  - `BR-OUT-05-02` **Cơ chế Từ chối phiếu (Rejection Rules):**
    - Khi từ chối, người duyệt bắt buộc phải nhập lý do từ chối vào trường `ghi_chu_duyet`.
    - Hệ thống cập nhật `trang_thai_phieu = '0'` (Từ chối/Hủy), gửi thông báo lý do về cho người lập phiếu.
  - `BR-OUT-05-03` **Tính toàn vẹn của giao dịch phê duyệt (Atomic Approval):**
    - Khi phê duyệt, hệ thống cập nhật `time_duyet = GETDATE()`, `nguoi_duyet = @UserId`, `status_soanhang = '0'` (Sẵn sàng soạn hàng).
    - Phiếu ngay lập tức được đẩy vào hàng đợi thời gian thực của màn hình Tivi Dashboard và thiết bị PDA.

- **Quy trình tương tác 5 bước (Interaction Flow):**
  - **Bước 1:** Quản đốc / Ban Giám Đốc đăng nhập vào phân hệ "Phê Duyệt Đề Nghị Xuất Kho" (`/approval/outbound`).
  - **Bước 2:** Xem danh sách các phiếu đang chờ duyệt (`trang_thai_phieu = '1'` hoặc `'3'`).
  - **Bước 3:** Nhấn vào một phiếu để xem toàn bộ thông tin chi tiết: Lệnh sản xuất, danh mục vật tư, số lượng yêu cầu, lý do giải trình.
  - **Bước 4:** Chọn hành động:
    - Bấm **"Phê Duyệt Đề Nghị"** (Màu xanh lá Emerald).
    - Bấm **"Từ Chối Đề Nghị"** (Màu đỏ Rose, nhập lý do từ chối).
  - **Bước 5:** Backend gọi SP `api.usp_WMS_OUT05_ApproveRequest_v1`, cập nhật trạng thái phiếu và ghi log audit.

---

## 2. Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)

- **Thiết bị đích:** Máy tính Desktop Web, Tablet & Mobile Responsive (Dành cho Lãnh đạo duyệt nhanh trên điện thoại).
- **Yêu cầu trải nghiệm (UX Principles):**
  - **Thẻ phiếu tóm tắt trực quan (Approval Card View):**
    - Nổi bật: Tên phân xưởng, Tổng giá trị / Tổng sản lượng, Mã LSX, Lý do đề nghị.
    - Cảnh báo trực quan nếu là phiếu vượt định mức `[ ⚠ VƯỢT ĐỊNH MỨC ]`.
  - **2 Nút hành động dứt khoát:**
    - Nút **`[ ✓ PHÊ DUYỆT ĐỀ NGHỊ ]`**: Gradient xanh Emerald (`from-emerald-600 to-teal-700`).
    - Nút **`[ ✕ TỪ CHỐI ]`**: Màu đỏ viền nổi, bật hộp thoại nhập lý do.

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

### 4.2. Data Flow & Transaction Locking Matrix
- **Cơ chế khóa đồng thời:** Stored Procedure áp dụng `SET XACT_ABORT ON` và `BEGIN TRANSACTION`.
- **Khóa dòng dữ liệu:** Sử dụng `WITH (UPDLOCK, HOLDLOCK)` trên `tbl_phieu_yeucau` và `tbl_batch_inv` để ngăn chặn hiện tượng Lost Update và xuất âm tồn kho khi nhiều nhân viên PDA thao tác đồng thời.
- **Rollback an toàn:** Bắt lỗi `CATCH` tự động kiểm tra `IF XACT_STATE() <> 0 ROLLBACK TRANSACTION` và ném lỗi nghiệp vụ kèm mã lỗi chuẩn.

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái Ban Đầu | Hành Động / Trigger | Trạng Thái Sau Chuyển Đổi | Bảng CSDL Bị Cập Nhật |
| :--- | :--- | :--- | :--- |
| **DRAFT / Mới tạo** | Gửi đề nghị xuất (OUT-01/02/03) | `trang_thai_phieu = '1'`, `status_soanhang = '0'` | `tbl_phieu_yeucau` |
| **`trang_thai_phieu = '1'`** | Phê duyệt cấp 1 / 2 (OUT-05) | `trang_thai_phieu = '4'`, `status_soanhang = '0'` | `tbl_phieu_yeucau` (`time_duyet = Now`) |
| **`status_soanhang = '0'`** | Bấm Bắt đầu soạn (OUT-06) | `status_soanhang = '1'` | `tbl_phieu_yeucau`, chèn `tbl_phieu_transaction` |
| **`status_soanhang = '1'`** | Nhặt đủ 100% món (OUT-08) | `status_soanhang = '2'` | `tbl_phieu_yeucau`, `tbl_phieu_transaction` |
| **`status_soanhang = '2'`** | Xưởng ký nhận vật tư (OUT-09) | `status_soanhang = '3'` | `tbl_phieu_yeucau` |

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)

```mermaid
sequenceDiagram
    autonumber
    actor Manager as Quản Đốc / Ban Giám Đốc
    participant UI as Approval Web / Mobile UI
    participant API as .NET 8 Web API
    participant DB as SQL Server (MMS DB)

    Manager->>UI: Mở danh sách phiếu chờ duyệt
    UI->>API: GET /api/v1/outbound-requests/pending-approval
    API->>DB: Truy vấn tbl_phieu_yeucau (trang_thai_phieu IN ('1', '3'))
    DB-->>API: Danh sách phiếu chờ duyệt
    API-->>UI: 200 OK
    Manager->>UI: Xem chi tiết phiếu & Bấm "Phê Duyệt"
    UI->>API: POST /api/v1/outbound-requests/9025/approve
    API->>DB: EXEC api.usp_WMS_OUT05_ApproveRequest_v1
    Note over DB: Update trang_thai_phieu = '4'<br/>Update status_soanhang = '0'<br/>Update time_duyet = Now
    DB-->>API: Success
    API-->>UI: 200 OK
    UI-->>Manager: Thông báo duyệt thành công, phiếu xuất hiện trên hàng đợi PDA (OUT-06)
```
