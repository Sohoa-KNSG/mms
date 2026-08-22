# Phân tích Thiết kế Logic UC-11 (LOC-04) - Khóa & Mở Khóa Vị Trí Ô Kệ Phục Vụ Bảo Trì & Kiểm Kê

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Khóa & Mở Khóa Ô Kệ (LOC-04)** của Quản trị kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Cho phép Quản trị kho thực hiện thao tác Khóa (Lock) hoặc Mở khóa (Unlock) một hoặc hàng loạt Ô kệ theo Dãy/Tầng. Khi Ô kệ bị khóa, hệ thống tự động vô hiệu hóa việc cất hàng mới và lấy hàng từ ô kệ đó, đồng thời hiển thị biểu tượng ổ khóa trên sơ đồ 2D.
- **Endpoint:** `POST /api/v1/locations/lock-unlock`
- **SP:** `api.usp_WMS_LOC04_SetLocationLock_v1`
