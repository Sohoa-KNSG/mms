# Báo Cáo Nghiệm Thu UC-08: Cập Nhật & Ghép Nhiều PO Cho Phiếu Nhận Hàng (INB-06)

- **Mã Use Case**: `UC-08` / `INB-06` (Cập nhật nhiều PO / Multi-PO Attachment).
- **Mục tiêu**: Cho phép một phiếu nhận hàng không PO (hàng mẫu, giao khẩn nhiều đợt) được đối soát và gắn kết đồng thời vào **nhiều đơn PO khác nhau** thuộc cùng một nhà cung cấp khi đơn PO chính thức được phát hành.
- **Database Đích**: CSDL MMS1.
- **Endpoint API**:
  - `GET /api/v1/receiving/receipts/{receiptId}/purchase-order-matches`: Tự động tìm kiếm các PO phù hợp với danh sách vật tư của phiếu.
  - `PUT /api/v1/receiving/receipts/{receiptId}/purchase-orders`: Xác nhận gắn nhiều PO và lưu `ma_po = 'nhieu_po'`, ghi nhật ký hành động `MULTI_PO`.
- **Stored Procedures**:
  - `api.usp_WMS_INB06_GetPurchaseOrderMatches_v1`: Truy vấn các dòng PO khớp vật tư và còn số lượng dư.
  - `api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1`: Cập nhật nguyên tử giao dịch nhiều PO.
- **Trạng thái**: **Hoàn thành (Passed & Verified 100%)**
- **Nhánh đồng bộ**: `pharse1` (`https://github.com/Sohoa-KNSG/mms/tree/pharse1`)

---

## 1. Các Tính Năng Đã Triển Khai

1. **Bộ Điều Khiển Chuyển Đổi Chế Độ Đối Soát PO**:
   - Tích hợp 2 chế độ trực quan:
     - `🔗 Ghép 1 PO (UC-05)`: Ghép toàn bộ phiếu với 1 mã PO.
     - `📑 Ghép Nhiều PO (UC-08)`: Ghép từng dòng nhận vào các PO khác nhau.
2. **Gợi Ý PO Tự Động Theo Từng Dòng Vật Tư**:
   - Khi chọn phiếu nhận tạm không PO, hệ thống tự động gọi `getPurchaseOrderMatches` để lọc các đơn PO khớp mã vật tư và còn số lượng đặt hàng (`RemainingQuantity >= ReceivedQuantity`).
3. **Kiểm Soát Ràng Buộc Nghiệp Vụ Chặt Chẽ (Business Rules)**:
   - Yêu cầu ánh xạ đủ tất cả các dòng nhận.
   - Yêu cầu tối thiểu **2 mã PO khác nhau** trong cùng 1 phiếu.
   - Kiểm tra tất cả các đơn PO phải thuộc **cùng một Nhà Cung Cấp / Khách Hàng**.
   - Bảng tổng kết trạng thái trực quan báo lỗi/hợp lệ trước khi cho phép bấm xác nhận.
4. **Cập Nhật Dữ Liệu Thực Tế Vào CSDL MMS1**:
   - Cập nhật `ma_po = N'nhieu_po'`, `status_nhap = N'2'`, `khach_hang = @CustomerCode` trong `dbo.tbl_phieu_nhan_hang`.
   - Cập nhật `ma_khoa_chinh` cho từng dòng vật tư trong `dbo.tbl_chitiet_nhanhang`.
   - Ghi nhật ký audit trong `dbo.tbl_his_phieunhap` với `action_type = N'MULTI_PO'`.

---

## 2. Kết Quả Kiểm Thử Thực Tế Trên CSDL MMS1

- **Tạo Phiếu Nhận Tạm Không PO `#7345`**:
  - Dòng 1: `CGBM901I5`, SL = 50 Cái.
  - Dòng 2: `CGBM903I3`, SL = 30 Cái.
- **Thực Hiện Đối Soát Ghép 2 PO Cùng NCC `Toàn Tâm`**:
  - Dòng 1 (`11145`): Gán PO `HP2603008` (Khóa: `HP2603008_8222_CGBM901I5`).
  - Dòng 2 (`11146`): Gán PO `HP2608007` (Khóa: `HP2608007_9176_CGBM903I3`).
- **Kết Quả CSDL Sau Khi Gắn PO**:
  - `dbo.tbl_phieu_nhan_hang`: `ma_phieu = 7345`, `ma_po = 'nhieu_po'`, `khach_hang = 'Toàn Tâm'`, `status_nhap = '2'`.
  - `dbo.tbl_chitiet_nhanhang`: `11145 -> HP2603008_8222_CGBM901I5`, `11146 -> HP2608007_9176_CGBM903I3`.
  - `dbo.tbl_his_phieunhap`: Bản ghi `his_id = 61799`, `action_type = 'MULTI_PO'`, `ma_po = 'nhieu_po'`.
- **Biên Dịch Giao Diện**:
  - `pnpm run build --filter @mms/web` -> **0 lỗi, 0 cảnh báo**.
