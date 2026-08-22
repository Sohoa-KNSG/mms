# Phân tích Thiết kế Logic UC20 - Đề nghị xuất kho mobile

Tài liệu phân tích toàn diện **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic** và **Diagrams** cho chức năng **Đề nghị xuất kho mobile** khi chuyển hệ thống Quản lý Kho Vật tư từ Power Apps sang React.

Nguyên tắc bắt buộc: React chỉ xử lý giao diện; backend là API host mỏng; mọi quy tắc nghiệp vụ, chuyển trạng thái và transaction nhiều bảng được thực thi trong SQL Stored Procedure.

---

## 1. Business Logic (Logic Nghiệp vụ)

### 1.1. Mục tiêu cốt lõi

Cung cấp luồng đề nghị xuất kho tối ưu mobile nhưng dùng chung rule và dữ liệu với UC19.

### 1.2. Phạm vi và nguồn hiện hữu

| Màn hình | Nguồn | Datasource phát hiện trong YAML |
|---|---|---|
| scr_mob_denghi_xuatkho_planning | Quản lý kho vật tư .msapp | tbl_phieu_yeucau_chitiet, tbl_pheduyet_process, vw_dm_vattu_tonkho, tbl_flow_pheduyet, vw_dinhmuc_conlai, tbl_his_pheduyet, tbl_phieu_yeucau, v_ton_he_thong, tbl_dm_vattu, tbl_sx_bravo |
| scr_mob_denghi_xuatkho_no_planning | Quản lý kho vật tư .msapp | tbl_phieu_yeucau_chitiet, tbl_pheduyet_process, vw_dm_vattu_tonkho, tbl_flow_pheduyet, tbl_his_pheduyet, tbl_phieu_yeucau, v_ton_he_thong, tbl_batch_inv, tbl_dm_vattu, tbl_sx_bravo |
| scr_mob_denghi_xuatkho_planning_vuot | Quản lý kho vật tư .msapp | tbl_phieu_yeucau_chitiet, tbl_pheduyet_process, vw_dm_vattu_tonkho, tbl_flow_pheduyet, vw_dinhmuc_conlai, tbl_his_pheduyet, tbl_phieu_yeucau, v_ton_he_thong, tbl_dm_vattu, tbl_sx_bravo |
| scr_mob_denghi_xuatkho_log | Quản lý kho vật tư .msapp | tbl_phieu_yeucau_chitiet, vw_phieu_dnxk_chitiet, tbl_pheduyet_process, vw_xuatkho_chitiet, v_yeucau_soanhang, tbl_flow_pheduyet, tbl_his_pheduyet, tbl_phieu_yeucau, tbl_dm_kehoach, tbl_sx_bravo |

- Thao tác Power Fx phát hiện: **ClearCollect, Collect, Navigate, Patch, Remove**.
- Datasource tham chiếu thực tế: `tbl_batch_inv, tbl_dm_kehoach, tbl_dm_vattu, tbl_flow_pheduyet, tbl_his_pheduyet, tbl_pheduyet_process, tbl_phieu_yeucau, tbl_phieu_yeucau_chitiet, tbl_sx_bravo, v_ton_he_thong, v_yeucau_soanhang, vw_dinhmuc_conlai, vw_dm_vattu_tonkho, vw_phieu_dnxk_chitiet, vw_xuatkho_chitiet`.
- Nhãn giao diện tiêu biểu: `ĐNXK TRONG KẾ HOẠCH ĐỊNH MỨC`, `Tên vật tư:`, `Tìm kiếm tên vật tư`, `Mã vật tư:`, `Tìm kiếm mã vật tư`, `Ghi Chú`, `TẠO PHIẾU`, `Đơn vị xuất cho toàn bộ Phiếu:`, `SL Yêu Cầu`, `Đơn vị xuất & Ghi chú`, `Ghi chú (nếu có)`, `TRÌNH DUYỆT`.

### 1.3. Actor

- Actor nghiệp vụ: Đơn vị yêu cầu trên mobile/PDA.
- React Web Client trên PC hoặc mobile/PDA tùy màn hình.
- Backend API xác thực, phân quyền, validate hình thức và gọi SP.
- SQL Server MMS chịu trách nhiệm toàn bộ logic nghiệp vụ.

### 1.4. Tiền điều kiện

- Người dùng đã đăng nhập và có quyền `UC20`.
- Danh mục và chứng từ nguồn liên quan đang hoạt động.
- Dữ liệu đầu vào thuộc đúng kho/bộ phận mà người dùng được phép thao tác.
- Các Stored Procedure của use case đã được triển khai và version tương thích API.

### 1.5. Hậu điều kiện

- Khi thành công, dữ liệu và trạng thái được cập nhật atomic, có người thao tác và thời gian.
- API trả mã kết quả, thông báo và dữ liệu mới nhất do SP xác nhận.
- Khi thất bại, SP rollback toàn bộ phần ghi và không để dữ liệu trung gian dở dang.
- React refresh dữ liệu từ response/read SP; không tự giả lập trạng thái thành công.

### 1.6. Business Rules

- **`[BR-UC20-01]`** Rule nghiệp vụ phải đồng nhất UC19.
- **`[BR-UC20-02]`** Không tạo logic riêng theo thiết bị.
- **`[BR-UC20-03]`** Payload ép kiểu số trước khi gửi.
- **`[BR-UC20-04]`** Chống submit lặp bằng request id.
- **`[BR-UC20-05]`** Chỉ xem phiếu thuộc người dùng/phạm vi quyền.
- **`[BR-UC20-06]`** Offline không được tự post nghiệp vụ.

- **`[BR-UC20-07]`** User thao tác lấy từ token; SP kiểm tra lại quyền và phạm vi dữ liệu.
- **`[BR-UC20-08]`** Mọi command phải hỗ trợ `RequestId` để chống gửi lặp.
- **`[BR-UC20-09]`** Không dùng SQL động do client truyền và không cho backend cập nhật bảng trực tiếp.

### 1.7. Luồng chính

| Bước | Thao tác | React/API | SQL Stored Procedure |
|---|---|---|---|
| 1 | Chọn loại đề nghị mobile | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 2 | Tìm nhanh vật tư | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 3 | Nhập số lượng bằng bàn phím số | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 4 | Xem định mức/tồn tóm tắt | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 5 | Nhập lý do nếu bắt buộc | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 6 | Gửi đề nghị | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 7 | Theo dõi trạng thái trong danh sách cá nhân | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |

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
| DRAFT | Trạng thái nghiệp vụ DRAFT của đề nghị xuất kho mobile | Theo state machine và quyền của SP |
| SUBMITTED | Trạng thái nghiệp vụ SUBMITTED của đề nghị xuất kho mobile | Theo state machine và quyền của SP |
| WAITING_APPROVAL | Trạng thái nghiệp vụ WAITING_APPROVAL của đề nghị xuất kho mobile | Theo state machine và quyền của SP |
| APPROVED | Trạng thái nghiệp vụ APPROVED của đề nghị xuất kho mobile | Theo state machine và quyền của SP |
| REJECTED | Trạng thái nghiệp vụ REJECTED của đề nghị xuất kho mobile | Theo state machine và quyền của SP |

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
