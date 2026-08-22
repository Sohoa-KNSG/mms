# Phân tích Thiết kế Logic UC-17 (INV-03) - Điều Chuyển Vị Trí Tồn Kho Nội Bộ Giữa Các Ô Kệ (Location Transfer)

Tài liệu này đi sâu vào phân tích và thiết kế hệ thống ở 5 khía cạnh bắt buộc: **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic**, và **Diagrams (Mermaid)** dành cho chức năng **Điều Chuyển Vị Trí Nội Bộ (INV-03)** của Thủ kho / Nhân viên PDA.

---

## 1. Business Logic (Logic Nghiệp Vụ)

- **Mục tiêu cốt lõi:** Cho phép nhân viên kho di chuyển một phần hoặc toàn bộ số lượng của Lô hàng từ Ô kệ nguồn (`Source Location`) sang Ô kệ đích (`Target Location`) nhằm tối ưu hóa không gian lưu trữ, gom hàng lẻ hoặc phục vụ bảo trì sửa chữa kệ. Hệ thống ghi nhận lịch sử điều chuyển tức thời vào bảng `tbl_transaction` (`nghiep_vu = 'TRANSFER'`) và cập nhật vị trí mới trong `tbl_map_nhapkho`.

- **Các quy tắc nghiệp vụ (Business Rules):**
  - `BR-INV-03-01` **Kiểm tra tính khả dụng của Ô kệ đích:** Ô kệ đích phải hợp lệ, không bị khóa, còn sức chứa.
  - `BR-INV-03-02` **Tính nguyên tử của giao dịch chuyển kệ:** Cập nhật vị trí Lô hoặc Tách Lô con chuyển vị trí, ghi nhận nhật ký `tbl_transaction` (`nghiep_vu = 'TRANSFER'`).

- **Quy trình tương tác 5 bước (Interaction Flow):**
  - **Bước 1:** Nhân viên mở phân hệ "Chuyển Vị Trí / Transfer" trên PDA hoặc Web.
  - **Bước 2:** Quét mã vạch Ô kệ nguồn hoặc quét mã Lô cần chuyển.
  - **Bước 3:** Nhập số lượng cần chuyển và quét mã Barcode Ô kệ đích.
  - **Bước 4:** Bấm **"Xác Nhận Chuyển Vị Trí"**. Backend gọi `api.usp_WMS_INV03_TransferLocation_v1`.
  - **Bước 5:** Hệ thống cập nhật vị trí mới trong CSDL, phát âm thanh thành công.

---

## 2. Tiêu chuẩn Thiết kế Giao diện (UI/UX Guidelines)
- Luồng quét 3 bước mượt mà: Quét Lô $ightarrow$ Nhập số lượng $ightarrow$ Quét Kệ đích.

---

## 3. Programming Logic (Logic Lập Trình)
- **Endpoint:** `POST /api/v1/inventory/transfer-location`
- **SP:** `api.usp_WMS_INV03_TransferLocation_v1`

---

## 4. Data Logic & Schema Model (Cấu Trúc Dữ Liệu)
- `dbo.tbl_map_nhapkho`: Cập nhật `id_vitri_khe`.
- `dbo.tbl_transaction`: Chèn bản ghi biến động (`nghiep_vu = 'TRANSFER'`).

---

## 5. Diagrams (Mermaid Sơ Đồ Luồng Nghiệp Vụ)
```mermaid
sequenceDiagram
    autonumber
    actor Staff as Nhân Viên Kho (PDA)
    participant UI as Handheld UI
    participant API as .NET 8 Web API
    participant DB as SQL Server (MMS DB)

    Staff->>UI: Quét mã Lô cần chuyển
    Staff->>UI: Quét mã Ô kệ đích & Nhập số lượng
    Staff->>UI: Bấm "Xác Nhận Chuyển Vị Trí"
    UI->>API: POST /api/v1/inventory/transfer-location
    API->>DB: EXEC api.usp_WMS_INV03_TransferLocation_v1
    DB-->>API: TransferId=8812, Status='SUCCESS'
    API-->>UI: 200 OK
    UI->>UI: Phát âm thanh Success Beep + Thông báo thành công
```
