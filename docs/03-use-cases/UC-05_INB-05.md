# Phân tích Thiết kế Logic UC-05 (INB-05) - Quét Xác Nhận Cất Hàng Vào Ô Kệ Trên Thiết Bị Cầm Tay (PDA Putaway)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Quét Xác Nhận Cất Kệ Trên PDA (INB-05)** của Nhân viên cất hàng kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Nhân viên dùng PDA quét mã Barcode Lô hàng, di chuyển xe nâng/xe kéo đến vị trí Ô kệ được đề xuất (hoặc vị trí thực tế), quét mã Barcode gắn trên mặt tiền Ô kệ để xác nhận đã đưa hàng vào kệ an toàn. Hệ thống cập nhật `status_kho = 'ON_RACK'` và ghi nhận vị trí lưu trữ chính xác vào `tbl_map_nhapkho`.
- **Endpoint:** `POST /api/v1/putaway/confirm`
- **SP:** `api.usp_WMS_INB05_ConfirmPutaway_v1`
