# Entity Traceability Matrix

| Entity | Type | Schema module | Target module |
| --- | --- | --- | --- |
| tbl_chitiet_nhanhang | Table | Nhan hang / Nhap kho | Receiving |
| tbl_dm_user | Table | User / Role / Security | IdentityAccess |
| tbl_dm_vattu | Table | Core / Khac | Core / Khac |
| tbl_phieu_nhan_hang | Table | Nhan hang / Nhap kho | Receiving |
| tbl_role_screen | Table | User / Role / Security | IdentityAccess |
| tbl_role | Table | User / Role / Security | IdentityAccess |
| tbl_khaibao_qc | Table | QC / Kiem chat luong | Quality |
| tbl_nhom_qc | Table | QC / Kiem chat luong | Quality |
| tbl_nhom_vattu_qc | Table | QC / Kiem chat luong | Quality |
| tbl_dm_nhom_vattu | Table | QC / Kiem chat luong | QC / Kiem chat luong |
| tbl_tieuchi_kiem | Table | QC / Kiem chat luong | Quality |
| tbl_phieu_nhan_hang_image | Table | Nhan hang / Nhap kho | Receiving |
| vw_distinctPO | View | Nhan hang / Nhap kho | Receiving |
| tbl_ChiTietDDH | Table | Nhan hang / Nhap kho | Receiving |
| tbl_dm_tieuchi_kiem | Table | QC / Kiem chat luong | Quality |
| vw_tieuchi_kiem | View | QC / Kiem chat luong | Quality |
| vw_khaibao_qc | View | QC / Kiem chat luong | Quality |
| vw_chitietnhan_coPO | View | Nhan hang / Nhap kho | Reporting |
| vw_phieukiem_group_qc | View | QC / Kiem chat luong | Quality |
| vw_ketqua_phieu_qc | View | QC / Kiem chat luong | Quality |
| vw_ketqua_vattu_qc | View | QC / Kiem chat luong | Quality |
| tbl_phieu_transaction | Table | Core / Khac | Core / Khac |
| tbl_phieu_yeucau | Table | De nghi / Xuat kho | Outbound |
| tbl_phieu_yeucau_chitiet | Table | De nghi / Xuat kho | Outbound |
| tbl_batch_inv | Table | Ton kho / Batch / Location | Inventory |
| tbl_transaction | Table | Core / Khac | Core / Khac |
| vw_chitiet_ddh_conlai | View | Nhan hang / Nhap kho | Reporting |
| vw_batch_print | View | Ton kho / Batch / Location | Putaway |
| tbl_dm_location | Table | Ton kho / Batch / Location | Putaway |
| tbl_dm_location_ma_ke | Table | Ton kho / Batch / Location | Putaway |
| tbl_dm_location_ma_tang | Table | Ton kho / Batch / Location | Putaway |
| vw_phieu_xuatkho | View | De nghi / Xuat kho | Outbound |
| vw_distinctPhieuYeuCau | View | De nghi / Xuat kho | Outbound |
| vw_status_phieu_nhanhang | View | Nhan hang / Nhap kho | Receiving |
| vw_nhapkho_vattu | View | Nhan hang / Nhap kho | Putaway |
| tbl_dm_screen_pc | Table | User / Role / Security | IdentityAccess |
| vw_tong_tonkho | View | Ton kho / Batch / Location | Inventory |
| tbl_sx_bravo | Table | Core / Khac | Core / Khac |
| v_ton_he_thong | View | Ton kho / Batch / Location | Ton kho / Batch / Location |
| vw_dm_vattu_tonkho | View | Ton kho / Batch / Location | Inventory |
| v_yeucau_soanhang | View | Nhan hang / Nhap kho | Outbound |
| vw_danhgia_vattu_qc | View | QC / Kiem chat luong | Quality |
| vw_batch_xuatkho | View | Ton kho / Batch / Location | Inventory |
| vw_nhanhang_copo | View | Nhan hang / Nhap kho | Receiving |
| vw_phieu_dnxk_chitiet | View | Reporting / View | Reporting |
| tbl_qc_kiem | Table | QC / Kiem chat luong | Quality |
| tbl_dinhmuc | Table | De nghi / Xuat kho | Outbound |
| vw_dinhmuc_conlai | View | De nghi / Xuat kho | Outbound |
| vw_xuatkho_chitiet | View | De nghi / Xuat kho | Outbound |
| tbl_flow_pheduyet | Table | Phe duyet | Approval |
| tbl_dm_kehoach | Table | De nghi / Xuat kho | De nghi / Xuat kho |
| tbl_pheduyet_process | Table | Phe duyet | Approval |
| tbl_his_pheduyet | Table | Phe duyet | Approval |
| vw_phieu_nhanhang_nhapkho | View | Nhan hang / Nhap kho | Receiving |
| tbl_phieu_nhap_noibo | Table | Noi bo | InternalReturn |
| tbl_chitiet_nhap_noibo | Table | Noi bo | InternalReturn |
