# SMART FACTORY CODING STANDARD

> Tiêu chuẩn phát triển phần mềm cho nền tảng Smart Factory Modular Monolith  
> Công nghệ mục tiêu: React + ASP.NET Core Web API + SQL Server  
> Phiên bản: 1.1  
> Trạng thái: Baseline dùng để thống nhất trong team

---

## 1. Mục đích

Tài liệu này quy định cách tổ chức, viết, kiểm tra và bàn giao mã nguồn cho các ứng dụng số hóa nhà máy như WMS, MES/Digital Production, MMS, QC, KPH/CAPA, OEM, HR, ME, Dashboard, E-Kanban và IoT Integration.

Mục tiêu:

- Mã nguồn dễ đọc, dễ kiểm tra và dễ bảo trì.
- Business rule được tập trung trong SQL Server Stored Procedure, có thể truy vết về yêu cầu nghiệp vụ.
- Các module có ranh giới rõ và không phụ thuộc tùy tiện vào nhau.
- AI có thể hỗ trợ phát triển nhưng không tự quyết định nghiệp vụ.
- Thay đổi có thể kiểm thử, triển khai và phục hồi an toàn.
- Hạn chế phụ thuộc vào kiến thức riêng của một cá nhân.

## 2. Phạm vi áp dụng

Áp dụng cho:

- Frontend React/TypeScript.
- Backend ASP.NET Core Web API.
- Lớp API, Application Orchestration và Data Access của backend.
- SQL Server, migration, view và stored procedure.
- API, event và tích hợp ERP/IoT.
- Automated test và UAT support.
- Git, pull request, CI/CD và release.
- Mã nguồn do lập trình viên hoặc AI tạo ra.

Không thay thế cho:

- Tài liệu Business Requirement/Use Case.
- Tiêu chuẩn an toàn thông tin của công ty.
- Quy trình quản lý thay đổi trên môi trường Production.

## 3. Nguyên tắc nền tảng

### 3.1 Business trước, code sau

Mọi tính năng phải bắt nguồn từ vấn đề nghiệp vụ, owner, KPI hoặc yêu cầu đã được xác nhận.

Chuỗi truy vết tối thiểu:

`Business Capability → Requirement/Use Case → Business Rule → Code → Test → Release`

Không xây dựng tính năng chỉ dựa trên suy đoán của lập trình viên hoặc AI.

### 3.2 Modular Monolith, không phải monolith hỗn hợp

Mỗi module phải:

- Đại diện cho một business capability hoặc bounded context rõ ràng.
- Sở hữu business rule và dữ liệu nghiệp vụ của mình.
- Chỉ công khai contract cần thiết.
- Không cho module khác truy cập trực tiếp bảng hoặc class nội bộ.
- Có thể kiểm thử độc lập.

### 3.3 Rõ ràng quan trọng hơn ngắn gọn

- Tên phải diễn đạt đúng nghiệp vụ.
- Tránh viết tắt không phổ biến.
- Tránh code “thông minh” nhưng khó đọc.
- Một đoạn code nên có một mục đích chính.

### 3.4 Business logic tập trung tại Stored Procedure

- Toàn bộ business rule, validation nghiệp vụ, chuyển trạng thái, tính toán nghiệp vụ và transaction dữ liệu phải được thực hiện trong SQL Server Stored Procedure.
- Frontend và backend không được tự thực thi hoặc sao chép business logic.
- Backend chỉ kiểm tra tính hợp lệ kỹ thuật của request, xác thực/xác quyền ở mức API, gọi stored procedure, điều phối tích hợp và trả response.
- Mỗi business rule phải có ID, tài liệu và test; không được phân tán cùng một rule qua nhiều stored procedure mà không có use case owner rõ ràng.
- Trigger không được dùng làm nơi chính để cài đặt business logic.

### 3.5 An toàn dữ liệu vận hành

- Không xóa cứng dữ liệu nghiệp vụ nếu chưa được phê duyệt.
- Mọi cập nhật quan trọng phải có audit trail.
- Không sửa trực tiếp dữ liệu Production bằng câu lệnh thủ công không được kiểm soát.
- Thao tác lặp lại phải bảo đảm idempotency khi có nguy cơ gửi lại.

## 4. Kiến trúc chuẩn

```text
React Frontend
      │
      ▼
ASP.NET Core Web API
      │
      ├── Authentication / API Authorization
      ├── Request Validation kỹ thuật
      ├── Application Orchestration
      ├── Stored Procedure Gateway
      └── Integration / Logging / Response Mapping
             │
             ▼
SQL Server Stored Procedures
      │
      ├── Business Validation
      ├── Business Rules / Calculation
      ├── State Transition / Permission Rule
      ├── Transaction / Concurrency / Idempotency
      └── Audit Trail
             │
             ▼
       Module Tables / Views
```

### 4.1 Luồng phụ thuộc cho phép

Trong một module:

`API → Application Orchestration → Stored Procedure Gateway → Stored Procedure → Tables/Views`

Quy định:

- API tiếp nhận request, kiểm tra authentication/authorization ở mức endpoint và trả response.
- Application chỉ điều phối luồng kỹ thuật; không chứa điều kiện, phép tính hoặc quyết định nghiệp vụ.
- Data Access chỉ gọi stored procedure qua contract đã định nghĩa; không tự ghép SQL nghiệp vụ trong C#.
- Stored procedure là nơi duy nhất quyết định nghiệp vụ và thay đổi dữ liệu nghiệp vụ.
- Backend không cập nhật trực tiếp bảng nghiệp vụ bằng EF Core, Dapper hoặc SQL inline.
- Tích hợp ngoài không được nằm trong transaction SQL kéo dài; stored procedure ghi Outbox/Integration Event để worker xử lý khi phù hợp.

### 4.2 Giao tiếp giữa các module

Ưu tiên theo thứ tự:

1. Public application/API contract.
2. Stored procedure hoặc view contract được module sở hữu.
3. Integration event/Outbox.
4. API nội bộ khi cần tách triển khai về sau.

Không được:

- Query trực tiếp bảng do module khác sở hữu.
- Tham chiếu entity nội bộ của module khác.
- Dùng shared database như một API ngầm ngoài contract đã được phê duyệt.
- Đưa business logic đặc thù vào thư mục `Common` hoặc `Shared`.

## 5. Cấu trúc repository đề xuất

```text
smart-factory/
├── apps/
│   ├── web/
│   └── api/
├── src/
│   ├── Modules/
│   │   ├── Wms/
│   │   │   ├── Wms.Api/
│   │   │   ├── Wms.Application/
│   │   │   ├── Wms.DataAccess/
│   │   │   ├── Wms.Integration/
│   │   │   └── Wms.Contracts/
│   │   ├── Quality/
│   │   └── Maintenance/
│   └── BuildingBlocks/
├── tests/
│   ├── UnitTests/
│   ├── IntegrationTests/
│   ├── ArchitectureTests/
│   └── EndToEndTests/
├── database/
│   ├── migrations/
│   ├── views/
│   ├── stored-procedures/
│   │   ├── commands/
│   │   ├── queries/
│   │   └── tests/
│   └── seed/
├── docs/
│   ├── architecture/
│   ├── requirements/
│   ├── api/
│   └── adr/
├── deploy/
└── scripts/
```

Không tạo thư mục theo tên nhân viên hoặc theo giai đoạn tạm thời như `new`, `old`, `backup`, `final2`.

## 6. Quy tắc đặt tên chung

| Thành phần | Quy tắc | Ví dụ |
|---|---|---|
| Module | PascalCase, theo capability | `Warehouse`, `Quality` |
| C# class/interface | PascalCase | `InventoryService`, `IInventoryRepository` |
| C# method/property | PascalCase | `ConfirmReceiptAsync` |
| C# parameter/local variable | camelCase | `receiptId` |
| TypeScript component/type | PascalCase | `ReceiptDetail`, `ReceiptLine` |
| TypeScript function/variable | camelCase | `loadReceipt` |
| Constant | PascalCase trong C#; UPPER_SNAKE_CASE khi phù hợp ở TS | `MaxRetryCount`, `DEFAULT_PAGE_SIZE` |
| API route | lowercase, số nhiều, kebab-case | `/api/v1/warehouse-receipts` |
| SQL table | PascalCase, có schema module | `wms.InventoryBalance` |
| SQL column | PascalCase | `WarehouseLocationId` |
| Stored procedure command | `usp_<Module>_<UseCase>_<Action>` | `usp_WMS_UC02_MapOrder` |
| Stored procedure query | `usp_<Module>_<UseCase>_Get...` | `usp_WMS_UC03_GetReceiptDetail` |
| Event | Thì quá khứ | `GoodsReceiptConfirmed` |
| Command | Động từ mệnh lệnh | `ConfirmGoodsReceipt` |
| Query | Diễn đạt dữ liệu cần lấy | `GetInventoryByLocation` |

Tên nghiệp vụ phải thống nhất với glossary. Không dùng nhiều tên cho cùng một khái niệm như `OrderNo`, `OrderCode`, `MaDH` nếu cùng đại diện một dữ liệu.

## 7. Tiêu chuẩn Backend – ASP.NET Core

### 7.1 Controller/API endpoint

Controller chỉ thực hiện:

1. Nhận và bind request.
2. Xác thực/xác quyền theo policy.
3. Gọi command/query tương ứng.
4. Chuyển kết quả sang HTTP response.

Controller không được:

- Chứa business rule.
- Query database trực tiếp.
- Gọi stored procedure trực tiếp.
- Tự xử lý transaction nghiệp vụ.
- Trả entity database ra ngoài API.

### 7.2 Application Orchestration

- Mỗi use case có command/query và handler riêng.
- Handler chỉ điều phối kỹ thuật: lấy user context, gọi một hoặc nhiều gateway, phát integration event và map kết quả.
- Validation kỹ thuật như required, format, data type và giới hạn kích thước đặt gần request.
- Validation nghiệp vụ như trạng thái hợp lệ, tồn kho đủ, quyền xác nhận, chống trùng và điều kiện phê duyệt phải nằm trong stored procedure.
- Handler không được dùng `if/switch` để quyết định kết quả nghiệp vụ, tự tính KPI/số lượng/đơn giá hoặc tự cập nhật trạng thái.
- Phương thức I/O phải dùng `async/await` và nhận `CancellationToken`.

### 7.3 Stored Procedure Gateway/Data Access

- Mỗi command ghi dữ liệu gọi stored procedure nghiệp vụ tương ứng; không cập nhật trực tiếp bảng.
- Query phải gọi stored procedure hoặc view/read contract được phê duyệt.
- Gateway chỉ khai báo parameter, timeout, execute và map result; không chứa business rule.
- Không dùng generic repository để che giấu SQL hoặc tạo đường ghi bảng ngoài stored procedure.
- Tất cả parameter phải được khai báo kiểu và độ dài rõ; không dùng `AddWithValue` tùy tiện.
- Kết quả stored procedure phải được map sang contract riêng, không trả `DataTable` hoặc entity database trực tiếp ra API.

### 7.4 Infrastructure và Integration

- Tất cả SQL phải parameterized.
- Không để connection string, password hoặc token trong source code.
- External service phải có timeout, retry có giới hạn và logging phù hợp.
- Retry không áp dụng mù quáng cho thao tác không idempotent.

### 7.5 Xử lý lỗi

Dùng exception middleware hoặc exception handler tập trung.

| Loại lỗi | HTTP gợi ý |
|---|---:|
| Request không hợp lệ | 400 |
| Chưa đăng nhập | 401 |
| Không có quyền | 403 |
| Không tìm thấy | 404 |
| Xung đột trạng thái/duplicate | 409 |
| Vi phạm business rule | 422 |
| Lỗi hệ thống ngoài dự kiến | 500 |

Response lỗi nên theo Problem Details và có `traceId`. Không trả stack trace hoặc thông tin nhạy cảm cho client.

### 7.6 Logging và audit

Log phải có cấu trúc và tối thiểu gồm khi phù hợp:

- `TraceId`/`CorrelationId`.
- Module và use case.
- User/Actor ID.
- Entity ID hoặc business reference.
- Kết quả và thời gian xử lý.

Không log:

- Password, token, secret.
- Toàn bộ dữ liệu cá nhân không cần thiết.
- Payload lớn hoặc ảnh dạng base64.

Audit trail phải ghi nhận `Ai`, `Thời điểm`, `Thao tác`, `Đối tượng`, `Giá trị trước/sau` đối với thay đổi quan trọng.

## 8. Tiêu chuẩn API

- API phải có version: `/api/v1/...`.
- Dùng danh từ cho resource; dùng action khi nghiệp vụ không thể biểu diễn rõ bằng CRUD.
- Không trả model nội bộ; dùng request/response contract.
- Ngày giờ trao đổi theo ISO 8601; lưu thời điểm chuẩn và xử lý múi giờ rõ ràng.
- Phân trang cho danh sách có thể tăng lớn.
- Hỗ trợ filter/sort có whitelist; không ghép trực tiếp câu SQL từ input.
- Mutation quan trọng nên hỗ trợ idempotency key hoặc business key chống ghi trùng.
- OpenAPI phải được cập nhật cùng mã nguồn.

Ví dụ:

```http
POST /api/v1/warehouse-receipts/{receiptId}/confirm
GET  /api/v1/inventory-balances?locationCode=A-01&page=1&pageSize=50
```

## 9. Tiêu chuẩn Frontend – React/TypeScript

### 9.1 Nguyên tắc

- Bắt buộc TypeScript; không dùng `any` nếu không có lý do và chú thích.
- Component UI không chứa business rule cốt lõi.
- Server state và UI state phải tách biệt.
- Form phải hiển thị validation rõ ràng và giữ dữ liệu hợp lệ của người dùng.
- Không dùng giá trị màu, quyền hoặc trạng thái nghiệp vụ rải rác trong component.

### 9.2 Cấu trúc theo feature

```text
src/features/warehouse-receipt/
├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── types/
└── tests/
```

### 9.3 Component

- Một component có một trách nhiệm giao diện chính.
- Tách component khi có logic riêng, tái sử dụng thật hoặc khó kiểm thử.
- Không tách thành quá nhiều component chỉ để giảm số dòng.
- Props phải có type rõ ràng.
- Side effect phải nằm trong hook/use case phù hợp, không chạy tùy tiện khi render.

### 9.4 Trạng thái và gọi API

- Không gọi API trực tiếp từ nhiều component cho cùng một nghiệp vụ.
- Chuẩn hóa một lớp client theo feature.
- Luôn có trạng thái loading, empty, error và retry phù hợp.
- Không dùng dữ liệu cache để xác nhận nghiệp vụ quan trọng nếu chưa kiểm tra lại server.
- Client validation giúp trải nghiệm; server validation mới là kiểm soát cuối cùng.

### 9.5 Giao diện nhà máy

- Ưu tiên thao tác nhanh, rõ và chống nhầm hơn hiệu ứng trang trí.
- Nút hành động nguy hiểm phải có phân biệt và xác nhận phù hợp.
- Trạng thái không chỉ phân biệt bằng màu; cần nhãn hoặc biểu tượng.
- Màn hình scanner/mobile phải tính đến găng tay, ánh sáng, tiếng ồn và mất mạng.
- Sự kiện quét lặp phải được kiểm soát cả client và server.

## 10. Tiêu chuẩn SQL Server và dữ liệu

### 10.1 Sở hữu dữ liệu

- Mỗi bảng có một module owner và một data owner.
- Module khác không cập nhật trực tiếp bảng không thuộc sở hữu.
- Tích hợp đọc chéo phải qua view/contract được phê duyệt hoặc application interface.

### 10.2 Thiết kế bảng

Mỗi bảng nghiệp vụ nên có khi phù hợp:

- Primary key ổn định.
- Business key và unique constraint.
- `CreatedAt`, `CreatedBy`, `UpdatedAt`, `UpdatedBy`.
- `RowVersion` để kiểm soát concurrent update.
- Trạng thái và lịch sử trạng thái nếu nghiệp vụ yêu cầu truy vết.

Không dùng `SELECT *` trong code Production.

### 10.3 Migration

- Mọi thay đổi schema phải có migration/script được version control.
- Script phải xác định rõ thứ tự chạy và dependency.
- Thay đổi phá vỡ tương thích phải có kế hoạch chuyển đổi dữ liệu và rollback/roll-forward.
- Không sửa một migration đã được áp dụng ở môi trường dùng chung; tạo migration mới.
- Dữ liệu seed phải idempotent.

### 10.4 Stored procedure, view và trigger

- Stored procedure là đơn vị thực thi business logic chính của hệ thống.
- Mỗi stored procedure nghiệp vụ phải gắn với Module, Use Case ID, Business Rule ID, owner và bộ test.
- Stored procedure ghi dữ liệu phải dùng `SET XACT_ABORT ON`, `TRY...CATCH` và transaction với phạm vi ngắn, trừ khi có lý do được ghi trong ADR.
- Stored procedure phải kiểm tra business validation trước khi ghi; mọi bảng liên quan phải commit hoặc rollback như một đơn vị nguyên tử.
- Phải kiểm soát concurrency bằng `RowVersion`, khóa phù hợp hoặc điều kiện cập nhật có kiểm tra; không chấp nhận lost update.
- Thao tác có khả năng gửi lại phải nhận `IdempotencyKey`/business key và chống ghi trùng.
- Stored procedure phải nhận user/device/correlation context cần thiết để ghi audit trail.
- Không trả thông báo tự do làm contract. Dùng `ResultCode`, `MessageKey`, dữ liệu kết quả và lỗi kỹ thuật tách biệt.
- Không dùng dynamic SQL nếu không thật sự cần; nếu dùng phải parameterized và được review bảo mật.
- Không để cùng một business rule tồn tại trong C#, frontend, trigger và stored procedure.
- View dùng làm read contract phải có schema, tài liệu field và quy tắc version.
- Hạn chế trigger vì khó quan sát; nếu bắt buộc dùng phải có ADR, logging và test.
- Không gọi API, MQTT hoặc hệ thống ngoài trong stored procedure. Ghi Outbox/Event để xử lý sau commit.

### 10.5 Contract chuẩn của Stored Procedure nghiệp vụ

Input tối thiểu khi phù hợp:

- Business data của use case.
- `UserId`, `DeviceId`, `CorrelationId`.
- `IdempotencyKey` hoặc business key.
- `ExpectedRowVersion` cho cập nhật cạnh tranh.

Output tối thiểu:

- `IsSuccess`.
- `ResultCode` ổn định, ví dụ `WMS_RECEIPT_ALREADY_CONFIRMED`.
- `MessageKey` để backend/frontend ánh xạ thông báo.
- ID, trạng thái mới, `RowVersion` hoặc dữ liệu kết quả cần thiết.

Lỗi business rule phải trả về result contract có kiểm soát. Lỗi kỹ thuật không dự kiến phải `THROW` để transaction rollback và backend ghi log.

### 10.6 Hiệu năng

- Index phải dựa trên query thực tế, không tạo theo cảm tính.
- Query danh sách lớn phải phân trang.
- Kiểm tra execution plan cho query quan trọng.
- Không thực hiện N+1 query.
- Không giữ transaction lâu trong khi gọi API hoặc thiết bị bên ngoài.

## 11. Business rule và quản lý trạng thái

Business rule và state transition phải được thực thi tập trung trong stored procedure của use case. Tài liệu BA là nguồn mô tả rule; stored procedure là nguồn thực thi chính thức.

Mỗi rule quan trọng phải có ID để truy vết, ví dụ `BR-WMS-UC02-01`.

Rule cần ghi rõ:

- Điều kiện áp dụng.
- Input và nguồn dữ liệu chuẩn.
- Quyết định/kết quả.
- Thông báo khi vi phạm.
- Ngoại lệ.
- Owner phê duyệt.
- Test case liên quan.

State transition phải được định nghĩa tập trung. Backend, frontend và script SQL rời không được cập nhật trạng thái trực tiếp.

Ví dụ:

`Draft → Confirmed → Processing → Completed`

Mọi trạng thái phải có:

- Ai được chuyển.
- Điều kiện chuyển.
- Dữ liệu bắt buộc.
- Tác động sau chuyển.
- Có được hoàn tác hay không.

## 12. Bảo mật và phân quyền

- Xác thực tập trung qua Identity Server/nền tảng danh tính.
- Phân quyền theo policy/permission; không chỉ kiểm tra tên role trong UI.
- Backend phải kiểm tra quyền truy cập endpoint cho mọi thao tác bảo vệ.
- Stored procedure phải kiểm tra các điều kiện quyền mang tính nghiệp vụ như quyền xác nhận theo xưởng/kho, phân tách người lập–người duyệt và phạm vi dữ liệu.
- Áp dụng nguyên tắc quyền tối thiểu.
- Tách quyền xem, tạo, sửa, xác nhận, phê duyệt, hủy và quản trị.
- Secret phải nằm trong secret store hoặc biến môi trường được quản lý.
- Validate file upload theo loại, kích thước và nội dung; đổi tên lưu trữ an toàn.
- Không tin dữ liệu từ thiết bị IoT nếu chưa xác thực device identity và kiểm tra timestamp/replay.

## 13. Tích hợp ERP, IoT và hệ thống ngoài

Mỗi integration phải có contract xác định:

- System of Record.
- Dữ liệu gửi/nhận.
- Tần suất hoặc event trigger.
- Mapping field và mã chuẩn.
- Cơ chế chống trùng.
- Timeout/retry/dead-letter.
- Cách reconciliation.
- Owner xử lý lỗi.

Không để lỗi tích hợp biến mất trong log. Phải có trạng thái theo dõi, khả năng chạy lại có kiểm soát và cảnh báo khi vượt SLA.

## 14. Kiểm thử

### 14.1 Test pyramid tối thiểu

| Loại test | Mục đích |
|---|---|
| SQL unit test | Business rule, validation, calculation và state transition trong stored procedure |
| Integration test | Stored procedure contract, database, API và message/integration contract |
| Backend unit test | Mapping, orchestration kỹ thuật và xử lý result/error contract |
| Architecture test | Bảo vệ ranh giới module và dependency |
| End-to-end test | Luồng nghiệp vụ trọng yếu |
| UAT | Xác nhận vận hành thực tế và giá trị nghiệp vụ |

### 14.2 Quy tắc bắt buộc

- Mỗi bug fix phải có test tái hiện lỗi khi khả thi.
- Mỗi business rule quan trọng phải có test positive, negative và boundary.
- Mỗi stored procedure command phải có test transaction rollback, concurrency và idempotency khi áp dụng.
- Test phải chứng minh backend không tạo đường ghi trực tiếp vào bảng nghiệp vụ.
- Không kiểm thử chỉ happy path.
- Test không phụ thuộc thứ tự chạy.
- Không dùng dữ liệu Production thật chứa thông tin nhạy cảm.
- Tên test mô tả điều kiện và kết quả mong đợi.

Ví dụ:

```text
ConfirmReceipt_WhenAnyLineHasNoOrderMapping_ReturnsBusinessRuleViolation
```

## 15. Git và quản lý nhánh

### 15.1 Mô hình nhánh

- `main`: mã đã sẵn sàng Production; được bảo vệ.
- `develop` hoặc nhánh tích hợp: chỉ dùng nếu quy trình release cần thiết.
- `feature/<issue-id>-<short-name>`: tính năng.
- `fix/<issue-id>-<short-name>`: sửa lỗi.
- `hotfix/<issue-id>-<short-name>`: lỗi khẩn cấp Production.

Không phát triển trực tiếp trên `main`.

### 15.2 Commit

Một commit nên là một thay đổi logic có thể hiểu và review.

Định dạng khuyến nghị:

```text
type(scope): summary
```

Ví dụ:

```text
feat(wms): add receipt order mapping
fix(quality): prevent duplicate defect confirmation
test(maintenance): cover preventive work order rules
docs(api): document inventory adjustment endpoint
```

### 15.3 Pull request

Mọi thay đổi vào nhánh được bảo vệ phải qua pull request.

PR phải có:

- Requirement/issue ID.
- Mục tiêu và phạm vi thay đổi.
- Business rule bị tác động.
- Ảnh/video nếu thay đổi UI.
- Migration hoặc ảnh hưởng dữ liệu.
- Stored procedure và Business Rule ID bị thêm/sửa.
- Cách kiểm thử và kết quả.
- Rủi ro, rollback hoặc lưu ý triển khai.

Người viết code không tự phê duyệt PR của mình.

## 16. Definition of Ready

Một hạng mục chỉ sẵn sàng phát triển khi tối thiểu có:

- Mục tiêu và business owner.
- Phạm vi trong/ngoài.
- Main flow và ngoại lệ quan trọng.
- Business rule đã được xác nhận hoặc đánh dấu rõ phần chưa xác nhận.
- Dữ liệu nguồn và owner.
- Acceptance criteria có thể kiểm thử.
- Tác động module/integration được nhận diện.
- UI mockup nếu giao diện có quyết định đáng kể.

## 17. Definition of Done

Một hạng mục chỉ hoàn thành khi:

- Code tuân thủ kiến trúc và coding standard.
- Business rule có thể truy vết và được thực thi trong stored procedure đúng owner.
- Backend không chứa business decision và không có đường ghi trực tiếp vào bảng nghiệp vụ.
- Stored procedure command có transaction, result contract, audit, concurrency/idempotency phù hợp.
- Test cần thiết đã chạy đạt.
- Static analysis/build đạt.
- API/OpenAPI và tài liệu liên quan đã cập nhật.
- Migration đã được review và thử nghiệm.
- Logging, audit và phân quyền đã kiểm tra.
- Không còn secret hoặc dữ liệu nhạy cảm trong code/log.
- UAT hoặc owner xác nhận theo mức cần thiết.
- Có hướng dẫn triển khai và rollback/roll-forward.
- PR được review và phê duyệt.

## 18. Quy tắc sử dụng AI trong phát triển

AI được dùng để:

- Phân tích code và đề xuất phương án.
- Sinh khung code, test, tài liệu và migration nháp.
- Rà soát consistency, security và test coverage.
- Hỗ trợ refactor trong phạm vi đã xác nhận.
- Sinh hoặc sửa business logic chỉ trong stored procedure khi requirement và Business Rule ID đã được xác nhận.

AI không được tự quyết định:

- Business rule chưa được phê duyệt.
- Xóa hoặc sửa dữ liệu Production.
- Thay đổi kiến trúc, schema hoặc public contract ngoài phạm vi giao việc.
- Bỏ qua test, review hoặc phân quyền.
- Dùng secret hoặc dữ liệu nhạy cảm đưa ra dịch vụ không được phê duyệt.
- Chuyển business logic sang C#/TypeScript để thuận tiện triển khai.

Mọi yêu cầu giao cho AI cần tối thiểu:

```text
Context:
Business objective:
Scope in/out:
Requirement/Use Case ID:
Business rules:
Affected files/modules:
Constraints:
Acceptance criteria:
Required tests:
Do not change:
```

Code do AI tạo phải được review như code của con người. Người merge chịu trách nhiệm cuối cùng.

## 19. Code review checklist

### Nghiệp vụ

- [ ] Thay đổi đúng requirement và scope.
- [ ] Business rule có ID/nguồn xác nhận.
- [ ] Có xử lý alternate/exception flow cần thiết.
- [ ] Không làm thay đổi ngầm nghiệp vụ module khác.

### Kiến trúc

- [ ] Đúng module và đúng layer.
- [ ] Không truy cập trực tiếp dữ liệu nội bộ module khác.
- [ ] Business logic chỉ nằm trong stored procedure đã xác định owner.
- [ ] Backend không chứa business decision và không ghi trực tiếp bảng nghiệp vụ.
- [ ] Backend gọi stored procedure thông qua gateway/contract, không gọi trực tiếp từ controller.
- [ ] Tích hợp ngoài dùng Outbox/Event khi cần, không kéo dài transaction SQL.
- [ ] Public contract chỉ mở phần cần thiết.

### Dữ liệu và bảo mật

- [ ] Query parameterized và có giới hạn dữ liệu.
- [ ] Có kiểm tra quyền ở backend.
- [ ] Không lộ secret hoặc dữ liệu nhạy cảm.
- [ ] Có audit/concurrency/idempotency khi cần.
- [ ] Stored procedure có transaction, rollback, result contract và test phù hợp.
- [ ] Migration an toàn và có kế hoạch dữ liệu.

### Chất lượng

- [ ] Tên và cấu trúc dễ hiểu.
- [ ] Không duplicate logic đáng kể.
- [ ] Test bao phủ rule và lỗi được sửa.
- [ ] Build, lint, test và static analysis đạt.
- [ ] Logging đủ để điều tra nhưng không thừa dữ liệu.

## 20. Kiểm soát tự động trong CI/CD

Pipeline tối thiểu:

1. Restore/install dependency.
2. Format/lint.
3. Build.
4. Backend unit test và SQL unit test.
5. Stored procedure contract test, integration/architecture test phù hợp.
6. Security/dependency scan.
7. Tạo artifact/container image.
8. Deploy môi trường kiểm thử.
9. Smoke test.
10. Phê duyệt trước Production.

Không triển khai Production nếu build/test bắt buộc thất bại. Mọi ngoại lệ phải có người phê duyệt, lý do và thời hạn xử lý.

## 21. Ngoại lệ tiêu chuẩn

Nếu cần vi phạm tiêu chuẩn vì giới hạn hệ thống cũ hoặc yêu cầu khẩn cấp, phải tạo Architecture Decision Record (ADR) gồm:

- Bối cảnh và vấn đề.
- Quy tắc bị ngoại lệ.
- Phương án đã cân nhắc.
- Lý do lựa chọn.
- Rủi ro và biện pháp kiểm soát.
- Owner phê duyệt.
- Thời hạn xem xét lại hoặc kế hoạch loại bỏ technical debt.

## 22. Vai trò và trách nhiệm

| Vai trò | Trách nhiệm chính |
|---|---|
| Product Owner/Business Owner | Xác nhận giá trị, phạm vi và ưu tiên |
| BA | Làm rõ quy trình, rule, dữ liệu, acceptance criteria và truy vết |
| Solution/Software Architect | Quản lý ranh giới module, contract và quyết định kiến trúc |
| Developer | Thiết kế chi tiết, code, test và tự kiểm tra |
| Database/SQL Developer | Cài đặt stored procedure, transaction, hiệu năng, audit và SQL test theo Business Rule ID |
| Reviewer/Tech Lead | Kiểm tra nghiệp vụ, kiến trúc, bảo mật và khả năng bảo trì |
| QA/Key User | Kiểm thử, xác nhận luồng vận hành và ngoại lệ |
| Data Owner | Xác nhận định nghĩa, chất lượng, quyền và vòng đời dữ liệu |
| DevOps/System Admin | Pipeline, cấu hình, triển khai, monitoring và recovery |

## 23. Lộ trình áp dụng đề xuất

### Giai đoạn 1 – Bắt buộc ngay

- Chuẩn tên và cấu trúc repository.
- Branch protection và pull request.
- Không business logic trong controller/UI.
- Business logic mới hoặc thay đổi phải được cài đặt và kiểm thử trong stored procedure.
- Backend không có đường ghi trực tiếp vào bảng nghiệp vụ.
- Không truy cập trực tiếp dữ liệu chéo module.
- Requirement ID, test và migration trong PR.
- Secret, quyền và audit cơ bản.

### Giai đoạn 2 – Trong 1 đến 2 tháng

- Architecture test.
- Chuẩn API/OpenAPI.
- Centralized logging và correlation ID.
- CI build, lint, unit/integration test.
- Data ownership và integration contract.

### Giai đoạn 3 – Khi nền tảng ổn định

- Automated security scan.
- Contract test và end-to-end test trọng yếu.
- Observability theo module/use case.
- Feature flag, canary hoặc phương án rollout an toàn.
- Đo lead time, defect escape rate và change failure rate.

## 24. Chỉ số theo dõi hiệu quả tiêu chuẩn

| KPI | Ý nghĩa |
|---|---|
| Pull Request Lead Time | Thời gian từ mở PR đến merge |
| Build Success Rate | Mức ổn định của nhánh tích hợp |
| Defect Escape Rate | Lỗi lọt sang UAT/Production |
| Change Failure Rate | Tỷ lệ release gây sự cố/rollback |
| Mean Time to Restore | Khả năng phục hồi sau lỗi |
| Automated Test Pass Rate | Mức ổn định của kiểm thử tự động |
| Requirement Traceability | Tỷ lệ thay đổi truy vết được về yêu cầu |
| Module Boundary Violations | Số vi phạm ranh giới kiến trúc |

## 25. Quyết định cần team xác nhận

Các nội dung sau cần được chốt trong workshop kỹ thuật trước khi coi tài liệu là chính thức:

- Tên repository và lựa chọn monorepo/multi-repo.
- Có sử dụng nhánh `develop` hay trunk-based development.
- Bộ thư viện chuẩn cho mediator, logging, data access và test SQL.
- Quy ước schema database theo module.
- Chuẩn gateway gọi stored procedure bằng Dapper/ADO.NET và phạm vi EF Core chỉ dành cho dữ liệu kỹ thuật nếu có.
- Chuẩn Identity Server và permission code.
- Ngưỡng test/quality gate bắt buộc.
- Quy trình release, rollback và người phê duyệt Production.

---

## Phụ lục A – Mẫu pull request

```markdown
## Requirement
- ID:
- Business owner:

## Mục tiêu

## Phạm vi thay đổi

## Business rule bị tác động
- Rule ID:
- Stored procedure:

## Dữ liệu/Migration

## API/UI/Integration impact

## Kiểm thử
- [ ] SQL unit test
- [ ] Stored procedure contract/integration test
- [ ] Backend unit test
- [ ] Manual/UAT scenario

## Rủi ro và rollback

## Ảnh hoặc bằng chứng
```

## Phụ lục B – Mẫu ADR

```markdown
# ADR-XXX: Tên quyết định

## Trạng thái
Proposed / Accepted / Superseded

## Bối cảnh

## Quyết định

## Phương án đã cân nhắc

## Hệ quả và rủi ro

## Owner và ngày xem xét lại
```

## Phụ lục C – Quy tắc ưu tiên khi có xung đột

Khi tài liệu hoặc code có mâu thuẫn, ưu tiên xác minh theo thứ tự:

1. Quy định pháp lý, an toàn và bảo mật.
2. Business rule đã được Business Owner phê duyệt.
3. Dữ liệu nguồn chuẩn và Data Owner.
4. Architecture Decision Record đã được chấp thuận.
5. Coding Standard hiện hành.
6. Cách triển khai đang tồn tại trong code.

Code hiện tại không tự động được xem là đúng nghiệp vụ.
