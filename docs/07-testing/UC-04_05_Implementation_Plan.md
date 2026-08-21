# Kế Hoạch Triển Khai UC-04 & UC-05: Nhận Hàng Không PO & Đối Soát Gắn PO

Tài liệu này chi tiết hóa kế hoạch triển khai kết hợp **UC-04 (Nhận hàng không PO - INB-02)** và **UC-05 (Đối soát & Gắn PO - INB-05)** trên CSDL `MMS1`.

---

## 1. Yêu Cầu Nghiệm Thu (User Review Required)

> [!IMPORTANT]
> - **UC-04 (Nhận hàng không PO / INB-02)**:
>   1. Tra cứu danh mục vật tư thực tế từ `GET /api/v1/receiving/materials` (CSDL `MMS1.dbo.tbl_dm_vattu`).
>   2. Nhập Nhà cung cấp/Đơn vị giao, chọn kho nhận, thêm danh sách dòng vật tư và số lượng.
>   3. Gọi `POST /api/v1/receiving/receipts/without-po` -> Lưu phiếu vào CSDL với `ma_po = 'khong_po'`, `status_nhap = '2'`.
>
> - **UC-05 (Đối soát & Gắn PO cho phiếu nhận / INB-05)**:
>   1. Tab **"Đối Soát & Gắn PO (UC-05)"** hiển thị danh sách các phiếu nhận hàng chưa có PO (`GET /api/v1/receiving/po-attachments/receipts`).
>   2. Chọn phiếu -> Hiển thị danh sách vật tư nhận thực tế.
>   3. Tìm và chọn đơn hàng PO phù hợp -> Khớp dòng vật tư PO.
>   4. Bấm **"Xác Nhận Gắn PO"** -> Gọi `PUT /api/v1/receiving/receipts/{receiptId}/purchase-order` (thực thi `api.usp_WMS_INB05_AttachPurchaseOrder_v1`).

---

## 2. Các Thay Đổi Dự Kiến Triển Khai (Proposed Changes)

### A. Tầng Dịch Vụ API Frontend (Services)
- **[MODIFY] apps/web/src/services/receivingService.ts**:
  - Bổ sung `getMaterials(search, page, pageSize)`: Gọi `GET /api/v1/receiving/materials`.
  - Bổ sung `createReceiptWithoutPo(request)`: Gọi `POST /api/v1/receiving/receipts/without-po`.
  - Bổ sung `getUnmatchedReceipts(search, page, pageSize)`: Gọi `GET /api/v1/receiving/po-attachments/receipts`.
  - Bổ sung `attachPurchaseOrder(receiptId, request)`: Gọi `PUT /api/v1/receiving/receipts/{receiptId}/purchase-order`.

### B. Tầng Giao Diện Nhận Hàng (Components)
- **[MODIFY] apps/web/src/components/ReceivingModule.tsx**:
  - Cập nhật luồng **"Nhận không PO (Mẫu / Khẩn)"** nạp vật tư từ CSDL `MMS1` và gửi yêu cầu tạo phiếu không PO.
  - Bổ sung Tab chuyên dụng **"Đối Soát PO (UC-05)"** cho phép xem phiếu chờ gắn PO và thực hiện ghép nối PO trực quan.

---

## 3. Kế Hoạch Kiểm Thử (Verification Plan)

### Kiểm Thử Tự Động & Build
1. Kiểm tra build frontend: `pnpm run build --filter @mms/web`.
2. Kiểm tra typecheck TypeScript: `tsc -b`.

### Kiểm Thử Chức Năng (Manual Verification)
1. Tạo phiếu nhận hàng không PO mẫu (UC-04) -> Kiểm tra sinh mã phiếu `ma_po = 'khong_po'` trên CSDL `MMS1`.
2. Mở tab **"Đối Soát PO"** -> Ghép nối phiếu vừa tạo với PO tương ứng (UC-05).
3. Kiểm tra phiếu được cập nhật mã PO chính thức trong `dbo.tbl_phieu_nhan_hang`.
