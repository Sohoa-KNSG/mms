# Phân tích Thiết kế Logic UC-18 (INV-07) - Sơ Đồ Cây Gia Phả Lô (Genealogy Tree Lô Mẹ - Lô Con)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Cây Gia Phả Lô & Truy Vết Nguồn Gốc (INV-07)** của Thủ kho, QC và Ban Giám Đốc.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Trực quan hóa toàn bộ phả hệ nguồn gốc và quá trình phân rã của Lô hàng từ Lô nhập kho ban đầu của Nhà cung cấp (Gốc F0) qua các lần tách thùng lẻ (F1, F2, F3...) và các lần xuất kho vào phân xưởng sản xuất. Cho phép truy vết ngược dòng 2 chiều.

---

## 2. Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)
- Đồ thị cây tương tác cao, mã màu trạng thái Lô tồn, Lô đã xuất, Lô lỗi.

---

## 3. Programming Logic (Logic Lập Trình)
- **Endpoint:** `GET /api/v1/inventory/batches/{batchId}/genealogy`
- **SP:** `api.usp_WMS_INV07_GetBatchGenealogy_v1`

---

## 4. Data Logic & Schema Model (Thiết kế Dữ Liệu Chuyên Sâu)

### 4.1. Entity Relationship Diagram (ERD) & Schema Details
```mermaid
erDiagram
    tbl_dm_vattu ||--o{ tbl_map_nhapkho : "Quan Ly Ton Lo"
    tbl_dm_vitri_khe ||--o{ tbl_map_nhapkho : "Luu Tru Tai Ke"
    tbl_map_nhapkho ||--o{ tbl_transaction : "Phat Sinh Bien Dong"
    tbl_kiemke_header ||--|{ tbl_kiemke_detail : "Chua Chi Tiet Kiem Dem"
    tbl_map_nhapkho ||--o{ tbl_kiemke_detail : "Doi Soat Snapshot"
```

- **Bảng Quản Lý Tồn Lô (`dbo.tbl_map_nhapkho` / `dbo.tbl_batch_inv`):**
  - Khóa chính: `id_nhapkho` (INT IDENTITY, Clustered Index).
  - Tự tham chiếu Lô Mẹ: `parent_batch_id` (INT NULL) phục vụ dựng Cây Gia Phả.
  - Vị trí Ô kệ: `id_vitri_khe` (VARCHAR(20), FK).
  - Trạng thái kiểm định: `status_qc` (`'PASS'`, `'REJECT'`, `'PENDING'`).
  - Trạng thái lưu kho: `status_kho` (`'STORED'`, `'ON_RACK'`, `'QUARANTINE'`).
  - Chỉ mục: `IX_tbl_map_nhapkho_vattu` on `(id_vattu, status_qc, status_kho) INCLUDE (so_luong, id_vitri_khe)`.

### 4.2. Data Flow & Transaction Locking Matrix
- **Khóa giao dịch Tách Lô / Chuyển vị trí:** Sử dụng `WITH (UPDLOCK, HOLDLOCK)` trên Lô nguồn để bảo toàn nguyên lý bảo toàn tổng sản lượng `TonLoMe = TonLoCon + TonDu`.
- **Khóa kiểm kê chốt sổ:** Áp dụng mức cô lập `SERIALIZABLE` với `WITH (TABLOCKX)` khi thực thi lệnh chốt chênh lệch `ADJUST_COUNT` để đảm bảo không bị xung đột với các giao dịch xuất nhập hàng ngày.

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái Lô | Sự Kiện Kích Hoạt | Trạng Thái Sau | Tác Động Sổ Cái |
| :--- | :--- | :--- | :--- |
| **Lô Mẹ F0 (1,000 cái)** | Tách Lô con 400 cái (INV-06) | Lô Mẹ: 600 cái, Lô Con: 400 cái | Ghi `tbl_transaction` (`SPLIT_BATCH`) |
| **Kệ K01 (Lô A)** | Điều chuyển sang Kệ K02 (INV-03) | Vị trí mới = K02 | Ghi `tbl_transaction` (`TRANSFER`) |
| **Snapshot Sổ Sách** | Chốt lệch kiểm kê (INV-09) | Điều chỉnh tồn = Thực đếm | Ghi `tbl_transaction` (`ADJUST_COUNT`) |

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)
```mermaid
graph TD
    F0[Lô Gốc F0: BATCH-100<br/>Nhập PO-882: 1,000 Cái] --> F1_1[Lô Con F1: BATCH-100_1<br/>Tồn tại Ô K01: 400 Cái]
    F0 --> F1_2[Lô Con F1: BATCH-100_2<br/>Tách xuất PXK-9025: 600 Cái]
```
