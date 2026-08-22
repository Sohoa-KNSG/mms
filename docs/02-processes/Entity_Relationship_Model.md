# Sơ Đồ Thực Thể Liên Kết (Entity Relationship & State Logic Map - ERD Map)

Tài liệu này đặc tả toàn diện sơ đồ quan hệ thực thể (ERD), định nghĩa các bảng dữ liệu cốt lõi, khóa chính (PK), khóa ngoại (FK), chỉ mục (Indexes) và ma trận liên kết trạng thái (State Logic Map) của CSDL hệ thống MMS WMS.

---

## 1. Sơ Đồ Quan Hệ Thực Thể Tổng Thể (System-wide ERD)

```mermaid
erDiagram
    tbl_dm_user ||--o{ tbl_phieu_yeucau : "Tao / Duyet"
    tbl_dm_user ||--o{ tbl_phieu_transaction : "User Thuc Hien"
    tbl_dm_vattu ||--o{ tbl_phieu_yeucau_chitiet : "Chua SKU"
    tbl_dm_vattu ||--o{ tbl_map_nhapkho : "Quan Ly Ton Lo"
    tbl_dm_vattu ||--o{ tbl_batch_inv : "Ton Kho Khed"
    tbl_dm_vitri_khe ||--o{ tbl_map_nhapkho : "Luu Tru Tai Ke"
    
    tbl_phieu_yeucau ||--|{ tbl_phieu_yeucau_chitiet : "Chua Cac Dong Yeu Cau"
    tbl_phieu_yeucau ||--o{ tbl_phieu_transaction : "Lien Ket Chung Tu Xuat"
    
    tbl_phieu_transaction ||--|{ tbl_transaction : "Chua Giao Dich Chi Tiet"
    tbl_map_nhapkho ||--o{ tbl_transaction : "Phat Sinh Bien Dong"
    tbl_phieu_yeucau_chitiet ||--o{ tbl_map_xuatkho : "So Khop Dong Xuat"
    tbl_transaction ||--o{ tbl_map_xuatkho : "Map Giao Dich"
    
    tbl_kiemke_header ||--|{ tbl_kiemke_detail : "Chua Chi Tiet Kiem Dem"
    tbl_map_nhapkho ||--o{ tbl_kiemke_detail : "Doi Soat Snapshot"

    tbl_phieu_yeucau {
        int id_phieu_yeucau PK "Ma phieu DNXK"
        nvarchar bo_phan "Phong ban / Phan xuong"
        nvarchar ma_bravo_bophan "Ma Bravo phan xuong"
        nvarchar nguoi_lap_phieu "Ten nguoi lap"
        datetime thoi_gian_can "Thoi gian yeu cau giao"
        datetime time_duyet "Thoi diem phe duyet"
        nvarchar phan_loai "trong / ngoai / vuot"
        nvarchar trang_thai_phieu "0:Huy, 1:Cho, 3:QD, 4:SanSang, 5:Xuat"
        nvarchar status_soanhang "0:Cho, 1:DangSoan, 2:DaSoan, 3:DaNhan"
    }

    tbl_phieu_yeucau_chitiet {
        int id_chitiet_phieu PK "ID dong chi tiet"
        int id_phieu_yeucau FK "Khoa ngoai tbl_phieu_yeucau"
        nvarchar id_vattu FK "Ma SKU vat tu"
        nvarchar id_bravo "Ma SKU Bravo"
        nvarchar ten_vattu "Ten quy cach"
        decimal so_luong "So luong yeu cau"
        nvarchar unit "Don vi tinh"
    }

    tbl_phieu_transaction {
        int id_phieu_trans PK "Ma chung tu WMS (PXK/PNK)"
        nvarchar nghiep_vu "OUT_CON / INB_PO / TRANSFER"
        int ma_yeucau FK "Lien ket id_phieu_yeucau"
        nvarchar ma_kho_from "Kho xuat (20020100)"
        nvarchar ma_kho_to "Kho dich / Phan xuong"
        nvarchar nguoi_nhan "Nguoi nhan hang"
        nvarchar trang_thai_phieu "1:Dang mo, 2:Hoan tat"
    }

    tbl_transaction {
        int id_trans PK "Ma giao dich kho"
        int id_phieu_trans FK "Khoa ngoai tbl_phieu_transaction"
        int id_batch FK "Khoa ngoai Lo hang"
        nvarchar id_vattu FK "Ma SKU vat tu"
        nvarchar nghiep_vu "OUT_CON / INB_PO / TRANSFER / SPLIT"
        decimal so_luong "So luong bien dong"
        datetime time_cre "Thoi diem ghi so"
    }

    tbl_map_nhapkho {
        int id_nhapkho PK "Ma Lo hang (Batch ID)"
        int parent_batch_id "Ma Lo Me (Genealogy Tree)"
        nvarchar id_vattu FK "Ma SKU vat tu"
        nvarchar id_vitri_khe FK "Ma O ke (K01-T2-01)"
        decimal so_luong "So luong ton thuc te"
        nvarchar status_qc "PASS / REJECT / PENDING"
        nvarchar status_kho "ON_RACK / STORED / QUARANTINE"
        datetime exp_date "Han su dung"
    }

    tbl_map_xuatkho {
        int id_map PK "ID ban ghi lien ket"
        int id_trans FK "Khoa ngoai tbl_transaction"
        int id_chitiet_phieu FK "Khoa ngoai tbl_phieu_yeucau_chitiet"
    }
```

---

## 2. Chi Tiết Thực Thể & Ma Trận Khóa Chỉ Mục (Table Schemas & Indexes)

### 2.1. Bảng `dbo.tbl_phieu_yeucau` (Header Đề Nghị Xuất Kho):
- **Khóa chính (PK):** `id_phieu_yeucau` (Clustered Index, INT IDENTITY).
- **Chỉ mục tìm kiếm (Non-Clustered Indexes):**
  - `IX_tbl_phieu_yeucau_status`: `(trang_thai_phieu, status_soanhang) INCLUDE (time_duyet, time_cre, bo_phan)` $\rightarrow$ Tối ưu truy vấn hàng đợi Tivi Dashboard và PDA Picking.

### 2.2. Bảng `dbo.tbl_map_nhapkho` (Quản Lý Tồn Chi Tiết Cấp Lô / Thùng):
- **Khóa chính (PK):** `id_nhapkho` (Clustered Index, INT IDENTITY).
- **Chỉ mục tìm kiếm (Non-Clustered Indexes):**
  - `IX_tbl_map_nhapkho_vattu_qc`: `(id_vattu, status_qc, status_kho) INCLUDE (so_luong, id_vitri_khe)` $\rightarrow$ Tối ưu truy vấn tồn khả dụng FIFO/FEFO.
  - `IX_tbl_map_nhapkho_parent`: `(parent_batch_id)` $\rightarrow$ Tối ưu dựng Cây Gia Phả Lô (Genealogy Tree).

### 2.3. Bảng `dbo.tbl_transaction` (Sổ Nhật Ký Biến Động Kho):
- **Khóa chính (PK):** `id_trans` (Clustered Index, INT IDENTITY).
- **Khóa ngoại (FK):**
  - `id_phieu_trans` $\rightarrow$ `tbl_phieu_transaction(id_phieu_trans)`.
  - `id_batch` $\rightarrow$ `tbl_map_nhapkho(id_nhapkho)`.
- **Chỉ mục tìm kiếm:** `IX_tbl_transaction_phieu`: `(id_phieu_trans, nghiep_vu) INCLUDE (id_vattu, so_luong)`.