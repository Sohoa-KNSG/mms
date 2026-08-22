# Phân tích Thiết kế Logic UC-28 (ADM-02) - Phân Quyền Vai Trò & Ma Trận Màn Hình Truy Cập (RBAC & Screen Access Matrix)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Phân Quyền Vai Trò & Màn Hình (ADM-02)** của Quản trị viên hệ thống (Admin).

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Thiết lập ma trận phân quyền dựa trên vai trò (Role-Based Access Control - RBAC) và theo từng tài khoản cụ thể. Quản lý quyền truy cập các mã màn hình chức năng: `scr_soanhang`, `scr_soanhang_chitiet`, `scr_soanhang_batch`, `scr_mob_soanhang`, `scr_dengatxuat`, `scr_duyet_xuat`, `scr_tonkho_sku`, `scr_kiemke`, v.v. qua view `api.vw_SEC_UserScreenAccess_v1`.
- **Endpoint:** `POST /api/v1/admin/permissions`
- **SP:** `api.usp_ADM_SavePermissions_v1`
