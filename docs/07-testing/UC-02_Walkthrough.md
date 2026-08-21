# Báo Cáo Nghiệm Thu: Kết Nối CSDL MMS1, Sao Chép Bảng Vận Hành & Tái Cấu Trúc Phân Quyền

- **Database Đích**: CSDL MMS1
- **Dữ liệu sao chép**: 69 bảng dữ liệu vận hành & Master Data (hơn 7.5 triệu bản ghi) từ `MMS` sang `MMS1`
- **Stored Procedures**: Đầy đủ 79 Stored Procedures trong schema `api` và các kiểu dữ liệu Table-Types
- **Trạng thái**: **Hoàn thành (Passed & Verified 100%)**
- **Nhánh đồng bộ**: `pharse1` (`https://github.com/Sohoa-KNSG/mms/tree/pharse1`)

---

## 1. Danh Sách Tài Khoản & Phân Quyền Chuẩn Trên MMS1

| STT | Tài khoản (user_n) | Mật khẩu | Họ và tên | Chức danh | Mã Role mới | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **`6797`** (hoặc `1`) | `123` | LƯU MINH TUẤN | Admin Hệ Thống | `admin` | Toàn quyền tất cả các phân hệ, quản trị phân quyền & master data |
| 2 | **`truongphong`** | `123` | VŨ MẠNH CƯỜNG | Trưởng Phòng Kho | `truongphong_kho` | **Phê duyệt đề nghị xuất kho**, giám sát Dashboard KPI & Báo cáo tổng thể |
| 3 | **`00`** | `123` | NGUYỄN ĐÌNH KHƯƠNG | Thủ Kho Trưởng | `thukho` | **Quản lý Nhập kho**, đối soát PO, làm thủ tục nhập, quản lý tồn kho, kệ và in tem batch |
| 4 | **`nhanvien01`** | `123` | TRẦN VĂN NAM | Nhân Viên Kho | `nhanvien` | **Soạn hàng FIFO**, thao tác **Máy quét PDA Laser**, quét cất/dời kệ thực địa |
| 5 | **`qc01`** | `123` | LÊ THỊ THU THẢO | Kỹ Thuật QC/QA | `qc` | Lập phiếu kiểm định chất lượng, đánh giá Đạt/Không đạt & in tem QC |

---

## 2. Các Bảng Phân Quyền Mới Được Khởi Tạo Trên MMS1

1. **`dbo.tbl_app_role`**: Quản lý 5 vai trò chuẩn của hệ thống.
2. **`dbo.tbl_app_permission`**: Quản lý 19 quyền nghiệp vụ chi tiết thuộc 6 nhóm: **Nhập kho**, **Xuất kho**, **Soạn hàng**, **Tồn kho & Kệ**, **QC Kiểm định**, **Quản trị**.
3. **`dbo.tbl_app_role_permission`**: Lưu vết ma trận cấp quyền cho từng vai trò.

---

## 3. Hướng Dẫn Kiểm Thử Trực Quan Trên Database MMS1

1. Truy cập giao diện tại: 👉 **http://localhost:5174**
2. Tại màn hình Đăng nhập **MMS SMART FACTORY (MMS1)**, bạn có thể bấm nhanh 1 trong 4 nút đăng nhập thực tế:
   * **Nút "00 - Thủ Kho"**: Đăng nhập tài khoản `00` -> Menu hiển thị các phân hệ Nhập kho, Kệ kho, Soạn hàng, Tồn kho.
   * **Nút "truongphong"**: Đăng nhập tài khoản Trưởng phòng -> Menu hiển thị phân hệ Duyệt xuất kho và Dashboard Báo cáo.
   * **Nút "nhanvien01 (PDA)"**: Đăng nhập tài khoản Nhân viên -> Menu chỉ hiển thị phân hệ Máy quét PDA và Soạn hàng FIFO thực địa.
   * **Nút "6797 - Admin"**: Đăng nhập tài khoản Quản trị -> Menu hiển thị đầy đủ tất cả phân hệ.
3. Vào phân hệ **Danh Mục & Hệ Thống (Settings)** -> Tab **"Phân Quyền Vai Trò (UC-02)"** để tùy biến ma trận quyền trực tiếp trên `MMS1`.
