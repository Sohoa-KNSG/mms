# Kế Hoạch Triển Khai UC-09: Thực Hiện Thủ Tục Nhập Kho (INB-07)

- **Mã Use Case**: `UC-09` / `INB-07`: Thực hiện thủ tục nhập kho (Warehouse Receipt Finalization).
- **Mục tiêu**: Thủ kho kiểm tra danh sách hàng đợi các phiếu nhận hàng đã đạt kiểm tra chất lượng QC (`status_nhap = '4'` - Đã kiểm QC), chọn số lượng nhập kho thực tế cho từng dòng vật tư, thực hiện chốt nhập kho chính thức, tự động sinh mã chứng từ giao dịch kho `IN_PO` (`dbo.tbl_phieu_transaction`), sinh các lô hàng tồn kho (`dbo.tbl_batch_inv`), và chuyển trạng thái phiếu nhận thành hoàn tất (`status_nhap = '5'`).
- **Database Đích**: `10.17.16.106` (`Database=MMS1`, User `codex1` / `123`).
- **Endpoints API**:
  - `GET /api/v1/receiving/warehouse-queue`: Danh sách hàng đợi phiếu nhận chờ thủ kho nhập kho kèm danh sách dòng hàng.
  - `POST /api/v1/receiving/receipts/{receiptId}/warehouse`: Xác nhận nhập kho chính thức cho các dòng hàng đã chọn.
  - `GET /api/v1/receiving/batch-labels`: Lấy dữ liệu tem nhãn Batch vừa sinh để in ấn dán kiện.

---

## 1. Yêu Cầu Nghiệp Vụ & Quy Tắc Ràng Buộc (Business Rules)

1. **Điều Kiện Phiếu Nhập Kho (`INB-07`)**:
   - Phiếu nhận hàng phải ở trạng thái đã kiểm định QC (`status_nhap = '4'`).
   - Các dòng vật tư được nhập kho phải có kết quả kiểm tra chất lượng đạt (`ket_qua_qc = '1'` hoặc không thuộc diện kiểm tra bắt buộc) và số lượng nhập $\le$ (Số lượng thực nhận - Số lượng đã sinh batch).
2. **Quy Trình Xử Lý CSDL Khi Chốt Nhập Kho**:
   - Tạo chứng từ giao dịch kho trong `dbo.tbl_phieu_transaction` (`nghiep_vu = 'IN_PO'`, `trang_thai_phieu = '1'`, `ma_kho_from = kho`, `ma_kho_to = khach_hang`).
   - Tự động sinh các bản ghi lô hàng tồn kho trong `dbo.tbl_batch_inv` (`trang_thai_ton = '1'` - Tồn kho khả dụng, `id_nhanhang = line.id_nhanhang`).
   - Cập nhật trạng thái phiếu `dbo.tbl_phieu_nhan_hang.status_nhap = '5'` (Đã nhập kho xong) hoặc giữ `'4'` nếu mới chỉ nhập một phần số lượng.
   - Ghi nhật ký lịch sử vào `dbo.tbl_his_phieunhap` (`action_type = 'NHAP_KHO'`).

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

### A. Tầng Dịch Vụ API Frontend (`apps/web/src/services/receivingService.ts`)
- Bổ sung các hàm gọi API:
  - `getWarehouseReceiptQueue(search, receiptId, page, pageSize)`
  - `processWarehouseReceipt(receiptId, request)`
  - `getBatchLabels(receiptId, transactionDocumentId, batchId)`

### B. Tầng Giao Diện Người Dùng (`apps/web/src/components/ReceivingModule.tsx`)
- Thêm Tab **"Thủ Tục Nhập Kho (UC-09)"** trong phân hệ Quản Lý Nhận Hàng:
  - **Danh sách hàng đợi chờ nhập kho**: Hiển thị các phiếu nhận đã có kết quả QC đạt.
  - **Form xác nhận nhập kho chi tiết theo từng dòng**:
    - Hiển thị: Mã vật tư, Tên hàng, Số lượng thực nhận, Đã nhập kho, Còn lại chờ nhập, Kết quả QC.
    - Ô nhập số lượng thực tế nhập kho.
    - Tùy chọn in tem mã vạch Batch ngay sau khi nhập kho thành công.
  - **Modal Kết Quả Nhập Kho & In Tem Nhãn**:
    - Hiển thị mã phiếu giao dịch kho (`TransactionDocumentId`), số lượng batch vừa tạo, và nút in tem mã vạch hàng loạt.

### C. Cập Nhật CSDL & Stored Procedures trên `MMS1`
- Đảm bảo SP `api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1` và `api.usp_WMS_INB07_ProcessWarehouseReceipt_v1` hoạt động chuẩn xác trên dữ liệu thực tế `MMS1`.
- Kiểm tra tính tương thích của bảng `dbo.tbl_batch_inv`, `dbo.tbl_phieu_transaction`, `dbo.tbl_transaction`.

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

1. **Kiểm thử API & SP trên CSDL `MMS1`**:
   - Chọn 1 phiếu nhận hàng có `status_nhap = '4'` trên `MMS1` (hoặc tạo phiếu mẫu đạt QC).
   - Thực hiện gọi API `POST /api/v1/receiving/receipts/{receiptId}/warehouse` để nhập kho.
   - Kiểm tra `dbo.tbl_phieu_transaction`, `dbo.tbl_batch_inv`, `dbo.tbl_phieu_nhan_hang` và `dbo.tbl_his_phieunhap`.
2. **Kiểm thử giao diện & Build**:
   - Chạy `pnpm run build --filter @mms/web` đảm bảo 0 lỗi.
   - Viết báo cáo `docs/history/UC-09_Walkthrough.md` và cập nhật `DEPLOYMENT_HISTORY.md`.
