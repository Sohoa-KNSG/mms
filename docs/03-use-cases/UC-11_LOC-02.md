# Phân tích Thiết kế Logic UC-11 (LOC-02) - Sơ Đồ Trực Quan 2D Mặt Đứng Kho Theo Ô Kệ (2D Warehouse Elevation Map)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Sơ Đồ 2D Trực Quan Mặt Đứng Kho (LOC-02)** của Thủ kho và Ban Giám Đốc.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Trực quan hóa toàn bộ 540 ô kệ thành bản đồ 2D mặt đứng tương tác (Interactive Elevation Grid) theo từng Dãy kệ (Dãy A, Dãy B, Dãy C...). Thể hiện trực quan theo mã màu heatmap: Ô còn trống (Xanh lá), Ô chứa 50-80% (Vàng), Ô đầy tải 100% (Đỏ), Ô bị khóa (Xám). Cho phép click vào từng ô trên sơ đồ để xem danh sách các Lô hàng và SKU đang nằm bên trong.
- **Endpoint:** `GET /api/v1/locations/elevation-map`
- **SP:** `api.usp_WMS_LOC02_GetElevationMap_v1`
