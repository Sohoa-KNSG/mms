# Phân tích Thiết kế Logic UC-08 (INB-06) - Xác Nhận Nhập Kho Chính Thức & Hạch Toán Sổ Cái Kép

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Xác Nhận Nhập Kho Chính Thức (INB-06)** của Thủ kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Sau khi toàn bộ các Lô hàng trong đơn PO đã được kiểm định QC Đạt (`PASS`) và cất vào Ô kệ (`ON_RACK`), Thủ kho kiểm tra đối chiếu lần cuối và bấm duyệt xác nhận nhập kho chính thức. Hệ thống thực thi giao dịch ACID: Chuyển toàn bộ Lô sang `status_kho = 'STORED'`, sinh tồn kho khả dụng `tbl_batch_inv`, chốt số lượng thực nhập với đơn PO Bravo và hạch toán ghi Nợ/Có vào Sổ Cái Kép.
- **Endpoint:** `POST /api/v1/receiving/confirm-official`
- **SP:** `api.usp_WMS_INB06_ConfirmOfficialReceipt_v1`
