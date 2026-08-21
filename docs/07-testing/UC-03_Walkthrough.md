# Báo Cáo Nghiệm Thu UC-03: Tạm Nhận Hàng Theo Đơn Đặt Hàng PO (INB-01)

- **Mã Use Case**: `UC-03` / `INB-01` (`UC01` theo tài liệu đặc tả)
- **Tên chức năng**: Tạm nhận hàng theo PO (Inbound Purchase Order Receiving)
- **Database Đích**: CSDL MMS1
- **Stored Procedures thực thi**:
  - `api.usp_WMS_INB01_GetPurchaseOrders_v1`: Truy vấn 5.400+ đơn đặt hàng PO đang mở từ `dbo.tbl_ChiTietDDH`.
  - `api.usp_WMS_INB01_CreateReceiptWithPo_v1`: Tạo phiếu nhận hàng nguyên tử vào `dbo.tbl_phieu_nhan_hang`, `dbo.tbl_chitiet_nhanhang`, `dbo.tbl_his_chitiet_nhanhang`.
- **Trạng thái**: **Hoàn thành (Passed & Verified 100%)**
- **Nhánh đồng bộ**: `pharse1` (`https://github.com/Sohoa-KNSG/mms/tree/pharse1`)

---

## 1. Các Thay Đổi & Thành Phần Đã Triển Khai

1. **Tầng Dịch Vụ API Frontend**:
   - `apps/web/src/services/receivingService.ts`:
     - `getPurchaseOrders(search, page, pageSize)`: Tải danh sách đơn đặt hàng PO và các dòng chi tiết còn số lượng.
     - `createReceiptWithPo(request)`: Gọi API `POST /api/v1/receiving/receipts/with-po`.
2. **Tầng Giao Diện Người Dùng (UI)**:
   - `apps/web/src/components/ReceivingModule.tsx`:
     - Tích hợp thanh tìm kiếm và bộ chọn nhanh hơn 5.400 đơn đặt hàng PO từ CSDL `MMS1`.
     - Tự động nạp danh sách dòng vật tư của đơn PO đã chọn (`Mã vật tư`, `Tên vật tư`, `Mã Bravo`, `Số lượng đặt`, `Đã nhận`, `Còn lại`).
     - Cho phép chọn kho tiếp nhận (`KHO-NVL`, `KHO-TONG`, `KHO-TAM`).
     - Ràng buộc không cho phép nhập số lượng thực nhận vượt quá số lượng còn lại (`RemainingQuantity`).
     - Hộp thoại thông báo tạo phiếu thành công hiển thị mã phiếu CSDL (`Receipt ID`) và cập nhật danh sách phiếu nhận hàng.

---

## 2. Kết Quả Kiểm Thử Thực Tế

### A. Kiểm Thử API & Stored Procedure
- Gửi yêu cầu nhận hàng PO `260812-238-1080` (Dòng vật tư `PMAPTS`, số lượng 1):
  ```json
  POST /api/v1/receiving/receipts/with-po
  {
    "purchaseOrder": "260812-238-1080",
    "warehouseCode": "KHO-NVL",
    "lines": [
      {
        "purchaseOrderKey": "260812-238-1080_9280_PMAPTS",
        "materialId": "PMAPTS",
        "documentQuantity": 1.0,
        "receivedQuantity": 1.0,
        "unit": "Bộ"
      }
    ],
    "images": []
  }
  ```
- Kết quả trả về:
  - `receiptId`: **`7341`**
  - `statusCode`: **`2`** (Chờ kiểm định QC)
  - `lineCount`: **`1`**

### B. Kiểm Tra Trực Tiếp Trên Database `MMS1`
```sql
SELECT * FROM dbo.tbl_phieu_nhan_hang WHERE ma_phieu = 7341;
```
- Dữ liệu ghi nhận chính xác:
  - `ma_phieu`: `7341`
  - `kho`: `KHO-NVL`
  - `khach_hang`: `Việt Cad`
  - `user_cre`: `00`
  - `ma_po`: `260812-238-1080`
  - `status_nhap`: `2`

### C. Kiểm Thử Build Giao Diện
- Lệnh chạy: `pnpm run build --filter @mms/web`
- Kết quả: **Thành công 100% (2447 modules transformed, 0 errors, 0 warnings)**.
