# Phân tích Thiết kế Logic UC12 - Cấu hình QC

Tài liệu phân tích toàn diện **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic** và **Diagrams** cho chức năng **Cấu hình QC** khi chuyển hệ thống Quản lý Kho Vật tư từ Power Apps sang React.

Nguyên tắc bắt buộc: React chỉ xử lý giao diện; backend là API host mỏng; mọi quy tắc nghiệp vụ, chuyển trạng thái và transaction nhiều bảng được thực thi trong SQL Stored Procedure.

---

## 1. Business Logic (Logic Nghiệp vụ)

### 1.1. Mục tiêu cốt lõi

Khai báo nhóm QC, phạm vi vật tư và bộ tiêu chí kiểm tra chất lượng có phiên bản.

### 1.2. Phạm vi và nguồn hiện hữu

| Màn hình | Nguồn | Datasource phát hiện trong YAML |
|---|---|---|
| scr_qc_update_nhom_admin | Quản lý kho vật tư .msapp | tbl_dm_tieuchi_kiem, MMS_update_ma_kiem, tbl_dm_nhom_vattu, tbl_nhom_vattu_qc, tbl_tieuchi_kiem, vw_tieuchi_kiem, tbl_khaibao_qc, vw_khaibao_qc, tbl_nhom_qc |
| scr_qc_update_vattu | Quản lý kho vật tư .msapp | tbl_dm_tieuchi_kiem, tbl_tieuchi_kiem, vw_tieuchi_kiem, tbl_khaibao_qc, vw_khaibao_qc, tbl_dm_vattu, tbl_nhom_qc |
| scr_qc_info_tieuchi | Quản lý kho vật tư .msapp | vw_tieuchi_kiem, vw_khaibao_qc, tbl_nhom_qc |

- Thao tác Power Fx phát hiện: **Collect, Flow.Run, Navigate, Patch, Remove**.
- Datasource tham chiếu thực tế: `MMS_update_ma_kiem, tbl_dm_nhom_vattu, tbl_dm_tieuchi_kiem, tbl_dm_vattu, tbl_khaibao_qc, tbl_nhom_qc, tbl_nhom_vattu_qc, tbl_tieuchi_kiem, vw_khaibao_qc, vw_tieuchi_kiem`.
- Nhãn giao diện tiêu biểu: `Tên nhóm mới`, `Mã nhóm mới`, `KHAI BÁO NHÓM TIÊU CHUẨN KIỂM`, `Nhóm mới:`, `Nhóm QC:`, `Nhóm vật tư:`, `LƯU`, `Tiêu chí kiểm`, `LIÊN KẾT NHÓM TIÊU CHUẨN KIỂM & NHÓM VẬT TƯ MUA HÀNG`, `KHAI BÁO TIÊU CHÍ KIỂM CHO NHÓM LIÊN KẾT`, `Nhóm vật tư`, `Trạng thái`.

### 1.3. Actor

- Actor nghiệp vụ: QC Admin.
- React Web Client trên PC hoặc mobile/PDA tùy màn hình.
- Backend API xác thực, phân quyền, validate hình thức và gọi SP.
- SQL Server MMS chịu trách nhiệm toàn bộ logic nghiệp vụ.

### 1.4. Tiền điều kiện

- Người dùng đã đăng nhập và có quyền `UC12`.
- Danh mục và chứng từ nguồn liên quan đang hoạt động.
- Dữ liệu đầu vào thuộc đúng kho/bộ phận mà người dùng được phép thao tác.
- Các Stored Procedure của use case đã được triển khai và version tương thích API.

### 1.5. Hậu điều kiện

- Khi thành công, dữ liệu và trạng thái được cập nhật atomic, có người thao tác và thời gian.
- API trả mã kết quả, thông báo và dữ liệu mới nhất do SP xác nhận.
- Khi thất bại, SP rollback toàn bộ phần ghi và không để dữ liệu trung gian dở dang.
- React refresh dữ liệu từ response/read SP; không tự giả lập trạng thái thành công.

### 1.6. Business Rules

- **`[BR-UC12-01]`** Mã nhóm và mã tiêu chí là duy nhất.
- **`[BR-UC12-02]`** Tiêu chí active phải có kiểu dữ liệu.
- **`[BR-UC12-03]`** Khoảng min không lớn hơn max.
- **`[BR-UC12-04]`** Một vật tư không có hai cấu hình active xung đột.
- **`[BR-UC12-05]`** Không sửa cấu hình đã dùng; tạo phiên bản mới.
- **`[BR-UC12-06]`** Mọi thay đổi có audit.

- **`[BR-UC12-07]`** User thao tác lấy từ token; SP kiểm tra lại quyền và phạm vi dữ liệu.
- **`[BR-UC12-08]`** Mọi command phải hỗ trợ `RequestId` để chống gửi lặp.
- **`[BR-UC12-09]`** Không dùng SQL động do client truyền và không cho backend cập nhật bảng trực tiếp.

### 1.7. Luồng chính

| Bước | Thao tác | React/API | SQL Stored Procedure |
|---|---|---|---|
| 1 | Tạo/chọn nhóm QC | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 2 | Gán nhóm vật tư hoặc vật tư | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 3 | Khai báo tiêu chí và kiểu kết quả | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 4 | Thiết lập ngưỡng/đơn vị/thứ tự | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 5 | Kiểm tra xung đột cấu hình | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 6 | Kích hoạt cấu hình QC | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |

### 1.8. Luồng ngoại lệ

| Mã | Tình huống | HTTP | Xử lý bắt buộc |
|---|---|---:|---|
| `INVALID_INPUT` | Thiếu hoặc sai định dạng dữ liệu | 400 | React đánh dấu trường; SP không ghi dữ liệu |
| `FORBIDDEN` | Không có quyền hoặc sai phạm vi kho | 403 | Không trả dữ liệu ngoài phạm vi |
| `NOT_FOUND` | Chứng từ/danh mục không tồn tại | 404 | Refresh danh sách và yêu cầu chọn lại |
| `INVALID_STATE` | Trạng thái hiện tại không cho phép thao tác | 409 | SP rollback, trả trạng thái mới nhất |
| `CONCURRENCY_CONFLICT` | Dữ liệu đã thay đổi bởi phiên khác | 409 | UI tải lại dữ liệu; không tự retry command |
| `DUPLICATE_REQUEST` | `RequestId` đã xử lý | 200/409 | Trả lại kết quả cũ hoặc mã trùng an toàn |
| `DATABASE_ERROR` | Lỗi SQL ngoài dự kiến | 500 | Rollback và ghi technical log |

### 1.9. State Model

| Trạng thái | Ý nghĩa | Hành động tiếp theo |
|---|---|---|
| DRAFT | Trạng thái nghiệp vụ DRAFT của cấu hình qc | Theo state machine và quyền của SP |
| ACTIVE | Trạng thái nghiệp vụ ACTIVE của cấu hình qc | Theo state machine và quyền của SP |
| INACTIVE | Trạng thái nghiệp vụ INACTIVE của cấu hình qc | Theo state machine và quyền của SP |

---

## 2. UI/UX Guidelines

### 2.1. Cấu trúc màn hình

- Thanh tiêu đề hiển thị tên nghiệp vụ, kho/bộ phận và người đang thao tác.
- Vùng bộ lọc/danh mục ở đầu, vùng dữ liệu chính ở giữa và thanh hành động cố định ở cuối.
- Danh sách nhiều dòng dùng table trên PC và list compact trên mobile, không lồng card.
- Trạng thái hiển thị bằng badge có cả màu và chữ; không chỉ dựa vào màu.
- Command chính chỉ bật khi dữ liệu đầu vào và trạng thái UI hợp lệ.

### 2.2. Trạng thái tương tác

| UI State | Hành vi |
|---|---|
| `idle` | Sẵn sàng nhập/chọn dữ liệu |
| `loading` | Skeleton cho vùng danh sách; giữ ổn định kích thước layout |
| `editing` | Cho phép thay đổi trường theo quyền và trạng thái |
| `submitting` | Khóa submit lặp; hiển thị tiến trình trong nút |
| `success` | Hiển thị mã chứng từ/kết quả và refresh từ server |
| `error` | Giữ dữ liệu người dùng, chỉ rõ trường hoặc rule bị lỗi |
| `conflict` | Cảnh báo dữ liệu đã đổi và cung cấp nút tải lại |

### 2.3. Responsive và accessibility

- Vùng chạm mobile tối thiểu 44 x 44 px; input số mở bàn phím số.
- Table rộng chuyển sang chế độ row detail trên màn hình nhỏ.
- Label liên kết input; lỗi dùng `aria-describedby`; dialog giữ focus đúng chuẩn.
- Hỗ trợ bàn phím cho tìm kiếm, thêm dòng, xác nhận và đóng dialog.
- Không hiển thị hướng dẫn kỹ thuật hoặc tên bảng/SP trong UI sản xuất.

---

## 3. Programming Logic

### 3.1. Ranh giới trách nhiệm

| Lớp | Trách nhiệm | Không được thực hiện |
|---|---|---|
| React | State giao diện, validation định dạng, gọi API, render kết quả | Tính rule nghiệp vụ, đổi trạng thái, ghi SQL |
| Backend | Auth, permission, request schema, correlation id, gọi SP, map HTTP | Viết lại rule hoặc transaction nhiều bảng |
| SQL SP | Validation nghiệp vụ, locking, state transition, CRUD atomic, audit | Trả dữ liệu ngoài phạm vi quyền |

### 3.2. React contract đề xuất

```typescript
export interface C_u_h_nh_QCCommand {
  requestId: string;
  action: string;
  documentId?: number | string;
  warehouseCode?: string;
  payload: Record<string, unknown>;
}

export interface C_u_h_nh_QCResult {
  resultCode: string;
  message: string;
  documentId?: number | string;
  status: string;
  rowVersion?: string;
  data?: Record<string, unknown>;
}
```

Frontend phải gửi đúng kiểu dữ liệu API; số lượng dùng decimal-compatible string khi cần tránh sai số JavaScript.

### 3.3. API endpoints

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/api/v1/quality/uc12` | Danh sách có filter và phân trang |
| `GET` | `/api/v1/quality/uc12/{id}` | Chi tiết chứng từ/đối tượng |
| `POST` | `/api/v1/quality/uc12/commands` | Thực thi command qua SP |

### 3.4. Backend handler mỏng

```csharp
[HttpPost("commands")]
public async Task<IActionResult> Execute([FromBody] C_u_h_nh_QCCommand request)
{
    if (request.RequestId == Guid.Empty || string.IsNullOrWhiteSpace(request.Action))
        return BadRequest(ApiError.InvalidInput());

    var result = await _sp.ExecuteAsync<dynamic>(
        "usp_MMS_UC12_SaveInspectionCriteria",
        new {
            RequestId = request.RequestId,
            Action = request.Action,
            DocumentId = request.DocumentId,
            PayloadJson = JsonSerializer.Serialize(request.Payload),
            UserName = _currentUser.UserName,
            CorrelationId = HttpContext.TraceIdentifier
        });

    return StoredProcedureResultMapper.ToActionResult(result);
}
```

Handler không được `INSERT/UPDATE` trực tiếp và không quyết định trạng thái tiếp theo.

---

## 4. SQL Stored Procedure Design

### 4.1. Danh mục SP

| Stored Procedure | Vai trò | Transaction |
|---|---|---|
| usp_MMS_UC12_SaveQCGroup | Command nghiệp vụ | Bắt buộc khi ghi |
| usp_MMS_UC12_AssignMaterialQC | Command nghiệp vụ | Bắt buộc khi ghi |
| usp_MMS_UC12_SaveInspectionCriteria | Command nghiệp vụ | Bắt buộc khi ghi |

### 4.2. Command SP contract

**Input chuẩn:** `@RequestId uniqueidentifier`, khóa chứng từ/đối tượng, action, dữ liệu nghiệp vụ, `@UserName`, `@CorrelationId` và `@ExpectedRowVersion` khi cập nhật.

**Output chuẩn:** `ResultCode`, `Message`, `DocumentId`, `Status`, `RowVersion` và result set chi tiết nếu cần.

### 4.3. Transaction skeleton

```sql
CREATE OR ALTER PROCEDURE dbo.usp_MMS_UC12_SaveInspectionCriteria
    @RequestId UNIQUEIDENTIFIER,
    @Action NVARCHAR(30),
    @DocumentId BIGINT = NULL,
    @PayloadJson NVARCHAR(MAX) = NULL,
    @UserName NVARCHAR(50),
    @CorrelationId NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- 1. Chống request lặp bằng @RequestId.
        -- 2. Kiểm tra user, quyền, kho/bộ phận và dữ liệu đầu vào.
        -- 3. SELECT đối tượng gốc WITH (UPDLOCK, HOLDLOCK).
        -- 4. Kiểm tra state transition và các BR của UC12.
        -- 5. Ghi/cập nhật tbl_khaibao_qc, tbl_nhom_qc, tbl_nhom_vattu_qc, tbl_dm_nhom_vattu theo nghiệp vụ.
        -- 6. Ghi audit và trạng thái cuối cùng.

        COMMIT TRANSACTION;
        SELECT N'SUCCESS' ResultCode,
               N'Xử lý thành công.' Message,
               @DocumentId DocumentId;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
```

Skeleton thể hiện ranh giới kiến trúc, không thay thế đặc tả cột chi tiết của từng SP khi triển khai.

### 4.4. Concurrency và idempotency

- Khóa bản ghi aggregate bằng `UPDLOCK, HOLDLOCK` trước khi kiểm tra số lượng/trạng thái.
- Dùng `rowversion` hoặc trạng thái kỳ vọng để phát hiện lost update.
- Mỗi command có `RequestId` duy nhất và bảng request audit để trả kết quả nhất quán khi retry.
- Không dùng `NOLOCK` trong bước quyết định số lượng tồn, định mức, trạng thái hoặc quyền ghi.

---

## 5. Data Logic

### 5.1. Ma trận CRUD

| Đối tượng | C | R | U | D | Vai trò |
|---|---|---|---|---|---|
| tbl_khaibao_qc | X | X | X | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_nhom_qc | X | X | X | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_nhom_vattu_qc | X | X | X | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_dm_nhom_vattu | - | X | X | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_tieuchi_kiem | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_dm_tieuchi_kiem | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| vw_khaibao_qc | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| vw_tieuchi_kiem | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |

### 5.2. Quan hệ dữ liệu trọng tâm

- Aggregate gốc: `tbl_khaibao_qc`.
- Dữ liệu liên quan: `tbl_nhom_qc, tbl_nhom_vattu_qc, tbl_dm_nhom_vattu, tbl_tieuchi_kiem, tbl_dm_tieuchi_kiem, vw_khaibao_qc, vw_tieuchi_kiem`.
- View chỉ dùng để đọc; command SP ghi vào bảng nguồn tương ứng.
- Khóa ngoại và khóa nghiệp vụ phải được xác nhận từ DDL SQL Server trước migration production.

### 5.3. Audit fields chuẩn

Mọi bảng command nên có hoặc liên kết được tới `user_cre`, `time_cre`, `user_up`, `time_up`, trạng thái và correlation/request id. Không thực hiện hard delete chứng từ đã phát sinh giao dịch.

---

## 6. Diagrams

### 6.1. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as QC Admin
    participant UI as React UI
    participant API as Thin API
    participant SP as SQL Stored Procedure
    participant DB as MMS Database
    User->>UI: Khởi tạo thao tác Cấu hình QC
    UI->>API: GET context/list/detail
    API->>SP: EXEC read SP với user scope
    SP->>DB: Đọc dữ liệu được cấp quyền
    DB-->>UI: Trả dữ liệu qua SP/API
    User->>UI: Nhập dữ liệu và xác nhận
    UI->>API: POST command + RequestId
    API->>SP: EXEC command SP
    SP->>DB: Lock, validate rules, ghi atomic
    alt Thành công
        DB-->>SP: Commit
        SP-->>UI: SUCCESS + trạng thái mới
    else Vi phạm rule hoặc xung đột
        SP->>DB: Rollback
        SP-->>UI: ResultCode + message
    end
```

### 6.2. Activity Flow

```mermaid
flowchart TD
    A[Mở màn hình UC12] --> B[Tải context qua read SP]
    B --> C[Người dùng nhập hoặc chọn dữ liệu]
    C --> D{Validation UI hợp lệ?}
    D -- Không --> E[Hiển thị lỗi trường]
    D -- Có --> F[API gọi command SP]
    F --> G[SQL lock aggregate]
    G --> H{Business rules hợp lệ?}
    H -- Không --> I[Rollback và trả mã lỗi]
    H -- Có --> J[Ghi dữ liệu và trạng thái]
    J --> K[Ghi audit]
    K --> L[Commit]
    L --> M[Refresh UI từ kết quả server]
```

### 6.3. State Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT
    DRAFT --> ACTIVE: SP xác nhận chuyển trạng thái
    ACTIVE --> INACTIVE: SP xác nhận chuyển trạng thái
    INACTIVE --> [*]
```

---

## 7. Acceptance Criteria và Test Scenarios

| ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| AC-UC12-01 | Luồng chính với dữ liệu hợp lệ | SP commit, trả SUCCESS và trạng thái đúng |
| AC-UC12-02 | Thiếu trường bắt buộc | INVALID_INPUT; không ghi dữ liệu |
| AC-UC12-03 | User không có quyền | HTTP 403; không lộ dữ liệu |
| AC-UC12-04 | Đối tượng không tồn tại | NOT_FOUND; UI tải lại danh sách |
| AC-UC12-05 | Sai trạng thái nghiệp vụ | INVALID_STATE; transaction rollback |
| AC-UC12-06 | Hai người cập nhật đồng thời | Một thành công, một conflict |
| AC-UC12-07 | Gửi lại cùng RequestId | Không tạo giao dịch trùng |
| AC-UC12-08 | Lỗi ở bước ghi cuối | Rollback toàn bộ bảng |
| AC-UC12-09 | Danh sách lớn | Paging/filter/sort tại SQL |
| AC-UC12-10 | Mobile viewport | Không tràn/đè UI |
| AC-UC12-11 | Audit | Đúng user, time, action, object |
| AC-UC12-12 | Kiểm tra sau commit | Header, lines, trạng thái nhất quán |

---

## 8. Traceability

| Thành phần | Nguồn/Đích |
|---|---|
| Use case | `UC12 - Cấu hình QC` |
| Power Apps screens | `scr_qc_update_nhom_admin,scr_qc_update_vattu,scr_qc_info_tieuchi` |
| Power Fx operations | `Collect, Flow.Run, Navigate, Patch, Remove` |
| Tables/Views | `tbl_khaibao_qc,tbl_nhom_qc,tbl_nhom_vattu_qc,tbl_dm_nhom_vattu,tbl_tieuchi_kiem,tbl_dm_tieuchi_kiem,vw_khaibao_qc,vw_tieuchi_kiem` |
| Stored Procedures | `usp_MMS_UC12_SaveQCGroup,usp_MMS_UC12_AssignMaterialQC,usp_MMS_UC12_SaveInspectionCriteria` |
| React module | `Quality` |
| API base | `/api/v1/quality/uc12` |

## 9. Open Points trước khi lập trình

- Xác nhận DDL thật, khóa chính/ngoại, default và index trên SQL Server MMS.
- Chốt bảng trạng thái và mapping mã số hiện tại sang enum API.
- Chốt quyền chi tiết theo action: VIEW, CREATE, EDIT, APPROVE, CANCEL, PRINT, EXPORT.
- Chốt retention của audit, chứng từ và file đính kèm.
- Viết integration test trực tiếp cho từng SP command trước khi nối React.
