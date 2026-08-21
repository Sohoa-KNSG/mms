# Data Layer Architecture

```mermaid
flowchart TD
  React["React"] --> API["API host mỏng"]
  API --> Read["Read views/query SP"]
  API --> Write["Write command SP"]
  Write --> Tx["SQL Transaction"]
  Tx --> Tables["Business tables"]
  Read --> Views["Views"]
  Views --> Tables
```

## Quy tắc

- Ghi nghiệp vụ: stored procedure.
- Đọc báo cáo: view hoặc read-only stored procedure.
- Không nhận SQL động từ frontend.
- Không xử lý rule nghiệp vụ nhiều bảng trong backend.
