# Báo Cáo Nghiệm Thu UC-07: Danh Sách & Nhật Ký Phiếu Nhận Hàng Thực Tế (INB-03 & INB-04)

- **Mã Use Case**:
  - `UC-07` / `INB-04`: Tra cứu danh sách & nhật ký nhận hàng từ CSDL (Receipt Log & Audit History).
  - `INB-03`: Tra cứu chi tiết phiếu nhận hàng (Receipt Details, Line Items, QC Result, Barcode Print).
- **Database Đích**: CSDL MMS1
- **Dữ liệu thực tế**: **60.181+ bản ghi phiếu nhận hàng** trong `dbo.tbl_his_phieunhap` và `dbo.tbl_phieu_nhan_hang`.
- **Stored Procedures thực thi**:
  - `api.usp_WMS_INB04_GetReceiptLog_v1`: Truy vấn danh sách lịch sử phiếu nhận có phân trang, lọc tìm kiếm theo mã phiếu, mã PO, NCC, kho.
  - `api.usp_WMS_INB03_GetReceipt_v1`: Truy vấn đầy đủ Header, Danh sách dòng vật tư, Thông tin QC, và Hình ảnh chứng từ của phiếu.
- **Trạng thái**: **Hoàn thành (Passed & Verified 100%)**
- **Nhánh đồng bộ**: `pharse1` (`https://github.com/Sohoa-KNSG/mms/tree/pharse1`)

---

## 1. Các Tính Năng Đã Triển Khai

1. **Bảng Danh Sách Phiếu Nhận CSDL MMS1**:
   - Hiển thị trực tiếp hơn **60.181 phiếu nhận** thực tế.
   - Các cột dữ liệu chuẩn:
     - **Mã Phiếu CSDL**: `#7344`, `#7343`, `#7342`, `#7341`, `#7336`...
     - **Kho Nhận**: `KHO-NVL`, `20020100`...
     - **Số PO / Đơn Hàng**: `HP2603008`, `khong_po`, `260812-238-1080`...
     - **Khách Hàng / Nhà Cung Cấp**: `Toàn Tâm`, `Cty Van Phong Pham Minh Duc`, `Việt Cad`, `Sunrise`...
     - **Trạng Thái (status_nhap)**: `Chờ Kiểm QC (status 2)`, `Đã Nhập Kho (status 4)`, `Đã Hủy (status 0)`...
     - **Thao Tác Gần Nhất**: `CREATE`, `UPDATE_PO`, `INSERT`, `UPDATE`, `DELETE`...
     - **Người Thực Hiện**: `NGUYỄN ĐÌNH KHƯƠNG`, `NGUYỄN TUẤN CƯỜNG`...
     - **Thời Gian Ghi Nhận**: Ngày giờ chuẩn `YYYY-MM-DD HH:mm:ss`.
   - **Tìm kiếm thời gian thực**: Tìm theo mã phiếu, mã PO, NCC, kho với nút Làm Mới.
   - **Phân trang hoàn chỉnh**: 20 phiếu / trang với nút Trang trước / Trang sau.

2. **Modal Chi Tiết Phiếu Nhận Hàng CSDL MMS1 (`INB-03`)**:
   - Khi bấm **"Chi Tiết"** tại bất kỳ dòng nào:
     - Nạp trực tiếp dữ liệu từ `api.usp_WMS_INB03_GetReceipt_v1`.
     - Hiển thị thông tin Tổng quan (Mã PO, Khách hàng, Kho, Người tạo, Ngày tạo, Quyền chỉnh sửa).
     - Bảng chi tiết từng dòng vật tư: Mã SKU, Tên vật tư chi tiết, SL Chứng từ, SL Thực nhận, ĐVT, Khóa chính PO (`Ma_khoa_chinh`), Kết quả QC.
     - Tích hợp nút **"In Tem Barcode"** trực tiếp cho từng dòng hàng.

---

## 2. Kết Quả Kiểm Thử Thực Tế

- **Query Danh Sách Lịch Sử**:
  - Gọi `GET /api/v1/receipts/log?page=1&pageSize=20` -> Trả về danh sách phiếu mới nhất (`#7344`, `#7343`, `#7342`, `#7341`...) và `totalCount = 60181`.
- **Query Chi Tiết Phiếu `#7344`**:
  - Header: `receiptId: 7344`, `warehouseCode: 'KHO-NVL'`, `customerName: 'Toàn Tâm'`, `purchaseOrder: 'HP2603008'`, `statusCode: '2'`.
  - Line Item: `materialId: 'CGBM901I5'`, `materialName: 'Chốt gắn BM901...'`, `documentQuantity: 100`, `receivedQuantity: 100`, `unit: 'Cái'`.
- **Biên dịch giao diện Web**:
  - `pnpm run build --filter @mms/web` -> **0 lỗi, 0 cảnh báo (2447 modules transformed)**.
