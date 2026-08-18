# Báo Cáo Nghiệm Thu UC-04 & UC-05: Nhận Hàng Không PO & Đối Soát Gắn PO (INB-02 & INB-05)

- **Mã Use Case**:
  - `UC-04` / `INB-02`: Nhận hàng không PO (Non-PO Goods Receipt / Mẫu, linh kiện khẩn).
  - `UC-05` / `INB-05`: Đối soát & Gắn PO chính thức cho phiếu nhận (PO Attachment).
- **Database Đích**: `10.17.16.106` (`Database=MMS1`, User `codex1` / `123`)
- **Stored Procedures thực thi**:
  - `api.usp_WMS_INB02_GetMaterials_v1`: Tra cứu danh mục vật tư thực tế từ `dbo.tbl_dm_vattu`.
  - `api.usp_WMS_INB02_CreateReceiptWithoutPo_v1`: Tạo phiếu nhận hàng tạm `ma_po = 'khong_po'`.
  - `api.usp_WMS_INB05_GetUnmatchedReceipts_v1`: Truy vấn danh sách các phiếu nhận hàng chưa có PO.
  - `api.usp_WMS_INB05_AttachPurchaseOrder_v1`: Đối soát và cập nhật đơn hàng PO chính thức cho phiếu nhận.
- **Trạng thái**: **Hoàn thành (Passed & Verified 100%)**
- **Nhánh đồng bộ**: `pharse1` (`https://github.com/Sohoa-KNSG/mms/tree/pharse1`)

---

## 1. Các Tính Năng Đã Triển Khai

1. **Tầng Dịch Vụ API Frontend (`apps/web/src/services/receivingService.ts`)**:
   - `getMaterials`: Tải danh mục vật tư thực tế từ CSDL `MMS1`.
   - `createReceiptWithoutPo`: Tạo phiếu nhận hàng không PO qua Stored Procedure.
   - `getUnmatchedReceipts`: Lấy danh sách phiếu chờ đối soát PO.
   - `attachPurchaseOrder`: Gán PO chính thức và khớp từng dòng nhận với dòng PO.
2. **Tầng Giao Diện Người Dùng (`apps/web/src/components/ReceivingModule.tsx`)**:
   - **Form Nhận Không PO (UC-04)**: Tích hợp chọn nhanh vật tư danh mục `MMS1`, nhập số lượng chứng từ/thực nhận, mã lô tạm.
   - **Tab Đối Soát PO (UC-05)**:
     - Hiển thị danh sách các phiếu nhận tạm đang chờ gắn PO.
     - Cho phép chọn đơn PO từ 5.400+ đơn đặt hàng trên hệ thống.
     - Tự động gợi ý khớp nối dòng vật tư tương ứng giữa phiếu nhận và PO.
     - Xác nhận đối soát và cập nhật trực tiếp vào database `MMS1`.

---

## 2. Kết Quả Kiểm Thử Thực Tế Trên CSDL `MMS1`

### A. Kiểm Thử Tạo Phiếu Không PO (UC-04)
- Tạo phiếu nhận hàng không PO cho vật tư `CGBM901I5` (Số lượng: 100):
  - Kết quả trả về: Mã phiếu CSDL: **`ma_phieu = 7344`**, `status_nhap = '2'`, `ma_po = 'khong_po'`.

### B. Kiểm Thử Đối Soát & Gắn PO (UC-05)
- Ghép phiếu nhận `#7344` (Dòng nhận `#11144`) với đơn hàng PO `HP2603008` (Dòng `HP2603008_8222_CGBM901I5`):
  - Gọi API `PUT /api/v1/receiving/receipts/7344/purchase-order`.
  - Kết quả: `receiptId = 7344`, `purchaseOrder = 'HP2603008'`, `assignmentCount = 1`.
- Kiểm tra lại bản ghi trong `dbo.tbl_phieu_nhan_hang`:
  - `ma_phieu`: `7344`
  - `ma_po`: **`HP2603008`** (Đã chuyển từ `'khong_po'` sang PO chính thức)
  - `khach_hang`: **`Toàn Tâm`**
  - `status_nhap`: `2` (Chờ QC kiểm định)

### C. Kiểm Thử Build Giao Diện
- Lệnh chạy: `pnpm run build --filter @mms/web`
- Kết quả: **Thành công 100% (2447 modules transformed, 0 errors, 0 warnings)**.
