# Phân tích Thiết kế Logic UC-10 (INB-08) - Nhập Kho Bán Thành Phẩm & Thành Phẩm Từ Phân Xưởng Sản Xuất

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Nhập Kho Sản Phẩm Sản Xuất (INB-08)** của Phân xưởng và Thủ kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Tiếp nhận các Lô bán thành phẩm (BTP) hoặc thành phẩm (TP) sau khi hoàn tất công đoạn dập/mài/xi mạ từ các phân xưởng sản xuất bàn giao về kho lưu trữ, gắn mã Lô BTP và đưa vào Ô kệ.
- **Endpoint:** `POST /api/v1/receiving/production-receipt`
- **SP:** `api.usp_WMS_INB08_CreateProductionReceipt_v1`
