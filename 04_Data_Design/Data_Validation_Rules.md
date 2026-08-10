# Data Validation Rules

| Nhóm | Rule | Layer |
|---|---|---|
| Input bắt buộc | Kiểm tra trường bắt buộc, kiểu dữ liệu, format | React + API |
| Rule nghiệp vụ | Kiểm tra trạng thái, tồn kho, phân bổ, phê duyệt | SQL SP |
| Tồn kho | Không xuất quá tồn khả dụng | SQL SP |
| Phiếu trả nội bộ | Chỉ xử lý phiếu chờ, quyết định đạt/không đạt/từ chối | SQL SP |
| Audit | Ghi user/time/status khi tạo/xác nhận/hủy | SQL SP + API log |
