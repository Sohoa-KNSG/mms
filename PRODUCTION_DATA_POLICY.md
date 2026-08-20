# QUY ĐỊNH BẢO VỆ DỮ LIỆU CƠ SỞ DỮ LIỆU CHÍNH THỨC (PRODUCTION DATABASE POLICY)
**Dự án**: Hệ Thống Quản Lý Kho MMS WMS - Công ty Cổ phần Kềm Nghĩa (KNSG)  
**Mục tiêu**: Bảo đảm tính toàn vẹn, bảo mật và an toàn tuyệt đối cho Cơ Sở Dữ Liệu Sản Xuất Chính Thức.

---

## 1. NGUYÊN TẮC CỐT LÕI (CORE GUARDRAILS)

### 🔴 QUY TẮC 1: TUYỆT ĐỐI KHÔNG TẠO DỮ LIỆU TEST / DEMO / MOCK TRÊN CSDL CHÍNH THỨC
1. Không được chạy bất kỳ script `INSERT`, `SEED`, hoặc mock data ngẫu nhiên vào các bảng dữ liệu thực tế (`tbl_dm_vattu`, `tbl_batch_inv`, `tbl_dm_location`, `tbl_phieu_nhan_hang`, `tbl_chitiet_nhanhang`, `tbl_qc_phieu_kiem`, `tbl_transaction`, `tbl_kiemke_...`).
2. Mọi dữ liệu mới phát sinh trên hệ thống chỉ được tạo ra thông qua **hành động nghiệp vụ thực tế của người dùng có thẩm quyền** (Thủ kho nhận hàng, Chuyên viên QC kiểm định, Nhân viên cất kệ, v.v.).
3. Không tự ý tạo thêm các Lô hàng giả lập hoặc Phiếu kiểm kê ảo nếu không có yêu cầu nghiệp vụ thực tế từ ban quản trị kho.

---

### 🔴 QUY TẮC 2: CẤM CÁC CÂU LỆNH DDL & DML NGUY HIỂM GÂY MẤT DỮ LIỆU
1. **Tuyệt đối cấm**:
   - `DROP TABLE`, `DROP DATABASE`, `DROP VIEW`, `DROP PROCEDURE`.
   - `TRUNCATE TABLE` trên bất kỳ bảng dữ liệu nghiệp vụ nào.
   - `DELETE FROM [table]` không có mệnh đề `WHERE` chính xác hoặc dùng điều kiện diện rộng `WHERE 1=1`.
   - `ALTER TABLE ... DROP COLUMN` làm mất cấu trúc dữ liệu lịch sử của Kềm Nghĩa.
2. Mọi thao tác điều chỉnh schema (nếu có yêu cầu từ Kềm Nghĩa) bắt buộc phải tạo script migration rõ ràng, có backup trước khi thực hiện và có sự phê duyệt của Quản trị viên hệ thống.

---

### 🟢 QUY TẮC 3: NGUYÊN TẮC GHI DỮ LIỆU & BẢO ĐẢM AUDIT TRAIL (DATA INTEGRITY)
1. **Định Danh Người Dùng (Actor Attribution)**:
   - Mọi thao tác `INSERT` / `UPDATE` vào CSDL phải truyền đúng mã nhân viên thực hiện (`@UserId` / `user_cre` / `user_mod`), không dùng tài khoản hệ thống ẩn danh để ghi đè.
2. **Lưu Vết Thời Gian Thực (Timestamping)**:
   - Mọi bản ghi phải có thời gian chính xác (`time_cre = GETDATE()`).
3. **Lưu Vết Lịch Sử Biến Động (Transaction & History Logging)**:
   - Mọi biến động tăng/giảm tồn kho của Lô hàng bắt buộc phải ghi nhận vào `dbo.tbl_transaction` và `dbo.tbl_batch_history`.
   - Mọi kết quả kiểm đếm kiểm kê bắt buộc phải ghi nhận qua `dbo.tbl_kiemke_log`.

---

### 🟢 QUY TẮC 4: NGUYÊN TẮC TRUY VẤN ĐỌC AN TOÀN (SAFE READ QUERY)
1. Tất cả các câu lệnh `SELECT` đọc dữ liệu vận hành từ các bảng có tần suất giao dịch cao (`tbl_batch_inv`, `tbl_transaction`, `tbl_dm_location`, `tbl_dm_vattu`) phải sử dụng gợi ý khóa `WITH (NOLOCK)` để tránh gây Deadlock hoặc khóa bảng ảnh hưởng đến hệ thống ERP Bravo của nhà máy.
2. Tất cả các tham số đầu vào từ API đều phải qua **Parameterized Query (`SqlCommand.Parameters.AddWithValue` hoặc `SqlParameter`)** để chống lỗi SQL Injection và bảo vệ an toàn CSDL.

---

### 🟢 QUY TẮC 5: PHÂN BIỆT MÔI TRƯỜNG & BẢO MẬT KẾT NỐI
1. **Chuỗi Kết Nối (Connection String)**:
   - Cấu hình tách biệt giữa môi trường kiểm thử nội bộ và CSDL vận hành chính thức thông qua biến môi trường hoặc file cấu hình `appsettings.Production.json`.
   - Tài khoản kết nối CSDL phải được cấp quyền vừa đủ (Principle of Least Privilege).
2. **Quy Trình Kiểm Thử (Testing Process)**:
   - Nếu cần kiểm thử tính năng mới, bắt buộc thực hiện trên môi trường Staging/Test riêng biệt, tuyệt đối không thử nghiệm trên môi trường CSDL chính thức của Kềm Nghĩa.
