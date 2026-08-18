# Báo Cáo Nghiệm Thu & Hướng Dẫn Sử Dụng: Quản Trị Người Dùng & Phân Quyền Vai Trò (UC-28 / ADM-01 & ADM-02)

- **Database Đích**: `10.17.16.106` (`Database=MMS1`, User `codex1` / `123`)
- **Use Case**: **UC-28 (ADM-01 & ADM-02)** - Quản trị người dùng & Ma trận phân quyền vai trò
- **Trạng thái**: **Hoàn thành & Nghiệm thu 100% (Passed)**
- **Nhánh đồng bộ**: `pharse1` (`https://github.com/Sohoa-KNSG/mms/tree/pharse1`)

---

## 1. Các Tính Năng Đã Triển Khai Thực Tế

### A. Quản Lý Danh Sách 110+ Người Dùng (`tbl_dm_user`)
1. **Tra cứu & Lọc thông minh**:
   - Tìm kiếm nhanh theo mã tài khoản (`user_n`), họ tên nhân viên, phòng ban phân xưởng.
   - Bộ lọc theo nhóm vai trò (`admin`, `truongphong_kho`, `thukho`, `bophan_yeucau`, `nv_sx`, `nhanvien`, `qc`).
2. **Gán nhóm vai trò & Cập nhật tài khoản**:
   - Nút **"Gán Vai Trò"** cho phép đổi nhóm quyền hạn của nhân viên trực tiếp vào `tbl_dm_user.ma_role`.
   - Cho phép cấp lại mật khẩu hoặc đổi trạng thái Hoạt động / Khóa tài khoản.
3. **Thêm tài khoản nhân viên mới**:
   - Nút **"Thêm Người Dùng Mới"** tạo tài khoản vào CSDL `MMS1` với mật khẩu mặc định `123`.

### B. Quản Trị Ma Trận Phân Quyền Vai Trò (`tbl_app_role_permission`)
1. **Ma trận Checkbox 2 chiều**:
   - 7 nhóm vai trò x 22 quyền nghiệp vụ chi tiết (thuộc 7 phân hệ: *Nhập kho, Xuất kho, Trả nội bộ, Soạn hàng, Tồn kho & Kệ, QC Kiểm định, Quản trị*).
   - Cho phép Admin tích chọn bật/tắt từng quyền.
2. **Lưu trực tiếp xuống CSDL MMS1**:
   - Nút **"Lưu Phân Quyền Vào CSDL"** thực thi `dbo.sp_admin_save_role_permissions` cập nhật tức thời bảng `tbl_app_role_permission`.

---

## 2. Hướng Dẫn Thao Tác Trực Quan

1. **Truy cập ứng dụng**: 👉 **http://localhost:5173** (hoặc port web đang chạy).
2. Vào phân hệ **Danh Mục & Hệ Thống (Settings)**:
   - **Tab "👥 Người Dùng (110)"**:
     - Xem danh sách toàn bộ nhân sự từ `tbl_dm_user`.
     - Bấm **"Gán Vai Trò"** tại một nhân viên bất kỳ (VD: `10003`) -> Đổi thành **"Thủ Kho"** hoặc **"Đơn Vị Yêu Cầu"** -> Bấm **"Lưu Thay Đổi"**.
   - **Tab "🛡️ Phân Quyền Vai Trò (UC-02)"**:
     - Bật/tắt các ô checkbox quyền của vai trò tương ứng -> Bấm **"Lưu Phân Quyền Vào CSDL"**.
   - **Bộ Simulator chuyển đổi nhanh tài khoản**:
     - Bấm thử các nút tài khoản mẫu ở trên đầu tab Phân quyền để quan sát Sidebar tự động co giãn các phân hệ menu theo đúng quyền vừa cấu hình!
