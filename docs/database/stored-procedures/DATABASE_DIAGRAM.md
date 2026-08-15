# Database diagram

Database `MMS` · snapshot `2026-08-15 13:42:41 +07:00` · **7 procedure**

## Mục lục

- [`dbo.sp_alterdiagram`](#dbo-sp-alterdiagram)
- [`dbo.sp_creatediagram`](#dbo-sp-creatediagram)
- [`dbo.sp_dropdiagram`](#dbo-sp-dropdiagram)
- [`dbo.sp_helpdiagramdefinition`](#dbo-sp-helpdiagramdefinition)
- [`dbo.sp_helpdiagrams`](#dbo-sp-helpdiagrams)
- [`dbo.sp_renamediagram`](#dbo-sp-renamediagram)
- [`dbo.sp_upgraddiagrams`](#dbo-sp-upgraddiagrams)

## `dbo.sp_alterdiagram`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@diagramname` | `sysname` | Không | `—` |
| 2 | `@owner_id` | `int` | Không | `—` |
| 3 | `@version` | `int` | Không | `—` |
| 4 | `@definition` | `varbinary(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_creatediagram`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Tạo dữ liệu
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@diagramname` | `sysname` | Không | `—` |
| 2 | `@owner_id` | `int` | Không | `—` |
| 3 | `@version` | `int` | Không | `—` |
| 4 | `@definition` | `varbinary(max)` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_dropdiagram`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@diagramname` | `sysname` | Không | `—` |
| 2 | `@owner_id` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_helpdiagramdefinition`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@diagramname` | `sysname` | Không | `—` |
| 2 | `@owner_id` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_helpdiagrams`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:28`
- Sửa gần nhất: `2026-06-29 08:25:28`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@diagramname` | `sysname` | Không | `—` |
| 2 | `@owner_id` | `int` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_renamediagram`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

| # | Tên | Kiểu | Output | Giá trị mặc định |
|---:|---|---|---|---|
| 1 | `@diagramname` | `sysname` | Không | `—` |
| 2 | `@owner_id` | `int` | Không | `—` |
| 3 | `@new_diagramname` | `sysname` | Không | `—` |

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[sysdiagrams]` | USER TABLE |

## `dbo.sp_upgraddiagrams`

- Phân loại: Database diagram
- Hành vi suy đoán từ tên: Cần đối chiếu định nghĩa SQL/use case
- Tạo: `2026-06-29 08:25:29`
- Sửa gần nhất: `2026-06-29 08:25:29`
- Mã hóa định nghĩa: `Không`

### Tham số

Không có tham số.

### Đối tượng phụ thuộc

| Đối tượng | Loại |
|---|---|
| `[dbo].[dtproperties]` | UNRESOLVED OR EXTERNAL |
| `[dbo].[sysdiagrams]` | USER TABLE |
