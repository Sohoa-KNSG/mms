# SQL Stored Procedure Catalog

| UC | Module | Stored procedure đề xuất | Ghi chú |
| --- | --- | --- | --- |
| UC01 | IdentityAccess | usp_ng_nh_p_pc_mobile | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC02 | IdentityAccess | usp_qu_n_tr_role_v_m_n_h_nh | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC03 | Receiving | usp_t_m_nh_n_h_ng | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC04 | Receiving | usp_nh_n_h_ng_theo_po | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC05 | Receiving | usp_nh_n_h_ng_kh_ng_po | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC06 | Receiving | usp_nh_n_h_ng_n_i_b | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC07 | Receiving | usp_l_ch_s_nh_n_h_ng | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC08 | Putaway | usp_c_p_nh_t_po_nh_p_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC09 | Putaway | usp_th_t_c_nh_p_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC10 | Putaway | usp_t_ch_batch_v_in_tem | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC11 | Putaway | usp_l_u_kho_l_n_k | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC12 | Quality | usp_c_u_h_nh_qc | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC13 | Quality | usp_phi_u_ki_m_qc | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC14 | Quality | usp_nh_gi_v_t_t_qc | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC15 | Inventory | usp_khai_b_o_t_n_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC16 | Inventory | usp_in_tem_t_n_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC17 | Inventory | usp_l_ch_s_batch | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC18 | Inventory | usp_ki_m_k_batch | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC19 | Outbound | usp_t_o_ngh_xu_t_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC20 | Outbound | usp_ngh_xu_t_kho_mobile | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC21 | Outbound | usp_l_ch_s_v_ch_nh_s_a_ngh_xu_t_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC22 | Outbound | usp_so_n_h_ng | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC23 | Outbound | usp_th_t_c_xu_t_kho | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC24 | Approval | usp_ph_duy_t_phi_u | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC25 | InternalReturn | usp_phi_u_tr_nh_p_n_i_b | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |
| UC26 | Reporting | usp_b_o_c_o_t_n_v_giao_d_ch | Cần thiết kế/chuẩn hóa; backend chỉ gọi SP |

## Stored procedure đã xác định rõ

| SP | Ghi chú |
|---|---|
| usp_xacnhan_phieu_nhap_noibo | Xử lý thủ kho xác nhận phiếu trả nội bộ, gồm đạt/không đạt/từ chối |
| usp_truyvan_tonkho_hientai | Truy vấn tồn kho hiện tại phát sinh từ transaction |
| usp_chot_tonkho_dauthang | Ghi nhận tồn đầu tháng theo batch và nghiệp vụ |
