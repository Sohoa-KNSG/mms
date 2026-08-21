# API Specification

## Nguyên tắc API

- Route version: `/api/v1`.
- API không nhận SQL string từ frontend.
- API ghi dữ liệu gọi stored procedure.
- API đọc dữ liệu dùng view hoặc read-only stored procedure.
- Response DTO không lộ raw database entity nếu không cần thiết.

## API groups

| Group | Endpoint mẫu | Stored procedure/view |
|---|---|---|
| Auth | `/api/v1/auth/login`, `/api/v1/auth/me` | tbl_dm_user, tbl_role, tbl_role_screen |
| Receiving | `/api/v1/receipts` | usp_tao_phieu_nhanhang, usp_insert_chitiet_nhanhang |
| Putaway | `/api/v1/putaway/confirm` | usp_xacnhan_nhapkho, usp_split_batch |
| Quality | `/api/v1/quality/inspections` | usp_qc_tao_phieukiem, usp_qc_capnhat_ketqua |
| Inventory | `/api/v1/inventory/current-stock` | vw_tong_tonkho, v_ton_he_thong, usp_truyvan_tonkho_hientai |
| Storage | `/api/v1/storage/locations` | usp_update_location, usp_update_xuong_ke |
| Outbound | `/api/v1/outbound/requests` | usp_tao_de_nghi_xuatkho |
| Picking | `/api/v1/picking` | usp_soan_hang, usp_xacnhan_soan_hang |
| Issue | `/api/v1/issue/confirm` | usp_xacnhan_xuatkho |
| InternalReturn | `/api/v1/internal-return-receipts` | usp_tao_phieu_nhap_noibo, usp_xacnhan_phieu_nhap_noibo |
| Reporting | `/api/v1/reports/...` | Views/read-only SP |
