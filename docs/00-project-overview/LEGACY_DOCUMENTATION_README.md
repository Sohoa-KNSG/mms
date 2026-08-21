# Bộ tài liệu đầy đủ theo nguồn thật - React kho vật tư

Bộ tài liệu này được tạo lại sau khi rà soát:

- `D:\Codex\Kho vật tư .msapp`
- `D:\Codex\Quản lý kho vật tư .msapp`
- `D:\Codex\database-schema-toan-bo-ung-dung-quan-ly-kho-vat-tu.docx`
- `D:\Codex\SMART_FACTORY_CODING_STANDARD.md`

## Kết quả trích xuất

| Nhóm | Số lượng |
|---|---:|
| Screen từ app PC | 34 |
| Screen từ app kho/mobile | 28 |
| Tổng screen | 62 |
| Datasource/flow từ app PC | 63 |
| Datasource/flow từ app kho/mobile | 51 |
| Entity trong schema Word | 56 |
| Datasource có trong app nhưng chưa nằm trong schema Word | 11 |

## Nguyên tắc kiến trúc bắt buộc

React chỉ xử lý UI. Backend ASP.NET Core chỉ là API host mỏng để xác thực, phân quyền, validate input, logging/audit và gọi stored procedure. Toàn bộ logic nghiệp vụ, chuyển trạng thái, ghi batch, ghi transaction và transaction nhiều bảng xử lý trong SQL stored procedure.

## Cấu trúc theo mẫu

Tài liệu dùng cùng nhóm thư mục như `D:\Codex\mau`: Project Overview, Business Architecture, Process/Use Case, Business Rules, Data Design, Application Design, UI/UX, Non Functional, Test Acceptance, Traceability.
