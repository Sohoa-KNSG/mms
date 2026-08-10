# Requirements Traceability Matrix

| UC | Nghiệp vụ | Module | Nguồn | SP/API |
| --- | --- | --- | --- | --- |
| UC01 | Đăng nhập PC/Mobile | IdentityAccess | scr_login, scr_mob_login | Stored procedure + /api/v1/identityaccess |
| UC02 | Quản trị role và màn hình | IdentityAccess | scr_admin_role_app | Stored procedure + /api/v1/identityaccess |
| UC03 | Tạm nhận hàng | Receiving | scr_tam_nhanhang, scr_tam_nhanhang_po, scr_tam_nhanhang_log | Stored procedure + /api/v1/receiving |
| UC04 | Nhận hàng theo PO | Receiving | scr_nhanhang_po, scr_nhanhang_po_chitiet, scr_nhanhang_po_nhapmoi, scr_nhanhang_po_edit | Stored procedure + /api/v1/receiving |
| UC05 | Nhận hàng không PO | Receiving | scr_nhanhang_khong_po | Stored procedure + /api/v1/receiving |
| UC06 | Nhận hàng nội bộ | Receiving | scr_nhanhang_noibo | Stored procedure + /api/v1/receiving |
| UC07 | Lịch sử nhận hàng | Receiving | scr_nhanhang_log | Stored procedure + /api/v1/receiving |
| UC08 | Cập nhật PO nhập kho | Putaway | scr_nhapkho_update_po, scr_nhapkho_update_nhieu_po | Stored procedure + /api/v1/putaway |
| UC09 | Thủ tục nhập kho | Putaway | scr_nhapkho_thutuc, scr_nhapkho_ql, scr_nhapkho_batch | Stored procedure + /api/v1/putaway |
| UC10 | Tách batch và in tem | Putaway | scr_nhapkho_tachbatch_intem | Stored procedure + /api/v1/putaway |
| UC11 | Lưu kho lên kệ | Putaway | scr_luukho, scr_luukho_ql, scr_luukho_so_do, scr_luukho_len_ke, scr_luukho_doi_ke, scr_luukho_vitri_ke | Stored procedure + /api/v1/putaway |
| UC12 | Cấu hình QC | Quality | scr_qc_update_nhom_admin, scr_qc_update_vattu, scr_qc_info_tieuchi | Stored procedure + /api/v1/quality |
| UC13 | Phiếu kiểm QC | Quality | scr_qc_phieukiem, scr_qc_phieukiem_print, scr_qc_info_danhgia | Stored procedure + /api/v1/quality |
| UC14 | Đánh giá vật tư QC | Quality | scr_qc_danhgia_vattu, scr_qc_log_info_edit, scr_qc_log_phieu_kiem, scr_qc_log_phieu_nhanhang | Stored procedure + /api/v1/quality |
| UC15 | Khai báo tồn kho | Inventory | scr_tonkho_khaibao, scr_tonkho_khaibao_ver1 | Stored procedure + /api/v1/inventory |
| UC16 | In tem tồn kho | Inventory | scr_tonkho_intem | Stored procedure + /api/v1/inventory |
| UC17 | Lịch sử batch | Inventory | scr_his_id_batch | Stored procedure + /api/v1/inventory |
| UC18 | Kiểm kê batch | Inventory | scr_kiemke_batch, scr_kiemke_vitri_ke | Stored procedure + /api/v1/inventory |
| UC19 | Tạo đề nghị xuất kho | Outbound | scr_denghi_xuatkho_request, scr_denghi_xuatkho_planning, scr_denghi_xuatkho_no_planning, scr_denghi_xuatkho_planning_vuot | Stored procedure + /api/v1/outbound |
| UC20 | Đề nghị xuất kho mobile | Outbound | scr_mob_denghi_xuatkho_planning, scr_mob_denghi_xuatkho_no_planning, scr_mob_denghi_xuatkho_planning_vuot, scr_mob_denghi_xuatkho_log | Stored procedure + /api/v1/outbound |
| UC21 | Lịch sử và chỉnh sửa đề nghị xuất kho | Outbound | scr_denghi_xuatkho_log, scr_admin_chinhsua_denghi | Stored procedure + /api/v1/outbound |
| UC22 | Soạn hàng | Outbound | scr_soanhang, scr_soanhang_batch, scr_soanhang_batch_1, scr_soanhang_chitiet | Stored procedure + /api/v1/outbound |
| UC23 | Thủ tục xuất kho | Outbound | scr_xuatkho_thutuc, scr_xuatkho_tructiep, scr_xuatkho_phieu_print, scr_xuatkho_phieu_print_20 | Stored procedure + /api/v1/outbound |
| UC24 | Phê duyệt phiếu | Approval | tbl_flow_pheduyet, tbl_pheduyet_process, tbl_his_pheduyet | Stored procedure + /api/v1/approval |
| UC25 | Phiếu trả/nhập nội bộ | InternalReturn | tbl_phieu_nhap_noibo, tbl_chitiet_nhap_noibo | Stored procedure + /api/v1/internalreturn |
| UC26 | Báo cáo tồn và giao dịch | Reporting | vw_tong_tonkho, v_ton_he_thong, vw_phieu_dnxk_chitiet | Stored procedure + /api/v1/reporting |
