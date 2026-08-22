# Danh Mục Hồ Sơ & Đặc Tả 42 Use Cases Hệ Thống MMS WMS (Chuẩn 5 Khía Cạnh)

Tài liệu này là **Chỉ mục Tổng quan (Master Index)** định vị toàn bộ 42 tài liệu Use Case của hệ thống Quản lý Kho Vật tư & Sản xuất MMS (Kềm Nghĩa Sài Gòn). Tất cả các tài liệu đã được chuẩn hóa đồng nhất theo mẫu thiết kế 5 khía cạnh chuyên sâu:
1. **Business Logic (Logic Nghiệp Vụ & Quy tắc BR)**
2. **Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)**
3. **Programming Logic (Mã nguồn React Frontend, .NET 8 API & SQL Stored Procedure)**
4. **Data Logic & Schema Model (Cấu trúc bảng, khóa chính/ngoại, mã trạng thái)**
5. **Diagrams (Sơ đồ tuần tự tương tác Mermaid Sequence Diagram)**

---

## 1. Nhóm Xác Thực, Quản Trị Hệ Thống & Giám Sát (AUTH, ADM & DASH)

| Mã Use Case | Tên Chức Năng | Tác Nhân | File Đặc Tả |
| :--- | :--- | :--- | :--- |
| **AUTH-01** | Đăng Nhập & Xác Thực Phiên Làm Việc (JWT Cookie) | Toàn bộ User | [UC-01_AUTH-01.md](file:///c:/MMS/docs/03-use-cases/UC-01_AUTH-01.md) |
| **AUTH-02** | Đăng Xuất & Thu Hồi Phiên An Toàn | Toàn bộ User | [UC-02_AUTH-02.md](file:///c:/MMS/docs/03-use-cases/UC-02_AUTH-02.md) |
| **ADM-01** | Quản Lý Danh Mục Người Dùng & Tài Khoản | Quản trị viên (Admin) | [UC-28_ADM-01.md](file:///c:/MMS/docs/03-use-cases/UC-28_ADM-01.md) |
| **ADM-02** | Phân Quyền Vai Trò & Ma Trận Màn Hình (RBAC) | Quản trị viên (Admin) | [UC-28_ADM-02.md](file:///c:/MMS/docs/03-use-cases/UC-28_ADM-02.md) |
| **ADM-03** | Giám Sát Phiên & Nhật Ký Bảo Mật (Audit Logs) | Quản trị viên (Admin) | [UC-28_ADM-03.md](file:///c:/MMS/docs/03-use-cases/UC-28_ADM-03.md) |
| **DASH-01** | Bảng Điều Khiển Tổng Quan & Tivi Giám Sát Kho (TV Wallboard) | Lãnh Đạo / Thủ Kho | [UC-29_DASH-01.md](file:///c:/MMS/docs/03-use-cases/UC-29_DASH-01.md) |

---

## 2. Nhóm Tiếp Nhận, Nhập Kho & Nhập Trả (INB & RET)

| Mã Use Case | Tên Chức Năng | Tác Nhân | File Đặc Tả |
| :--- | :--- | :--- | :--- |
| **INB-01** | Tiếp Nhận Đơn Hàng Nhập Kho Theo PO Bravo | Nhân viên tiếp nhận | [UC-03_INB-01.md](file:///c:/MMS/docs/03-use-cases/UC-03_INB-01.md) |
| **INB-02** | Tiếp Nhận Hàng Phi PO (Đột Xuất) | Thủ kho / QC | [UC-04_INB-02.md](file:///c:/MMS/docs/03-use-cases/UC-04_INB-02.md) |
| **INB-03** | Quét Mã Vạch Kiểm Đếm & In Tem Nhãn Lô (Batch) | Nhân viên tiếp nhận | [UC-05_INB-03.md](file:///c:/MMS/docs/03-use-cases/UC-05_INB-03.md) |
| **INB-04** | Đề Xuất Vị Trí Ô Kệ Nhập Kho (Putaway Algorithm) | Hệ thống MMS | [UC-07_INB-04.md](file:///c:/MMS/docs/03-use-cases/UC-07_INB-04.md) |
| **INB-05** | Quét Xác Nhận Cất Hàng Vào Ô Kệ Trên PDA | Nhân viên cất hàng | [UC-05_INB-05.md](file:///c:/MMS/docs/03-use-cases/UC-05_INB-05.md) |
| **INB-06** | Xác Nhận Nhập Kho Chính Thức & Hạch Toán Sổ Cái Kép | Thủ kho | [UC-08_INB-06.md](file:///c:/MMS/docs/03-use-cases/UC-08_INB-06.md) |
| **INB-07** | In Phiếu Nhập Kho Chính Thức (PNK) & Bàn Giao | Thủ kho / Kế toán | [UC-09_INB-07.md](file:///c:/MMS/docs/03-use-cases/UC-09_INB-07.md) |
| **INB-08** | Nhập Kho Bán Thành Phẩm & Thành Phẩm Sản Xuất | Phân xưởng / Thủ kho | [UC-10_INB-08.md](file:///c:/MMS/docs/03-use-cases/UC-10_INB-08.md) |
| **RET-01** | Đăng Ký Đề Nghị Nhập Trả Hàng & Phế Liệu | Nhân viên phân xưởng | [UC-06_RET-01.md](file:///c:/MMS/docs/03-use-cases/UC-06_RET-01.md) |
| **RET-02** | Phê Duyệt Phiếu Nhập Trả Hàng | Quản đốc phân xưởng | [UC-06_RET-02.md](file:///c:/MMS/docs/03-use-cases/UC-06_RET-02.md) |
| **RET-03** | Kiểm Đếm & Xác Nhận Nhập Trả Hàng Vào Kho Trên PDA | Thủ kho | [UC-25_RET-03.md](file:///c:/MMS/docs/03-use-cases/UC-25_RET-03.md) |

---

## 3. Nhóm Kiểm Định Chất Lượng (QC / KCS)

| Mã Use Case | Tên Chức Năng | Tác Nhân | File Đặc Tả |
| :--- | :--- | :--- | :--- |
| **QC-01** | Tiếp Nhận Danh Sách Lô Chờ Kiểm Định (QC Queue) | Nhân viên QC | [UC-12_QC-01.md](file:///c:/MMS/docs/03-use-cases/UC-12_QC-01.md) |
| **QC-02** | Thiết Lập Tiêu Chí Kỹ Thuật & Phương Pháp Lấy Mẫu AQL | Trưởng nhóm QC | [UC-12_QC-02.md](file:///c:/MMS/docs/03-use-cases/UC-12_QC-02.md) |
| **QC-03** | Nhập Kết Quả Đo Lường & Biên Bản Lỗi Kỹ Thuật | Nhân viên QC | [UC-13_QC-03.md](file:///c:/MMS/docs/03-use-cases/UC-13_QC-03.md) |
| **QC-04** | Phê Duyệt Kết Luận QC Pass / QC Reject | Trưởng bộ phận QC | [UC-14_QC-04.md](file:///c:/MMS/docs/03-use-cases/UC-14_QC-04.md) |
| **QC-05** | In Tem Nhãn Trạng Thái QC (QC Pass / Reject) | Nhân viên QC | [UC-26_QC-05.md](file:///c:/MMS/docs/03-use-cases/UC-26_QC-05.md) |
| **QC-06** | Quản Lý Kho Cách Ly & Trả Hàng NCC Không Đạt | QC / Thủ kho | [UC-26_QC-06.md](file:///c:/MMS/docs/03-use-cases/UC-26_QC-06.md) |

---

## 4. Nhóm Quản Lý Vị Trí Ô Kệ & Sơ Đồ Kho (LOC)

| Mã Use Case | Tên Chức Năng | Tác Nhân | File Đặc Tả |
| :--- | :--- | :--- | :--- |
| **LOC-01** | Quản Lý Danh Mục 540 Vị Trí Ô Kệ Kho | Quản lý kho | [UC-11_LOC-01.md](file:///c:/MMS/docs/03-use-cases/UC-11_LOC-01.md) |
| **LOC-02** | Sơ Đồ Trực Quan 2D Mặt Đứng Kho Theo Ô Kệ | Thủ kho / Lãnh đạo | [UC-11_LOC-02.md](file:///c:/MMS/docs/03-use-cases/UC-11_LOC-02.md) |
| **LOC-03** | Cảnh Báo Dung Tích, Sức Chứa & Trọng Tải Quá Mức | Thủ kho | [UC-11_LOC-03.md](file:///c:/MMS/docs/03-use-cases/UC-11_LOC-03.md) |
| **LOC-04** | Khóa & Mở Khóa Ô Kệ Bảo Trì & Kiểm Kê | Quản lý kho | [UC-11_LOC-04.md](file:///c:/MMS/docs/03-use-cases/UC-11_LOC-04.md) |

---

## 5. Nhóm Quản Lý Tồn Kho, Tách Lô, Gia Phả & Kiểm Kê (INV & CYCLE COUNT)

| Mã Use Case | Tên Chức Năng | Tác Nhân | File Đặc Tả |
| :--- | :--- | :--- | :--- |
| **INV-01** | Tra Cứu Tồn Kho Tổng Hợp Theo Mã Vật Tư (17,476 SKU) | Thủ kho / Kế toán | [UC-17_INV-01.md](file:///c:/MMS/docs/03-use-cases/UC-17_INV-01.md) |
| **INV-02** | Tra Cứu Tồn Kho Chi Tiết Theo Lô (11,665 Lô) | Thủ kho / QC | [UC-17_INV-02.md](file:///c:/MMS/docs/03-use-cases/UC-17_INV-02.md) |
| **INV-03** | Điều Chuyển Vị Trí Tồn Kho Nội Bộ Giữa Các Ô Kệ | Nhân viên kho (PDA) | [UC-17_INV-03.md](file:///c:/MMS/docs/03-use-cases/UC-17_INV-03.md) |
| **INV-06** | Tách Lô (Split Batch) & Quản Lý Thùng Lẻ Trong Kho | Thủ kho / Đếm hàng | [UC-18_INV-06.md](file:///c:/MMS/docs/03-use-cases/UC-18_INV-06.md) |
| **INV-07** | Sơ Đồ Cây Gia Phả Lô (Genealogy Tree Lô Mẹ - Lô Con) | Thủ kho / Quản lý | [UC-18_INV-07.md](file:///c:/MMS/docs/03-use-cases/UC-18_INV-07.md) |
| **INV-08** | Lập Kế Hoạch Kiểm Kê Tồn Kho Định Kỳ & Đếm Mù | Trưởng phòng kho | [UC-27_INV-08.md](file:///c:/MMS/docs/03-use-cases/UC-27_INV-08.md) |
| **INV-09** | Kiểm Đếm Thực Địa Trên PDA, Đếm Từng Thùng & Chốt Sổ Cái | Nhân viên kiểm kê | [UC-27_INV-09.md](file:///c:/MMS/docs/03-use-cases/UC-27_INV-09.md) |

---

## 6. Nhóm Đề Nghị, Phê Duyệt, Soạn Hàng & Xuất Kho (OUT)

| Mã Use Case | Tên Chức Năng | Tác Nhân | File Đặc Tả |
| :--- | :--- | :--- | :--- |
| **OUT-01** | Đăng Ký Đề Nghị Xuất Kho Theo Định Mức BOM | Nhân viên phân xưởng | [UC-19_OUT-01.md](file:///c:/MMS/docs/03-use-cases/UC-19_OUT-01.md) |
| **OUT-02** | Đăng Ký Đề Nghị Xuất Kho Ngoài Định Mức (Đột Xuất) | Kỹ thuật / Bảo trì | [UC-20_OUT-02.md](file:///c:/MMS/docs/03-use-cases/UC-20_OUT-02.md) |
| **OUT-03** | Đăng Ký Đề Nghị Xuất Kho Vượt Định Mức | Phân xưởng / Kế hoạch | [UC-20_OUT-03.md](file:///c:/MMS/docs/03-use-cases/UC-20_OUT-03.md) |
| **OUT-04** | Tiếp Nhận & Thẩm Tra Danh Sách Đề Nghị Xuất Kho | Thủ kho | [UC-21_OUT-04.md](file:///c:/MMS/docs/03-use-cases/UC-21_OUT-04.md) |
| **OUT-05** | Phê Duyệt Đề Nghị Xuất Kho Đa Cấp | Quản Đốc / Ban Giám Đốc | [UC-24_OUT-05.md](file:///c:/MMS/docs/03-use-cases/UC-24_OUT-05.md) |
| **OUT-06** | Lập Danh Sách Soạn Hàng & Phân Bổ Lộ Trình Picking | Thủ kho / PDA | [UC-22_OUT-06.md](file:///c:/MMS/docs/03-use-cases/UC-22_OUT-06.md) |
| **OUT-07** | Quét Barcode & Soạn Hàng Theo Lô (Batch) Trên PDA | Nhân viên soạn hàng | [UC-22_OUT-07.md](file:///c:/MMS/docs/03-use-cases/UC-22_OUT-07.md) |
| **OUT-08** | Hoàn Tất Soạn Hàng, Chốt Xuất Kho & Hạch Toán Sổ Cái | Thủ kho | [UC-23_OUT-08.md](file:///c:/MMS/docs/03-use-cases/UC-23_OUT-08.md) |
| **OUT-09** | In Phiếu Xuất Kho (PXK) & Bàn Giao Vật Tư Phân Xưởng | Thủ kho / Phân xưởng | [UC-23_OUT-09.md](file:///c:/MMS/docs/03-use-cases/UC-23_OUT-09.md) |
