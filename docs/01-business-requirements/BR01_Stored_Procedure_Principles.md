# BR01 - Stored Procedure Principles

- Mỗi nghiệp vụ ghi dữ liệu có một stored procedure command.
- Stored procedure phải validate trạng thái hiện tại trước khi chuyển trạng thái mới.
- Stored procedure phải dùng transaction SQL khi ghi nhiều bảng.
- Stored procedure trả mã kết quả, thông báo nghiệp vụ, id chứng từ nếu có.
- Backend chỉ gọi SP, không tự xử lý rule chính.
