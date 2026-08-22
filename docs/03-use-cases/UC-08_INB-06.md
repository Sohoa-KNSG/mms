# Phân tích Thiết kế Logic UC-08 (INB-06) - Xác Nhận Nhập Kho Chính Thức & Hạch Toán Sổ Cái Kép

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Xác Nhận Nhập Kho Chính Thức (INB-06)** của Thủ kho.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Sau khi toàn bộ các Lô hàng trong đơn PO đã được kiểm định QC Đạt (`PASS`) và cất vào Ô kệ (`ON_RACK`), Thủ kho kiểm tra đối chiếu lần cuối và bấm duyệt xác nhận nhập kho chính thức. Hệ thống thực thi giao dịch ACID: Chuyển toàn bộ Lô sang `status_kho = 'STORED'`, sinh tồn kho khả dụng `tbl_batch_inv`, chốt số lượng thực nhập với đơn PO Bravo và hạch toán ghi Nợ/Có vào Sổ Cái Kép.
- **Endpoint:** `POST /api/v1/receiving/confirm-official`
- **SP:** `api.usp_WMS_INB06_ConfirmOfficialReceipt_v1`

---

## 4. Data Logic & Schema Model (Thiết kế Dữ Liệu Chuyên Sâu)

### 4.1. Entity Relationship Diagram (ERD) & Schema Details
```mermaid
erDiagram
    tbl_po_bravo ||--|{ tbl_map_nhapkho : "Tiep Nhan Lo Hang"
    tbl_dm_vattu ||--o{ tbl_map_nhapkho : "Thuoc SKU"
    tbl_dm_vitri_khe ||--o{ tbl_map_nhapkho : "Cat Vao Ke"
    tbl_phieu_transaction ||--|{ tbl_transaction : "Chung Tu Nhap"
    tbl_map_nhapkho ||--o{ tbl_transaction : "Phat Sinh Nhap"
```

- **Bảng Tiếp Nhận & Lô (`dbo.tbl_map_nhapkho`):**
  - Khóa chính: `id_nhapkho` (INT IDENTITY).
  - Trạng thái tiếp nhận: `status_kho` (`'RECEIVING'` $ightarrow$ `'ON_RACK'` $ightarrow$ `'STORED'`).
  - Trạng thái kiểm tra: `status_qc` (`'PENDING'` $ightarrow$ `'PASS'` / `'REJECT'`).

### 4.2. Data Flow & Transaction Locking Matrix
- **Khóa tiếp nhận PO Bravo:** Sử dụng `WITH (UPDLOCK, HOLDLOCK)` trên dòng PO Bravo để đảm bảo số lượng thực nhận không vượt quá dung sai PO cho phép và chống tạo trùng Lô khi quét liên tục.

### 4.3. Conceptual State Model & Transition Rules
| Bước Tiếp Nhận | Sự Kiện | Trạng Thái Kho / QC | Hành Động Kế Tiếp |
| :--- | :--- | :--- | :--- |
| **1. Cửa kho Staging** | Quét in tem Lô (INB-03) | `status_kho = 'RECEIVING'`, `status_qc = 'PENDING'` | Đưa vào hàng đợi QC (QC-01) |
| **2. KCS Kiểm tra** | QC Duyệt Đạt (QC-04) | `status_qc = 'PASS'` | Đề xuất vị trí Ô kệ (INB-04) |
| **3. Cất vào dầm kệ** | Quét cất Ô kệ PDA (INB-05) | `status_kho = 'ON_RACK'` | Chờ Thủ kho duyệt nhập chính thức |
| **4. Hạch toán chính thức** | Xác nhận nhập kho (INB-06) | `status_kho = 'STORED'` | Ghi Nợ/Có Sổ Cái Kép & In PNK (INB-07) |
