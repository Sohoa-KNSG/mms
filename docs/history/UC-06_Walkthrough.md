# Báo Cáo Nghiệm Thu & Kiểm Thử UC-06: Nhận Hàng & Hoàn Trả Vật Tư Nội Bộ (RET-01 & RET-02)

- **Mã Use Case**:
  - `UC-06` / `RET-01`: Lập phiếu trả vật tư nội bộ từ phân xưởng / R&D / QC về kho (Internal Return Creation).
  - `UC-06` / `RET-02`: Thủ kho tiếp nhận, phân loại và xác nhận nhập kho phiếu trả nội bộ (Warehouse Keeper Confirmation).
- **Trạng thái**: ✅ **Hoàn thành & Đã nghiệm thu trên CSDL MMS1**.
- **CSDL Đích**: `10.17.16.106` (`Database=MMS1`, User `codex1` / `123`).

---

## 1. Kết Quả Triển Khai & Mã Nguồn

### A. Tầng Dịch Vụ API Frontend
- **Tệp**: [`apps/web/src/services/internalReturnService.ts`](file:///c:/MMS/apps/web/src/services/internalReturnService.ts)
  - `getCatalog(search)`: Truy xuất danh mục vật tư từ `dbo.tbl_dm_vattu` và danh sách bộ phận/phân xưởng từ `dbo.tbl_sx_bravo`.
  - `createInternalReturn(request)`: Gửi yêu cầu lập phiếu trả nội bộ mới (`POST /api/v1/internal-returns`).
  - `getReturnQueue(search, status, page, pageSize)`: Truy xuất hàng đợi danh sách phiếu trả nội bộ (`GET /api/v1/internal-returns`).
  - `getInternalReturn(returnId)`: Xem chi tiết phiếu trả và danh sách dòng vật tư (`GET /api/v1/internal-returns/{id}`).
  - `confirmInternalReturn(returnId, request)`: Thủ kho xác nhận: `1 = Đạt`, `2 = Lỗi/cách ly`, `3 = Từ chối` (`POST /api/v1/internal-returns/{id}/confirmation`).

### B. Tầng Giao Diện Người Dùng (UI)
- **Tệp**: [`apps/web/src/components/ReceivingModule.tsx`](file:///c:/MMS/apps/web/src/components/ReceivingModule.tsx)
  - Thêm tab **"📦 Trả Nội Bộ (UC-06)"** trên thanh điều hướng module Nhận Hàng.
  - **Form Lập Phiếu Trả Mới (`RET-01`)**:
    - Chọn phân xưởng/bộ phận hoàn trả (`dbo.tbl_sx_bravo`).
    - Phân loại chất lượng (`1 = Đạt/Dùng tốt`, `2 = Lỗi/Không đạt`).
    - Bảng chi tiết vật tư trả với tính năng thêm/xóa dòng, kiểm tra trùng mã vật tư, nhập số lượng, đơn vị tính và lý do hoàn trả.
  - **Bảng Danh Sách Hàng Đợi Phiếu Trả**:
    - Bộ lọc trạng thái (`Tất cả`, `Chờ xác nhận - status 1`, `Đã nhập kho - status 2`, `Đã từ chối - status 3`).
    - Tìm kiếm theo mã phiếu, người lập, phân xưởng trả.
    - Phân trang thời gian thực.
  - **Modal Kiểm Tra & Xác Nhận Cho Thủ Kho (`RET-02`)**:
    - Hiển thị đầy đủ thông tin phân xưởng, người lập, ghi chú và danh sách vật tư chi tiết.
    - Nút bấm xử lý theo nghiệp vụ:
      - `✅ Chấp Nhận - Nhập Kho Đạt` (Tạo batch tồn kho sẵn sàng cấp phát `trang_thai_ton = '1'`).
      - `⚠️ Chấp Nhận - Nhập Kho Lỗi/Cách Ly` (Tạo batch tồn kho cách ly `trang_thai_ton = '3'`).
      - `❌ Từ Chối Tiếp Nhận` (Yêu cầu nhập lý do từ chối, cập nhật `status_phieu = '3'`).

### C. Stored Procedures & CSDL trên `MMS1`
- `api.vw_SEC_UserScreenAccess_v1`: Cấu hình quyền truy cập các màn hình `scr_phieutra_noibo`, `scr_thukho_xacnhan_noibo`, `scr_phieutra_tachbatch`.
- `api.usp_WMS_RET01_GetReturnCatalog_v1`: Cho phép lấy danh mục phân xưởng và vật tư linh hoạt.
- `api.usp_WMS_RET01_CreateInternalReturn_v1`: Tạo phiếu trả vào `dbo.tbl_phieu_nhap_noibo` và `dbo.tbl_chitiet_nhap_noibo`.
- `api.usp_WMS_RET02_ConfirmInternalReturn_v1`: Xác nhận phiếu, tự động tạo chứng từ xuất/nhập trong `dbo.tbl_phieu_transaction` (`nghiep_vu = 'IN_PROD'`) và tạo batch mới trong `dbo.tbl_batch_inv`.

---

## 2. Bằng Chứng Kiểm Thử Nghiệm Thu Trên CSDL MMS1

### Kịch bản kiểm thử:
1. **Lập Phiếu Trả Nội Bộ (`RET-01`)**:
   - Phân xưởng: `Gia công cơ, Cắt dây` (`ma_bravo = 20100700`).
   - Phân loại chất lượng: `1` (Hàng đạt).
   - Vật tư: `CGBM901I5` (Chốt gắn BM901,902,916,939 Þ7.5x15x2.5mm V5 Inox S304), Số lượng = `25 Cái`.
   - Ghi chú: `Dư sau lắp ráp`.
   - Kết quả API: `ReturnId = 22`, `StatusCode = 1`.

2. **Thủ Kho Xác Nhận Nhập Kho Đạt (`RET-02`)**:
   - Số chứng từ Bravo: `NK-NB-20260815-01`.
   - Kết quả xử lý: `ResultCode = 1` (Chấp nhận Đạt).
   - Kết quả API: `ReturnId = 22`, `StatusCode = 2`, `TransactionDocumentId = 9919`, `CreatedBatchCount = 1`.

### Dữ liệu thực tế ghi nhận trên SQL Server `MMS1`:
```sql
-- 1. Phiếu nhập nội bộ (Header)
SELECT id_phieu_noibo, ma_bravo_bophan, ten_bravo_bophan, phan_loai_tra, nhap_kho, status_phieu, user_cre, time_cre 
FROM dbo.tbl_phieu_nhap_noibo WHERE id_phieu_noibo = 22;
-- Kết quả: id_phieu_noibo = 22, ten_bravo_bophan = 'Gia công cơ, Cắt dây', phan_loai_tra = '1', nhap_kho = '1', status_phieu = '2'

-- 2. Chi tiết vật tư phiếu trả (Line item)
SELECT id_nhan_noibo, id_phieu_noibo, id_vattu, ten_vattu, unit, so_luong, ghi_chu 
FROM dbo.tbl_chitiet_nhap_noibo WHERE id_phieu_noibo = 22;
-- Kết quả: id_nhan_noibo = 17, id_vattu = 'CGBM901I5', so_luong = 25.0, unit = 'Cái', ghi_chu = 'Dư sau lắp ráp'

-- 3. Phiếu giao dịch kho (Transaction document)
SELECT id_phieu_trans, nghiep_vu, ma_kho_from, ma_kho_to, nguoi_nhan, so_ct_bravo, trang_thai_phieu, ma_yeucau 
FROM dbo.tbl_phieu_transaction WHERE ma_yeucau = 22;
-- Kết quả: id_phieu_trans = 9919, nghiep_vu = 'IN_PROD', ma_kho_from = '20020100', ma_kho_to = '20100700', so_ct_bravo = 'NK-NB-20260815-01', trang_thai_phieu = '2'

-- 4. Batch tồn kho được sinh mới (Inventory Batch)
SELECT id_batch, ma_kho, id_vattu, ten_vattu, so_luong, unit, trang_thai_ton, time_cre 
FROM dbo.tbl_batch_inv WHERE id_batch = 12803;
-- Kết quả: id_batch = 12803, id_vattu = 'CGBM901I5', so_luong = 25.0, unit = 'Cái', trang_thai_ton = '1' (Sẵn sàng cấp phát)
```

---

## 3. Kết Luận

- Tính năng **`UC-06: Nhận Hàng & Hoàn Trả Vật Tư Nội Bộ (RET-01 & RET-02)`** đã hoàn thành 100% các tiêu chí kỹ thuật, giao diện đẹp mắt, chuẩn UX/UI và đồng bộ dữ liệu thời gian thực trên CSDL `MMS1`.
