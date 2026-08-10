# Orchestrator Command Design

Backend command handler chỉ được làm:

1. Nhận request DTO.
2. Xác thực user.
3. Kiểm tra permission.
4. Validate format dữ liệu.
5. Gọi stored procedure.
6. Map result/error sang response.

Backend command handler không được làm:

- Tự tính tồn kho.
- Tự chuyển trạng thái phiếu.
- Tự quyết định batch nào được xuất/nhập.
- Tự insert/update nhiều bảng nghiệp vụ theo rule.
