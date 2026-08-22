# Phân tích Thiết kế Logic UC-28 (ADM-01) - Quản Lý Danh Mục Người Dùng & Tài Khoản Nhân Viên

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Quản Lý Người Dùng & Tài Khoản (ADM-01)** của Quản trị viên hệ thống (Admin).

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Quản lý toàn bộ danh sách tài khoản người dùng (`tbl_dm_user`), liên kết mã nhân viên (`msnv`), họ tên, phòng ban phân xưởng, email, số điện thoại, trạng thái kích hoạt (`status_active`), cấp phát và đặt lại mật khẩu cho nhân viên kho và phân xưởng.
- **Endpoint:** `GET /api/v1/admin/users` & `POST /api/v1/admin/users`
- **SP:** `api.usp_ADM_ManageUsers_v1`
