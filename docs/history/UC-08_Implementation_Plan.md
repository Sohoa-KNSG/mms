# Kế Hoạch Triển Khai UC-08: Cập Nhật & Ghép Nhiều Đơn PO Cho Phiếu Nhận Hàng (INB-06)

- **Mã Use Case**: `UC-08` / `INB-06` (Cập nhật nhiều PO / Multi-PO Attachment).
- **Mục tiêu**: Cho phép một phiếu nhận hàng không PO (hàng mẫu, giao khẩn nhiều đợt) được đối soát và gắn kết đồng thời vào **nhiều đơn PO khác nhau** thuộc cùng một nhà cung cấp khi đơn PO chính thức được phát hành.
- **Database Đích**: CSDL MMS1.
- **Endpoint API**:
  - `GET /api/v1/receiving/receipts/{receiptId}/purchase-order-matches`: Tự động tìm kiếm các PO phù hợp với danh sách vật tư của phiếu.
  - `PUT /api/v1/receiving/receipts/{receiptId}/purchase-orders`: Xác nhận gắn nhiều PO và lưu `ma_po = 'nhieu_po'`, ghi nhật ký hành động `MULTI_PO`.
- **Stored Procedures**:
  - `api.usp_WMS_INB06_GetPurchaseOrderMatches_v1`: Truy vấn các dòng PO khớp vật tư và còn số lượng dư.
  - `api.usp_WMS_INB06_AttachMultiplePurchaseOrders_v1`: Cập nhật nguyên tử giao dịch nhiều PO.

---

## 1. Yêu Cầu Nghiệp Vụ & Quy Tắc Ràng Buộc (Business Rules)

1. **Điều kiện đối soát nhiều PO (`INB-06`)**:
   - Phiếu nhận phải là phiếu nhận tạm `ma_po = 'khong_po'` và đang ở trạng thái chờ kiểm `status_nhap = '2'`.
   - Mỗi dòng nhận phải được ánh xạ chính xác vào một dòng PO (`PurchaseOrderKey`), đúng mã vật tư (`Ma_hang_hoa`) và không vượt quá số lượng còn lại của PO.
   - **Quy tắc nhiều PO**: Phải có **tối thiểu 2 mã PO khác nhau** được gán trong cùng một phiếu (nếu chỉ 1 PO thì chuyển qua luồng UC-05).
   - **Quy tắc NCC duy nhất**: Tất cả các PO được gán phải thuộc về **cùng một nhà cung cấp / khách hàng**.
2. **Cập nhật dữ liệu CSDL**:
   - Trường `ma_po` trong `dbo.tbl_phieu_nhan_hang` được cập nhật thành **`N'nhieu_po'`**.
   - Trường `khach_hang` được cập nhật theo mã NCC của các PO.
   - Cập nhật trường `ma_khoa_chinh` cho từng dòng tương ứng trong `dbo.tbl_chitiet_nhanhang`.
   - Ghi audit log vào `dbo.tbl_his_phieunhap` với `action_type = N'MULTI_PO'`.

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

### A. Tầng Dịch Vụ API Frontend (`apps/web/src/services/receivingService.ts`)
- Thêm interface:
  - `PoMatchCandidate`: Dòng PO gợi ý khớp vật tư.
  - `PoMatchResult`: Danh sách dòng nhận và các PO ứng viên gợi ý.
  - `AttachMultiplePoRequest`: Payload gửi danh sách ghép nhiều PO.
- Thêm methods:
  - `getPurchaseOrderMatches(receiptId, search)`: Gọi `GET /api/v1/receiving/receipts/{receiptId}/purchase-order-matches`.
  - `attachMultiplePurchaseOrders(receiptId, request)`: Gọi `PUT /api/v1/receiving/receipts/{receiptId}/purchase-orders`.

### B. Tầng Giao Diện Người Dùng (`apps/web/src/components/ReceivingModule.tsx`)
- Tích hợp thêm chế độ **"Ghép Nhiều PO (UC-08)"** trong Tab "Đối Soát PO":
  - Cho phép người dùng chuyển đổi linh hoạt giữa:
    - **Ghép 1 PO (UC-05)**: Cho các phiếu đối soát với 1 đơn đặt hàng.
    - **Ghép Nhiều PO (UC-08)**: Cho các phiếu có nhiều dòng vật tư thuộc các đơn PO khác nhau của cùng nhà cung cấp.
  - Tự động gọi `getPurchaseOrderMatches` để hiển thị danh sách các PO tiềm năng khớp với từng dòng vật tư.
  - Cảnh báo trực quan nếu chưa đủ 2 PO hoặc các PO không cùng NCC.
  - Nút **"Xác Nhận Gắn Nhiều PO (UC-08)"** thực hiện cập nhật và làm mới dữ liệu.

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

1. **Kiểm thử API & SP trên CSDL `MMS1`**:
   - Tạo một phiếu nhận hàng không PO có 2 dòng vật tư khác nhau.
   - Gọi `GET /api/v1/receiving/receipts/{receiptId}/purchase-order-matches` để lấy danh sách PO ứng viên.
   - Gọi `PUT /api/v1/receiving/receipts/{receiptId}/purchase-orders` gán 2 PO khác nhau cùng NCC.
   - Kiểm tra `dbo.tbl_phieu_nhan_hang` có `ma_po = 'nhieu_po'` và `status_nhap = '2'`.
2. **Kiểm thử giao diện & Build**:
   - Chạy `pnpm run build --filter @mms/web` đảm bảo 0 lỗi.
   - Tạo file báo cáo `docs/history/UC-08_Walkthrough.md` và cập nhật `DEPLOYMENT_HISTORY.md`.
