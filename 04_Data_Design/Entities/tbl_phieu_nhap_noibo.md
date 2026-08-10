# tbl_phieu_nhap_noibo

        | Property | Value |
        |---|---|
        | Entity Name | tbl_phieu_nhap_noibo |
        | Physical Name | tbl_phieu_nhap_noibo |
        | Type | Table |
        | Module | Noi bo |
        | Definition | Ghi nhan thong tin phieu tra / nhap noi bo tu don vi san xuat ve kho. |

        ## Attributes

        | # | Attribute Physical | Key | Data Type | Definition | Ver. |
| --- | --- | --- | --- | --- | --- |
| 1 | id_phieu_noibo | PK | int | Ma phieu noi bo | 1.0 |
| 2 | ma_kho |  | nvarchar(50) | Ma kho nhan, mac dinh 20020100 | 1.0 |
| 3 | ma_bravo_bophan |  | nvarchar(50) | Ma don vi / bo phan Bravo | 1.0 |
| 4 | ten_bravo_bophan |  | nvarchar(50) | Ten don vi / bo phan Bravo | 1.0 |
| 5 | phan_loai_kh |  | nvarchar(20) | Da bo tren giao dien tao phieu | 1.0 |
| 6 | phan_loai_tra |  | nvarchar(20) | 1: Dat chat luong; 2: Khong dat chat luong | 1.0 |
| 7 | nhap_kho |  | nvarchar(20) | 1: Nhap dat; 2: Nhap cho xu ly / khong dat | 1.0 |
| 8 | ghi_chu |  | nvarchar(MAX) | Ghi chu phieu / ghi chu xu ly | 1.0 |
| 9 | user_cre |  | nvarchar(20) | Nguoi tao phieu | 1.0 |
| 10 | time_tra |  | datetime | Ngay tra | 1.0 |
| 11 | time_cre |  | datetime | Thoi gian tao | 1.0 |
| 12 | status_phieu |  | nvarchar(20) | 0: Huy; 1: Tao; 2: Kho dong y; 3: Kho tu choi; 4: Da nhap kho | 1.0 |
