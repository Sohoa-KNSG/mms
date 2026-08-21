# Phân tích Thiết kế Logic UC14 - Đánh giá vật tư QC

Tài liệu phân tích toàn diện **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic** và **Diagrams** cho chức năng **Đánh giá vật tư QC** khi chuyển hệ thống Quản lý Kho Vật tư từ Power Apps sang React.

Nguyên tắc bắt buộc: React chỉ xử lý giao diện; backend là API host mỏng; mọi quy tắc nghiệp vụ, chuyển trạng thái và transaction nhiều bảng được thực thi trong SQL Stored Procedure.

---

## 1. Business Logic (Logic Nghiệp vụ)

### 1.1. Mục tiêu cốt lõi

Ghi kết quả từng tiêu chí/vật tư và kết luận chất lượng cho phiếu nhận hàng.

### 1.2. Phạm vi và nguồn hiện hữu

| Màn hình | Nguồn | Datasource phát hiện trong YAML |
|---|---|---|
| scr_qc_danhgia_vattu | Kho vật tư .msapp | vw_phieukiem_vattu_qc, tbl_chitiet_nhanhang, tbl_phieu_nhan_hang, vw_danhgia_vattu_qc, vw_xuatkho_chitiet, tbl_qc_kiem, MMS_sql |
| scr_qc_log_info_edit | Kho vật tư .msapp | tbl_phieu_nhan_hang_image, vw_ketqua_vattu_qc |
| scr_qc_log_phieu_kiem | Kho vật tư .msapp | vw_phieukiem_group_qc, vw_phieukiem_vattu_qc, vw_ketqua_phieu_qc, tbl_qc_phieu_kiem, tbl_qc_kiem |
| scr_qc_log_phieu_nhanhang | Kho vật tư .msapp | vw_phieukiem_group_qc, vw_phieukiem_vattu_qc, tbl_chitiet_nhanhang, tbl_phieu_nhan_hang, MMS_update_ma_kiem, vw_ketqua_vattu_qc, vw_ketqua_phieu_qc, tbl_dm_vattu |

- Thao tác Power Fx phát hiện: **ClearCollect, Collect, Flow.Run, Navigate, Patch**.
- Datasource tham chiếu thực tế: `MMS_sql, MMS_update_ma_kiem, tbl_chitiet_nhanhang, tbl_dm_vattu, tbl_phieu_nhan_hang, tbl_phieu_nhan_hang_image, tbl_qc_kiem, tbl_qc_phieu_kiem, vw_danhgia_vattu_qc, vw_ketqua_phieu_qc, vw_ketqua_vattu_qc, vw_phieukiem_group_qc, vw_phieukiem_vattu_qc, vw_xuatkho_chitiet`.
- Nhãn giao diện tiêu biểu: `Ghi Chú Lỗi (nếu có)`, `Kết Quả`, `Tiêu Chí Kiểm`, `SL Kiểm`, `ĐÃ ĐÁNH GIÁ`, `Không Đạt`, `Kiểm Tra`, `Đã Nhận`, `SỐ LƯỢNG`, `Loại Kiểm`, `SL Kiểm Tra`, `SL Đã Nhận`.

### 1.3. Actor

- Actor nghiệp vụ: Nhân viên QC, QC Lead.
- React Web Client trên PC hoặc mobile/PDA tùy màn hình.
- Backend API xác thực, phân quyền, validate hình thức và gọi SP.
- SQL Server MMS chịu trách nhiệm toàn bộ logic nghiệp vụ.

### 1.4. Tiền điều kiện

- Người dùng đã đăng nhập và có quyền `UC14`.
- Danh mục và chứng từ nguồn liên quan đang hoạt động.
- Dữ liệu đầu vào thuộc đúng kho/bộ phận mà người dùng được phép thao tác.
- Các Stored Procedure của use case đã được triển khai và version tương thích API.

### 1.5. Hậu điều kiện

- Khi thành công, dữ liệu và trạng thái được cập nhật atomic, có người thao tác và thời gian.
- API trả mã kết quả, thông báo và dữ liệu mới nhất do SP xác nhận.
- Khi thất bại, SP rollback toàn bộ phần ghi và không để dữ liệu trung gian dở dang.
- React refresh dữ liệu từ response/read SP; không tự giả lập trạng thái thành công.

### 1.6. Business Rules

- **`[BR-UC14-01]`** Kết quả phải đúng kiểu tiêu chí.
- **`[BR-UC14-02]`** Ngưỡng đạt tính tại SP.
- **`[BR-UC14-03]`** Tiêu chí bắt buộc không được bỏ trống.
- **`[BR-UC14-04]`** Kết luận FAIL nếu có tiêu chí bắt buộc không đạt.
- **`[BR-UC14-05]`** Chỉ QC Lead được sửa kết quả đã kết luận.
- **`[BR-UC14-06]`** Sửa kết quả phải lưu lịch sử trước/sau.

- **`[BR-UC14-07]`** User thao tác lấy từ token; SP kiểm tra lại quyền và phạm vi dữ liệu.
- **`[BR-UC14-08]`** Mọi command phải hỗ trợ `RequestId` để chống gửi lặp.
- **`[BR-UC14-09]`** Không dùng SQL động do client truyền và không cho backend cập nhật bảng trực tiếp.

### 1.7. Luồng chính

| Bước | Thao tác | React/API | SQL Stored Procedure |
|---|---|---|---|
| 1 | Chọn phiếu kiểm đang thực hiện | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 2 | Chọn vật tư và tiêu chí | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 3 | Nhập kết quả đo/đánh giá | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 4 | Đính kèm ghi chú hoặc bằng chứng | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 5 | Lưu từng kết quả | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 6 | Kết luận đạt/không đạt | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 7 | Khóa phiếu và chuyển trạng thái nhập kho | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |

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
| NOT_EVALUATED | Trạng thái nghiệp vụ NOT_EVALUATED của đánh giá vật tư qc | Theo state machine và quyền của SP |
| PASS | Trạng thái nghiệp vụ PASS của đánh giá vật tư qc | Theo state machine và quyền của SP |
| FAIL | Trạng thái nghiệp vụ FAIL của đánh giá vật tư qc | Theo state machine và quyền của SP |
| CONDITIONAL_PASS | Trạng thái nghiệp vụ CONDITIONAL_PASS của đánh giá vật tư qc | Theo state machine và quyền của SP |

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
export interface __nh_gi__v_t_t__QCCommand {
  requestId: string;
  action: string;
  documentId?: number | string;
  warehouseCode?: string;
  payload: Record<string, unknown>;
}

export interface __nh_gi__v_t_t__QCResult {
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
| `GET` | `/api/v1/quality/uc14` | Danh sách có filter và phân trang |
| `GET` | `/api/v1/quality/uc14/{id}` | Chi tiết chứng từ/đối tượng |
| `POST` | `/api/v1/quality/uc14/commands` | Thực thi command qua SP |

### 3.4. Backend handler mỏng

```csharp
[HttpPost("commands")]
public async Task<IActionResult> Execute([FromBody] __nh_gi__v_t_t__QCCommand request)
{
    if (request.RequestId == Guid.Empty || string.IsNullOrWhiteSpace(request.Action))
        return BadRequest(ApiError.InvalidInput());

    var result = await _sp.ExecuteAsync<dynamic>(
        "usp_MMS_UC14_ConcludeInspection",
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
| usp_MMS_UC14_GetInspectionItems | Read/query | Read-only |
| usp_MMS_UC14_SaveEvaluation | Command nghiệp vụ | Bắt buộc khi ghi |
| usp_MMS_UC14_ConcludeInspection | Command nghiệp vụ | Bắt buộc khi ghi |

### 4.2. Command SP contract

**Input chuẩn:** `@RequestId uniqueidentifier`, khóa chứng từ/đối tượng, action, dữ liệu nghiệp vụ, `@UserName`, `@CorrelationId` và `@ExpectedRowVersion` khi cập nhật.

**Output chuẩn:** `ResultCode`, `Message`, `DocumentId`, `Status`, `RowVersion` và result set chi tiết nếu cần.

### 4.3. Transaction skeleton

```sql
CREATE OR ALTER PROCEDURE dbo.usp_MMS_UC14_ConcludeInspection
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
        -- 4. Kiểm tra state transition và các BR của UC14.
        -- 5. Ghi/cập nhật tbl_qc_kiem, vw_danhgia_vattu_qc, vw_ketqua_phieu_qc, vw_ketqua_vattu_qc theo nghiệp vụ.
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
| tbl_qc_kiem | X | X | X | - | Nguồn dữ liệu/chứng từ của use case |
| vw_danhgia_vattu_qc | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| vw_ketqua_phieu_qc | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| vw_ketqua_vattu_qc | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_chitiet_nhanhang | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |

### 5.2. Quan hệ dữ liệu trọng tâm

- Aggregate gốc: `tbl_qc_kiem`.
- Dữ liệu liên quan: `vw_danhgia_vattu_qc, vw_ketqua_phieu_qc, vw_ketqua_vattu_qc, tbl_chitiet_nhanhang`.
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
    actor User as Nhân viên QC
    participant UI as React UI
    participant API as Thin API
    participant SP as SQL Stored Procedure
    participant DB as MMS Database
    User->>UI: Khởi tạo thao tác Đánh giá vật tư QC
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
    A[Mở màn hình UC14] --> B[Tải context qua read SP]
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
    [*] --> NOT_EVALUATED
    NOT_EVALUATED --> PASS: SP xác nhận chuyển trạng thái
    PASS --> FAIL: SP xác nhận chuyển trạng thái
    FAIL --> CONDITIONAL_PASS: SP xác nhận chuyển trạng thái
    CONDITIONAL_PASS --> [*]
```

---

## 7. Acceptance Criteria và Test Scenarios

| ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| AC-UC14-01 | Luồng chính với dữ liệu hợp lệ | SP commit, trả SUCCESS và trạng thái đúng |
| AC-UC14-02 | Thiếu trường bắt buộc | INVALID_INPUT; không ghi dữ liệu |
| AC-UC14-03 | User không có quyền | HTTP 403; không lộ dữ liệu |
| AC-UC14-04 | Đối tượng không tồn tại | NOT_FOUND; UI tải lại danh sách |
| AC-UC14-05 | Sai trạng thái nghiệp vụ | INVALID_STATE; transaction rollback |
| AC-UC14-06 | Hai người cập nhật đồng thời | Một thành công, một conflict |
| AC-UC14-07 | Gửi lại cùng RequestId | Không tạo giao dịch trùng |
| AC-UC14-08 | Lỗi ở bước ghi cuối | Rollback toàn bộ bảng |
| AC-UC14-09 | Danh sách lớn | Paging/filter/sort tại SQL |
| AC-UC14-10 | Mobile viewport | Không tràn/đè UI |
| AC-UC14-11 | Audit | Đúng user, time, action, object |
| AC-UC14-12 | Kiểm tra sau commit | Header, lines, trạng thái nhất quán |

---

## 8. Traceability

| Thành phần | Nguồn/Đích |
|---|---|
| Use case | `UC14 - Đánh giá vật tư QC` |
| Power Apps screens | `scr_qc_danhgia_vattu,scr_qc_log_info_edit,scr_qc_log_phieu_kiem,scr_qc_log_phieu_nhanhang` |
| Power Fx operations | `ClearCollect, Collect, Flow.Run, Navigate, Patch` |
| Tables/Views | `tbl_qc_kiem,vw_danhgia_vattu_qc,vw_ketqua_phieu_qc,vw_ketqua_vattu_qc,tbl_chitiet_nhanhang` |
| Stored Procedures | `usp_MMS_UC14_GetInspectionItems,usp_MMS_UC14_SaveEvaluation,usp_MMS_UC14_ConcludeInspection` |
| React module | `Quality` |
| API base | `/api/v1/quality/uc14` |

## 9. Open Points trước khi lập trình

- Xác nhận DDL thật, khóa chính/ngoại, default và index trên SQL Server MMS.
- Chốt bảng trạng thái và mapping mã số hiện tại sang enum API.
- Chốt quyền chi tiết theo action: VIEW, CREATE, EDIT, APPROVE, CANCEL, PRINT, EXPORT.
- Chốt retention của audit, chứng từ và file đính kèm.
- Viết integration test trực tiếp cho từng SP command trước khi nối React.
