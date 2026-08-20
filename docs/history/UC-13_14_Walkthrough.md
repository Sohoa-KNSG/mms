# Kết Quả Triển Khai UC-13 & UC-14 (QC-03 & QC-04): Lập Phiếu Kiểm & Đánh Giá Tiêu Chuẩn QC

- **Mã Nghiệp Vụ**: 
  - `UC-13` / `QC-03`: Lập phiếu kiểm tra chất lượng tiếp nhận đầu vào (Create Inspection Ticket).
  - `UC-14` / `QC-04`: Đánh giá chi tiết tiêu chí kỹ thuật & kết luận Đạt/Không đạt (Technical Criteria Evaluation).
- **Thời gian hoàn thành**: 2026-08-15
- **Database Đích**: CSDL MMS1.
- **Trạng thái**: ✅ **HOÀN THÀNH VÀ KIỂM THỬ THÀNH CÔNG (PASS 100%)**.

---

## 1. Nội Dung Đã Triển Khai

### A. Tầng CSDL & Stored Procedures (MMS1)
1. **`api.vw_SEC_UserScreenAccess_v1`**:
   - Khai báo đầy đủ các mã màn hình kiểm tra chất lượng cho vai trò `qc`, `qc_kho`, `admin`:
     - `scr_qc_phieukiem`, `scr_qc_danhgia_vattu`, `scr_qc_info_danhgia`, `scr_qc_cauhinh_tieuchi`, `scr_qc_kiemtra_dauvao`, `scr_qc_lichsu_ketqua`, `scr_qc_in_tem`.
2. **`api.usp_QC_QC03_GetInspectionCandidates_v1`**:
   - Truy vấn 462+ phiếu nhận hàng có dòng vật tư chưa có kết quả QC (`ket_qua_qc IS NULL`) và thuộc diện kiểm tra bắt buộc (`ma_kiem IS NOT NULL`).
3. **`api.usp_QC_QC03_CreateInspection_v1`**:
   - Khởi tạo hồ sơ phiếu kiểm `dbo.tbl_qc_phieu_kiem` (`status_duyet = 0`).
4. **`api.usp_QC_QC04_GetEvaluation_v1`**:
   - Tải danh mục các tiêu chí kiểm định kỹ thuật từ `dbo.tbl_tieuchi_kiem` theo mã kiểm của vật tư (`ma_kiem`).
5. **`api.usp_QC_QC04_EvaluateMaterial_v1`**:
   - Chuẩn hóa mã kết quả tiêu chí (hỗ trợ `Đạt`, `Không Đạt`, `Không Kiểm`, `PASS`, `FAIL`, `1`, `2`, `0`).
   - Ghi nhận chi tiết từng chỉ tiêu kiểm vào `dbo.tbl_qc_kiem`.
   - Cập nhật kết luận chất lượng `dbo.tbl_chitiet_nhanhang.ket_qua_qc = '1'` (Đạt) / `'2'` (Không đạt).
   - Chuyển trạng thái phiếu nhận `dbo.tbl_phieu_nhan_hang.status_nhap = '4'` (Đã kiểm QC - Đủ điều kiện nhập kho).

### B. Tầng Dịch Vụ API Frontend (`apps/web/src/services/qualityService.ts`)
- `getInspectionCandidates(search, receiptId, page, pageSize)` -> `GET /api/v1/quality/inspection-candidates`.
- `createInspection(request)` -> `POST /api/v1/quality/inspections`.
- `getEvaluation(inspectionId, receivingLineId)` -> `GET /api/v1/quality/inspections/{id}/evaluation`.
- `evaluateMaterial(inspectionId, request)` -> `POST /api/v1/quality/inspections/{id}/evaluation`.
- `getInspectionHistory(search, inspectionId, page, pageSize)` -> `GET /api/v1/quality/inspections/history`.

### C. Tầng Giao Diện Người Dùng (`apps/web/src/components/QualityControlModule.tsx`)
- **Tab 1: Hàng Đợi Chờ Kiểm (UC-13 / QC-03)**:
  - Bố cục 2 cột Master-Detail:
    - Cột trái: Danh sách các phiếu nhận hàng chờ kiểm kèm tìm kiếm, số lượng vật tư chờ kiểm và phân trang.
    - Cột phải: Danh sách chi tiết các dòng SKU của phiếu được chọn kèm mã kiểm `#ma_kiem`, tên hàng, số lượng và nút **"Lập Phiếu & Đánh Giá QC (UC-13/14)"**.
- **Tab 2: Đánh Giá Tiêu Chuẩn Kỹ Thuật (UC-14 / QC-04)**:
  - Thanh chọn phương pháp lấy mẫu (`100% Lô Hàng` / `Lấy Mẫu AQL`), số lượng kiểm tra, số lượng lỗi.
  - Bảng danh mục tiêu chí kỹ thuật thực tế tải động theo mã kiểm.
  - Nút đánh giá nhanh từng tiêu chí: `Đạt`, `Không Đạt`, `Bỏ qua` + ô nhập ghi chú lỗi.
  - Action bar 3 nút kết luận nhanh: `✅ ĐẠT (Pass - 1)`, `❌ KHÔNG ĐẠT (Fail - 2)`, `⚠️ NHÂN NHƯỢNG (3)`.

---

## 2. Kết Quả Kiểm Thử Thực Tế trên CSDL MMS1

| Thông Số / Nghiệp Vụ | Kết Quả Thực Tế | Bảng CSDL `MMS1` |
| :--- | :--- | :--- |
| **Mã Phiếu Nhận Hàng** | `#7347` (`PO-QC-TEST-01`, NCC Test) | `dbo.tbl_phieu_nhan_hang` |
| **Vật Tư Cần Kiểm** | SKU `CGBM901I5` (100 Cái, `ma_kiem = 1`) | `dbo.tbl_chitiet_nhanhang` |
| **Hồ Sơ Phiếu Kiểm QC** | `#4464` | `dbo.tbl_qc_phieu_kiem` |
| **Kết Quả Chi Tiết Tiêu Chí** | 4 tiêu chí kỹ thuật: Chủng loại giấy, Kích thước, Màu sắc, Chữ in | `dbo.tbl_qc_kiem` (ID 24202 - 24205) |
| **Kết Luận Đánh Giá** | `ket_qua_qc = '1'` (Đạt tiêu chuẩn kỹ thuật) | `dbo.tbl_chitiet_nhanhang` |
| **Trạng Thái Phiếu Sau QC** | `status_nhap = '4'` (Đã kiểm QC) | `dbo.tbl_phieu_nhan_hang` |
| **Liên Thông Với UC-09** | Xuất hiện ngay lập tức trong hàng đợi **"Nhập Kho (UC-09)"** | `api.usp_WMS_INB07_GetWarehouseReceiptQueue_v1` |
| **Biên Dịch Build Frontend** | `pnpm run build --filter @mms/web` | ✅ **Thành công 100% (0 errors)** |
