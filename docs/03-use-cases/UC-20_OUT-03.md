# Phân tích Thiết kế Logic UC-20 (OUT-03) - Đăng Ký Đề Nghị Xuất Kho Vượt Định Mức (Over-Planning)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Đăng Ký Đề Nghị Xuất Kho Vượt Định Mức (OUT-03)** của Nhân viên Phân xưởng / Kế hoạch sản xuất.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Cho phép phân xưởng lập phiếu đề nghị xuất bổ sung vật tư khi lượng vật tư cấp phát theo BOM đã dùng hết nhưng do tỷ lệ hao hụt phôi lỗi, hư hỏng trong quá trình dập nguội/mài/nhiệt luyện vượt mức dự kiến (`tbl_phieu_yeucau`, `phan_loai = 'vuot'`). Phiếu này gắn chặt với Lệnh Sản Xuất gốc và bắt buộc phải qua quy trình phê duyệt nghiêm ngặt của Quản đốc và Ban Giám Đốc.

- **Các quy tắc nghiệp vụ (Business Rules):**
  - `BR-OUT-03-01` **Liên kết Lệnh Sản Xuất gốc (Mandatory Root LSX Linkage):**
    - Phiếu xuất vượt định mức bắt buộc phải tham chiếu đến một Lệnh Sản Xuất (`ma_lenh_san_xuat` hoặc `planningUnit`) đang chạy.
    - Hệ thống tính toán và hiển thị: *Tổng định mức gốc vs Lượng đã xuất thực tế vs Lượng vượt định mức xin cấp thêm*.
  - `BR-OUT-03-02` **Giải trình nguyên nhân hao hụt (Mandatory Defect Justification):**
    - Người lập phiếu bắt buộc phải chọn hoặc nhập nhóm nguyên nhân hao hụt vượt định mức (ví dụ: Lỗi phôi nứt trong lúc dập nóng, sai số kích thước mài, hỏng nhiệt luyện, v.v.).
  - `BR-OUT-03-03` **Phân quyền phê duyệt đặc biệt cấp Ban Giám Đốc:**
    - Mọi phiếu `phan_loai = 'vuot'` đều được hệ thống gắn cờ yêu cầu phê duyệt 2 cấp: Cấp 1 (Quản đốc phân xưởng xác nhận lỗi) $\rightarrow$ Cấp 2 (Ban Giám Đốc duyệt xuất chi phí vượt định mức).

- **Quy trình tương tác 5 bước (Interaction Flow):**
  - **Bước 1:** Người dùng chọn loại phiếu "Xuất vượt định mức" trên giao diện tạo đề nghị.
  - **Bước 2:** Chọn Lệnh Sản Xuất gốc. Hệ thống tự động tính toán tỷ lệ vượt định mức (`%`).
  - **Bước 3:** Nhập số lượng vật tư xin cấp thêm và giải trình chi tiết nguyên nhân hao hụt.
  - **Bước 4:** Bấm **"Gửi Đề Nghị Xuất Vượt Định Mức"**.
  - **Bước 5:** Hệ thống sinh mã `DNXK-xxxx`, chuyển phiếu vào luồng phê duyệt đặc biệt cấp Ban Giám Đốc.

---

## 2. Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)

- **Thiết bị đích:** Máy tính Desktop Web.
- **Yêu cầu trải nghiệm (UX Principles):**
  - **Chỉ số cảnh báo vượt định mức (Over-consumption Alert):** Hiển thị thanh đo tỷ lệ phần trăm vượt định mức (ví dụ: `+12.5% Vượt Định Mức`) bằng màu đỏ cảnh báo.
  - **Badge phân loại:** Badge màu đỏ `[ Vượt Định Mức ]` nổi bật trên toàn bộ các danh sách và phiếu in.

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
    actor Planner as Nhân Viên Phân Xưởng
    participant UI as React Web UI
    participant API as .NET 8 Web API
    participant DB as SQL Server (MMS DB)

    Planner->>UI: Chọn LSX & Nhập số lượng vượt + Lý do hư hỏng
    Planner->>UI: Bấm "Gửi Đề Nghị Xuất Vượt Định Mức"
    UI->>API: POST /api/v1/outbound-requests (classification='vuot')
    API->>DB: EXEC api.usp_WMS_OUT03_CreateOverPlanningRequest_v1
    DB-->>API: RequestId=9032, RequestCode='DNXK-9032'
    API-->>UI: 200 OK
    UI-->>Planner: Thông báo gửi duyệt cấp Ban Giám Đốc (OUT-05)
```
