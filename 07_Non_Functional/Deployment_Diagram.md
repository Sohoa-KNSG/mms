# Deployment Diagram

```mermaid
flowchart LR
  Browser["Browser PC/Mobile"] --> Web["React hosting"]
  Browser --> API["ASP.NET Core API"]
  API --> SQL["SQL Server MMS"]
  API --> Logs["Log/Audit"]
  SQL --> Backup["Backup/Restore"]
```
