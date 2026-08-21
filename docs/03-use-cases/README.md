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
| AUTH-01 | Đăng nhập hệ thống | W0 | [Mở tài liệu](./UC-01_AUTH-01.md) |
| AUTH-02 | Hiển thị chức năng theo vai trò | W0 | [Mở tài liệu](./UC-02_AUTH-02.md) |

### INB

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| INB-01 | Nhận hàng theo PO (UC-03) | W3 | [Mở tài liệu](./UC-03_INB-01.md) |
| INB-02 | Nhận hàng không PO (UC-04) | W3 | [Mở tài liệu](./UC-04_INB-02.md) |
| INB-03 | Tạo mới và chỉnh sửa phiếu nhận (UC-05) | W3 | [Mở tài liệu](./UC-05_INB-03.md) |
| INB-04 | Tra cứu nhật ký nhận hàng (UC-07) | W1 | [Mở tài liệu](./UC-07_INB-04.md) |
| INB-05 | Cập nhật nhận hàng & Đối soát gắn PO (UC-05) | W3 | [Mở tài liệu](./UC-05_INB-05.md) |
| INB-06 | Cập nhật nhiều PO (UC-08) | W3 | [Mở tài liệu](./UC-08_INB-06.md) |
| INB-07 | Thực hiện thủ tục nhập kho (UC-09) | W3 | [Mở tài liệu](./UC-09_INB-07.md) |
| INB-08 | Xem và in tem batch nhập (UC-10) | W3 | [Mở tài liệu](./UC-10_INB-08.md) |

### QC

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| QC-01 | Khai báo nhóm và tiêu chí QC (UC-12) | W2 | [Mở tài liệu](./UC-12_QC-01.md) |
| QC-02 | Gán cấu hình QC cho vật tư (UC-12) | W2 | [Mở tài liệu](./UC-12_QC-02.md) |
| QC-03 | Lập phiếu kiểm (UC-13) | W2 | [Mở tài liệu](./UC-13_QC-03.md) |
| QC-04 | Đánh giá vật tư (UC-14) | W2 | [Mở tài liệu](./UC-14_QC-04.md) |
| QC-05 | Tra cứu và hiệu chỉnh lịch sử QC (UC-26) | W2 | [Mở tài liệu](./UC-26_QC-05.md) |
| QC-06 | In phiếu kiểm (UC-26) | W2 | [Mở tài liệu](./UC-26_QC-06.md) |

### INV

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| INV-01 | Tra cứu tồn kho (UC-17) | W1 | [Mở tài liệu](./UC-17_INV-01.md) |
| INV-02 | Tra cứu lịch sử batch (UC-17) | W1 | [Mở tài liệu](./UC-17_INV-02.md) |
| INV-03 | Tra cứu lịch sử vật tư (UC-17) | W1 | [Mở tài liệu](./UC-17_INV-03.md) |
| INV-04 | Khai báo tồn kho (UC-15) | W4 | [Mở tài liệu](./UC-15_INV-04.md) |
| INV-05 | Tách batch (UC-10) | W4 | [Mở tài liệu](./UC-10_INV-05.md) |
| INV-06 | Kiểm kê theo batch 3 cấp (UC-18) | W4 | [Đặc tả kỹ thuật](./UC-18_INV-06_BATCH_AUDIT.md) / [Tài liệu gửi Quản lý kho](./UC-18_BATCH_AUDIT_CUSTOMER_PROPOSAL.md) |
| INV-07 | Kiểm kê theo vị trí kệ (UC-18) | W4 | [Mở tài liệu](./UC-18_INV-07.md) |
| INV-08 | Kiểm kê cycle count theo vật tư (UC-27) | W4 | [Đặc tả kỹ thuật](./UC-27_INV-08.md) / [Tài liệu gửi Quản lý kho](./UC-27_CYCLE_COUNT_CUSTOMER_PROPOSAL.md) |

### LOC

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| LOC-01 | Xem sơ đồ và danh mục vị trí (UC-11) | W1 | [Mở tài liệu](./UC-11_LOC-01.md) |
| LOC-02 | Đưa batch lên kệ (UC-11) | W4 | [Mở tài liệu](./UC-11_LOC-02.md) |
| LOC-03 | Đổi vị trí kệ (UC-11) | W4 | [Mở tài liệu](./UC-11_LOC-03.md) |
| LOC-04 | Đưa batch xuống kệ (UC-11) | W4 | [Mở tài liệu](./UC-11_LOC-04.md) |

### OUT

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| OUT-01 | Lập đề nghị xuất theo kế hoạch (UC-19) | W5 | [Mở tài liệu](./UC-19_OUT-01.md) |
| OUT-02 | Lập đề nghị ngoài kế hoạch (UC-20) | W5 | [Mở tài liệu](./UC-20_OUT-02.md) |
| OUT-03 | Lập đề nghị vượt định mức (UC-20) | W5 | [Mở tài liệu](./UC-20_OUT-03.md) |
| OUT-04 | Chỉnh sửa đề nghị/bao bì (UC-21) | W5 | [Mở tài liệu](./UC-21_OUT-04.md) |
| OUT-05 | Theo dõi và phê duyệt đề nghị (UC-24) | W5 | [Mở tài liệu](./UC-24_OUT-05.md) |
| OUT-06 | Lập danh sách soạn hàng (UC-22) | W6 | [Mở tài liệu](./UC-22_OUT-06.md) |
| OUT-07 | Soạn hàng theo batch (UC-22) | W6 | [Mở tài liệu](./UC-22_OUT-07.md) |
| OUT-08 | Xuất kho trực tiếp/thủ tục xuất (UC-23) | W6 | [Mở tài liệu](./UC-23_OUT-08.md) |
| OUT-09 | In phiếu xuất kho (UC-23) | W6 | [Mở tài liệu](./UC-23_OUT-09.md) |

### RET

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| RET-01 | Lập phiếu trả nội bộ (UC-06) | W7 | [Mở tài liệu](./UC-06_RET-01.md) |
| RET-02 | Kho xác nhận phiếu trả nội bộ (UC-06) | W7 | [Mở tài liệu](./UC-06_RET-02.md) |
| RET-03 | Tách batch nhập trả (UC-25) | W7 | [Mở tài liệu](./UC-25_RET-03.md) |

### ADM

| Use case | Tên | Wave | Tài liệu |
| --- | --- | --- | --- |
| ADM-01 | Quản lý vai trò và quyền màn hình (UC-28) | W2 | [Mở tài liệu](./UC-28_ADM-01.md) |
| ADM-02 | Quản trị danh mục và cấu hình (UC-28) | W2 | [Mở tài liệu](./UC-28_ADM-02.md) |
| ADM-03 | Theo dõi log và dashboard (UC-28) | W1 | [Mở tài liệu](./UC-28_ADM-03.md) |

### TÀI LIỆU CHUYÊN BIỆT CYCLE COUNT
| Tài liệu | Mô tả | File |
| --- | --- | --- |
| Đề án Kiểm kê Cycle Count | Thuyết minh giải pháp & Cam kết SLA khách hàng | [Mở tài liệu](./UC-27_CYCLE_COUNT_CUSTOMER_PROPOSAL.md) |
| Bản thiết kế App Kiểm kê Độc Lập | Kiến trúc xây dựng Mobile App độc lập | [Mở tài liệu](./UC-27_CYCLE_COUNT_STANDALONE_BLUEPRINT.md) |

## Quy ước

- Mỗi use case là một file độc lập, có business, UI/UX, programming, data, diagram, UAT, cutover và traceability.
- Bảng và mã trạng thái legacy không thay đổi.
- Logic nghiệp vụ ghi dữ liệu đặt trong stored procedure.
- Power Apps chỉ là phương án dự phòng sau cutover React.
