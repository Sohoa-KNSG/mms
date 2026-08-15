# Bộ đặc tả toàn bộ use case MMS

Phiên bản: 1.0  
Ngày tạo: 13/08/2026  
Chuẩn: Markdown, React + .NET API + SQL stored procedure

## Tổng quan

| Chỉ tiêu | Giá trị |
| --- | ---: |
| Tổng use case | 42 |
| AUTH | 2 |
| INB | 8 |
| QC | 6 |
| INV | 7 |
| LOC | 4 |
| OUT | 9 |
| RET | 3 |
| ADM | 3 |

## Danh mục tài liệu

### AUTH

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| AUTH-01 | Đăng nhập hệ thống | W0 | [Mở tài liệu](./AUTH-01.md) |
| AUTH-02 | Hiển thị chức năng theo vai trò | W0 | [Mở tài liệu](./AUTH-02.md) |

### INB

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| INB-01 | Nhận hàng theo PO | W3 | [Mở tài liệu](./INB-01.md) |
| INB-02 | Nhận hàng không PO | W3 | [Mở tài liệu](./INB-02.md) |
| INB-03 | Tạo mới và chỉnh sửa phiếu nhận | W3 | [Mở tài liệu](./INB-03.md) |
| INB-04 | Tra cứu nhật ký nhận hàng | W1 | [Mở tài liệu](./INB-04.md) |
| INB-05 | Cập nhật nhận hàng theo PO | W3 | [Mở tài liệu](./INB-05.md) |
| INB-06 | Cập nhật nhiều PO | W3 | [Mở tài liệu](./INB-06.md) |
| INB-07 | Thực hiện thủ tục nhập kho | W3 | [Mở tài liệu](./INB-07.md) |
| INB-08 | Xem và in tem batch nhập | W3 | [Mở tài liệu](./INB-08.md) |

### QC

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| QC-01 | Khai báo nhóm và tiêu chí QC | W2 | [Mở tài liệu](./QC-01.md) |
| QC-02 | Gán cấu hình QC cho vật tư | W2 | [Mở tài liệu](./QC-02.md) |
| QC-03 | Lập phiếu kiểm | W2 | [Mở tài liệu](./QC-03.md) |
| QC-04 | Đánh giá vật tư | W2 | [Mở tài liệu](./QC-04.md) |
| QC-05 | Tra cứu và hiệu chỉnh lịch sử QC | W2 | [Mở tài liệu](./QC-05.md) |
| QC-06 | In phiếu kiểm | W2 | [Mở tài liệu](./QC-06.md) |

### INV

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| INV-01 | Tra cứu tồn kho | W1 | [Mở tài liệu](./INV-01.md) |
| INV-02 | Tra cứu lịch sử batch | W1 | [Mở tài liệu](./INV-02.md) |
| INV-03 | Tra cứu lịch sử vật tư | W1 | [Mở tài liệu](./INV-03.md) |
| INV-04 | Khai báo tồn kho | W4 | [Mở tài liệu](./INV-04.md) |
| INV-05 | Tách batch | W4 | [Mở tài liệu](./INV-05.md) |
| INV-06 | Kiểm kê theo batch | W4 | [Mở tài liệu](./INV-06.md) |
| INV-07 | Kiểm kê theo vị trí kệ | W4 | [Mở tài liệu](./INV-07.md) |

### LOC

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| LOC-01 | Xem sơ đồ và danh mục vị trí | W1 | [Mở tài liệu](./LOC-01.md) |
| LOC-02 | Đưa batch lên kệ | W4 | [Mở tài liệu](./LOC-02.md) |
| LOC-03 | Đổi vị trí kệ | W4 | [Mở tài liệu](./LOC-03.md) |
| LOC-04 | Đưa batch xuống kệ | W4 | [Mở tài liệu](./LOC-04.md) |

### OUT

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| OUT-01 | Lập đề nghị xuất theo kế hoạch | W5 | [Mở tài liệu](./OUT-01.md) |
| OUT-02 | Lập đề nghị ngoài kế hoạch | W5 | [Mở tài liệu](./OUT-02.md) |
| OUT-03 | Lập đề nghị vượt định mức | W5 | [Mở tài liệu](./OUT-03.md) |
| OUT-04 | Chỉnh sửa đề nghị/bao bì | W5 | [Mở tài liệu](./OUT-04.md) |
| OUT-05 | Theo dõi và phê duyệt đề nghị | W5 | [Mở tài liệu](./OUT-05.md) |
| OUT-06 | Lập danh sách soạn hàng | W6 | [Mở tài liệu](./OUT-06.md) |
| OUT-07 | Soạn hàng theo batch | W6 | [Mở tài liệu](./OUT-07.md) |
| OUT-08 | Xuất kho trực tiếp/thủ tục xuất | W6 | [Mở tài liệu](./OUT-08.md) |
| OUT-09 | In phiếu xuất kho | W6 | [Mở tài liệu](./OUT-09.md) |

### RET

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| RET-01 | Lập phiếu trả nội bộ | W7 | [Mở tài liệu](./RET-01.md) |
| RET-02 | Kho xác nhận phiếu trả nội bộ | W7 | [Mở tài liệu](./RET-02.md) |
| RET-03 | Tách batch nhập trả | W7 | [Mở tài liệu](./RET-03.md) |

### ADM

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| ADM-01 | Quản lý vai trò và quyền màn hình | W2 | [Mở tài liệu](./ADM-01.md) |
| ADM-02 | Quản trị danh mục và cấu hình | W2 | [Mở tài liệu](./ADM-02.md) |
| ADM-03 | Theo dõi log và dashboard | W1 | [Mở tài liệu](./ADM-03.md) |

## Quy ước

- Mỗi use case là một file độc lập, có business, UI/UX, programming, data, diagram, UAT, cutover và traceability.
- Bảng và mã trạng thái legacy không thay đổi.
- Logic nghiệp vụ ghi dữ liệu đặt trong stored procedure.
- Power Apps chỉ là phương án dự phòng sau cutover React.
