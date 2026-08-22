# Phân tích Thiết kế Logic UC-02 (AUTH-02) - Đăng Xuất & Thu Hồi Phiên Làm Việc An Toàn (Logout & Token Revocation)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Đăng Xuất Hệ Thống (AUTH-02)** của Người dùng.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Hủy bỏ phiên làm việc của người dùng, xóa bỏ `HttpOnly Cookie` phía client, đưa token vào danh sách thu hồi (`Revoked Tokens Cache`), ghi nhận thời điểm đăng xuất vào nhật ký `tbl_sec_audit_log` và điều hướng người dùng về màn hình đăng nhập.
- **Endpoint:** `POST /api/v1/auth/logout`
- **SP:** `api.usp_SEC_Logout_v1`
