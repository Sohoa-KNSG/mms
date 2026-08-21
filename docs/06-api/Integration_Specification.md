# Integration Specification

## Flows/connectors

| App | Name | Type | Kind | Module |
| --- | --- | --- | --- | --- |
| Quản lý kho vật tư .msapp | Dashboard_log_user | ServiceInfo | ConnectedWadl | IdentityAccess |
| Quản lý kho vật tư .msapp | MMS_insert_phieu_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Quản lý kho vật tư .msapp | AzureBlobStorage | ServiceInfo | ConnectedWadl | Core |
| Quản lý kho vật tư .msapp | MMS_sql | ServiceInfo | ConnectedWadl | Core |
| Quản lý kho vật tư .msapp | MMS_update_ma_kiem | ServiceInfo | ConnectedWadl | Quality |
| Quản lý kho vật tư .msapp | MMS_insert_nhapkho | ServiceInfo | ConnectedWadl | Putaway |
| Quản lý kho vật tư .msapp | MMS_split_batch | ServiceInfo | ConnectedWadl | Inventory |
| Quản lý kho vật tư .msapp | Http_to_C_MMS | ServiceInfo | ConnectedWadl | Core |
| Quản lý kho vật tư .msapp | MMS_insert_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Kho vật tư .msapp | AzureBlobStorage | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_insert_phieu_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Kho vật tư .msapp | MMS_sql | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_split_batch | ServiceInfo | ConnectedWadl | Inventory |
| Kho vật tư .msapp | MMS_update_location | ServiceInfo | ConnectedWadl | Putaway |
| Kho vật tư .msapp | MMS_update_xuong_ke | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_insert_tonkho | ServiceInfo | ConnectedWadl | Inventory |
| Kho vật tư .msapp | MMS_insert_xuatkho | ServiceInfo | ConnectedWadl | Outbound |
| Kho vật tư .msapp | MMS_insert_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Kho vật tư .msapp | MMS_update_ma_kiem | ServiceInfo | ConnectedWadl | Quality |
| Kho vật tư .msapp | MMS_insert_nhaptra | ServiceInfo | ConnectedWadl | InternalReturn |
| Kho vật tư .msapp | Http_to_C_MMS | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_kiemke_batch | ServiceInfo | ConnectedWadl | Quality |

## All datasources

| App | Name | Type | Kind | Module |
| --- | --- | --- | --- | --- |
| Quản lý kho vật tư .msapp | Dashboard_log_user | ServiceInfo | ConnectedWadl | IdentityAccess |
| Quản lý kho vật tư .msapp | MMS_insert_phieu_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Quản lý kho vật tư .msapp | AzureBlobStorage | ServiceInfo | ConnectedWadl | Core |
| Quản lý kho vật tư .msapp | MMS_sql | ServiceInfo | ConnectedWadl | Core |
| Quản lý kho vật tư .msapp | MMS_update_ma_kiem | ServiceInfo | ConnectedWadl | Quality |
| Quản lý kho vật tư .msapp | MMS_insert_nhapkho | ServiceInfo | ConnectedWadl | Putaway |
| Quản lý kho vật tư .msapp | MMS_split_batch | ServiceInfo | ConnectedWadl | Inventory |
| Quản lý kho vật tư .msapp | Http_to_C_MMS | ServiceInfo | ConnectedWadl | Core |
| Quản lý kho vật tư .msapp | MMS_insert_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Quản lý kho vật tư .msapp | tbl_chitiet_nhanhang | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | tbl_dm_user | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Quản lý kho vật tư .msapp | tbl_dm_vattu | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | tbl_phieu_nhan_hang | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | tbl_role_screen | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Quản lý kho vật tư .msapp | tbl_role | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Quản lý kho vật tư .msapp | tbl_khaibao_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | tbl_nhom_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | tbl_nhom_vattu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | tbl_dm_nhom_vattu | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | tbl_tieuchi_kiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | tbl_phieu_nhan_hang_image | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | vw_distinctPO | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | tbl_ChiTietDDH | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | tbl_dm_tieuchi_kiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | vw_tieuchi_kiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | vw_khaibao_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | vw_chitietnhan_coPO | ConnectedDataSourceInfo | SQL/Table/View | Reporting |
| Quản lý kho vật tư .msapp | vw_phieukiem_group_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | vw_ketqua_phieu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | vw_ketqua_vattu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | tbl_phieu_transaction | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | tbl_phieu_yeucau | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | tbl_phieu_yeucau_chitiet | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | tbl_batch_inv | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Quản lý kho vật tư .msapp | tbl_transaction | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | vw_chitiet_ddh_conlai | ConnectedDataSourceInfo | SQL/Table/View | Reporting |
| Quản lý kho vật tư .msapp | vw_batch_print | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Quản lý kho vật tư .msapp | tbl_dm_location | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Quản lý kho vật tư .msapp | tbl_dm_location_ma_ke | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Quản lý kho vật tư .msapp | tbl_dm_location_ma_tang | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Quản lý kho vật tư .msapp | vw_phieu_xuatkho | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | vw_distinctPhieuYeuCau | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | vw_status_phieu_nhanhang | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | vw_nhapkho_vattu | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Quản lý kho vật tư .msapp | tbl_dm_screen_pc | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Quản lý kho vật tư .msapp | vw_tong_tonkho | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Quản lý kho vật tư .msapp | tbl_sx_bravo | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | v_ton_he_thong | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | vw_dm_vattu_tonkho | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Quản lý kho vật tư .msapp | v_yeucau_soanhang | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | vw_danhgia_vattu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | vw_batch_xuatkho | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Quản lý kho vật tư .msapp | vw_nhanhang_copo | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Quản lý kho vật tư .msapp | vw_phieu_dnxk_chitiet | ConnectedDataSourceInfo | SQL/Table/View | Reporting |
| Quản lý kho vật tư .msapp | tbl_qc_kiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Quản lý kho vật tư .msapp | tbl_dinhmuc | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | vw_dinhmuc_conlai | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | vw_xuatkho_chitiet | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Quản lý kho vật tư .msapp | tbl_flow_pheduyet | ConnectedDataSourceInfo | SQL/Table/View | Approval |
| Quản lý kho vật tư .msapp | tbl_dm_kehoach | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Quản lý kho vật tư .msapp | tbl_pheduyet_process | ConnectedDataSourceInfo | SQL/Table/View | Approval |
| Quản lý kho vật tư .msapp | tbl_his_pheduyet | ConnectedDataSourceInfo | SQL/Table/View | Approval |
| Quản lý kho vật tư .msapp | vw_phieu_nhanhang_nhapkho | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | AzureBlobStorage | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_insert_phieu_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Kho vật tư .msapp | MMS_sql | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_split_batch | ServiceInfo | ConnectedWadl | Inventory |
| Kho vật tư .msapp | MMS_update_location | ServiceInfo | ConnectedWadl | Putaway |
| Kho vật tư .msapp | MMS_update_xuong_ke | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_insert_tonkho | ServiceInfo | ConnectedWadl | Inventory |
| Kho vật tư .msapp | MMS_insert_xuatkho | ServiceInfo | ConnectedWadl | Outbound |
| Kho vật tư .msapp | MMS_insert_nhanhang | ServiceInfo | ConnectedWadl | Receiving |
| Kho vật tư .msapp | MMS_update_ma_kiem | ServiceInfo | ConnectedWadl | Quality |
| Kho vật tư .msapp | MMS_insert_nhaptra | ServiceInfo | ConnectedWadl | InternalReturn |
| Kho vật tư .msapp | Http_to_C_MMS | ServiceInfo | ConnectedWadl | Core |
| Kho vật tư .msapp | MMS_kiemke_batch | ServiceInfo | ConnectedWadl | Quality |
| Kho vật tư .msapp | tbl_chitiet_nhanhang | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | tbl_phieu_nhan_hang | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | tbl_dm_user | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Kho vật tư .msapp | tbl_dm_vattu | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Kho vật tư .msapp | log_user_screen | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Kho vật tư .msapp | tbl_user_ql | ConnectedDataSourceInfo | SQL/Table/View | IdentityAccess |
| Kho vật tư .msapp | tbl_ChiTietDDH | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | tbl_qc_dm_tieuchikiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | tbl_phieu_nhan_hang_image | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | vw_distinctPO | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | vw_phieukiem_group_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | tbl_qc_kiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | tbl_qc_phieu_kiem | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | vw_danhgia_vattu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | vw_phieukiem_vattu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | vw_ketqua_phieu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | vw_ketqua_vattu_qc | ConnectedDataSourceInfo | SQL/Table/View | Quality |
| Kho vật tư .msapp | vw_chitiet_ddh_conlai | ConnectedDataSourceInfo | SQL/Table/View | Reporting |
| Kho vật tư .msapp | tbl_phieu_transaction | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Kho vật tư .msapp | tbl_transaction | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Kho vật tư .msapp | tbl_batch_inv | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Kho vật tư .msapp | vw_batch_print | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Kho vật tư .msapp | tbl_dm_location | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Kho vật tư .msapp | vw_batch_print_tonkho | ConnectedDataSourceInfo | SQL/Table/View | Putaway |
| Kho vật tư .msapp | tbl_phieu_yeucau | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Kho vật tư .msapp | tbl_phieu_yeucau_chitiet | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Kho vật tư .msapp | vw_batch_xuatkho | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Kho vật tư .msapp | vw_status_soan_vattu | ConnectedDataSourceInfo | SQL/Table/View | Reporting |
| Kho vật tư .msapp | vw_phieu_xuatkho | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Kho vật tư .msapp | v_yeucau_soanhang | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Kho vật tư .msapp | vw_his_id_batch | ConnectedDataSourceInfo | SQL/Table/View | Inventory |
| Kho vật tư .msapp | tbl_his_phieunhap | ConnectedDataSourceInfo | SQL/Table/View | Core |
| Kho vật tư .msapp | vw_yeucau_chitiet | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Kho vật tư .msapp | vw_phieu_yeucau_5ngay | ConnectedDataSourceInfo | SQL/Table/View | Outbound |
| Kho vật tư .msapp | vw_phieu_dnxk_chitiet | ConnectedDataSourceInfo | SQL/Table/View | Reporting |
| Kho vật tư .msapp | vw_phieu_nhanhang_nhapkho | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | vw_nhanhang_copo | ConnectedDataSourceInfo | SQL/Table/View | Receiving |
| Kho vật tư .msapp | tbl_sx_bravo | ConnectedDataSourceInfo | SQL/Table/View | Core |
