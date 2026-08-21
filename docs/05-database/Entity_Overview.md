# Entity Overview From Schema DOCX

| # | Entity | Physical | Type | Module | Definition |
| --- | --- | --- | --- | --- | --- |
| 1 | tbl_chitiet_nhanhang | tbl_chitiet_nhanhang | Table | Nhan hang / Nhap kho | Chi tiet vat tu nhan hang. |
| 2 | tbl_dm_user | tbl_dm_user | Table | User / Role / Security | Danh muc nguoi dung, thong tin dang nhap, bo phan va role. |
| 3 | tbl_dm_vattu | tbl_dm_vattu | Table | Core / Khac | Danh muc vat tu. |
| 4 | tbl_phieu_nhan_hang | tbl_phieu_nhan_hang | Table | Nhan hang / Nhap kho | Header phieu nhan hang. |
| 5 | tbl_role_screen | tbl_role_screen | Table | User / Role / Security | Phan quyen role theo man hinh. |
| 6 | tbl_role | tbl_role | Table | User / Role / Security | Danh muc role ung dung. |
| 7 | tbl_khaibao_qc | tbl_khaibao_qc | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu khaibao qc. |
| 8 | tbl_nhom_qc | tbl_nhom_qc | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu nhom qc. |
| 9 | tbl_nhom_vattu_qc | tbl_nhom_vattu_qc | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu nhom vattu qc. |
| 10 | tbl_dm_nhom_vattu | tbl_dm_nhom_vattu | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu dm nhom vattu. |
| 11 | tbl_tieuchi_kiem | tbl_tieuchi_kiem | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu tieuchi kiem. |
| 12 | tbl_phieu_nhan_hang_image | tbl_phieu_nhan_hang_image | Table | Nhan hang / Nhap kho | Anh dinh kem theo phieu nhan hang. |
| 13 | vw_distinctPO | vw_distinctPO | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu distinctPO. |
| 14 | tbl_ChiTietDDH | tbl_ChiTietDDH | Table | Nhan hang / Nhap kho | Bang du lieu cho nghiep vu ChiTietDDH. |
| 15 | tbl_dm_tieuchi_kiem | tbl_dm_tieuchi_kiem | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu dm tieuchi kiem. |
| 16 | vw_tieuchi_kiem | vw_tieuchi_kiem | View | QC / Kiem chat luong | View tong hop cho nghiep vu tieuchi kiem. |
| 17 | vw_khaibao_qc | vw_khaibao_qc | View | QC / Kiem chat luong | View tong hop cho nghiep vu khaibao qc. |
| 18 | vw_chitietnhan_coPO | vw_chitietnhan_coPO | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu chitietnhan coPO. |
| 19 | vw_phieukiem_group_qc | vw_phieukiem_group_qc | View | QC / Kiem chat luong | View tong hop cho nghiep vu phieukiem group qc. |
| 20 | vw_ketqua_phieu_qc | vw_ketqua_phieu_qc | View | QC / Kiem chat luong | View tong hop cho nghiep vu ketqua phieu qc. |
| 21 | vw_ketqua_vattu_qc | vw_ketqua_vattu_qc | View | QC / Kiem chat luong | View tong hop cho nghiep vu ketqua vattu qc. |
| 22 | tbl_phieu_transaction | tbl_phieu_transaction | Table | Core / Khac | Header phieu giao dich kho. |
| 23 | tbl_phieu_yeucau | tbl_phieu_yeucau | Table | De nghi / Xuat kho | Header phieu de nghi xuat kho. |
| 24 | tbl_phieu_yeucau_chitiet | tbl_phieu_yeucau_chitiet | Table | De nghi / Xuat kho | Chi tiet vat tu de nghi xuat kho. |
| 25 | tbl_batch_inv | tbl_batch_inv | Table | Ton kho / Batch / Location | Ton kho batch. |
| 26 | tbl_transaction | tbl_transaction | Table | Core / Khac | Chi tiet transaction kho theo batch. |
| 27 | vw_chitiet_ddh_conlai | vw_chitiet_ddh_conlai | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu chitiet ddh conlai. |
| 28 | vw_batch_print | vw_batch_print | View | Ton kho / Batch / Location | View tong hop cho nghiep vu batch print. |
| 29 | tbl_dm_location | tbl_dm_location | Table | Ton kho / Batch / Location | Danh muc vi tri kho. |
| 30 | tbl_dm_location_ma_ke | tbl_dm_location_ma_ke | Table | Ton kho / Batch / Location | Danh muc ma ke. |
| 31 | tbl_dm_location_ma_tang | tbl_dm_location_ma_tang | Table | Ton kho / Batch / Location | Danh muc tang ke. |
| 32 | vw_phieu_xuatkho | vw_phieu_xuatkho | View | De nghi / Xuat kho | View tong hop cho nghiep vu phieu xuatkho. |
| 33 | vw_distinctPhieuYeuCau | vw_distinctPhieuYeuCau | View | De nghi / Xuat kho | View tong hop cho nghiep vu distinctPhieuYeuCau. |
| 34 | vw_status_phieu_nhanhang | vw_status_phieu_nhanhang | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu status phieu nhanhang. |
| 35 | vw_nhapkho_vattu | vw_nhapkho_vattu | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu nhapkho vattu. |
| 36 | tbl_dm_screen_pc | tbl_dm_screen_pc | Table | User / Role / Security | Danh muc man hinh PC dung cho phan quyen. |
| 37 | vw_tong_tonkho | vw_tong_tonkho | View | Ton kho / Batch / Location | View tong hop cho nghiep vu tong tonkho. |
| 38 | tbl_sx_bravo | tbl_sx_bravo | Table | Core / Khac | Danh muc don vi san xuat / bo phan Bravo. |
| 39 | v_ton_he_thong | v_ton_he_thong | View | Ton kho / Batch / Location | View tong hop cho nghiep vu ton he thong. |
| 40 | vw_dm_vattu_tonkho | vw_dm_vattu_tonkho | View | Ton kho / Batch / Location | View tong hop cho nghiep vu dm vattu tonkho. |
| 41 | v_yeucau_soanhang | v_yeucau_soanhang | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu yeucau soanhang. |
| 42 | vw_danhgia_vattu_qc | vw_danhgia_vattu_qc | View | QC / Kiem chat luong | View tong hop cho nghiep vu danhgia vattu qc. |
| 43 | vw_batch_xuatkho | vw_batch_xuatkho | View | Ton kho / Batch / Location | View tong hop cho nghiep vu batch xuatkho. |
| 44 | vw_nhanhang_copo | vw_nhanhang_copo | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu nhanhang copo. |
| 45 | vw_phieu_dnxk_chitiet | vw_phieu_dnxk_chitiet | View | Reporting / View | View tong hop cho nghiep vu phieu dnxk chitiet. |
| 46 | tbl_qc_kiem | tbl_qc_kiem | Table | QC / Kiem chat luong | Bang du lieu cho nghiep vu qc kiem. |
| 47 | tbl_dinhmuc | tbl_dinhmuc | Table | De nghi / Xuat kho | Bang du lieu cho nghiep vu dinhmuc. |
| 48 | vw_dinhmuc_conlai | vw_dinhmuc_conlai | View | De nghi / Xuat kho | View tong hop cho nghiep vu dinhmuc conlai. |
| 49 | vw_xuatkho_chitiet | vw_xuatkho_chitiet | View | De nghi / Xuat kho | View tong hop cho nghiep vu xuatkho chitiet. |
| 50 | tbl_flow_pheduyet | tbl_flow_pheduyet | Table | Phe duyet | Cau hinh flow phe duyet. |
| 51 | tbl_dm_kehoach | tbl_dm_kehoach | Table | De nghi / Xuat kho | Bang du lieu cho nghiep vu dm kehoach. |
| 52 | tbl_pheduyet_process | tbl_pheduyet_process | Table | Phe duyet | Danh sach buoc / nguoi phe duyet theo flow. |
| 53 | tbl_his_pheduyet | tbl_his_pheduyet | Table | Phe duyet | Lich su phe duyet phieu. |
| 54 | vw_phieu_nhanhang_nhapkho | vw_phieu_nhanhang_nhapkho | View | Nhan hang / Nhap kho | View tong hop cho nghiep vu phieu nhanhang nhapkho. |
| 55 | tbl_phieu_nhap_noibo | tbl_phieu_nhap_noibo | Table | Noi bo | Ghi nhan thong tin phieu tra / nhap noi bo tu don vi san xuat ve kho. |
| 56 | tbl_chitiet_nhap_noibo | tbl_chitiet_nhap_noibo | Table | Noi bo | Ghi nhan chi tiet vat tu theo phieu tra / nhap noi bo. |
