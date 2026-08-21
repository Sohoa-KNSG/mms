# Kế Hoạch Triển Khai UC-03: Tạm Nhận Hàng Theo PO (Inbound Receiving)

Tài liệu này chi tiết hóa kế hoạch triển khai **UC-03 (Đặc tả INB-01 / UC01)**: Kết nối giao diện Nhận hàng Inbound với hơn 5.400 đơn đặt hàng PO thực tế trên CSDL `MMS1` và thực thi Stored Procedure `api.usp_WMS_INB01_GetPurchaseOrders_v1` & `api.usp_WMS_INB01_CreateReceiptWithPo_v1`.

---

## 1. Yêu Cầu Nghiệm Thu (User Review Required)

> [!IMPORTANT]
> - **Dữ liệu PO thực tế**: Tải trực tiếp danh sách PO đang mở và còn số lượng nhận từ bảng `dbo.tbl_ChiTietDDH` trên CSDL `MMS1`.
> - **Quy trình nhận hàng**:
>   1. Tìm kiếm PO theo Mã đơn hàng, Tên nhà cung cấp, Mã vật tư.
>   2. Chọn PO -> Hiển thị danh sách các mặt hàng chi tiết (Số lượng đặt, Đã nhận, Còn lại).
>   3. Nhập số lượng thực nhận, chọn Kho nhận (`KHO-NVL`, `KHO-TONG`, v.v.).
>   4. Bấm **"Tạo Phiếu Nhận Hàng"** -> Gọi `POST /api/v1/receiving/receipts/with-po` ghi nhận nguyên tử vào các bảng `tbl_phieu_nhan_hang`, `tbl_chitiet_nhanhang` và `tbl_his_chitiet_nhanhang`.
>   5. Hiển thị thông báo thành công kèm Mã phiếu nhận (Receipt ID) và tùy chọn In nhãn mã vạch.

---

## 2. Các Thay Đổi Dự Kiến Triển Khai (Proposed Changes)

### A. Tầng Dịch Vụ API Frontend (Services)
- **[NEW] apps/web/src/services/receivingService.ts**:
  - `getPurchaseOrders(search, page, pageSize)`: Gọi `GET /api/v1/receiving/purchase-orders`.
  - `createReceiptWithPo(data)`: Gọi `POST /api/v1/receiving/receipts/with-po`.
  - `getWarehouses()`: Danh sách kho nhận hàng thực tế từ `dbo.tbl_dm_kho`.

### B. Tầng Giao Diện Nhận Hàng (Components)
- **[MODIFY] apps/web/src/components/ReceivingModule.tsx**:
  - Tích hợp tab **"1. Nhận Hàng Theo PO (UC-03)"** với dữ liệu thực tế từ API.
  - Bộ lọc tìm kiếm PO nhanh và phân trang.
  - Bảng chọn dòng vật tư, kiểm soát không cho nhận vượt quá số lượng còn lại (`RemainingQuantity`).
  - Modal xác nhận tạo phiếu và hiển thị kết quả biên lai nhận hàng.

---

## 3. Kế Hoạch Kiểm Thử (Verification Plan)

### Kiểm Thử Tự Động & Build
1. Kiểm tra build frontend: `pnpm run build --filter @mms/web`.
2. Kiểm tra typecheck TypeScript: `tsc -b`.

### Kiểm Thử Chức Năng (Manual Verification)
1. Mở phân hệ **1. Nhận Hàng (Inbound)** -> Chọn PO thực tế (ví dụ `DSM2604604-FT3` hoặc `HP2601013`).
2. Nhập số lượng thực nhận -> Bấm **"Xác nhận nhận hàng"**.
3. Kiểm tra mã phiếu nhận sinh ra trên CSDL `MMS1` trong bảng `dbo.tbl_phieu_nhan_hang`.
