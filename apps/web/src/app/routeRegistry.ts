export interface AppRouteDefinition {
  path: string;
  label: string;
  useCaseId: string;
}

const route = (path: string, label: string, useCaseId: string): AppRouteDefinition => ({ path, label, useCaseId });

export const routeRegistry: Record<string, readonly AppRouteDefinition[]> = {
  scr_tam_nhanhang_log: [route('/receiving/log', 'Nhật ký nhận hàng', 'INB-04')],
  scr_nhanhang_log: [route('/receiving/log', 'Nhật ký nhận hàng', 'INB-04')],
  scr_tonkho_intem: [route('/inventory/balances', 'Tồn kho', 'INV-01')],
  scr_his_id_batch: [route('/inventory/batches', 'Lịch sử batch', 'INV-02')],
  scr_his_vattu: [route('/inventory/materials', 'Lịch sử vật tư', 'INV-03')],
  scr_luukho_so_do: [route('/locations', 'Sơ đồ vị trí', 'LOC-01')],
  scr_luukho_vitri_ke: [route('/locations', 'Sơ đồ vị trí', 'LOC-01')],
  operations_summary: [route('/administration/operations', 'Giám sát vận hành', 'ADM-03')],
  scr_admin_role_app: [
    route('/administration/access', 'Vai trò và quyền', 'ADM-01'),
    route('/administration/catalogs', 'Danh mục cấu hình', 'ADM-02'),
  ],
  scr_qc_update_nhom_admin: [route('/quality/configuration', 'Cấu hình QC', 'QC-01')],
  scr_qc_info_tieuchi: [route('/quality/configuration', 'Cấu hình QC', 'QC-01')],
  scr_qc_update_vattu: [route('/quality/material-assignments', 'Gán QC vật tư', 'QC-02')],
  scr_qc_phieukiem: [route('/quality/inspections/new', 'Lập phiếu kiểm', 'QC-03')],
  scr_qc_info_danhgia: [route('/quality/inspections/new', 'Lập phiếu kiểm', 'QC-03')],
  scr_qc_danhgia_vattu: [route('/quality/evaluation', 'Đánh giá vật tư', 'QC-04')],
  scr_qc_log_phieu_kiem: [route('/quality/history', 'Lịch sử QC', 'QC-05')],
  scr_qc_log_phieu_nhanhang: [route('/quality/history', 'Lịch sử QC', 'QC-05')],
  scr_qc_log_info_edit: [route('/quality/history', 'Lịch sử QC', 'QC-05')],
  scr_qc_phieukiem_print: [route('/quality/print', 'In phiếu kiểm', 'QC-06')],
  scr_nhanhang_po: [route('/receiving/with-po', 'Nhận hàng theo PO', 'INB-01')],
  scr_nhanhang_po_chitiet: [route('/receiving/with-po', 'Nhận hàng theo PO', 'INB-01')],
  scr_nhanhang_po_nhapmoi: [route('/receiving/with-po', 'Nhận hàng theo PO', 'INB-01')],
  scr_nhanhang_khong_po: [route('/receiving/without-po', 'Nhận hàng không PO', 'INB-02')],
  scr_nhanhang_po_edit: [route('/receiving/receipts', 'Chỉnh sửa phiếu nhận', 'INB-03')],
  scr_tam_nhanhang: [route('/receiving/receipts', 'Chỉnh sửa phiếu nhận', 'INB-03')],
  scr_nhapkho_update_po: [route('/receiving/attach-po', 'Cập nhật một PO', 'INB-05')],
  scr_nhapkho_update_nhieu_po: [route('/receiving/attach-multiple-pos', 'Cập nhật nhiều PO', 'INB-06')],
  scr_nhapkho_thutuc: [route('/receiving/warehouse', 'Thủ tục nhập kho', 'INB-07')],
  scr_nhapkho_ql: [route('/receiving/warehouse', 'Thủ tục nhập kho', 'INB-07')],
  scr_nhapkho_batch: [route('/receiving/batch-labels', 'In tem batch', 'INB-08')],
  scr_nhapkho_tachbatch_intem: [
    route('/receiving/batch-labels', 'In tem batch', 'INB-08'),
    route('/inventory/split-batch', 'Tách batch', 'INV-05'),
  ],
  scr_tonkho_khaibao: [route('/inventory/declare', 'Khai báo tồn kho', 'INV-04')],
  scr_kiemke_batch: [route('/inventory/count-batch', 'Kiểm kê batch', 'INV-06')],
  scr_kiemke_vitri_ke: [route('/inventory/count-location', 'Kiểm kê vị trí', 'INV-07')],
  scr_luukho_len_ke: [route('/locations/put-away', 'Đưa batch lên kệ', 'LOC-02')],
  scr_luukho_doi_ke: [route('/locations/relocate', 'Đổi vị trí kệ', 'LOC-03')],
  scr_luukho: [route('/locations/take-down', 'Đưa batch xuống kệ', 'LOC-04')],
  scr_luukho_ql: [
    route('/locations/put-away', 'Đưa batch lên kệ', 'LOC-02'),
    route('/locations/take-down', 'Đưa batch xuống kệ', 'LOC-04'),
  ],
  scr_denghi_xuatkho_planning: [route('/outbound/requests/planned', 'Đề nghị trong kế hoạch', 'OUT-01')],
  scr_mob_denghi_xuatkho_planning: [route('/outbound/requests/planned', 'Đề nghị trong kế hoạch', 'OUT-01')],
  scr_denghi_xuatkho_no_planning: [route('/outbound/requests/unplanned', 'Đề nghị ngoài kế hoạch', 'OUT-02')],
  scr_mob_denghi_xuatkho_no_planning: [route('/outbound/requests/unplanned', 'Đề nghị ngoài kế hoạch', 'OUT-02')],
  scr_denghi_xuatkho_request: [route('/outbound/requests/unplanned', 'Đề nghị ngoài kế hoạch', 'OUT-02')],
  scr_denghi_xuatkho_planning_vuot: [route('/outbound/requests/over-plan', 'Đề nghị vượt kế hoạch', 'OUT-03')],
  scr_mob_denghi_xuatkho_planning_vuot: [route('/outbound/requests/over-plan', 'Đề nghị vượt kế hoạch', 'OUT-03')],
  scr_chinhsua_denghi_baobi: [route('/outbound/requests/edit', 'Chỉnh sửa đề nghị', 'OUT-04')],
  scr_admin_chinhsua_denghi: [route('/outbound/requests/edit', 'Chỉnh sửa đề nghị', 'OUT-04')],
  scr_denghi_xuatkho_log: [route('/outbound/requests', 'Theo dõi đề nghị', 'OUT-05')],
  scr_mob_denghi_xuatkho_log: [route('/outbound/requests', 'Theo dõi đề nghị', 'OUT-05')],
  scr_soanhang: [route('/outbound/picking', 'Soạn hàng', 'OUT-06')],
  scr_soanhang_chitiet: [route('/outbound/picking', 'Soạn hàng', 'OUT-06')],
  scr_soanhang_batch: [route('/outbound/picking', 'Soạn theo batch', 'OUT-07')],
  scr_xuatkho_tructiep: [route('/outbound/picking', 'Xác nhận xuất kho', 'OUT-08')],
  scr_xuatkho_thutuc: [
    route('/outbound/issue-documents', 'Thủ tục xuất kho', 'OUT-08'),
    route('/outbound/issue-documents', 'Phiếu xuất kho', 'OUT-09'),
  ],
  scr_xuatkho_phieu_print: [route('/outbound/issue-documents', 'In phiếu xuất', 'OUT-09')],
  scr_xuatkho_phieu_print_20: [route('/outbound/issue-documents', 'In phiếu xuất', 'OUT-09')],
  scr_phieutra_noibo: [route('/returns/internal', 'Phiếu trả nội bộ', 'RET-01')],
  scr_thukho_xacnhan_noibo: [route('/returns/internal/confirmation', 'Xác nhận trả nội bộ', 'RET-02')],
  scr_nhaptra_tachbatch_intem: [route('/returns/internal/split-batch', 'Tách batch nhập trả', 'RET-03')],
};

export function routesForNavigation(navigation: ReadonlyArray<{ screenCode: string }>): AppRouteDefinition[] {
  return navigation
    .flatMap((item) => routeRegistry[item.screenCode] ?? [])
    .filter((item, index, all) => all.findIndex((candidate) => candidate.path === item.path) === index);
}
