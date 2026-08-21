# Danh mục stored procedure – MMS

- Database: `MMS`
- Máy chủ: `10.17.16.106`
- Thời điểm chụp metadata: `2026-08-15 13:42:41 +07:00`
- Tổng số stored procedure: **282**

## Phân loại

| Nhóm | Số lượng | Tài liệu |
|---|---:|---|
| API contract | 79 | [API_CONTRACTS.md](API_CONTRACTS.md) |
| Legacy nghiệp vụ | 19 | [LEGACY_BUSINESS.md](LEGACY_BUSINESS.md) |
| Replication | 177 | [REPLICATION.md](REPLICATION.md) |
| Database diagram | 7 | [DATABASE_DIAGRAM.md](DATABASE_DIAGRAM.md) |

## Quy ước

- `api`: contract versioned cho React/.NET API.
- `Legacy nghiệp vụ`: procedure tùy chỉnh trong schema khác `api`.
- `Replication`: procedure `sp_MS*` do SQL Server replication quản lý; không chỉnh sửa thủ công.
- `Database diagram`: procedure hỗ trợ sơ đồ database; không phải logic nghiệp vụ.
- Dependencies được lấy từ `sys.sql_expression_dependencies`; SQL động và linked server có thể không được phân giải đầy đủ.
- Tài liệu không chứa connection string, mật khẩu hoặc dữ liệu nghiệp vụ.
