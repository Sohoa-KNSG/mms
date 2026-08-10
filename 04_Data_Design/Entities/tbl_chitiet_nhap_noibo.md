# tbl_chitiet_nhap_noibo

        | Property | Value |
        |---|---|
        | Entity Name | tbl_chitiet_nhap_noibo |
        | Physical Name | tbl_chitiet_nhap_noibo |
        | Type | Table |
        | Module | Noi bo |
        | Definition | Ghi nhan chi tiet vat tu theo phieu tra / nhap noi bo. |

        ## Attributes

        | # | Attribute Physical | Key | Data Type | Definition | Ver. |
| --- | --- | --- | --- | --- | --- |
| 1 | id_nhan_noibo | PK | int | Ma dong chi tiet noi bo | 1.0 |
| 2 | id_phieu_noibo | FK | int | Lien ket tbl_phieu_nhap_noibo | 1.0 |
| 3 | id_vattu |  | nvarchar(50) | Ma vat tu | 1.0 |
| 4 | id_bravo |  | nvarchar(50) | Ma Bravo vat tu | 1.0 |
| 5 | ten_vattu |  | nvarchar(255) | Ten vat tu | 1.0 |
| 6 | unit |  | nvarchar(20) | Don vi tinh | 1.0 |
| 7 | so_luong |  | float | So luong tra | 1.0 |
| 8 | ghi_chu |  | nvarchar(MAX) | Ly do tra | 1.0 |
| 9 | time_cre |  | datetime | Thoi gian tao | 1.0 |
