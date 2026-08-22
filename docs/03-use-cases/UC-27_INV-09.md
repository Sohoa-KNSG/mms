# Phân tích Thiết kế Logic UC-27 (INV-09) - Kiểm Đếm Thực Địa Trên PDA, Đếm Từng Thùng, Tách Tem & Chốt Chênh Lệch Sổ Cái

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Kiểm Đếm Thực Địa Trên PDA & Chốt Chênh Lệch (INV-09)** của Nhân viên kiểm đếm và Trưởng phòng kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Quy trình 3 bước:** Bước 1 (Quét Kệ) $ightarrow$ Bước 2 (Quét Lô) $ightarrow$ Bước 3 (Nhập số lượng đếm thùng).
- **Tự động tách tem & in tem mới.**
- **Chốt chênh lệch sổ cái:** Đối chiếu và hạch toán điều chỉnh tồn kho (`ADJUST_COUNT`).
