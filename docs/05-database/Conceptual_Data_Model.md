# Conceptual Data Model

```mermaid
erDiagram
  tbl_phieu_nhan_hang ||--o{ tbl_chitiet_nhanhang : includes
  tbl_phieu_nhan_hang ||--o{ tbl_phieu_nhan_hang_image : has
  tbl_qc_kiem ||--o{ vw_ketqua_phieu_qc : produces
  tbl_phieu_yeucau ||--o{ tbl_phieu_yeucau_chitiet : includes
  tbl_phieu_yeucau ||--o{ tbl_his_pheduyet : approved_by
  tbl_batch_inv ||--o{ tbl_transaction : moves
  tbl_phieu_transaction ||--o{ tbl_transaction : includes
  tbl_phieu_nhap_noibo ||--o{ tbl_chitiet_nhap_noibo : includes
```
