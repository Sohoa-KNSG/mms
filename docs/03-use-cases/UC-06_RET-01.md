# Phân tích Thiết kế Logic UC-06 (RET-01) - Đăng Ký Đề Nghị Nhập Trả Hàng & Phế Liệu Từ Phân Xưởng

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Đăng Ký Đề Nghị Trả Hàng (RET-01)** của Nhân viên Phân xưởng.

---

## 1. Business Logic (Logic Nghiệp Vụ)
- **Mục tiêu cốt lõi:** Cho phép phân xưởng lập phiếu đề nghị trả lại kho các vật tư thừa sau sản xuất, phế liệu thu hồi hoặc vật tư không đạt yêu cầu kỹ thuật (`nghiep_vu = 'RET_PROD'`).
- **Endpoint:** `POST /api/v1/return-requests`
- **SP:** `api.usp_WMS_RET01_CreateReturnRequest_v1`
