# Phân tích Thiết kế Logic UC-07 (INB-04) - Đề Xuất Vị Trí Ô Kệ Nhập Kho (Putaway Recommendation Algorithm)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Thuật Toán Đề Xuất Vị Trí Cất Kệ (INB-04)** của Hệ thống MMS WMS.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Hệ thống tự động phân tích 540 ô kệ, đối chiếu quy tắc lưu trữ theo Nhóm vật tư (Category), Tải trọng tối đa của kệ (Max Weight), Thể tích chứa (Max Volume), Kệ đang chứa cùng SKU (Cùng loại gom chung) và Độ cao tầng kệ (Hàng nặng tầng thấp, hàng nhẹ tầng cao) để đưa ra đề xuất vị trí Ô kệ tối ưu nhất cho từng Lô hàng mới nhập.
- **Endpoint:** `GET /api/v1/putaway/recommendations`
- **SP:** `api.usp_WMS_INB04_GetPutawayRecommendation_v1`
