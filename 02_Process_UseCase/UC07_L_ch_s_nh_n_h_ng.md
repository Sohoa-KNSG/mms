# Phân tích Thiết kế Logic UC07 - Lịch sử nhận hàng

Tài liệu phân tích toàn diện **Business Logic**, **UI/UX Guidelines**, **Programming Logic**, **Data Logic** và **Diagrams** cho chức năng **Lịch sử nhận hàng** khi chuyển hệ thống Quản lý Kho Vật tư từ Power Apps sang React.

Nguyên tắc bắt buộc: React chỉ xử lý giao diện; backend là API host mỏng; mọi quy tắc nghiệp vụ, chuyển trạng thái và transaction nhiều bảng được thực thi trong SQL Stored Procedure.

---

## 1. Business Logic (Logic Nghiệp vụ)

### 1.1. Mục tiêu cốt lõi

Tra cứu lịch sử, trạng thái và chi tiết toàn bộ phiếu nhận hàng theo điều kiện nghiệp vụ.

### 1.2. Phạm vi và nguồn hiện hữu

| Màn hình | Nguồn | Datasource phát hiện trong YAML |
|---|---|---|
| scr_nhanhang_log | Kho vật tư .msapp | vw_chitiet_ddh_conlai, tbl_chitiet_nhanhang, tbl_phieu_nhan_hang, vw_distinctPO |
| scr_tam_nhanhang_log | Quản lý kho vật tư .msapp | tbl_phieu_nhan_hang_image, vw_chitiet_ddh_conlai, tbl_chitiet_nhanhang, tbl_phieu_nhan_hang, AzureBlobStorage, vw_distinctPO, tbl_dm_vattu, MMS_sql |

- Thao tác Power Fx phát hiện: **Collect, Flow.Run, Navigate, Patch, Remove**.
- Datasource tham chiếu thực tế: `AzureBlobStorage, MMS_sql, tbl_chitiet_nhanhang, tbl_dm_vattu, tbl_phieu_nhan_hang, tbl_phieu_nhan_hang_image, vw_chitiet_ddh_conlai, vw_distinctPO`.
- Nhãn giao diện tiêu biểu: `Trạng Thái`, `Thời Gian`, `Người Nhận`, `Nhà Cung Cấp`, `Mã PO`, `Phiếu`, `NHẬN HÀNG KHÔNG PO`, `Số Phiếu:`, `Tìm Phiếu Nhận Hàng`, `Mã PO:`, `Tìm Phiếu theo PO`, `Trạng thái`.

### 1.3. Actor

- Actor nghiệp vụ: Nhân viên nhận hàng, thủ kho, QC, quản lý.
- React Web Client trên PC hoặc mobile/PDA tùy màn hình.
- Backend API xác thực, phân quyền, validate hình thức và gọi SP.
- SQL Server MMS chịu trách nhiệm toàn bộ logic nghiệp vụ.

### 1.4. Tiền điều kiện

- Người dùng đã đăng nhập và có quyền `UC07`.
- Danh mục và chứng từ nguồn liên quan đang hoạt động.
- Dữ liệu đầu vào thuộc đúng kho/bộ phận mà người dùng được phép thao tác.
- Các Stored Procedure của use case đã được triển khai và version tương thích API.

### 1.5. Hậu điều kiện

- Khi thành công, dữ liệu và trạng thái được cập nhật atomic, có người thao tác và thời gian.
- API trả mã kết quả, thông báo và dữ liệu mới nhất do SP xác nhận.
- Khi thất bại, SP rollback toàn bộ phần ghi và không để dữ liệu trung gian dở dang.
- React refresh dữ liệu từ response/read SP; không tự giả lập trạng thái thành công.

### 1.6. Business Rules

- **`[BR-UC07-01]`** Mặc định giới hạn khoảng ngày.
- **`[BR-UC07-02]`** Phân trang thực hiện tại SQL.
- **`[BR-UC07-03]`** Chỉ đọc dữ liệu thuộc phạm vi quyền.
- **`[BR-UC07-04]`** Trạng thái lấy từ view chuẩn.
- **`[BR-UC07-05]`** Không sửa dữ liệu từ màn hình lịch sử.
- **`[BR-UC07-06]`** Xuất dữ liệu phải ghi audit.

- **`[BR-UC07-07]`** User thao tác lấy từ token; SP kiểm tra lại quyền và phạm vi dữ liệu.
- **`[BR-UC07-08]`** Mọi command phải hỗ trợ `RequestId` để chống gửi lặp.
- **`[BR-UC07-09]`** Không dùng SQL động do client truyền và không cho backend cập nhật bảng trực tiếp.

### 1.7. Luồng chính

| Bước | Thao tác | React/API | SQL Stored Procedure |
|---|---|---|---|
| 1 | Nhập bộ lọc thời gian/trạng thái | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 2 | Tìm phiếu nhận | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 3 | Xem trạng thái tổng hợp | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 4 | Mở chi tiết vật tư | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 5 | Xem chứng từ đính kèm | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |
| 6 | Xuất/in dữ liệu nếu có quyền | Hiển thị/thu thập dữ liệu và gọi API | Đọc, kiểm tra rule hoặc ghi dữ liệu trong SP |

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
| ALL | Trạng thái nghiệp vụ ALL của lịch sử nhận hàng | Theo state machine và quyền của SP |
| DRAFT | Trạng thái nghiệp vụ DRAFT của lịch sử nhận hàng | Theo state machine và quyền của SP |
| QC_PENDING | Trạng thái nghiệp vụ QC_PENDING của lịch sử nhận hàng | Theo state machine và quyền của SP |
| WAREHOUSED | Trạng thái nghiệp vụ WAREHOUSED của lịch sử nhận hàng | Theo state machine và quyền của SP |
| CANCELLED | Trạng thái nghiệp vụ CANCELLED của lịch sử nhận hàng | Theo state machine và quyền của SP |

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
export interface L_ch_s__nh_n_h_ngCommand {
  requestId: string;
  action: string;
  documentId?: number | string;
  warehouseCode?: string;
  payload: Record<string, unknown>;
}

export interface L_ch_s__nh_n_h_ngResult {
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
| `GET` | `/api/v1/receiving/uc07` | Danh sách có filter và phân trang |
| `GET` | `/api/v1/receiving/uc07/{id}` | Chi tiết chứng từ/đối tượng |
| - | Không có command endpoint | Use case chỉ đọc; export audit dùng endpoint dùng chung |

### 3.4. Backend handler mỏng

```csharp
[HttpGet]
public async Task<IActionResult> Search([FromQuery] SearchL_ch_s__nh_n_h_ngRequest request)
{
    var result = await _sp.QueryAsync<dynamic>(
        "usp_MMS_UC07_GetReceiptDetail",
        new { request.Keyword, request.FromDate, request.ToDate,
              UserName = _currentUser.UserName });
    return Ok(result);
}
```

Handler không được `INSERT/UPDATE` trực tiếp và không quyết định trạng thái tiếp theo.

---

## 4. SQL Stored Procedure Design

### 4.1. Danh mục SP

| Stored Procedure | Vai trò | Transaction |
|---|---|---|
| usp_MMS_UC07_SearchReceiptHistory | Read/query | Read-only |
| usp_MMS_UC07_GetReceiptDetail | Read/query | Read-only |

### 4.2. Read SP contract

**Input chuẩn:** bộ lọc, khoảng thời gian, phân trang và `@UserName` để giới hạn phạm vi. **Output chuẩn:** `TotalRows` và page dữ liệu đã sort ổn định.

### 4.3. Read-only query skeleton

```sql
CREATE OR ALTER PROCEDURE dbo.usp_MMS_UC07_GetReceiptDetail
    @Keyword NVARCHAR(100) = NULL,
    @FromDate DATETIME2(0) = NULL,
    @ToDate DATETIME2(0) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @UserName NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    -- 1. Kiểm tra quyền và phạm vi kho của @UserName.
    -- 2. Chuẩn hóa khoảng ngày, PageNumber và PageSize.
    -- 3. Đọc tbl_phieu_nhan_hang, tbl_chitiet_nhanhang, vw_status_phieu_nhanhang, vw_phieu_nhanhang_nhapkho với filter có tham số.
    -- 4. Trả TotalRows và page dữ liệu; không thay đổi nghiệp vụ.
END;
GO
```

Skeleton thể hiện ranh giới kiến trúc, không thay thế đặc tả cột chi tiết của từng SP khi triển khai.

### 4.4. Concurrency và idempotency

- Read SP chạy nhất quán theo mốc thời gian và luôn có sort ổn định trước phân trang.
- Không dùng `NOLOCK` nếu báo cáo cần số liệu đối soát tại cùng một thời điểm.
- Giới hạn `PageSize`, khoảng ngày và thời gian thực thi; export lớn chạy theo job có audit.
- Filter luôn truyền bằng tham số, không nhận biểu thức SQL từ client.

---

## 5. Data Logic

### 5.1. Ma trận CRUD

| Đối tượng | C | R | U | D | Vai trò |
|---|---|---|---|---|---|
| tbl_phieu_nhan_hang | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_chitiet_nhanhang | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| vw_status_phieu_nhanhang | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| vw_phieu_nhanhang_nhapkho | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |
| tbl_phieu_nhan_hang_image | - | X | - | - | Nguồn dữ liệu/chứng từ của use case |

### 5.2. Quan hệ dữ liệu trọng tâm

- Aggregate gốc: `tbl_phieu_nhan_hang`.
- Dữ liệu liên quan: `tbl_chitiet_nhanhang, vw_status_phieu_nhanhang, vw_phieu_nhanhang_nhapkho, tbl_phieu_nhan_hang_image`.
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
    actor User as Nhân viên nhận hàng
    participant UI as React UI
    participant API as Thin API
    participant SP as Read Stored Procedure
    participant DB as MMS Database
    User->>UI: Nhập bộ lọc Lịch sử nhận hàng
    UI->>API: GET list/detail + paging
    API->>SP: EXEC usp_MMS_UC07_GetReceiptDetail
    SP->>DB: Kiểm tra phạm vi và truy vấn có tham số
    DB-->>SP: Page dữ liệu + tổng số dòng
    SP-->>API: Result set chuẩn
    API-->>UI: HTTP 200
    UI-->>User: Hiển thị, drill-down hoặc export có quyền
```

### 6.2. Activity Flow

```mermaid
flowchart TD
    A[Mở màn hình UC07] --> B[Nhập bộ lọc]
    B --> C{Bộ lọc hợp lệ?}
    C -- Không --> D[Hiển thị lỗi điều kiện]
    C -- Có --> E[API gọi read SP]
    E --> F[SP kiểm tra quyền và phạm vi]
    F --> G[Truy vấn có filter, sort, paging]
    G --> H[Trả TotalRows và page dữ liệu]
    H --> I[React hiển thị hoặc drill-down]
```

### 6.3. State Diagram

```mermaid
stateDiagram-v2
    [*] --> ALL
    ALL --> DRAFT: SP xác nhận chuyển trạng thái
    DRAFT --> QC_PENDING: SP xác nhận chuyển trạng thái
    QC_PENDING --> WAREHOUSED: SP xác nhận chuyển trạng thái
    WAREHOUSED --> CANCELLED: SP xác nhận chuyển trạng thái
    CANCELLED --> [*]
```

---

## 7. Acceptance Criteria và Test Scenarios

| ID | Kịch bản | Kết quả mong đợi |
|---|---|---|
| AC-UC07-01 | Bộ lọc hợp lệ | Trả đúng page dữ liệu và TotalRows |
| AC-UC07-02 | Khoảng ngày không hợp lệ | INVALID_INPUT; không chạy truy vấn lớn |
| AC-UC07-03 | User không có quyền | HTTP 403; không lộ dữ liệu |
| AC-UC07-04 | Không có kết quả | Danh sách rỗng hợp lệ, không phải lỗi hệ thống |
| AC-UC07-05 | Chuyển trang | Không trùng/thiếu dòng nhờ sort ổn định |
| AC-UC07-06 | Filter kết hợp | Kết quả đúng mọi điều kiện |
| AC-UC07-07 | PageSize vượt giới hạn | SP giới hạn hoặc từ chối |
| AC-UC07-08 | Drill-down chứng từ | Chi tiết khớp dòng tổng hợp |
| AC-UC07-09 | Export | Cùng dữ liệu/quyền với màn hình và có audit |
| AC-UC07-10 | Truy vấn đồng thời | Không khóa ghi kéo dài bất thường |
| AC-UC07-11 | Mobile viewport | Bảng chuyển layout, không tràn UI |
| AC-UC07-12 | SQL timeout | API trả lỗi chuẩn và correlation id |

---

## 8. Traceability

| Thành phần | Nguồn/Đích |
|---|---|
| Use case | `UC07 - Lịch sử nhận hàng` |
| Power Apps screens | `scr_nhanhang_log,scr_tam_nhanhang_log` |
| Power Fx operations | `Collect, Flow.Run, Navigate, Patch, Remove` |
| Tables/Views | `tbl_phieu_nhan_hang,tbl_chitiet_nhanhang,vw_status_phieu_nhanhang,vw_phieu_nhanhang_nhapkho,tbl_phieu_nhan_hang_image` |
| Stored Procedures | `usp_MMS_UC07_SearchReceiptHistory,usp_MMS_UC07_GetReceiptDetail` |
| React module | `Receiving` |
| API base | `/api/v1/receiving/uc07` |

## 9. Open Points trước khi lập trình

- Xác nhận DDL thật, khóa chính/ngoại, default và index trên SQL Server MMS.
- Chốt bảng trạng thái và mapping mã số hiện tại sang enum API.
- Chốt quyền chi tiết theo action: VIEW, CREATE, EDIT, APPROVE, CANCEL, PRINT, EXPORT.
- Chốt retention của audit, chứng từ và file đính kèm.
- Viết integration test trực tiếp cho từng SP command trước khi nối React.
