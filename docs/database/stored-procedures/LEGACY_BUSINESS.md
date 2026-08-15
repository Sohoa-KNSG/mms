# Legacy nghiệp vụ

Database `MMS` · snapshot `2026-08-15 13:42:41 +07:00` · **19 procedure**

## Mục lục

- [`dbo.insertsql`](#dbo-insertsql)
- [`dbo.sp_insert_nhanhang`](#dbo-sp-insert-nhanhang)
- [`dbo.sp_insert_nhapkho`](#dbo-sp-insert-nhapkho)
- [`dbo.sp_insert_nhaptra`](#dbo-sp-insert-nhaptra)
- [`dbo.sp_insert_phieu_nhan_hang`](#dbo-sp-insert-phieu-nhan-hang)
- [`dbo.sp_insert_phieu_yeu_cau_chi_tiet`](#dbo-sp-insert-phieu-yeu-cau-chi-tiet)
- [`dbo.sp_insert_tonkho`](#dbo-sp-insert-tonkho)
- [`dbo.sp_insert_xuatkho`](#dbo-sp-insert-xuatkho)
- [`dbo.sp_kiemke_batch`](#dbo-sp-kiemke-batch)
- [`dbo.sp_pheduyet_approvalcheck`](#dbo-sp-pheduyet-approvalcheck)
- [`dbo.sp_select_infor_phieu_dnxk`](#dbo-sp-select-infor-phieu-dnxk)
- [`dbo.sp_select_string_vattu_phieu_dnxk`](#dbo-sp-select-string-vattu-phieu-dnxk)
- [`dbo.sp_split_batch`](#dbo-sp-split-batch)
- [`dbo.sp_test_select_string_vattu`](#dbo-sp-test-select-string-vattu)
- [`dbo.sp_update_location`](#dbo-sp-update-location)
- [`dbo.sp_update_ma_kiem`](#dbo-sp-update-ma-kiem)
- [`dbo.sp_update_unit`](#dbo-sp-update-unit)
- [`dbo.sp_update_xuong_ke`](#dbo-sp-update-xuong-ke)
- [`dbo.usp_xacnhan_phieu_nhap_noibo`](#dbo-usp-xacnhan-phieu-nhap-noibo)

## `dbo.insertsql`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@sql` | `nvarchar(max)` | Không | `—` |

### Đối tượng phụ thuộc

Không phân giải được dependency tĩnh hoặc procedure không tham chiếu object khác.

## `dbo.sp_insert_nhanhang`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@status_nhanhang` | `nvarchar(50)` | Không | `—` |
| 2 | `@ma_hang` | `nvarchar(50)` | Không | `—` |
| 3 | `@soluong_chungtu` | `float` | Không | `—` |
| 4 | `@soluong_thucnhan` | `float` | Không | `—` |
| 5 | `@status` | `nvarchar(20)` | Không | `—` |
| 6 | `@ma_phieu` | `int` | Không | `—` |
| 7 | `@ma_khoa_chinh` | `nvarchar(150)` | Không | `—` |
| 8 | `@unit` | `nvarchar(20)` | Không | `—` |
| 9 | `@ngay_giao_hang` | `date` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |

## `dbo.sp_insert_nhapkho`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_nhanhang` | `int` | Không | `—` |
| 2 | `@ma_kho` | `nvarchar(50)` | Không | `—` |
| 3 | `@id_vattu` | `nvarchar(50)` | Không | `—` |
| 4 | `@id_bravo` | `nvarchar(50)` | Không | `—` |
| 5 | `@ten_vattu` | `nvarchar(255)` | Không | `—` |
| 6 | `@so_luong` | `float` | Không | `—` |
| 7 | `@unit` | `nvarchar(50)` | Không | `—` |
| 8 | `@id_phieu_trans` | `int` | Không | `—` |
| 9 | `@user` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_insert_nhaptra`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-07-08 08:45:41`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_trans` | `int` | Không | `—` |
| 2 | `@so_luong_dung` | `float` | Không | `—` |
| 3 | `@user_up` | `nvarchar(50)` | Không | `—` |
| 4 | `@ghi_chu` | `nvarchar(500)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_insert_phieu_nhan_hang`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@ma_po` | `nvarchar(50)` | Không | `—` |
| 2 | `@khach_hang` | `nvarchar(100)` | Không | `—` |
| 3 | `@kho` | `nvarchar(50)` | Không | `—` |
| 4 | `@status_nhap` | `nvarchar(50)` | Không | `—` |
| 5 | `@user_cre` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_nhan_hang]` | USER TABLE |

## `dbo.sp_insert_phieu_yeu_cau_chi_tiet`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@json` | `nvarchar(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |

## `dbo.sp_insert_tonkho`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_nhanhang` | `int` | Không | `—` |
| 2 | `@ma_kho` | `nvarchar(50)` | Không | `—` |
| 3 | `@id_vattu` | `nvarchar(50)` | Không | `—` |
| 4 | `@id_bravo` | `nvarchar(50)` | Không | `—` |
| 5 | `@ten_vattu` | `nvarchar(255)` | Không | `—` |
| 6 | `@so_luong` | `float` | Không | `—` |
| 7 | `@unit` | `nvarchar(50)` | Không | `—` |
| 8 | `@user` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_insert_xuatkho`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_batch` | `int` | Không | `—` |
| 2 | `@so_luong_xuat` | `float` | Không | `—` |
| 3 | `@id_phieu_trans` | `int` | Không | `—` |
| 4 | `@id_vattu` | `nvarchar(50)` | Không | `—` |
| 5 | `@id_bravo` | `nvarchar(50)` | Không | `—` |
| 6 | `@ten_vattu` | `nvarchar(255)` | Không | `—` |
| 7 | `@unit` | `nvarchar(50)` | Không | `—` |
| 8 | `@user` | `nvarchar(50)` | Không | `—` |
| 9 | `@time_up` | `datetime` | Không | `—` |
| 10 | `@id_chitiet_phieu` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_map_xuatkho]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_kiemke_batch`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_batch` | `int` | Không | `—` |
| 2 | `@so_luong_thuc_te` | `float` | Không | `—` |
| 3 | `@user_up` | `nvarchar(20)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_pheduyet_approvalcheck`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_run` | `nvarchar(50)` | Không | `—` |
| 2 | `@approval` | `nvarchar(50)` | Không | `—` |
| 3 | `@ghi_chu` | `nvarchar(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |

## `dbo.sp_select_infor_phieu_dnxk`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_run` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_his_pheduyet]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau]` | USER TABLE |

## `dbo.sp_select_string_vattu_phieu_dnxk`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_run` | `int` | Không | `—` |
| 2 | `@id_phieu_yeucau` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[vw_dinhmuc_conlai]` | UNRESOLVED OR EXTERNAL |

## `dbo.sp_split_batch`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-07-21 06:18:21`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_batch` | `int` | Không | `—` |
| 2 | `@so_luong_tach` | `float` | Không | `—` |
| 3 | `@id_phieu_trans` | `int` | Không | `—` |
| 4 | `@user_cre` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_dm_nghiepvu_kho]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_test_select_string_vattu`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_run` | `int` | Không | `—` |
| 2 | `@id_phieu_yeucau` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[vw_dinhmuc_conlai]` | UNRESOLVED OR EXTERNAL |

## `dbo.sp_update_location`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@location` | `nvarchar(50)` | Không | `—` |
| 2 | `@id_batch` | `int` | Không | `—` |
| 3 | `@user_up` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |

## `dbo.sp_update_ma_kiem`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

Không có tham số.

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_khaibao_qc]` | USER TABLE |
| `[dbo].[tbl_nhom_vattu_qc]` | USER TABLE |

## `dbo.sp_update_unit`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

Không có tham số.

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhanhang]` | USER TABLE |
| `[dbo].[tbl_dm_vattu]` | USER TABLE |
| `[dbo].[tbl_phieu_yeucau_chitiet]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |

## `dbo.sp_update_xuong_ke`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Ghi hoặc cập nhật dữ liệu
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_batch` | `int` | Không | `—` |
| 2 | `@user_up` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |

## `dbo.usp_xacnhan_phieu_nhap_noibo`

- Phân loại: Legacy nghiệp vụ
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@id_phieu_noibo` | `int` | Không | `—` |
| 2 | `@ket_qua` | `int` | Không | `—` |
| 3 | `@user_up` | `nvarchar(20)` | Không | `—` |
| 4 | `@ten_user` | `nvarchar(255)` | Không | `—` |
| 5 | `@ghi_chu` | `nvarchar(max)` | Không | `—` |
| 6 | `@so_ct_bravo` | `nvarchar(50)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[tbl_batch_inv]` | USER TABLE |
| `[dbo].[tbl_chitiet_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_phieu_nhap_noibo]` | USER TABLE |
| `[dbo].[tbl_phieu_transaction]` | USER TABLE |
| `[dbo].[tbl_transaction]` | USER TABLE |
