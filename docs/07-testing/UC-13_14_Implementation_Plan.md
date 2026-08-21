# Kế Hoạch Triển Khai UC-13 & UC-14 (QC-03 & QC-04): Lập Phiếu Kiểm & Đánh Giá Chất Lượng QC

- **Mã Use Case**: 
  - `UC-13` / `QC-03`: Lập phiếu kiểm tra chất lượng tiếp nhận đầu vào (`/quality/inspections/new` / `scr_qc_phieukiem`).
  - `UC-14` / `QC-04`: Đánh giá chi tiết từng tiêu chí QC, kết luận Đạt / Không Đạt / Nhân Nhượng (`/quality/evaluation` / `scr_qc_danhgia_vattu`).
- **Mục tiêu**: Nhân viên QC kiểm tra danh sách các phiếu nhận hàng có vật tư thuộc diện kiểm tra bắt buộc (`tbl_dm_vattu.ma_kiem IS NOT NULL`), tạo phiếu kiểm tra chất lượng (`dbo.tbl_qc_phieu_kiem`), đánh giá từng chỉ tiêu kỹ thuật (`dbo.tbl_qc_kiem`), kết luận chất lượng (`ket_qua_qc = '1'` Đạt / `'2'` Không đạt / `'3'` Nhân nhượng) và cập nhật trạng thái phiếu sang sẵn sàng nhập kho (`status_nhap = '4'`).
- **Database Đích**: CSDL MMS1.

---

## 1. Nghiệp Vụ & Quy Tắc Cốt Lõi (Business Rules)

1. **Hàng Đợi QC Đầu Vào (QC-03)**:
   - Truy vấn từ `dbo.tbl_phieu_nhan_hang` và `dbo.tbl_chitiet_nhanhang` có vật tư đã gán `ma_kiem` và chưa có `ket_qua_qc`.
   - Tạo hồ sơ phiếu kiểm `dbo.tbl_qc_phieu_kiem` (`status_duyet = 0`).
2. **Đánh Giá Tiêu Chí QC (QC-04)**:
   - Tải bộ tiêu chuẩn kiểm tra theo `ma_kiem` từ `dbo.tbl_tieuchi_kiem`.
   - QC nhập: Loại kiểm (`AQL` hoặc `100%`), số lượng kiểm tra, số lượng lỗi không đạt, đánh giá từng tiêu chí (`Đạt`, `Không Đạt`, `Không Kiểm`), ghi chú lỗi.
   - Kết luận tổng thể:
     - `1 = Đạt (Pass)`: Cho phép chuyển tiếp sang bước Thủ Tục Nhập Kho (`UC-09 / INB-07`).
     - `2 = Không Đạt (Fail / Rejected)`: Đánh dấu lô lỗi hoặc cách ly, yêu cầu hoàn trả hoặc xử lý sự cố.
     - `3 = Nhân Nhượng (Concession)`: Đạt có điều kiện theo phê duyệt.
   - Tự động cập nhật `dbo.tbl_chitiet_nhanhang.ket_qua_qc` và `dbo.tbl_phieu_nhan_hang.status_nhap = '4'` (Đã kiểm QC).

---

## 2. Kế Hoạch Triển Khai Kỹ Thuật

### A. Tầng Dịch Vụ API Frontend (`apps/web/src/services/qualityService.ts`)
- Tạo service `qualityService.ts` kết nối với các endpoint:
  - `GET /api/v1/quality/inspection-candidates`: Danh sách phiếu & vật tư chờ kiểm tra QC.
  - `POST /api/v1/quality/inspections`: Lập phiếu kiểm tra mới.
  - `GET /api/v1/quality/inspections/{id}/evaluation`: Chi tiết phiếu kiểm và danh sách tiêu chí kỹ thuật theo `ma_kiem`.
  - `POST /api/v1/quality/inspections/{id}/evaluation`: Lưu kết quả đánh giá từng tiêu chí và kết luận chất lượng.
  - `GET /api/v1/quality/inspections/history`: Xem lịch sử kết quả kiểm tra.

### B. Tầng Giao Diện Người Dùng (`apps/web/src/components/QualityControlModule.tsx`)
- Nâng cấp `QualityControlModule.tsx` kết nối 100% dữ liệu thực từ CSDL MMS1:
  - **Tab 1: Hàng Đợi Kiểm Tra QC (UC-13 / QC-03)**:
    - Bảng danh sách phiếu nhận hàng chờ kiểm (461+ phiếu chờ kiểm trên MMS1).
    - Nút **"Lập Phiếu & Đánh Giá QC"**.
  - **Tab 2: Đánh Giá Chi Tiết & Kết Luận (UC-14 / QC-04)**:
    - Form kiểm tra: Chọn loại kiểm (AQL / 100%), số lượng kiểm tra, số lượng lỗi.
    - Bảng danh sách tiêu chí kiểm định kỹ thuật thực tế lấy từ `dbo.tbl_tieuchi_kiem`.
    - 3 nút kết luận nhanh: `✅ Đạt (Pass - 1)`, `❌ Không Đạt (Fail - 2)`, `⚠️ Nhân Nhượng (3)`.
  - **Tab 3: Lịch Sử & Hồ Sơ Kiểm Tra (QC-05)**:
    - Tra cứu lịch sử các đợt kiểm tra và kết quả đã lưu.

---

## 3. Kế Hoạch Kiểm Thử (Verification Plan)

1. **Kiểm thử API & SP trên CSDL MMS1**:
   - Chọn phiếu nhận mẫu, lập phiếu kiểm `#id_phieukiem`.
   - Gửi đánh giá tiêu chí QC và kết luận `1` (Đạt).
   - Kiểm tra dữ liệu được ghi vào `dbo.tbl_qc_phieu_kiem`, `dbo.tbl_qc_kiem`, `dbo.tbl_chitiet_nhanhang`, `dbo.tbl_phieu_nhan_hang`.
2. **Kiểm thử liên thông với UC-09**:
   - Phiếu vừa được QC Đạt sẽ xuất hiện ngay lập tức trong hàng đợi **"Nhập Kho (UC-09)"** của Thủ kho!
3. **Biên dịch build**:
   - Chạy `pnpm run build --filter @mms/web`.
   - Ghi lại `docs/history/UC-13_14_Walkthrough.md`.
