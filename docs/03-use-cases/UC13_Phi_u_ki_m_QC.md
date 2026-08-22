# Phân tích Thiết kế Logic UC13 - Phiếu kiểm QC

Tài liệu phân tích toàn diện **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic** và **Diagrams** cho chức năng **Phiếu kiểm QC** khi chuyển hệ thống Quản lý Kho Vật tư từ Power Apps sang React.

Nguyên tắc bắt buộc: React chỉ xử lý giao diện; backend là API host mỏng; mọi quy tắc nghiệp vụ, chuyển trạng thái và transaction nhiều bảng được thực thi trong SQL Stored Procedure.

---

## 1. Business Logic (Logic Nghiệp vụ)

### 1.1. Mục tiêu cốt lõi

Tạo phiếu kiểm từ phiếu nhận, nạp tiêu chí áp dụng và phát hành/in phiếu QC.

### 1.2. Phạm vi và nguồn hiện hữu

| Màn hình | Nguồn | Datasource phát hiện trong YAML |
|---|---|---|
| scr_qc_phieukiem | Quản lý kho vật tư .msapp | vw_ketqua_vattu_qc, vw_ketqua_phieu_qc |
| scr_qc_phieukiem_print | Quản lý kho vật tư .msapp | vw_danhgia_vattu_qc, vw_ketqua_vattu_qc, tbl_qc_kiem |
| scr_qc_info_danhgia | Kho vật tư .msapp | tbl_phieu_nhan_hang_image, vw_phieukiem_group_qc, vw_phieukiem_vattu_qc, tbl_qc_phieu_kiem, tbl_his_phieunhap |

- Thao tác Power Fx phát hiện: **ClearCollect, Navigate, Patch**.
- Datasource tham chiếu thực tế: `tbl_his_phieunhap, tbl_phieu_nhan_hang_image, tbl_qc_kiem, tbl_qc_phieu_kiem, vw_danhgia_vattu_qc, vw_ketqua_phieu_qc, vw_ketqua_vattu_qc, vw_phieukiem_group_qc, vw_phieukiem_vattu_qc`.
- Nhãn giao diện tiêu biểu: `Phiếu Kiểm`, `Nhà Cung Cấp`, `SL Kiểm Tra`, `SL Đã Nhận`, `SL Không Đạt`, `Phiếu Nhận`, `Người Kiểm`, `Kết Quả`, `Ngày Kiểm`, `Ngày Nhận`, `Mã PO`, `Phiếu Kiểm:`.

### 1.3. Actor

- Actor nghiệp vụ: Nhân viên QC.
- React Web Client trên PC hoặc mobile/PDA tùy màn hình.
- Backend API xác thực, phân quyền, validate hình thức và gọi SP.
- SQL Server MMS chịu trách nhiệm toàn bộ logic nghiệp vụ.

### 1.4. Tiền điều kiện

- Người dùng đã đăng nhập và có quyền `UC13`.
- Danh mục và chứng từ nguồn liên quan đang hoạt động.
- Dữ liệu đầu vào thuộc đúng kho/bộ phận mà người dùng được phép thao tác.
- Các Stored Procedure của use case đã được triển khai và version tương thích API.

### 1.5. Hậu điều kiện

- Khi thành công, dữ liệu và trạng thái được cập nhật atomic, có người thao tác và thời gian.
- API trả mã kết quả, thông báo và dữ liệu mới nhất do SP xác nhận.
- Khi thất bại, SP rollback toàn bộ phần ghi và không để dữ liệu trung gian dở dang.
- React refresh dữ liệu từ response/read SP; không tự giả lập trạng thái thành công.

### 1.6. Business Rules

- **`[BR-UC13-01]`** Chỉ vật tư cấu hình QC mới sinh tiêu chí.
- **`[BR-UC13-02]`** Cấu hình được snapshot tại thời điểm tạo.
- **`[BR-UC13-03]`** Không tạo trùng phiếu active cho cùng dòng nhận.
- **`[BR-UC13-04]`** Kết luận chỉ khi đủ tiêu chí bắt buộc.
- **`[BR-UC13-05]`** Phiếu đã kết luận không sửa trực tiếp.
- **`[BR-UC13-06]`** In phiếu không thay đổi kết quả.

- **`[BR-UC13-07]`** User thao tác lấy từ token; SP kiểm tra lại quyền và phạm vi dữ liệu.
- **`[BR-UC13-08]`** Mọi command phải hỗ trợ `RequestId` để chống gửi lặp.
- **`[BR-UC13-09]`** Không dùng SQL động do client truyền và không cho backend cập nhật bảng trực tiếp.

### 1.7. Luồng chính

| Bước | Thao tác | React/API | SQL Stored Procedure |
|---|---|---|---|
| 1 | Chọn phiếu nhận cần QC | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 2 | Nạp vật tư và cấu hình tiêu chí | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 3 | Tạo phiếu kiểm | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 4 | Phân công người kiểm | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 5 | Ghi/đọc trạng thái đánh giá | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 6 | Kết luận phiếu | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 7 | In phiếu kiểm | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |

### 1.8. Luồng ngoại lệ

| Mã | Tình huống | HTTP | Xử lý bắt buộc |
|---|---|---:|---|
| `INVALID_INPUT` | Thiếu hoặc sai định dạng dữ liệu | 400 | React đánh dấu trường; SP không ghi dữ liệu |
| `FORBIDDEN` | Không có quyền hoặc sai phạm vi kho | 403 | Không trả dữ liệu ngoài phạm vi |
| `NOT_FOUND` | Chứng từ/danh mục không tồn tại | 404 | Refresh danh sách và yêu cầu chọn lại |
| `INVALID_STATE` | Trạng thái hiện tại không cho phép thao tác | 409 | SP rollback, trả trạng thái mới nhất |
| `CONCURRENCY_CONFLICT` | Dữ liệu đã thay đổi bởi phiên khác | 409 | UI tải lại dữ liệu; không tự retry command |
| `DUPLICATE_REQUEST` | `RequestId` đã xử lý | 200/409 | Trả lại kết quả cũ hoặc mã trùng an toàn |
| `DATABASE_ERROR` | Lỗi SQL ngoài dự kiến | 500 | Rollback và ghi technical log |

### 1.9. State Model

| Trạng thái | Ý nghĩa | Hành động tiếp theo |
|---|---|---|
| DRAFT | Trạng thái nghiệp vụ DRAFT của phiếu kiểm qc | Theo state machine và quyền của SP |
| IN_PROGRESS | Trạng thái nghiệp vụ IN_PROGRESS của phiếu kiểm qc | Theo state machine và quyền của SP |
| PASSED | Trạng thái nghiệp vụ PASSED của phiếu kiểm qc | Theo state machine và quyền của SP |
| FAILED | Trạng thái nghiệp vụ FAILED của phiếu kiểm qc | Theo state machine và quyền của SP |
| CANCELLED | Trạng thái nghiệp vụ CANCELLED của phiếu kiểm qc | Theo state machine và quyền của SP |

---

## 2. UI/UX Guidelines

### 2.1. Cấu trúc màn hình

- Thanh tiêu đề hiển thị tên nghiệp vụ, kho/bộ phận và người đang thao tác.
- Vùng bộ lọc/danh mục ở đầu, vùng dữ liệu chính ở giữa và thanh hành động cố định ở cuối.
- Danh sách nhiều dòng dùng table trên PC và list compact trên mobile, không lồng card.
- Trạng thái hiển thị bằng badge có cả màu và chữ; không chỉ dựa vào màu.
- Command chính chỉ bật khi dữ liệu đầu vào và trạng thái UI hợp lệ.

### 2.2. Trạng thái tương tác

| UI State | Hành vi |
|---|---|
| `idle` | Sẵn sàng nhập/chọn dữ liệu |
| `loading` | Skeleton cho vùng danh sách; giữ ổn định kích thước layout |
| `editing` | Cho phép thay đổi trường theo quyền và trạng thái |
| `submitting` | Khóa submit lặp; hiển thị tiến trình trong nút |
| `success` | Hiển thị mã chứng từ/kết quả và refresh từ server |
| `error` | Giữ dữ liệu người dùng, chỉ rõ trường hoặc rule bị lỗi |
| `conflict` | Cảnh báo dữ liệu đã đổi và cung cấp nút tải lại |

### 2.3. Responsive và accessibility

- Vùng chạm mobile tối thiểu 44 x 44 px; input số mở bàn phím số.
- Table rộng chuyển sang chế độ row detail trên màn hình nhỏ.
- Label liên kết input; lỗi dùng `aria-describedby`; dialog giữ focus đúng chuẩn.
- Hỗ trợ bàn phím cho tìm kiếm, thêm dòng, xác nhận và đóng dialog.
- Không hiển thị hướng dẫn kỹ thuật hoặc tên bảng/SP trong UI sản xuất.

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
    tbl_map_nhapkho ||--o{ tbl_qc_inspection : "Ho So KCS"
    tbl_qc_inspection ||--|{ tbl_qc_measurements : "Ket Qua Do Luong"
    tbl_qc_inspection ||--o{ tbl_qc_defects : "Bien Ban Loi"
```

- **Bảng Hồ Sơ Kiểm Định (`dbo.tbl_qc_inspection`):**
  - Khóa chính: `id_inspection` (INT IDENTITY).
  - Khóa ngoại: `id_nhapkho` $ightarrow$ `tbl_map_nhapkho(id_nhapkho)`.
  - Kết luận kiểm tra: `decision` (`'PASS'`, `'REJECT'`, `'CONCESSION'`).

### 4.2. Data Flow & Transaction Locking Matrix
- **Khóa Lô kiểm định:** Khi QC tiếp nhận lấy mẫu, cập nhật `status_qc = 'IN_INSPECTION'` với `UPDLOCK` để khóa quyền xuất kho cho đến khi có quyết định phê duyệt chính thức.

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái QC | Điều Kiện Chuyển Đổi | Trạng Thái Sau | Tác Động Hệ Thống |
| :--- | :--- | :--- | :--- |
| **`PENDING`** | KCS tiếp nhận lấy mẫu (QC-01) | `IN_INSPECTION` | Khóa xuất kho |
| **`IN_INSPECTION`** | Đạt tiêu chuẩn AQL (QC-04) | `PASS` / `PASS_CHO_NHAP` | Mở khóa cất kệ & xuất kho |
| **`IN_INSPECTION`** | Không đạt tiêu chuẩn (QC-04) | `REJECT` | Tự động chuyển kho cách ly (QC-06) |
