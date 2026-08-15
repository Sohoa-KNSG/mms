# MMS Modernization

Ứng dụng thay thế Power Apps theo kế hoạch quản lý bằng 42 use case.

## Kiến trúc

```text
React + TypeScript → ASP.NET Core API mỏng → api.* Stored Procedures → MMS tables
```

- React không truy cập SQL trực tiếp.
- API không chứa business rule và không DML bảng nghiệp vụ.
- Business validation, state transition, transaction và concurrency nằm trong stored procedure.
- 59 bảng cùng toàn bộ mã trạng thái hiện tại được giữ nguyên.
- Power Apps chỉ là kênh dự phòng và không hoạt động đồng thời với React cho cùng use case/cohort.

## Yêu cầu công cụ

- Node.js 22+
- pnpm 10+
- .NET 10 SDK LTS
- SQL Server 2022 hoặc môi trường tương thích với database MMS

## Khởi động frontend

```powershell
pnpm install
pnpm dev
```

## Khởi động API

```powershell
$env:ConnectionStrings__Mms="Server=<server>;Database=MMS;Integrated Security=true;TrustServerCertificate=true"
$env:Authentication__DevelopmentUser="<user>"
dotnet run --project apps/api/Mms.Api.csproj
```

Không lưu connection string, mật khẩu hoặc token trong repository.

## Trạng thái triển khai

- Foundation: đã build và smoke test.
- W0: AUTH-01/AUTH-02 đã deploy vào database DEV MMS và smoke test đạt; còn IdP/JWT và UAT.
- W1: SQL/API/UI read contracts đã hoàn thành code, chờ deploy SQL, đối soát và UAT.
- W2: ADM-01/02 và QC-01 đến QC-06 đã hoàn thành code, chờ deploy/UAT.
- W3: INB-01/02/03/05/06/07/08 đã hoàn thành code, chờ deploy/UAT.
- W4: INV-04 đến INV-07 và LOC-02 đến LOC-04 đã hoàn thành code, chờ deploy/UAT.
- W5: OUT-01 đến OUT-05 đã hoàn thành SQL/API/React, chờ deploy/UAT.
- W6: OUT-06 đến OUT-09 đã hoàn thành SQL/API/React, chờ deploy/UAT.
- W7: RET-01 đến RET-03 đã hoàn thành SQL/API/React, chờ deploy/UAT.
- Tổng: 42/42 use case đã hoàn thành mã nguồn; W0 đã deploy, W1–W7 chưa triển khai vào database MMS thật.

Theo dõi phạm vi đầy đủ tại [kế hoạch chuyển đổi](KE_HOACH_CHUYEN_DOI_POWER_APPS_SANG_REACT_MMS.md).
Theo dõi bằng chứng build và trạng thái từng wave tại [tiến độ use case](TIEN_DO_XAY_DUNG_THEO_USE_CASE.md).
Thực hiện ký nhận tại [checklist UAT và cutover 42 use case](UAT_CUTOVER_CHECKLIST_MMS.md).
