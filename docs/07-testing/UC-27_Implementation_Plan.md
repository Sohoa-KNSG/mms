# Kế Hoạch Triển Khai UC-27 (INV-08): Kiểm Kê Cycle Count Theo Vật Tư (Bước 1)

- **Mã Use Case**: `UC-27` / `INV-08`
- **Mục tiêu**: Lập kế hoạch kiểm kê theo từng mã vật tư (`id_vattu`), tự động snapshot danh sách các batch tồn kho (`tbl_batch_inv`), cho phép nhân viên quét vị trí ô kệ, ghi nhận số lượng kiểm đếm thực tế hiện trường và dán tem đã kiểm.
- **Database Đích**: CSDL MMS1.
- **Tài liệu đặc tả**: [`docs/use-cases/UC-27_INV-08.md`](file:///c:/MMS/docs/use-cases/UC-27_INV-08.md) (từ file nghiệp vụ `MMS_kiemke_buoc1.docx`).

---

## 1. Cấu Trúc CSDL & Logic Stored Procedures (MMS1)

### A. Khởi Tạo 3 Bảng Dữ Liệu
1. **`dbo.tbl_kiemke_kh`** (Kế hoạch kiểm kê tổng):
   - `id_kh_kiemke` INT IDENTITY(1,1) PRIMARY KEY
   - `id_vattu` NVARCHAR(50) NOT NULL
   - `soluong_hethong` DECIMAL(18,4) DEFAULT 0
   - `soluong_sosach` DECIMAL(18,4) DEFAULT 0
   - `soluong_thucte` DECIMAL(18,4) DEFAULT 0
   - `time_batdau` DATETIME2(0) NULL
   - `time_ketthuc` DATETIME2(0) NULL
   - `ghi_chu` NVARCHAR(500) NULL
   - `trang_thai` NVARCHAR(50) DEFAULT N'0' (0: Đang kiểm, 1: Đã hoàn tất, 2: Đã hủy)
   - `user_cre` NVARCHAR(50) NOT NULL
   - `time_cre` DATETIME2(7) DEFAULT SYSDATETIME()
   - `user_duyet` NVARCHAR(50) NULL

2. **`dbo.tbl_kiemke_danhsach`** (Danh sách batch theo kế hoạch):
   - `id_kiemke` INT IDENTITY(1,1) PRIMARY KEY
   - `id_kh_kiemke` INT NOT NULL (FK -> `tbl_kiemke_kh`)
   - `id_batch` INT NOT NULL
   - `so_luong` DECIMAL(18,4) NOT NULL
   - `unit` NVARCHAR(20) NULL
   - `vi_tri` NVARCHAR(100) NULL
   - `time_cre` DATETIME2(7) DEFAULT SYSDATETIME()

3. **`dbo.tbl_kiemke_log`** (Nhật ký đếm thực tế hiện trường):
   - `id_kiem` INT IDENTITY(1,1) PRIMARY KEY
   - `id_kiemke` INT NOT NULL (FK -> `tbl_kiemke_danhsach`)
   - `id_batch` INT NOT NULL
   - `so_luong` DECIMAL(18,4) NOT NULL
   - `unit` NVARCHAR(20) NULL
   - `vi_tri` NVARCHAR(100) NULL
   - `user_cre` NVARCHAR(50) NOT NULL
   - `time_cre` DATETIME2(7) DEFAULT SYSDATETIME()

### B. Khởi Tạo Stored Procedures
1. **`dbo.sp_kiemke_tao_kehoach`**:
   - Tính tổng tồn hệ thống của vật tư từ `tbl_batch_inv` (`trang_thai_ton <> 0`).
   - Insert kế hoạch vào `tbl_kiemke_kh`.
   - Snapshot danh sách batch còn tồn vào `tbl_kiemke_danhsach`.
2. **`dbo.sp_kiemke_soluong`**:
   - Ghi nhận lượt kiểm đếm thực tế vào `tbl_kiemke_log`.
   - Cập nhật lũy kế `soluong_thucte` vào `tbl_kiemke_kh`.
3. **`dbo.sp_kiemke_danhsach_kh`**:
   - Lấy danh sách kế hoạch kiểm kê đang mở / đã hoàn thành kèm tên vật tư, số batch, số lượng hệ thống / sổ sách / thực tế.
4. **`dbo.sp_kiemke_chitiet_kh`**:
   - Lấy chi tiết các batch của kế hoạch kiểm kê kèm lịch sử các lần đếm thực tế.

---

## 2. Thiết Kế Tầng Dịch Vụ API Backend & Frontend

### A. Backend .NET Minimal API
- `POST /api/v1/inventory/cycle-counts`: Lập kế hoạch kiểm kê mới (`sp_kiemke_tao_kehoach`).
- `GET /api/v1/inventory/cycle-counts`: Danh sách kế hoạch kiểm kê.
- `GET /api/v1/inventory/cycle-counts/{id}`: Chi tiết kế hoạch kiểm kê & các batch.
- `POST /api/v1/inventory/cycle-counts/{id}/count`: Ghi nhận kiểm đếm thực tế (`sp_kiemke_soluong`).

### B. Frontend Web & Handheld (PDA)
- **Web App (`InventoryModule.tsx`)**:
  - Thêm tab **"📋 Kiểm Kê Cycle Count (UC-27)"**:
    - Form lập kế hoạch kiểm kê mới: Chọn mã vật tư, nhập số lượng sổ sách, thời gian bắt đầu.
    - Danh sách kế hoạch kiểm kê (Trạng thái, Tồn hệ thống, Sổ sách, Thực tế, Chênh lệch).
    - Xem chi tiết từng Batch và nhật ký các lần đếm.
- **Máy Quét PDA (`HandheldModule.tsx`)**:
  - Thêm chế độ quét **"📦 Kiểm Kê Cycle Count"**:
    - Chọn kế hoạch kiểm kê đang mở.
    - Quét Barcode vị trí kệ (`vi_tri`) & mã Batch (`id_batch`).
    - Nhập số lượng thực tế kiểm đếm -> Lưu và in/dán tem xác nhận đã kiểm.

---

## 3. Kế Hoạch Kiểm Thử (Verification Plan)
1. Khởi tạo schema và SPs trên CSDL `MMS1`.
2. Thực thi thử nghiệm tạo kế hoạch kiểm cho một mã vật tư có tồn kho trên MMS1.
3. Ghi nhận thử nghiệm kiểm đếm batch và kiểm tra dữ liệu trong `tbl_kiemke_log` và `tbl_kiemke_kh`.
4. Build và kiểm thử end-to-end trên giao diện Web.
