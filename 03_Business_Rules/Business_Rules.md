# Business Rules

## Nguyên tắc chung

- React không chứa business rule chính.
- Backend không tự cập nhật trạng thái phiếu, batch hoặc transaction nhiều bảng.
- Stored procedure là nơi xử lý rule nghiệp vụ và transaction.
- View chỉ dùng đọc, không ghi nghiệp vụ.

## Nhóm rule

| Nhóm | Rule chính |
|---|---|
| Nhận hàng | Phiếu nhận phải có header và chi tiết hợp lệ |
| Nhập kho | Nhập kho phải sinh batch và transaction trong cùng transaction SQL |
| QC | Vật tư thuộc nhóm QC phải có kết quả kiểm trước khi nhập nếu cấu hình yêu cầu |
| Lưu kho | Batch chỉ được gán vị trí hợp lệ |
| Kiểm kê | Chênh lệch kiểm kê phải ghi lịch sử và người xác nhận |
| Đề nghị xuất | Đề nghị theo kế hoạch, ngoài kế hoạch, vượt kế hoạch có rule phê duyệt riêng |
| Soạn hàng | Chỉ soạn từ batch còn tồn khả dụng |
| Xuất kho | Xuất kho phải ghi giảm tồn và transaction |
| Trả nội bộ | Kho quyết định đạt, không đạt hoặc từ chối trong SP |
