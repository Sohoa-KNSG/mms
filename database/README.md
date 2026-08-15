# Database contracts cho React MMS

Danh mục metadata của toàn bộ stored procedure trên database thực được lưu tại
[`docs/database/stored-procedures/README.md`](../docs/database/stored-procedures/README.md).

Các object trong thư mục này đều là object mới, có version và nằm trong schema `api`. Không script nào được phép thay đổi 59 bảng hoặc mã trạng thái legacy.

## Thứ tự triển khai

1. Chạy `deploy-w0-w1.sql`.
2. Chạy lần lượt `deploy-w2.sql` đến `deploy-w7.sql`; không bỏ qua migration table type đi kèm mỗi wave.
3. Cấp quyền `EXECUTE` schema `api` cho service identity theo `security/0001_api_runtime_role.sql`.
4. Trước khi deploy W5–W7, chạy `parse-w5.sql`, `parse-w6.sql`, `parse-w7.sql` trên bản sao MMS.
5. Chạy smoke test `tests/w*_contract_smoke.sql` tương ứng và sau đó mới chạy UAT nghiệp vụ.

Sau khi từng wave đã được DBA review, có thể dùng `deploy-all.sql` để điều phối đúng thứ tự và `tests/smoke-all.sql` để kiểm tra toàn bộ object. Hai script này không thay thế bước review, backup và UAT.

Các script dùng `CREATE OR ALTER` nên có thể triển khai lặp lại. Việc chạy trên database MMS thật phải qua backup, review và cửa sổ triển khai đã phê duyệt; workspace không tự động ghi lên máy chủ sản xuất.
