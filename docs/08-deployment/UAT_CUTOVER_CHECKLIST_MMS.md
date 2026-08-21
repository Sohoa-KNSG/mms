# Checklist UAT và cutover MMS theo use case

Cập nhật: 12/08/2026

## Cổng bắt buộc trước UAT

- DBA đã review `database/deploy-all.sql`, từng SP và execution plan trên bản sao dữ liệu gần Production.
- Chạy parse W5–W7, deploy W0–W7 và `database/tests/smoke-all.sql` thành công.
- Service identity chỉ có `EXECUTE` trên schema `api`; không dùng tài khoản SQL cá nhân.
- Có bộ dữ liệu UAT riêng, máy quét và máy in thực tế; Power Apps vẫn là kênh Production trong giai đoạn UAT.
- Với mỗi UC ghi dữ liệu: đối chiếu bảng header/detail, transaction, batch, trạng thái và trường hợp rollback.

## Ma trận ký nhận 42 use case

| UC | Kịch bản UAT chính | Bằng chứng bắt buộc | Owner | Kết quả |
|---|---|---|---|---|
| AUTH-01 | Đăng nhập user hoạt động/khóa/không mapping | HTTP, user context, audit log |  | Chưa chạy |
| AUTH-02 | Menu và truy cập URL theo role/screen | Ảnh menu, kiểm tra 403 |  | Chưa chạy |
| INB-01 | Nhận hàng theo PO đủ/thiếu/vượt | Phiếu, dòng, trạng thái PO |  | Chưa chạy |
| INB-02 | Nhận hàng không PO | Header/detail và validation |  | Chưa chạy |
| INB-03 | Sửa phiếu nhận hợp lệ và stale data | Kết quả update, lỗi conflict |  | Chưa chạy |
| INB-04 | Tra cứu nhật ký nhận hàng | Báo cáo parity Power Apps |  | Chưa chạy |
| INB-05 | Gắn một PO | Mapping trước/sau |  | Chưa chạy |
| INB-06 | Gắn nhiều PO | Tổng phân bổ và rollback |  | Chưa chạy |
| INB-07 | Nhập kho đạt/không đạt và gọi lặp | Batch/transaction/state |  | Chưa chạy |
| INB-08 | Xem và in tem batch | Bản in/máy in thực tế |  | Chưa chạy |
| QC-01 | Tạo/sửa tiêu chí QC | Danh mục trước/sau |  | Chưa chạy |
| QC-02 | Gán QC cho vật tư | Mapping vật tư/nhóm |  | Chưa chạy |
| QC-03 | Lập phiếu kiểm | Header/detail tiêu chí |  | Chưa chạy |
| QC-04 | Đánh giá đạt/không đạt | Trạng thái và kết quả |  | Chưa chạy |
| QC-05 | Tra cứu/sửa kết quả được phép | Lịch sử và audit |  | Chưa chạy |
| QC-06 | In phiếu kiểm | Nội dung và bố cục in |  | Chưa chạy |
| INV-01 | Tra cứu tồn | Tổng tồn parity và hiệu năng |  | Chưa chạy |
| INV-02 | Lịch sử batch | Transaction parity |  | Chưa chạy |
| INV-03 | Lịch sử vật tư | Transaction parity |  | Chưa chạy |
| INV-04 | Khai báo tồn | Batch/transaction/call lặp |  | Chưa chạy |
| INV-05 | Tách batch | Cân bằng trước/sau, rollback |  | Chưa chạy |
| INV-06 | Kiểm kê batch | Chênh lệch và transaction |  | Chưa chạy |
| INV-07 | Kiểm kê vị trí | Vị trí, batch, transaction |  | Chưa chạy |
| LOC-01 | Xem sơ đồ vị trí | Parity vị trí/tồn |  | Chưa chạy |
| LOC-02 | Đưa batch lên kệ | Expected location và conflict |  | Chưa chạy |
| LOC-03 | Đổi vị trí kệ | Khóa nguồn/đích và rollback |  | Chưa chạy |
| LOC-04 | Đưa batch xuống kệ | Trạng thái/vị trí trước sau |  | Chưa chạy |
| OUT-01 | Đề nghị trong kế hoạch | Định mức còn lại và giữ chỗ |  | Chưa chạy |
| OUT-02 | Đề nghị ngoài kế hoạch | Flow, header/detail |  | Chưa chạy |
| OUT-03 | Đề nghị vượt kế hoạch | Flow riêng và validation |  | Chưa chạy |
| OUT-04 | Sửa đề nghị trước/sau duyệt | Conflict và state guard |  | Chưa chạy |
| OUT-05 | Duyệt nhiều bước/từ chối/hủy | History và trạng thái 1→4 |  | Chưa chạy |
| OUT-06 | Bắt đầu soạn | Một phiếu OUT_CON, state 0→1 |  | Chưa chạy |
| OUT-07 | Soạn FIFO theo batch | Tồn/vị trí/không vượt nhu cầu |  | Chưa chạy |
| OUT-08 | Hoàn tất xuất đủ/thiếu | Rollback khi thiếu, state →2 |  | Chưa chạy |
| OUT-09 | Xem/in phiếu xuất | Đối chiếu yêu cầu và batch |  | Chưa chạy |
| RET-01 | Lập phiếu trả đạt/không đạt | Header/detail nguyên tử |  | Chưa chạy |
| RET-02 | Kho chọn kết quả 1/2/3 | Batch/transaction/state 4/3 |  | Chưa chạy |
| RET-03 | Tách batch nhập trả | Cân bằng và expected quantity |  | Chưa chạy |
| ADM-01 | Gán role/quyền và bảo vệ admin | Matrix trước/sau, 403 |  | Chưa chạy |
| ADM-02 | Sửa danh mục hợp lệ/không hợp lệ | Dữ liệu và quyền |  | Chưa chạy |
| ADM-03 | Dashboard vận hành | Parity số liệu và thời gian đáp ứng |  | Chưa chạy |

## Cutover độc quyền

1. Đóng băng thay đổi schema/object legacy và chụp baseline số liệu.
2. Dừng thao tác ghi Power Apps cho phạm vi cutover; xác nhận không còn giao dịch đang mở.
3. Chuyển channel sang React, bật API mutation và kiểm tra health/smoke.
4. Chạy một giao dịch canary theo wave, đối chiếu trực tiếp bảng, batch và transaction.
5. Theo dõi lỗi, deadlock, thời gian SP và chênh lệch tồn trong cửa sổ ổn định.

## Fallback Power Apps

1. Khóa mutation React trước, chờ request đang chạy kết thúc.
2. Ghi lại thời điểm, UC/cohort, correlation ID và các giao dịch cần reconciliation.
3. Kích hoạt lại Power Apps cho đúng phạm vi; không mở đồng thời hai kênh ghi.
4. Không restore database hoặc sửa tay giao dịch đã commit chỉ vì lỗi ứng dụng.
5. Đối chiếu record do React tạo có thể đọc/tiếp tục xử lý bằng Power Apps trước khi kết thúc fallback.
