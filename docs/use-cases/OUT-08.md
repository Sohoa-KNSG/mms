---
title: "Đặc tả OUT-08 - Xuất kho trực tiếp/thủ tục xuất"
use_case_id: "OUT-08"
version: "1.0"
date: "2026-08-13"
status: "Đặc tả theo hồ sơ và contract mã nguồn hiện tại"
format: "Markdown - nguồn giao tiếp chuẩn"
---

# OUT-08 – Xuất kho trực tiếp/thủ tục xuất

> Tài liệu thuộc bộ đặc tả 42 use case MMS. Nguồn sự thật gồm hồ sơ tổng thể, React route, .NET endpoint và SQL contract versioned trong workspace.

## Thông tin kiểm soát

| Thuộc tính | Giá trị |
| --- | --- |
| Module | Đề nghị & xuất kho |
| Wave | W6 |
| Tác nhân | Thủ kho |
| Loại xử lý | Query + Command |
| Route React | `/outbound/picking`, `/outbound/issue-documents` |
| Màn hình quyền | `scr_xuatkho_tructiep`, `scr_xuatkho_thutuc` |
| Trạng thái | Contract đã có trong workspace; triển khai/UAT theo checklist chung |

---

## 1. Business Logic (Logic nghiệp vụ)

### 1.1. Mục tiêu

Ghi giảm tồn và hoàn tất giao dịch xuất.

### 1.2. Điều kiện trước và sau

| Loại | Nội dung |
| --- | --- |
| Điều kiện trước | Phiếu đủ điều kiện hoặc có quyền xuất trực tiếp. |
| Thành công | Hoàn tất đúng luồng 'OUT-08', trả dữ liệu/kết quả contract và ghi audit khi có command. |
| Thất bại | Không để dữ liệu dở dang; trả lỗi nghiệp vụ hoặc 'traceId'. |

### 1.3. Luồng chính

1. Kiểm tra chi tiết.
2. xác nhận xuất.
3. tạo transaction.
4. cập nhật tồn và trạng thái phiếu..

### 1.4. Ngoại lệ và kiểm soát

Bất nhất tồn: rollback và báo lỗi.

### 1.5. Business Rules

| Mã | Quy tắc |
| --- | --- |
| BR-OUT-08-01 | User phải có phiên xác thực và quyền màn hình tương ứng. |
| BR-OUT-08-02 | Dữ liệu bắt buộc phải được trim và kiểm tra tại API lẫn stored procedure. |
| BR-OUT-08-03 | Không tin 'UserId', trạng thái hoặc giá trị suy diễn do client tự gửi. |
| BR-OUT-08-04 | Stored procedure là nơi thực thi logic nghiệp vụ và phân quyền dữ liệu. |
| BR-OUT-08-05 | Command phải nguyên tử, rollback khi bất kỳ bước nào lỗi. |
| BR-OUT-08-06 | Giữ nguyên cấu trúc bảng và mã trạng thái legacy. |
| BR-OUT-08-07 | Lỗi nghiệp vụ phải dùng mã ổn định; lỗi ngoài dự kiến phải có 'traceId'. |
| BR-OUT-08-08 | React không truy cập bảng SQL trực tiếp. |

### 1.6. Ranh giới trách nhiệm

| Lớp | Trách nhiệm |
| --- | --- |
| React | Hiển thị, nhập liệu, validation trải nghiệm và trạng thái request |
| .NET API | Xác thực, contract HTTP, user claim, gọi SP và ánh xạ lỗi |
| SQL SP | Quyền, business rule, concurrency, transaction và dữ liệu |
| Legacy tables | Lưu dữ liệu/trạng thái vật lý hiện hành |

---

## 2. UI/UX Guidelines

### 2.1. Bố cục

- Header hiển thị mã 'OUT-08' và tên “Xuất kho trực tiếp/thủ tục xuất”.
- Khu vực lọc/tìm kiếm hoặc form dữ liệu theo luồng nghiệp vụ.
- Vùng kết quả dạng bảng/chi tiết, có loading, empty, error và success state.
- Command quan trọng phải có xác nhận và khóa nút trong lúc gửi.

### 2.2. Trạng thái giao diện

| Trạng thái | Yêu cầu |
| --- | --- |
| Loading | Không hiển thị dữ liệu cũ như kết quả mới |
| Empty | Giải thích không có dữ liệu phù hợp |
| Validation | Gắn lỗi với đúng trường/dòng |
| Submitting | Chặn submit lặp; không tự retry command |
| Success | Hiển thị mã đối tượng, trạng thái và bước tiếp theo |
| Error | Thông báo thân thiện, nút thử lại và 'traceId' nếu có |

### 2.3. Accessibility

- Label rõ ràng cho input/select và nút chỉ có biểu tượng.
- Thao tác được bằng bàn phím; focus tới lỗi đầu tiên.
- Không dùng màu làm tín hiệu duy nhất.
- Thông báo dùng vùng 'aria-live'.

---

## 3. Programming Logic

### 3.1. React và route

| Screen | Route |
| --- | --- |
| scr_xuatkho_tructiep | /outbound/picking |
| scr_xuatkho_thutuc | /outbound/issue-documents |

### 3.2. .NET endpoint contract

| Endpoint name | Vai trò |
| --- | --- |
| `OUT-08_CompleteGoodsIssue` | .NET endpoint đã định danh |

Nguồn endpoint: apps/api/Modules/OutboundPicking/OutboundPickingEndpoints.cs.

### 3.3. Stored procedure contract

| Stored procedure | File nguồn |
| --- | --- |
| `api.usp_WMS_OUT08_CompleteGoodsIssue_v1` | `database/stored-procedures/w6/api.usp_WMS_OUT08_CompleteGoodsIssue_v1.sql` |

**api.usp_WMS_OUT08_CompleteGoodsIssue_v1**

~~~sql
api.usp_WMS_OUT08_CompleteGoodsIssue_v1 @UserId nvarchar(50), @RequestId int
~~~

### 3.4. Error contract

| SQL number | HTTP | Ý nghĩa |
| --- | --- | --- |
| 51001 | 403 | Khong co quyen xac nhan xuat kho. |
| 51009 | 409 | Phieu khong o trang thai dang soan. |
| 51009 | 409 | Khong tim thay phieu xuat dang hoat dong. |
| 51022 | 422 | Phieu yeu cau khong co dong vat tu. |
| 51022 | 422 | Chua soan du so luong cua tat ca dong vat tu. |
| Khác | 500 | Lỗi hệ thống; không lộ chi tiết nhạy cảm, bắt buộc có 'traceId' |

### 3.5. Concurrency và idempotency

- Command phải chạy trong transaction với XACT_ABORT ON.
- Cập nhật trạng thái cần expected state/time hoặc khóa phù hợp.
- Client không tự retry POST/PUT khi chưa có idempotency key.
- Retry không được tạo giao dịch trùng.

---

## 4. Data Logic

### 4.1. Ma trận dữ liệu

| Object | Vai trò | Truy cập qua |
| --- | --- | --- |
| `tbl_transaction, tbl_batch_inv` | Dữ liệu nghiệp vụ legacy | SP |
| `sp_insert_xuatkho` | Dữ liệu nghiệp vụ legacy | SP |
| `api.vw_SEC_UserScreenAccess_v1` | Contract API/view/type | SP |
| `dbo.tbl_phieu_yeucau` | Dữ liệu nghiệp vụ legacy | SP |
| `dbo.tbl_phieu_transaction` | Dữ liệu nghiệp vụ legacy | SP |
| `dbo.tbl_phieu_yeucau_chitiet` | Dữ liệu nghiệp vụ legacy | SP |
| `dbo.tbl_map_xuatkho` | Dữ liệu nghiệp vụ legacy | SP |
| `dbo.tbl_transaction` | Dữ liệu nghiệp vụ legacy | SP |

### 4.2. Nguyên tắc dữ liệu

- Không thay đổi 59 bảng legacy hoặc mã trạng thái hiện hữu trong use case này.
- Mọi truy cập từ ứng dụng đi qua schema 'api' và stored procedure versioned.
- User/audit lấy từ phiên xác thực.
- Tất cả ghi nghiệp vụ liên quan phải cùng commit hoặc cùng rollback.

### 4.3. State model

~~~text
[Chưa đủ điều kiện]
        |
        | kiểm tra quyền + business rules
        v
[Sẵn sàng xử lý OUT-08]
        |
        | command SP
        v
[Kết quả hợp lệ / trạng thái legacy được giữ nguyên]
~~~

---

## 5. Biểu đồ thiết kế

### 5.1. Sequence Diagram

~~~mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React OUT-08
    participant API as .NET API
    participant SP as SQL Contract
    participant DB as MMS Legacy Tables
    User->>UI: Thực hiện Xuất kho trực tiếp/thủ tục xuất
    UI->>API: Request đã validate sơ bộ
    API->>SP: UserId + contract input
    SP->>DB: Kiểm tra quyền và business rules
    alt Hợp lệ
        SP->>DB: Transaction/query nghiệp vụ
        DB-->>SP: Kết quả
        SP-->>API: Result set ổn định
        API-->>UI: 2xx
        UI-->>User: Hiển thị kết quả
    else Không hợp lệ
        SP-->>API: THROW 510xx
        API-->>UI: Problem Details
        UI-->>User: Thông báo + traceId
    end
~~~

### 5.2. Business Flow

~~~mermaid
flowchart TD
    S0["Kiểm tra chi tiết"]
    S1["xác nhận xuất"]
    S2["tạo transaction"]
    S3["cập nhật tồn và trạng thái phiếu."]
    S0 --> S1
    S1 --> S2
    S2 --> S3
    S3 --> V{"Hợp lệ?"}
    V -- Có --> OK["Hoàn tất OUT-08"]
    V -- Không --> ERR["Từ chối và trả lỗi có kiểm soát"]
~~~

### 5.3. Architecture Flow

~~~mermaid
flowchart LR
    UI["React route"] --> API[".NET endpoint"]
    API --> SP["api.usp_* versioned"]
    SP --> ACCESS["User screen access"]
    SP --> DATA["Legacy tables/views"]
    DATA --> SP --> API --> UI
~~~

---

## 6. Acceptance Criteria và UAT

| Mã | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| AC-OUT-08-01 | User có quyền mở use case | Màn hình và dữ liệu đúng phạm vi được hiển thị |
| AC-OUT-08-02 | User không có quyền | HTTP 403, không lộ dữ liệu |
| AC-OUT-08-03 | Dữ liệu hợp lệ | Hoàn tất đúng luồng chính |
| AC-OUT-08-04 | Thiếu dữ liệu bắt buộc | HTTP 400/422, chỉ rõ lỗi |
| AC-OUT-08-05 | Đối tượng không tồn tại | HTTP 404, không ghi dở dang |
| AC-OUT-08-06 | Dữ liệu đã thay đổi đồng thời | HTTP 409 hoặc kết quả nhất quán |
| AC-OUT-08-07 | Lỗi hệ thống | HTTP 500 với 'traceId' |
| AC-OUT-08-08 | Kiểm tra audit | User, thời gian và hành động đúng contract |
| AC-OUT-08-09 | Kiểm tra phân quyền dữ liệu | Không thấy dữ liệu ngoài phạm vi |
| AC-OUT-08-10 | Kiểm tra Power Apps dự phòng | Bảng và trạng thái legacy vẫn tương thích |

---

## 7. Cutover và dự phòng Power Apps

- React là giao diện chính sau cutover use case.
- Power Apps chỉ dùng dự phòng, không ghi đồng thời cùng use case React.
- Rollback bằng feature flag/route; không đảo ngược giao dịch đã commit.
- Trước khi bật Power Apps, dừng command React đang chạy và đối soát giao dịch cuối.

---

## 8. Traceability

| Nguồn | Tham chiếu |
| --- | --- |
| Hồ sơ nghiệp vụ | 'HO_SO_TONG_THE_UNG_DUNG_MMS.md' – OUT-08 |
| Route registry | 'apps/web/src/app/routeRegistry.ts' |
| API source | apps/api/Modules/OutboundPicking/OutboundPickingEndpoints.cs |
| SQL source | database/stored-procedures/w6/api.usp_WMS_OUT08_CompleteGoodsIssue_v1.sql |
| UAT chung | 'UAT_CUTOVER_CHECKLIST_MMS.md' |
| Kế hoạch | 'KE_HOACH_CHUYEN_DOI_POWER_APPS_SANG_REACT_MMS.md' |

---

## 9. Definition of Done

- [ ] React/API/SQL contract khớp kiểu dữ liệu và trường kết quả.
- [ ] Quyền màn hình và quyền dữ liệu được kiểm thử.
- [ ] AC-01 đến AC-10 đạt trên UAT.
- [ ] Không có lỗi 500 do thiếu hoặc sai object SQL.
- [ ] Audit và 'traceId' hoạt động.
- [ ] Đối soát xác nhận không thay đổi ngoài phạm vi use case.
- [ ] Nghiệp vụ và IT vận hành phê duyệt.
