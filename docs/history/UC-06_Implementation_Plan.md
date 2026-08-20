# Kế Hoạch Triển Khai UC-06: Nhận Hàng & Trả Vật Tư Nội Bộ (RET-01 & RET-02)

- **Mã Use Case**:
  - `UC-06` / `RET-01`: Lập phiếu trả vật tư nội bộ từ các bộ phận sản xuất / R&D / QC về kho (Internal Return Creation).
  - `UC-06` / `RET-02`: Kho tiếp nhận và xác nhận xử lý phiếu trả nội bộ (Chấp nhận Đạt -> Nhập tồn kho / Không đạt / Từ chối).
- **Mục tiêu**: Cho phép các phân xưởng sản xuất, tổ cơ khí, phòng QC/R&D lập phiếu hoàn trả vật tư thừa/hỏng/thử nghiệm về kho lưu trữ, và Thủ kho tiến hành kiểm tra, phân loại chất lượng, tự động sinh batch tồn kho (`dbo.tbl_batch_inv`) và chứng từ kho (`dbo.tbl_phieu_transaction`).
- **Database Đích**: CSDL MMS1.
- **Endpoints API**:
  - `GET /api/v1/internal-returns/catalog`: Danh mục vật tư và danh sách bộ phận/phân xưởng trả (`tbl_sx_bravo`).
  - `POST /api/v1/internal-returns`: Lập phiếu trả nội bộ mới (`tbl_phieu_nhap_noibo` + `tbl_chitiet_nhap_noibo`).
  - `GET /api/v1/internal-returns`: Danh sách hàng đợi phiếu trả nội bộ với phân trang và bộ lọc trạng thái.
  - `GET /api/v1/internal-returns/{returnId}`: Chi tiết phiếu trả nội bộ và danh sách dòng vật tư.
  - `POST /api/v1/internal-returns/{returnId}/confirmation`: Thủ kho xác nhận: `1 = Đạt (Nhập kho tốt)`, `2 = Không đạt (Nhập kho phế phẩm/chờ xử lý)`, `3 = Từ chối`.

---

## 1. Yêu Cầu Nghiệp Vụ & Quy Tắc Ràng Buộc (Business Rules)

1. **Lập Phiếu Trả Nội Bộ (`RET-01`)**:
   - Chọn bộ phận hoàn trả (Mã Bravo, Tên phân xưởng/bộ phận từ `dbo.tbl_sx_bravo`).
   - Phân loại chất lượng: `1 = Hàng đạt (sử dụng lại được)`, `2 = Hàng lỗi/không đạt tiêu chuẩn`.
   - Danh sách vật tư hoàn trả: Mã vật tư, Tên, Số lượng (> 0), Đơn vị tính, Lý do trả. Không cho phép trùng mã vật tư trên cùng một phiếu.
   - Lưu vào bảng `dbo.tbl_phieu_nhap_noibo` và `dbo.tbl_chitiet_nhap_noibo` với `status_phieu = N'1'` (Chờ kho xác nhận).

2. **Thủ Kho Xác Nhận Phiếu Trả (`RET-02`)**:
   - Chỉ người dùng có quyền thủ kho (`scr_thukho_xacnhan_noibo`) mới được xác nhận phiếu.
   - Các hành động xử lý:
     - **Kết quả 1 (Chấp nhận Đạt)**: Cập nhật `status_phieu = '2'`, tạo phiếu giao dịch `dbo.tbl_phieu_transaction` (`nghiep_vu = 'IN_PROD'`, `trang_thai_phieu = '2'`), tự động tạo batch tồn kho mới trong `dbo.tbl_batch_inv` với trạng thái `trang_thai_ton = '1'` (Sẵn sàng cấp phát).
     - **Kết quả 2 (Chấp nhận Không Đạt / Lỗi)**: Cập nhật `status_phieu = '2'`, tạo batch tồn kho với `trang_thai_ton = '3'` (Hàng cách ly/lỗi).
     - **Kết quả 3 (Từ chối nhận)**: Bắt buộc nhập lý do từ chối, cập nhật `status_phieu = '3'` (Từ chối), không sinh batch tồn kho.

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

### A. Tầng Dịch Vụ API Frontend (`apps/web/src/services/internalReturnService.ts`)
- Tạo service mới `internalReturnService.ts` kết nối trực tiếp các endpoint:
  - `getCatalog(search)`
  - `createInternalReturn(request)`
  - `getReturnQueue(search, status, page, pageSize)`
  - `getInternalReturn(returnId)`
  - `confirmInternalReturn(returnId, request)`

### B. Tầng Giao Diện Người Dùng (`apps/web/src/components/ReceivingModule.tsx` & `InternalReturnModule.tsx`)
- Tích hợp tính năng Trả nội bộ trong phân hệ Nhận hàng:
  - Thêm tab **"Trả Nội Bộ (UC-06)"** hoặc module con:
    - **Tab 1: Danh sách phiếu trả nội bộ**: Xem danh sách phiếu từ các phân xưởng với trạng thái `Chờ xác nhận`, `Đã tiếp nhận`, `Đã từ chối`.
    - **Tab 2: Tạo phiếu trả mới**: Form chọn phân xưởng trả (`tbl_sx_bravo`), phân loại chất lượng, thêm các dòng vật tư hoàn trả và lý do.
    - **Modal Xác nhận cho Thủ kho**: Xem chi tiết dòng hàng, nút bấm **"Chấp nhận Nhập kho Đạt"**, **"Chấp nhận Nhập kho Lỗi"**, **"Từ chối Nhận"** (kèm lý do).

### C. Cập Nhật CSDL & Stored Procedures trên `MMS1`
- Cập nhật view `api.vw_SEC_UserScreenAccess_v1` bổ sung các màn hình:
  - `scr_phieutra_noibo`
  - `scr_thukho_xacnhan_noibo`
- Tinh chỉnh SP `api.usp_WMS_RET01_GetReturnCatalog_v1` & `api.usp_WMS_RET01_CreateInternalReturn_v1` để hỗ trợ linh hoạt người dùng quản trị / thủ kho chọn bộ phận trả từ toàn bộ danh mục phân xưởng.

---

## 3. Kế Hoạch Kiểm Thử & Nghiệm Thu (Verification Plan)

1. **Kiểm thử API & SP trên CSDL `MMS1`**:
   - Lập phiếu trả nội bộ từ bộ phận `Gia công cơ, Cắt dây` (Mã Bravo `20100700`) gồm vật tư `CGBM901I5` (SL = 20 Cái).
   - Thủ kho thực hiện xác nhận Kết quả 1 (Chấp nhận Đạt).
   - Kiểm tra `dbo.tbl_phieu_nhap_noibo`, `dbo.tbl_phieu_transaction`, và `dbo.tbl_batch_inv` được sinh mới chính xác.
2. **Kiểm thử giao diện & Build**:
   - Chạy `pnpm run build --filter @mms/web` đảm bảo 0 lỗi.
   - Ghi lại báo cáo `docs/history/UC-06_Walkthrough.md` và cập nhật `DEPLOYMENT_HISTORY.md`.
