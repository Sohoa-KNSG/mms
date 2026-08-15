# Replication

Database `MMS` · snapshot `2026-08-15 13:42:41 +07:00` · **177 procedure**

## Mục lục

- [`dbo.sp_MSdel_dbolog_user_screen`](#dbo-sp-msdel-dbolog-user-screen)
- [`dbo.sp_MSdel_dbosysdiagrams`](#dbo-sp-msdel-dbosysdiagrams)
- [`dbo.sp_MSdel_dbotbl_bang_tam_DDH`](#dbo-sp-msdel-dbotbl-bang-tam-ddh)
- [`dbo.sp_MSdel_dbotbl_bang_tam_dm_vattu`](#dbo-sp-msdel-dbotbl-bang-tam-dm-vattu)
- [`dbo.sp_MSdel_dbotbl_batch_event`](#dbo-sp-msdel-dbotbl-batch-event)
- [`dbo.sp_MSdel_dbotbl_batch_inv`](#dbo-sp-msdel-dbotbl-batch-inv)
- [`dbo.sp_MSdel_dbotbl_chitiet_nhanhang`](#dbo-sp-msdel-dbotbl-chitiet-nhanhang)
- [`dbo.sp_MSdel_dbotbl_chitiet_nhap_noibo`](#dbo-sp-msdel-dbotbl-chitiet-nhap-noibo)
- [`dbo.sp_MSdel_dbotbl_ChiTietDDH`](#dbo-sp-msdel-dbotbl-chitietddh)
- [`dbo.sp_MSdel_dbotbl_dinhmuc`](#dbo-sp-msdel-dbotbl-dinhmuc)
- [`dbo.sp_MSdel_dbotbl_dm_batch_event`](#dbo-sp-msdel-dbotbl-dm-batch-event)
- [`dbo.sp_MSdel_dbotbl_dm_donvi_bravo`](#dbo-sp-msdel-dbotbl-dm-donvi-bravo)
- [`dbo.sp_MSdel_dbotbl_dm_donvi_kehoach`](#dbo-sp-msdel-dbotbl-dm-donvi-kehoach)
- [`dbo.sp_MSdel_dbotbl_dm_kehoach`](#dbo-sp-msdel-dbotbl-dm-kehoach)
- [`dbo.sp_MSdel_dbotbl_dm_location`](#dbo-sp-msdel-dbotbl-dm-location)
- [`dbo.sp_MSdel_dbotbl_dm_location_event`](#dbo-sp-msdel-dbotbl-dm-location-event)
- [`dbo.sp_MSdel_dbotbl_dm_location_ma_khu_vuc`](#dbo-sp-msdel-dbotbl-dm-location-ma-khu-vuc)
- [`dbo.sp_MSdel_dbotbl_dm_location_ma_tang`](#dbo-sp-msdel-dbotbl-dm-location-ma-tang)
- [`dbo.sp_MSdel_dbotbl_dm_nghiepvu`](#dbo-sp-msdel-dbotbl-dm-nghiepvu)
- [`dbo.sp_MSdel_dbotbl_dm_nghiepvu_kho`](#dbo-sp-msdel-dbotbl-dm-nghiepvu-kho)
- [`dbo.sp_MSdel_dbotbl_dm_nhom_vattu`](#dbo-sp-msdel-dbotbl-dm-nhom-vattu)
- [`dbo.sp_MSdel_dbotbl_dm_screen_pc`](#dbo-sp-msdel-dbotbl-dm-screen-pc)
- [`dbo.sp_MSdel_dbotbl_dm_status_nhanhang`](#dbo-sp-msdel-dbotbl-dm-status-nhanhang)
- [`dbo.sp_MSdel_dbotbl_dm_status_phieu_dnxk`](#dbo-sp-msdel-dbotbl-dm-status-phieu-dnxk)
- [`dbo.sp_MSdel_dbotbl_dm_status_soanhang`](#dbo-sp-msdel-dbotbl-dm-status-soanhang)
- [`dbo.sp_MSdel_dbotbl_dm_tieuchi_kiem`](#dbo-sp-msdel-dbotbl-dm-tieuchi-kiem)
- [`dbo.sp_MSdel_dbotbl_dm_trangthai_phieuyc`](#dbo-sp-msdel-dbotbl-dm-trangthai-phieuyc)
- [`dbo.sp_MSdel_dbotbl_dm_trangthai_ton`](#dbo-sp-msdel-dbotbl-dm-trangthai-ton)
- [`dbo.sp_MSdel_dbotbl_dm_user`](#dbo-sp-msdel-dbotbl-dm-user)
- [`dbo.sp_MSdel_dbotbl_dm_vattu`](#dbo-sp-msdel-dbotbl-dm-vattu)
- [`dbo.sp_MSdel_dbotbl_donvi_sx`](#dbo-sp-msdel-dbotbl-donvi-sx)
- [`dbo.sp_MSdel_dbotbl_flow_pheduyet`](#dbo-sp-msdel-dbotbl-flow-pheduyet)
- [`dbo.sp_MSdel_dbotbl_his_chitiet_nhanhang`](#dbo-sp-msdel-dbotbl-his-chitiet-nhanhang)
- [`dbo.sp_MSdel_dbotbl_his_pheduyet`](#dbo-sp-msdel-dbotbl-his-pheduyet)
- [`dbo.sp_MSdel_dbotbl_his_phieunhap`](#dbo-sp-msdel-dbotbl-his-phieunhap)
- [`dbo.sp_MSdel_dbotbl_his_status_pheduyet`](#dbo-sp-msdel-dbotbl-his-status-pheduyet)
- [`dbo.sp_MSdel_dbotbl_kehoach_dinhmuc`](#dbo-sp-msdel-dbotbl-kehoach-dinhmuc)
- [`dbo.sp_MSdel_dbotbl_khaibao_qc`](#dbo-sp-msdel-dbotbl-khaibao-qc)
- [`dbo.sp_MSdel_dbotbl_location_event`](#dbo-sp-msdel-dbotbl-location-event)
- [`dbo.sp_MSdel_dbotbl_map_xuatkho`](#dbo-sp-msdel-dbotbl-map-xuatkho)
- [`dbo.sp_MSdel_dbotbl_nhom_qc`](#dbo-sp-msdel-dbotbl-nhom-qc)
- [`dbo.sp_MSdel_dbotbl_nhom_vattu_qc`](#dbo-sp-msdel-dbotbl-nhom-vattu-qc)
- [`dbo.sp_MSdel_dbotbl_pheduyet_flow`](#dbo-sp-msdel-dbotbl-pheduyet-flow)
- [`dbo.sp_MSdel_dbotbl_pheduyet_process`](#dbo-sp-msdel-dbotbl-pheduyet-process)
- [`dbo.sp_MSdel_dbotbl_phieu_nhan_hang`](#dbo-sp-msdel-dbotbl-phieu-nhan-hang)
- [`dbo.sp_MSdel_dbotbl_phieu_nhan_hang_image`](#dbo-sp-msdel-dbotbl-phieu-nhan-hang-image)
- [`dbo.sp_MSdel_dbotbl_phieu_nhap_noibo`](#dbo-sp-msdel-dbotbl-phieu-nhap-noibo)
- [`dbo.sp_MSdel_dbotbl_phieu_transaction`](#dbo-sp-msdel-dbotbl-phieu-transaction)
- [`dbo.sp_MSdel_dbotbl_phieu_yeucau`](#dbo-sp-msdel-dbotbl-phieu-yeucau)
- [`dbo.sp_MSdel_dbotbl_phieu_yeucau_chitiet`](#dbo-sp-msdel-dbotbl-phieu-yeucau-chitiet)
- [`dbo.sp_MSdel_dbotbl_qc_kiem`](#dbo-sp-msdel-dbotbl-qc-kiem)
- [`dbo.sp_MSdel_dbotbl_qc_phieu_kiem`](#dbo-sp-msdel-dbotbl-qc-phieu-kiem)
- [`dbo.sp_MSdel_dbotbl_role`](#dbo-sp-msdel-dbotbl-role)
- [`dbo.sp_MSdel_dbotbl_role_screen`](#dbo-sp-msdel-dbotbl-role-screen)
- [`dbo.sp_MSdel_dbotbl_sx_bravo`](#dbo-sp-msdel-dbotbl-sx-bravo)
- [`dbo.sp_MSdel_dbotbl_tieuchi_kiem`](#dbo-sp-msdel-dbotbl-tieuchi-kiem)
- [`dbo.sp_MSdel_dbotbl_transaction`](#dbo-sp-msdel-dbotbl-transaction)
- [`dbo.sp_MSdel_dbotbl_user_ql`](#dbo-sp-msdel-dbotbl-user-ql)
- [`dbo.sp_MSdel_dbotbl_v_B20Dept`](#dbo-sp-msdel-dbotbl-v-b20dept)
- [`dbo.sp_MSins_dbolog_user_screen`](#dbo-sp-msins-dbolog-user-screen)
- [`dbo.sp_MSins_dbosysdiagrams`](#dbo-sp-msins-dbosysdiagrams)
- [`dbo.sp_MSins_dbotbl_bang_tam_DDH`](#dbo-sp-msins-dbotbl-bang-tam-ddh)
- [`dbo.sp_MSins_dbotbl_bang_tam_dm_vattu`](#dbo-sp-msins-dbotbl-bang-tam-dm-vattu)
- [`dbo.sp_MSins_dbotbl_batch_event`](#dbo-sp-msins-dbotbl-batch-event)
- [`dbo.sp_MSins_dbotbl_batch_inv`](#dbo-sp-msins-dbotbl-batch-inv)
- [`dbo.sp_MSins_dbotbl_chitiet_nhanhang`](#dbo-sp-msins-dbotbl-chitiet-nhanhang)
- [`dbo.sp_MSins_dbotbl_chitiet_nhap_noibo`](#dbo-sp-msins-dbotbl-chitiet-nhap-noibo)
- [`dbo.sp_MSins_dbotbl_ChiTietDDH`](#dbo-sp-msins-dbotbl-chitietddh)
- [`dbo.sp_MSins_dbotbl_dinhmuc`](#dbo-sp-msins-dbotbl-dinhmuc)
- [`dbo.sp_MSins_dbotbl_dm_batch_event`](#dbo-sp-msins-dbotbl-dm-batch-event)
- [`dbo.sp_MSins_dbotbl_dm_donvi_bravo`](#dbo-sp-msins-dbotbl-dm-donvi-bravo)
- [`dbo.sp_MSins_dbotbl_dm_donvi_kehoach`](#dbo-sp-msins-dbotbl-dm-donvi-kehoach)
- [`dbo.sp_MSins_dbotbl_dm_kehoach`](#dbo-sp-msins-dbotbl-dm-kehoach)
- [`dbo.sp_MSins_dbotbl_dm_location`](#dbo-sp-msins-dbotbl-dm-location)
- [`dbo.sp_MSins_dbotbl_dm_location_event`](#dbo-sp-msins-dbotbl-dm-location-event)
- [`dbo.sp_MSins_dbotbl_dm_location_ma_khu_vuc`](#dbo-sp-msins-dbotbl-dm-location-ma-khu-vuc)
- [`dbo.sp_MSins_dbotbl_dm_location_ma_tang`](#dbo-sp-msins-dbotbl-dm-location-ma-tang)
- [`dbo.sp_MSins_dbotbl_dm_nghiepvu`](#dbo-sp-msins-dbotbl-dm-nghiepvu)
- [`dbo.sp_MSins_dbotbl_dm_nghiepvu_kho`](#dbo-sp-msins-dbotbl-dm-nghiepvu-kho)
- [`dbo.sp_MSins_dbotbl_dm_nhom_vattu`](#dbo-sp-msins-dbotbl-dm-nhom-vattu)
- [`dbo.sp_MSins_dbotbl_dm_screen_pc`](#dbo-sp-msins-dbotbl-dm-screen-pc)
- [`dbo.sp_MSins_dbotbl_dm_status_nhanhang`](#dbo-sp-msins-dbotbl-dm-status-nhanhang)
- [`dbo.sp_MSins_dbotbl_dm_status_phieu_dnxk`](#dbo-sp-msins-dbotbl-dm-status-phieu-dnxk)
- [`dbo.sp_MSins_dbotbl_dm_status_soanhang`](#dbo-sp-msins-dbotbl-dm-status-soanhang)
- [`dbo.sp_MSins_dbotbl_dm_tieuchi_kiem`](#dbo-sp-msins-dbotbl-dm-tieuchi-kiem)
- [`dbo.sp_MSins_dbotbl_dm_trangthai_phieuyc`](#dbo-sp-msins-dbotbl-dm-trangthai-phieuyc)
- [`dbo.sp_MSins_dbotbl_dm_trangthai_ton`](#dbo-sp-msins-dbotbl-dm-trangthai-ton)
- [`dbo.sp_MSins_dbotbl_dm_user`](#dbo-sp-msins-dbotbl-dm-user)
- [`dbo.sp_MSins_dbotbl_dm_vattu`](#dbo-sp-msins-dbotbl-dm-vattu)
- [`dbo.sp_MSins_dbotbl_donvi_sx`](#dbo-sp-msins-dbotbl-donvi-sx)
- [`dbo.sp_MSins_dbotbl_flow_pheduyet`](#dbo-sp-msins-dbotbl-flow-pheduyet)
- [`dbo.sp_MSins_dbotbl_his_chitiet_nhanhang`](#dbo-sp-msins-dbotbl-his-chitiet-nhanhang)
- [`dbo.sp_MSins_dbotbl_his_pheduyet`](#dbo-sp-msins-dbotbl-his-pheduyet)
- [`dbo.sp_MSins_dbotbl_his_phieunhap`](#dbo-sp-msins-dbotbl-his-phieunhap)
- [`dbo.sp_MSins_dbotbl_his_status_pheduyet`](#dbo-sp-msins-dbotbl-his-status-pheduyet)
- [`dbo.sp_MSins_dbotbl_kehoach_dinhmuc`](#dbo-sp-msins-dbotbl-kehoach-dinhmuc)
- [`dbo.sp_MSins_dbotbl_khaibao_qc`](#dbo-sp-msins-dbotbl-khaibao-qc)
- [`dbo.sp_MSins_dbotbl_location_event`](#dbo-sp-msins-dbotbl-location-event)
- [`dbo.sp_MSins_dbotbl_map_xuatkho`](#dbo-sp-msins-dbotbl-map-xuatkho)
- [`dbo.sp_MSins_dbotbl_nhom_qc`](#dbo-sp-msins-dbotbl-nhom-qc)
- [`dbo.sp_MSins_dbotbl_nhom_vattu_qc`](#dbo-sp-msins-dbotbl-nhom-vattu-qc)
- [`dbo.sp_MSins_dbotbl_pheduyet_flow`](#dbo-sp-msins-dbotbl-pheduyet-flow)
- [`dbo.sp_MSins_dbotbl_pheduyet_process`](#dbo-sp-msins-dbotbl-pheduyet-process)
- [`dbo.sp_MSins_dbotbl_phieu_nhan_hang`](#dbo-sp-msins-dbotbl-phieu-nhan-hang)
- [`dbo.sp_MSins_dbotbl_phieu_nhan_hang_image`](#dbo-sp-msins-dbotbl-phieu-nhan-hang-image)
- [`dbo.sp_MSins_dbotbl_phieu_nhap_noibo`](#dbo-sp-msins-dbotbl-phieu-nhap-noibo)
- [`dbo.sp_MSins_dbotbl_phieu_transaction`](#dbo-sp-msins-dbotbl-phieu-transaction)
- [`dbo.sp_MSins_dbotbl_phieu_yeucau`](#dbo-sp-msins-dbotbl-phieu-yeucau)
- [`dbo.sp_MSins_dbotbl_phieu_yeucau_chitiet`](#dbo-sp-msins-dbotbl-phieu-yeucau-chitiet)
- [`dbo.sp_MSins_dbotbl_qc_kiem`](#dbo-sp-msins-dbotbl-qc-kiem)
- [`dbo.sp_MSins_dbotbl_qc_phieu_kiem`](#dbo-sp-msins-dbotbl-qc-phieu-kiem)
- [`dbo.sp_MSins_dbotbl_role`](#dbo-sp-msins-dbotbl-role)
- [`dbo.sp_MSins_dbotbl_role_screen`](#dbo-sp-msins-dbotbl-role-screen)
- [`dbo.sp_MSins_dbotbl_sx_bravo`](#dbo-sp-msins-dbotbl-sx-bravo)
- [`dbo.sp_MSins_dbotbl_tieuchi_kiem`](#dbo-sp-msins-dbotbl-tieuchi-kiem)
- [`dbo.sp_MSins_dbotbl_transaction`](#dbo-sp-msins-dbotbl-transaction)
- [`dbo.sp_MSins_dbotbl_user_ql`](#dbo-sp-msins-dbotbl-user-ql)
- [`dbo.sp_MSins_dbotbl_v_B20Dept`](#dbo-sp-msins-dbotbl-v-b20dept)
- [`dbo.sp_MSupd_dbolog_user_screen`](#dbo-sp-msupd-dbolog-user-screen)
- [`dbo.sp_MSupd_dbosysdiagrams`](#dbo-sp-msupd-dbosysdiagrams)
- [`dbo.sp_MSupd_dbotbl_bang_tam_DDH`](#dbo-sp-msupd-dbotbl-bang-tam-ddh)
- [`dbo.sp_MSupd_dbotbl_bang_tam_dm_vattu`](#dbo-sp-msupd-dbotbl-bang-tam-dm-vattu)
- [`dbo.sp_MSupd_dbotbl_batch_event`](#dbo-sp-msupd-dbotbl-batch-event)
- [`dbo.sp_MSupd_dbotbl_batch_inv`](#dbo-sp-msupd-dbotbl-batch-inv)
- [`dbo.sp_MSupd_dbotbl_chitiet_nhanhang`](#dbo-sp-msupd-dbotbl-chitiet-nhanhang)
- [`dbo.sp_MSupd_dbotbl_chitiet_nhap_noibo`](#dbo-sp-msupd-dbotbl-chitiet-nhap-noibo)
- [`dbo.sp_MSupd_dbotbl_ChiTietDDH`](#dbo-sp-msupd-dbotbl-chitietddh)
- [`dbo.sp_MSupd_dbotbl_dinhmuc`](#dbo-sp-msupd-dbotbl-dinhmuc)
- [`dbo.sp_MSupd_dbotbl_dm_batch_event`](#dbo-sp-msupd-dbotbl-dm-batch-event)
- [`dbo.sp_MSupd_dbotbl_dm_donvi_bravo`](#dbo-sp-msupd-dbotbl-dm-donvi-bravo)
- [`dbo.sp_MSupd_dbotbl_dm_donvi_kehoach`](#dbo-sp-msupd-dbotbl-dm-donvi-kehoach)
- [`dbo.sp_MSupd_dbotbl_dm_kehoach`](#dbo-sp-msupd-dbotbl-dm-kehoach)
- [`dbo.sp_MSupd_dbotbl_dm_location`](#dbo-sp-msupd-dbotbl-dm-location)
- [`dbo.sp_MSupd_dbotbl_dm_location_event`](#dbo-sp-msupd-dbotbl-dm-location-event)
- [`dbo.sp_MSupd_dbotbl_dm_location_ma_khu_vuc`](#dbo-sp-msupd-dbotbl-dm-location-ma-khu-vuc)
- [`dbo.sp_MSupd_dbotbl_dm_location_ma_tang`](#dbo-sp-msupd-dbotbl-dm-location-ma-tang)
- [`dbo.sp_MSupd_dbotbl_dm_nghiepvu`](#dbo-sp-msupd-dbotbl-dm-nghiepvu)
- [`dbo.sp_MSupd_dbotbl_dm_nghiepvu_kho`](#dbo-sp-msupd-dbotbl-dm-nghiepvu-kho)
- [`dbo.sp_MSupd_dbotbl_dm_nhom_vattu`](#dbo-sp-msupd-dbotbl-dm-nhom-vattu)
- [`dbo.sp_MSupd_dbotbl_dm_screen_pc`](#dbo-sp-msupd-dbotbl-dm-screen-pc)
- [`dbo.sp_MSupd_dbotbl_dm_status_nhanhang`](#dbo-sp-msupd-dbotbl-dm-status-nhanhang)
- [`dbo.sp_MSupd_dbotbl_dm_status_phieu_dnxk`](#dbo-sp-msupd-dbotbl-dm-status-phieu-dnxk)
- [`dbo.sp_MSupd_dbotbl_dm_status_soanhang`](#dbo-sp-msupd-dbotbl-dm-status-soanhang)
- [`dbo.sp_MSupd_dbotbl_dm_tieuchi_kiem`](#dbo-sp-msupd-dbotbl-dm-tieuchi-kiem)
- [`dbo.sp_MSupd_dbotbl_dm_trangthai_phieuyc`](#dbo-sp-msupd-dbotbl-dm-trangthai-phieuyc)
- [`dbo.sp_MSupd_dbotbl_dm_trangthai_ton`](#dbo-sp-msupd-dbotbl-dm-trangthai-ton)
- [`dbo.sp_MSupd_dbotbl_dm_user`](#dbo-sp-msupd-dbotbl-dm-user)
- [`dbo.sp_MSupd_dbotbl_dm_vattu`](#dbo-sp-msupd-dbotbl-dm-vattu)
- [`dbo.sp_MSupd_dbotbl_donvi_sx`](#dbo-sp-msupd-dbotbl-donvi-sx)
- [`dbo.sp_MSupd_dbotbl_flow_pheduyet`](#dbo-sp-msupd-dbotbl-flow-pheduyet)
- [`dbo.sp_MSupd_dbotbl_his_chitiet_nhanhang`](#dbo-sp-msupd-dbotbl-his-chitiet-nhanhang)
- [`dbo.sp_MSupd_dbotbl_his_pheduyet`](#dbo-sp-msupd-dbotbl-his-pheduyet)
- [`dbo.sp_MSupd_dbotbl_his_phieunhap`](#dbo-sp-msupd-dbotbl-his-phieunhap)
- [`dbo.sp_MSupd_dbotbl_his_status_pheduyet`](#dbo-sp-msupd-dbotbl-his-status-pheduyet)
- [`dbo.sp_MSupd_dbotbl_kehoach_dinhmuc`](#dbo-sp-msupd-dbotbl-kehoach-dinhmuc)
- [`dbo.sp_MSupd_dbotbl_khaibao_qc`](#dbo-sp-msupd-dbotbl-khaibao-qc)
- [`dbo.sp_MSupd_dbotbl_location_event`](#dbo-sp-msupd-dbotbl-location-event)
- [`dbo.sp_MSupd_dbotbl_map_xuatkho`](#dbo-sp-msupd-dbotbl-map-xuatkho)
- [`dbo.sp_MSupd_dbotbl_nhom_qc`](#dbo-sp-msupd-dbotbl-nhom-qc)
- [`dbo.sp_MSupd_dbotbl_nhom_vattu_qc`](#dbo-sp-msupd-dbotbl-nhom-vattu-qc)
- [`dbo.sp_MSupd_dbotbl_pheduyet_flow`](#dbo-sp-msupd-dbotbl-pheduyet-flow)
- [`dbo.sp_MSupd_dbotbl_pheduyet_process`](#dbo-sp-msupd-dbotbl-pheduyet-process)
- [`dbo.sp_MSupd_dbotbl_phieu_nhan_hang`](#dbo-sp-msupd-dbotbl-phieu-nhan-hang)
- [`dbo.sp_MSupd_dbotbl_phieu_nhan_hang_image`](#dbo-sp-msupd-dbotbl-phieu-nhan-hang-image)
- [`dbo.sp_MSupd_dbotbl_phieu_nhap_noibo`](#dbo-sp-msupd-dbotbl-phieu-nhap-noibo)
- [`dbo.sp_MSupd_dbotbl_phieu_transaction`](#dbo-sp-msupd-dbotbl-phieu-transaction)
- [`dbo.sp_MSupd_dbotbl_phieu_yeucau`](#dbo-sp-msupd-dbotbl-phieu-yeucau)
- [`dbo.sp_MSupd_dbotbl_phieu_yeucau_chitiet`](#dbo-sp-msupd-dbotbl-phieu-yeucau-chitiet)
- [`dbo.sp_MSupd_dbotbl_qc_kiem`](#dbo-sp-msupd-dbotbl-qc-kiem)
- [`dbo.sp_MSupd_dbotbl_qc_phieu_kiem`](#dbo-sp-msupd-dbotbl-qc-phieu-kiem)
- [`dbo.sp_MSupd_dbotbl_role`](#dbo-sp-msupd-dbotbl-role)
- [`dbo.sp_MSupd_dbotbl_role_screen`](#dbo-sp-msupd-dbotbl-role-screen)
- [`dbo.sp_MSupd_dbotbl_sx_bravo`](#dbo-sp-msupd-dbotbl-sx-bravo)
- [`dbo.sp_MSupd_dbotbl_tieuchi_kiem`](#dbo-sp-msupd-dbotbl-tieuchi-kiem)
- [`dbo.sp_MSupd_dbotbl_transaction`](#dbo-sp-msupd-dbotbl-transaction)
- [`dbo.sp_MSupd_dbotbl_user_ql`](#dbo-sp-msupd-dbotbl-user-ql)
- [`dbo.sp_MSupd_dbotbl_v_B20Dept`](#dbo-sp-msupd-dbotbl-v-b20dept)

## `dbo.sp_MSdel_dbolog_user_screen`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:19`
- Sửa gần nhất: `2026-06-29 08:25:19`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[log_user_screen]` | USER TABLE |

## `dbo.sp_MSdel_dbosysdiagrams`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_bang_tam_DDH`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(150)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_bang_tam_DDH]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_bang_tam_dm_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_bang_tam_dm_vattu]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_batch_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_event]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_batch_inv`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_chitiet_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_chitiet_nhap_noibo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_ChiTietDDH`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(150)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dinhmuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dinhmuc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_batch_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_batch_event]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_donvi_bravo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_donvi_bravo]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_donvi_kehoach`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_donvi_kehoach]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_kehoach`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_kehoach]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_location`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_location_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_event]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_location_ma_khu_vuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_ma_khu_vuc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_location_ma_tang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_ma_tang]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_nghiepvu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nghiepvu]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_nghiepvu_kho`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_nhom_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_screen_pc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_screen_pc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_status_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_status_phieu_dnxk`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_phieu_dnxk]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_status_soanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_soanhang]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_tieuchi_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_tieuchi_kiem]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_trangthai_phieuyc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_trangthai_phieuyc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_trangthai_ton`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_user`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_user]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_dm_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_vattu]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_donvi_sx`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_donvi_sx]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_flow_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_his_chitiet_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_his_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_his_phieunhap`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_his_status_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_status_pheduyet]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_kehoach_dinhmuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_kehoach_dinhmuc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_khaibao_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_location_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_location_event]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_map_xuatkho`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_nhom_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_nhom_qc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_nhom_vattu_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_pheduyet_flow`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_pheduyet_flow]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_pheduyet_process`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_pheduyet_process]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_phieu_nhan_hang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_phieu_nhan_hang_image`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_phieu_nhap_noibo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-07-06 06:50:20`
- Sửa gần nhất: `2026-07-06 06:50:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_phieu_transaction`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_phieu_yeucau`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-08-13 07:03:48`
- Sửa gần nhất: `2026-08-13 07:03:48`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_phieu_yeucau_chitiet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_qc_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_qc_kiem]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_qc_phieu_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_role`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_role]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_role_screen`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_role_screen]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_sx_bravo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_tieuchi_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_transaction`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_user_ql`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `dbo.sp_MSdel_dbotbl_v_B20Dept`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@pkc1` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_v_B20Dept]` | USER TABLE |

## `dbo.sp_MSins_dbolog_user_screen`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:19`
- Sửa gần nhất: `2026-06-29 08:25:19`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[log_user_screen]` | USER TABLE |

## `dbo.sp_MSins_dbosysdiagrams`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(128)` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `varbinary(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_bang_tam_DDH`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `datetime` | Không | `—` |
| 2 | `@c2` | `datetime` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(350)` | Không | `—` |
| 9 | `@c9` | `float` | Không | `—` |
| 10 | `@c10` | `float` | Không | `—` |
| 11 | `@c11` | `float` | Không | `—` |
| 12 | `@c12` | `nvarchar(7)` | Không | `—` |
| 13 | `@c13` | `nvarchar(100)` | Không | `—` |
| 14 | `@c14` | `nvarchar(150)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_bang_tam_DDH]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_bang_tam_dm_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(300)` | Không | `—` |
| 4 | `@c4` | `nvarchar(20)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_bang_tam_dm_vattu]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_batch_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `float` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_event]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_batch_inv`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(255)` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(20)` | Không | `—` |
| 9 | `@c9` | `datetime` | Không | `—` |
| 10 | `@c10` | `nvarchar(20)` | Không | `—` |
| 11 | `@c11` | `datetime` | Không | `—` |
| 12 | `@c12` | `nvarchar(10)` | Không | `—` |
| 13 | `@c13` | `nvarchar(10)` | Không | `—` |
| 14 | `@c14` | `nvarchar(10)` | Không | `—` |
| 15 | `@c15` | `nvarchar(50)` | Không | `—` |
| 16 | `@c16` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_chitiet_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `float` | Không | `—` |
| 5 | `@c5` | `float` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `nvarchar(20)` | Không | `—` |
| 8 | `@c8` | `int` | Không | `—` |
| 9 | `@c9` | `nvarchar(150)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `nvarchar(20)` | Không | `—` |
| 13 | `@c13` | `date` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_chitiet_nhap_noibo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(255)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(max)` | Không | `—` |
| 9 | `@c9` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_ChiTietDDH`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `datetime` | Không | `—` |
| 2 | `@c2` | `datetime` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(350)` | Không | `—` |
| 9 | `@c9` | `float` | Không | `—` |
| 10 | `@c10` | `float` | Không | `—` |
| 11 | `@c11` | `float` | Không | `—` |
| 12 | `@c12` | `float` | Không | `—` |
| 13 | `@c13` | `nvarchar(10)` | Không | `—` |
| 14 | `@c14` | `nvarchar(100)` | Không | `—` |
| 15 | `@c15` | `datetime` | Không | `—` |
| 16 | `@c16` | `nvarchar(150)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dinhmuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(255)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(255)` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(20)` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `datetime` | Không | `—` |
| 13 | `@c13` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dinhmuc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_batch_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_batch_event]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_donvi_bravo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_donvi_bravo]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_donvi_kehoach`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_donvi_kehoach]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_kehoach`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_kehoach]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_location`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(10)` | Không | `—` |
| 3 | `@c3` | `nvarchar(10)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `int` | Không | `—` |
| 7 | `@c7` | `nvarchar(100)` | Không | `—` |
| 8 | `@c8` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_location_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(max)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_event]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_location_ma_khu_vuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_ma_khu_vuc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_location_ma_tang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_ma_tang]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_nghiepvu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nghiepvu]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_nghiepvu_kho`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(20)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_nhom_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_screen_pc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_screen_pc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_status_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `datetime` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_status_phieu_dnxk`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_phieu_dnxk]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_status_soanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_soanhang]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_tieuchi_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `nvarchar(100)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_tieuchi_kiem]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_trangthai_phieuyc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nchar(10)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_trangthai_phieuyc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_trangthai_ton`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_user`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_user]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_dm_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(200)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `int` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_vattu]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_donvi_sx`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_donvi_sx]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_flow_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@c6` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_his_chitiet_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `float` | Không | `—` |
| 6 | `@c6` | `float` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(20)` | Không | `—` |
| 9 | `@c9` | `int` | Không | `—` |
| 10 | `@c10` | `nvarchar(150)` | Không | `—` |
| 11 | `@c11` | `nvarchar(10)` | Không | `—` |
| 12 | `@c12` | `datetime` | Không | `—` |
| 13 | `@c13` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_his_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `datetime` | Không | `—` |
| 12 | `@c12` | `nvarchar(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_his_phieunhap`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `int` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(10)` | Không | `—` |
| 11 | `@c11` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_his_status_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_status_pheduyet]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_kehoach_dinhmuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(255)` | Không | `—` |
| 5 | `@c5` | `decimal(18,4)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `nvarchar(20)` | Không | `—` |
| 8 | `@c8` | `nvarchar(100)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `nvarchar(100)` | Không | `—` |
| 11 | `@c11` | `nvarchar(max)` | Không | `—` |
| 12 | `@c12` | `nvarchar(50)` | Không | `—` |
| 13 | `@c13` | `datetime` | Không | `—` |
| 14 | `@c14` | `nvarchar(50)` | Không | `—` |
| 15 | `@c15` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_kehoach_dinhmuc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_khaibao_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(100)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_location_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_location_event]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_map_xuatkho`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_nhom_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_nhom_qc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_nhom_vattu_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_pheduyet_flow`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_pheduyet_flow]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_pheduyet_process`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `int` | Không | `—` |
| 12 | `@c12` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_pheduyet_process]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_phieu_nhan_hang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `int` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_phieu_nhan_hang_image`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(max)` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_phieu_nhap_noibo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-07-06 06:50:20`
- Sửa gần nhất: `2026-07-06 06:50:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(20)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `nvarchar(max)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `datetime` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(20)` | Không | `—` |
| 12 | `@c12` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_phieu_transaction`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(20)` | Không | `—` |
| 4 | `@c4` | `nvarchar(20)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `datetime` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `int` | Không | `—` |
| 12 | `@c12` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_phieu_yeucau`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-08-13 07:03:48`
- Sửa gần nhất: `2026-08-13 07:03:48`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(20)` | Không | `—` |
| 9 | `@c9` | `nvarchar(255)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `nvarchar(50)` | Không | `—` |
| 13 | `@c13` | `datetime` | Không | `—` |
| 14 | `@c14` | `nvarchar(20)` | Không | `—` |
| 15 | `@c15` | `datetime` | Không | `—` |
| 16 | `@c16` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_phieu_yeucau_chitiet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `float` | Không | `—` |
| 7 | `@c7` | `nvarchar(20)` | Không | `—` |
| 8 | `@c8` | `datetime` | Không | `—` |
| 9 | `@c9` | `nvarchar(100)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_qc_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `float` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(max)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_qc_kiem]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_qc_phieu_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(max)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_role`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_role]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_role_screen`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(10)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_role_screen]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_sx_bravo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_tieuchi_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(max)` | Không | `—` |
| 5 | `@c5` | `nvarchar(255)` | Không | `—` |
| 6 | `@c6` | `nvarchar(255)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_transaction`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(100)` | Không | `—` |
| 8 | `@c8` | `float` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_user_ql`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `dbo.sp_MSins_dbotbl_v_B20Dept`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_v_B20Dept]` | USER TABLE |

## `dbo.sp_MSupd_dbolog_user_screen`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:19`
- Sửa gần nhất: `2026-06-29 08:25:19`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `int` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[log_user_screen]` | USER TABLE |

## `dbo.sp_MSupd_dbosysdiagrams`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(128)` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `varbinary(max)` | Không | `—` |
| 6 | `@pkc1` | `int` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_bang_tam_DDH`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `datetime` | Không | `—` |
| 2 | `@c2` | `datetime` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(350)` | Không | `—` |
| 9 | `@c9` | `float` | Không | `—` |
| 10 | `@c10` | `float` | Không | `—` |
| 11 | `@c11` | `float` | Không | `—` |
| 12 | `@c12` | `nvarchar(7)` | Không | `—` |
| 13 | `@c13` | `nvarchar(100)` | Không | `—` |
| 14 | `@c14` | `nvarchar(150)` | Không | `—` |
| 15 | `@pkc1` | `nvarchar(150)` | Không | `—` |
| 16 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_bang_tam_DDH]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_bang_tam_dm_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(300)` | Không | `—` |
| 4 | `@c4` | `nvarchar(20)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 9 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_bang_tam_dm_vattu]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_batch_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `float` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@pkc1` | `int` | Không | `—` |
| 11 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_event]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_batch_inv`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(255)` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(20)` | Không | `—` |
| 9 | `@c9` | `datetime` | Không | `—` |
| 10 | `@c10` | `nvarchar(20)` | Không | `—` |
| 11 | `@c11` | `datetime` | Không | `—` |
| 12 | `@c12` | `nvarchar(10)` | Không | `—` |
| 13 | `@c13` | `nvarchar(10)` | Không | `—` |
| 14 | `@c14` | `nvarchar(10)` | Không | `—` |
| 15 | `@c15` | `nvarchar(50)` | Không | `—` |
| 16 | `@c16` | `nvarchar(50)` | Không | `—` |
| 17 | `@pkc1` | `int` | Không | `—` |
| 18 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_chitiet_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `float` | Không | `—` |
| 5 | `@c5` | `float` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `nvarchar(20)` | Không | `—` |
| 8 | `@c8` | `int` | Không | `—` |
| 9 | `@c9` | `nvarchar(150)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `nvarchar(20)` | Không | `—` |
| 13 | `@c13` | `date` | Không | `—` |
| 14 | `@pkc1` | `int` | Không | `—` |
| 15 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_chitiet_nhap_noibo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(255)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(max)` | Không | `—` |
| 9 | `@c9` | `datetime` | Không | `—` |
| 10 | `@pkc1` | `int` | Không | `—` |
| 11 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_ChiTietDDH`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `datetime` | Không | `—` |
| 2 | `@c2` | `datetime` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(350)` | Không | `—` |
| 9 | `@c9` | `float` | Không | `—` |
| 10 | `@c10` | `float` | Không | `—` |
| 11 | `@c11` | `float` | Không | `—` |
| 12 | `@c12` | `float` | Không | `—` |
| 13 | `@c13` | `nvarchar(10)` | Không | `—` |
| 14 | `@c14` | `nvarchar(100)` | Không | `—` |
| 15 | `@c15` | `datetime` | Không | `—` |
| 16 | `@c16` | `nvarchar(150)` | Không | `—` |
| 17 | `@pkc1` | `nvarchar(150)` | Không | `—` |
| 18 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_ChiTietDDH]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dinhmuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(255)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(255)` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(20)` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `datetime` | Không | `—` |
| 13 | `@c13` | `int` | Không | `—` |
| 14 | `@pkc1` | `int` | Không | `—` |
| 15 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dinhmuc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_batch_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_batch_event]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_donvi_bravo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 5 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_donvi_bravo]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_donvi_kehoach`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@pkc1` | `int` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_donvi_kehoach]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_kehoach`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_kehoach]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_location`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(10)` | Không | `—` |
| 3 | `@c3` | `nvarchar(10)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `int` | Không | `—` |
| 7 | `@c7` | `nvarchar(100)` | Không | `—` |
| 8 | `@c8` | `int` | Không | `—` |
| 9 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 10 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_location_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(max)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_event]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_location_ma_khu_vuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 4 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_ma_khu_vuc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_location_ma_tang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@pkc1` | `int` | Không | `—` |
| 4 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_location_ma_tang]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_nghiepvu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nghiepvu]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_nghiepvu_kho`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:21`
- Sửa gần nhất: `2026-06-29 08:25:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(20)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@pkc1` | `nvarchar(20)` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_nhom_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_nhom_vattu]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_screen_pc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `int` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_screen_pc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_status_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:20`
- Sửa gần nhất: `2026-06-29 08:25:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `datetime` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(20)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_nhanhang]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_status_phieu_dnxk`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(20)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_phieu_dnxk]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_status_soanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(20)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_status_soanhang]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_tieuchi_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `nvarchar(100)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_tieuchi_kiem]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_trangthai_phieuyc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(20)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nchar(10)` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(20)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_trangthai_phieuyc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_trangthai_ton`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_trangthai_ton]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_user`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `int` | Không | `—` |
| 11 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 12 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_user]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_dm_vattu`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(200)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `int` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 12 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_dm_vattu]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_donvi_sx`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_donvi_sx]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_flow_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@c6` | `int` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_flow_pheduyet]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_his_chitiet_nhanhang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:22`
- Sửa gần nhất: `2026-06-29 08:25:22`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `float` | Không | `—` |
| 6 | `@c6` | `float` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(20)` | Không | `—` |
| 9 | `@c9` | `int` | Không | `—` |
| 10 | `@c10` | `nvarchar(150)` | Không | `—` |
| 11 | `@c11` | `nvarchar(10)` | Không | `—` |
| 12 | `@c12` | `datetime` | Không | `—` |
| 13 | `@c13` | `nvarchar(20)` | Không | `—` |
| 14 | `@pkc1` | `int` | Không | `—` |
| 15 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_his_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:27`
- Sửa gần nhất: `2026-06-29 08:25:27`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `datetime` | Không | `—` |
| 12 | `@c12` | `nvarchar(max)` | Không | `—` |
| 13 | `@pkc1` | `int` | Không | `—` |
| 14 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_his_phieunhap`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `int` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(10)` | Không | `—` |
| 11 | `@c11` | `datetime` | Không | `—` |
| 12 | `@pkc1` | `int` | Không | `—` |
| 13 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_phieunhap]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_his_status_pheduyet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_status_pheduyet]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_kehoach_dinhmuc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(255)` | Không | `—` |
| 5 | `@c5` | `decimal(18,4)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `nvarchar(20)` | Không | `—` |
| 8 | `@c8` | `nvarchar(100)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `nvarchar(100)` | Không | `—` |
| 11 | `@c11` | `nvarchar(max)` | Không | `—` |
| 12 | `@c12` | `nvarchar(50)` | Không | `—` |
| 13 | `@c13` | `datetime` | Không | `—` |
| 14 | `@c14` | `nvarchar(50)` | Không | `—` |
| 15 | `@c15` | `datetime` | Không | `—` |
| 16 | `@pkc1` | `int` | Không | `—` |
| 17 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_kehoach_dinhmuc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_khaibao_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(100)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_location_event`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_location_event]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_map_xuatkho`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@pkc1` | `int` | Không | `—` |
| 5 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_nhom_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(100)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_nhom_qc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_nhom_vattu_qc`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@pkc1` | `int` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_pheduyet_flow`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@pkc1` | `int` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_pheduyet_flow]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_pheduyet_process`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `int` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `int` | Không | `—` |
| 12 | `@c12` | `datetime` | Không | `—` |
| 13 | `@pkc1` | `int` | Không | `—` |
| 14 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_pheduyet_process]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_phieu_nhan_hang`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `int` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@pkc1` | `int` | Không | `—` |
| 10 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_phieu_nhan_hang_image`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(max)` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@pkc1` | `int` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang_image]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_phieu_nhap_noibo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-07-06 06:50:20`
- Sửa gần nhất: `2026-07-06 06:50:20`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(20)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `nvarchar(max)` | Không | `—` |
| 8 | `@c8` | `nvarchar(50)` | Không | `—` |
| 9 | `@c9` | `datetime` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(20)` | Không | `—` |
| 12 | `@c12` | `nvarchar(50)` | Không | `—` |
| 13 | `@pkc1` | `int` | Không | `—` |
| 14 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_phieu_transaction`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:23`
- Sửa gần nhất: `2026-06-29 08:25:23`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(20)` | Không | `—` |
| 4 | `@c4` | `nvarchar(20)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `datetime` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `nvarchar(50)` | Không | `—` |
| 11 | `@c11` | `int` | Không | `—` |
| 12 | `@c12` | `nvarchar(20)` | Không | `—` |
| 13 | `@pkc1` | `int` | Không | `—` |
| 14 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_phieu_yeucau`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-08-13 07:03:48`
- Sửa gần nhất: `2026-08-13 07:03:48`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `datetime` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(20)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@c8` | `nvarchar(20)` | Không | `—` |
| 9 | `@c9` | `nvarchar(255)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `nvarchar(50)` | Không | `—` |
| 13 | `@c13` | `datetime` | Không | `—` |
| 14 | `@c14` | `nvarchar(20)` | Không | `—` |
| 15 | `@c15` | `datetime` | Không | `—` |
| 16 | `@c16` | `nvarchar(50)` | Không | `—` |
| 17 | `@pkc1` | `int` | Không | `—` |
| 18 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_phieu_yeucau_chitiet`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(100)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `float` | Không | `—` |
| 7 | `@c7` | `nvarchar(20)` | Không | `—` |
| 8 | `@c8` | `datetime` | Không | `—` |
| 9 | `@c9` | `nvarchar(100)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `int` | Không | `—` |
| 13 | `@pkc1` | `int` | Không | `—` |
| 14 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_qc_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `int` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `float` | Không | `—` |
| 7 | `@c7` | `float` | Không | `—` |
| 8 | `@c8` | `nvarchar(max)` | Không | `—` |
| 9 | `@c9` | `nvarchar(50)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(50)` | Không | `—` |
| 12 | `@c12` | `nvarchar(20)` | Không | `—` |
| 13 | `@pkc1` | `int` | Không | `—` |
| 14 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_qc_kiem]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_qc_phieu_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(max)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@pkc1` | `int` | Không | `—` |
| 9 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_qc_phieu_kiem]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_role`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@c7` | `datetime` | Không | `—` |
| 8 | `@pkc1` | `int` | Không | `—` |
| 9 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_role]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_role_screen`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(10)` | Không | `—` |
| 6 | `@c6` | `datetime` | Không | `—` |
| 7 | `@pkc1` | `int` | Không | `—` |
| 8 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_role_screen]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_sx_bravo`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@pkc1` | `int` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_sx_bravo]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_tieuchi_kiem`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(max)` | Không | `—` |
| 5 | `@c5` | `nvarchar(255)` | Không | `—` |
| 6 | `@c6` | `nvarchar(255)` | Không | `—` |
| 7 | `@c7` | `nvarchar(50)` | Không | `—` |
| 8 | `@c8` | `datetime` | Không | `—` |
| 9 | `@pkc1` | `int` | Không | `—` |
| 10 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_tieuchi_kiem]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_transaction`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:24`
- Sửa gần nhất: `2026-06-29 08:25:24`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `int` | Không | `—` |
| 2 | `@c2` | `int` | Không | `—` |
| 3 | `@c3` | `int` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `nvarchar(50)` | Không | `—` |
| 6 | `@c6` | `nvarchar(50)` | Không | `—` |
| 7 | `@c7` | `nvarchar(100)` | Không | `—` |
| 8 | `@c8` | `float` | Không | `—` |
| 9 | `@c9` | `nvarchar(20)` | Không | `—` |
| 10 | `@c10` | `datetime` | Không | `—` |
| 11 | `@c11` | `nvarchar(20)` | Không | `—` |
| 12 | `@pkc1` | `int` | Không | `—` |
| 13 | `@bitmap` | `binary(2)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_user_ql`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:25`
- Sửa gần nhất: `2026-06-29 08:25:25`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@c5` | `datetime` | Không | `—` |
| 6 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 7 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_user_ql]` | USER TABLE |

## `dbo.sp_MSupd_dbotbl_v_B20Dept`

- Phân loại: Replication
- Hành vi suy đoán từ tên: SQL Server replication nội bộ
- Tạo: `2026-06-29 08:25:26`
- Sửa gần nhất: `2026-06-29 08:25:26`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@c1` | `nvarchar(50)` | Không | `—` |
| 2 | `@c2` | `nvarchar(50)` | Không | `—` |
| 3 | `@c3` | `nvarchar(50)` | Không | `—` |
| 4 | `@c4` | `nvarchar(50)` | Không | `—` |
| 5 | `@pkc1` | `nvarchar(50)` | Không | `—` |
| 6 | `@bitmap` | `binary(1)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_v_B20Dept]` | USER TABLE |
