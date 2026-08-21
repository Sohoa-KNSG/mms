# Decision Tables

## Phiếu trả nội bộ

| Quyết định thủ kho | status_phieu | nhap_kho | trang_thai_ton | Tạo batch | Tạo transaction |
|---|---:|---:|---:|---|---|
| Nhập đạt | 4 | 1 | 1 | Có | Có |
| Nhập không đạt | 4 | 2 | 3 | Có | Có |
| Không đồng ý | 3 | NULL | NULL | Không | Không |

## Đề nghị xuất kho

| Loại đề nghị | Điều kiện | Yêu cầu phê duyệt |
|---|---|---|
| Trong kế hoạch | Không vượt định mức/kế hoạch | Theo flow chuẩn |
| Ngoài kế hoạch | Không có kế hoạch tương ứng | Theo flow ngoài kế hoạch |
| Vượt kế hoạch | Số lượng vượt kế hoạch | Theo flow vượt kế hoạch |
