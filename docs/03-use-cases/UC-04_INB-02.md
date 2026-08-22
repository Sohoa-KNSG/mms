# Phân tích Thiết kế Logic UC-04 (INB-02) - Tiếp Nhận Vật Tư Không Theo PO (Đột Xuất / Phi PO)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Tiếp Nhận Hàng Phi PO (INB-02)** của Thủ kho và KCS/QC.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Cho phép nhập kho các loại hàng mẫu, vật tư tặng kèm, hàng tài trợ, phế liệu thu hồi hoặc vật tư phát sinh ngoài quy trình PO Bravo thông thường. Bắt buộc khai báo nguồn gốc, nhà cung cấp/người giao và ghi nhận phiên tiếp nhận đặc biệt (`nghiep_vu = 'INB_NON_PO'`).
- **Endpoint:** `POST /api/v1/receiving/non-po`
- **SP:** `api.usp_WMS_INB02_CreateNonPoReceipt_v1`
