# Walkthrough - UC-27 (INV-08): Kiểm Kê Xoay Vòng Cycle Count Theo Vật Tư (Bước 1)

Đã hoàn thành toàn diện việc nghiên cứu tài liệu nghiệp vụ [`MMS_kiemke_buoc1.docx`](file:///c:/MMS/MMS_kiemke_buoc1.docx), thiết kế cơ sở dữ liệu trên máy chủ SQL `MMS1`, xây dựng backend .NET Minimal API, và tích hợp luồng kiểm kê trên cả giao diện Web Desktop & Thiết bị cầm tay Handheld (PDA).

---

## 1. Cơ Sở Dữ Liệu & Stored Procedures (MMS1)

Hệ thống đã triển khai bảng và Stored Procedure theo đúng đặc tả và quan hệ dữ liệu:

1. **3 Bảng CSDL**:
   - `dbo.tbl_kiemke_kh`: Lưu thông tin chung của kế hoạch kiểm kê (`id_kh_kiemke`, `id_vattu`, `soluong_hethong`, `soluong_sosach`, `soluong_thucte`, `trang_thai`, `time_batdau`, `time_ketthuc`...).
   - `dbo.tbl_kiemke_danhsach`: Snapshot danh sách các Lô Batch còn tồn kho từ `tbl_batch_inv` tại thời điểm lập kế hoạch (`id_kiemke`, `id_kh_kiemke`, `id_batch`, `so_luong`, `unit`, `vi_tri`...).
   - `dbo.tbl_kiemke_log`: Lưu nhật ký kiểm đếm thực tế hiện trường của thủ kho / nhân viên PDA (`id_kiem`, `id_kiemke`, `id_batch`, `so_luong`, `unit`, `vi_tri`, `user_cre`, `time_cre`...).

2. **4 Stored Procedures**:
   - `dbo.sp_kiemke_tao_kehoach`: Lập kế hoạch kiểm kê mới cho mã vật tư, tự động tính tổng tồn hệ thống và snapshot các batch tồn kho.
   - `dbo.sp_kiemke_soluong`: Ghi nhận số lượng đếm tại hiện trường vào bảng log và cập nhật tổng thực tế.
   - `dbo.sp_kiemke_danhsach_kh`: Truy vấn danh sách kế hoạch kiểm kê kèm thống kê số batch, số lần đếm và độ lệch.
   - `dbo.sp_kiemke_chitiet_kh`: Truy vấn chi tiết kế hoạch, các batch và toàn bộ lịch sử đếm.

3. **Phân Quyền Màn Hình**:
   - Đã khai báo mã màn hình `scr_kiemke_kh_vattu` và `scr_kiemke_thucte_log` vào view bảo mật `api.vw_SEC_UserScreenAccess_v1`.

---

## 2. Backend .NET Minimal API

- **Contracts**: [`apps/api/Modules/InventoryOperations/InventoryOperationContracts.cs`](file:///c:/MMS/apps/api/Modules/InventoryOperations/InventoryOperationContracts.cs)
- **Gateway**: [`apps/api/Modules/InventoryOperations/InventoryOperationGateway.cs`](file:///c:/MMS/apps/api/Modules/InventoryOperations/InventoryOperationGateway.cs)
- **Endpoints**: [`apps/api/Modules/InventoryOperations/InventoryOperationEndpoints.cs`](file:///c:/MMS/apps/api/Modules/InventoryOperations/InventoryOperationEndpoints.cs)
  - `GET /api/v1/inventory-operations/cycle-counts`: Lấy danh sách kế hoạch kiểm kê.
  - `POST /api/v1/inventory-operations/cycle-counts`: Tạo kế hoạch kiểm kê mới.
  - `GET /api/v1/inventory-operations/cycle-counts/{planId}`: Lấy chi tiết kế hoạch kiểm kê.
  - `POST /api/v1/inventory-operations/cycle-counts/{planId}/log`: Ghi nhận kiểm đếm thực tế từ Web/PDA.

---

## 3. Giao Diện Người Dùng (Frontend Web & Handheld PDA)

1. **Frontend Service**:
   - [`apps/web/src/services/cycleCountService.ts`](file:///c:/MMS/apps/web/src/services/cycleCountService.ts): Xử lý toàn bộ kết nối API và truyền nhận Bearer Token.

2. **Giao Diện Quản Lý Web Desktop**:
   - [`apps/web/src/components/InventoryModule.tsx`](file:///c:/MMS/apps/web/src/components/InventoryModule.tsx): Bổ sung tab **"📋 Kiểm Kê Cycle Count (UC-27)"**:
     - Xem danh sách kế hoạch kèm số liệu đối chiếu 4 chiều: **Tồn Hệ Thống**, **Sổ Sách Kế Toán**, **Thực Tế Đếm**, **Chênh Lệch**.
     - Modal tạo mới kế hoạch theo mã vật tư và số dư sổ sách.
     - Bảng danh sách Lô (Batch) chi tiết, trạng thái `Đã đếm` / `Chưa đếm` và lịch sử log kiểm đếm.
     - Chức năng in tem **"ĐÃ KIỂM KÊ (CYCLE COUNT)"**.

3. **Giao Diện Thiết Bị Cầm Tay Handheld (PDA)**:
   - [`apps/web/src/components/HandheldModule.tsx`](file:///c:/MMS/apps/web/src/components/HandheldModule.tsx): Bổ sung chế độ **"5B. Kiểm Kê Cycle Count (UC-27)"**:
     - Chọn kế hoạch đang mở từ danh sách.
     - Lựa chọn nhanh Lô Batch cần kiểm.
     - Quét barcode vị trí kệ thực tế hoặc chọn từ máy quét Camera/Laser.
     - Nhập số lượng thực tế đếm với nút tăng giảm `+`/`-` và xác nhận lưu trực tiếp vào CSDL MMS1.

---

## 4. Kiểm Tra & Xác Minh (Verification Results)

- **SQL Stored Procedures**: Đã chạy thử nghiệm tạo kế hoạch #1 cho vật tư `CGBM901I5`, snapshot 17 batch tồn kho, ghi nhận log kiểm đếm thành công.
- **.NET API Endpoints**: Đã kiểm tra qua kịch bản tự động PowerShell với mã phản hồi HTTP `200 OK`.
- **Frontend Build**: Biên dịch Vite & TypeScript thành công 100% không có lỗi (`tsc -b && vite build` hoàn thành).
