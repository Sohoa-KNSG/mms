# Phân tích Thiết kế Logic UC-28 (ADM-03) - Giám Sát Phiên Hoạt Động & Nhật Ký Bảo Mật (Audit Logs & Security Monitoring)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Nhật Ký Bảo Mật & Giám Sát Phiên (ADM-03)** của Quản trị viên hệ thống (Admin).

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Ghi vết và giám sát toàn bộ các hành động trọng yếu trên hệ thống: Đăng nhập/đăng xuất, thay đổi mật khẩu, xóa/hủy phiếu đề nghị xuất kho, điều chỉnh số liệu kiểm kê, xuất kho vượt định mức. Cho phép tra cứu theo thời gian, IP, UserId và mã chức năng.
- **Endpoint:** `GET /api/v1/admin/audit-logs`
- **SP:** `api.usp_ADM_GetAuditLogs_v1`
