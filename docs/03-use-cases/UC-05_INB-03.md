# Phân tích Thiết kế Logic UC-05 (INB-03) - Quét Mã Vạch Kiểm Đếm & In Tem Nhãn Thùng / Lô (Batch Barcode)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Quét Kiểm Đếm & In Tem Nhãn Lô (INB-03)** của Nhân viên tiếp nhận kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Kiểm đếm thực tế số lượng thùng/kiện/bao vật tư giao đến, quy chuẩn đóng gói theo quy cách tiêu chuẩn (Standard Pack Size). Hệ thống tự động sinh Mã Lô định danh duy nhất (`id_nhapkho`), sinh chuỗi Barcode Code 128 và gửi trực tiếp tới máy in nhiệt để dán tem nhãn lên từng thùng hàng trước khi đưa vào kiểm định QC và cất kệ.
- **Endpoint:** `POST /api/v1/receiving/generate-batch-labels`
- **SP:** `api.usp_WMS_INB03_GenerateBatchLabels_v1`
