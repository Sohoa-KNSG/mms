# Tiến độ xây dựng MMS React theo use case

Cập nhật: 12/08/2026

## Nguyên tắc đã chốt

- React là ứng dụng vận hành chính; Power Apps chỉ là phương án dự phòng và không chạy ghi dữ liệu song song.
- Giữ nguyên toàn bộ cấu trúc bảng và mã trạng thái hiện tại.
- Tạo mới contract SQL có version trong schema `api`; không sửa hoặc thay thế object legacy tại chỗ.
- API ASP.NET Core là lớp mỏng: xác thực, ánh xạ HTTP và gọi stored procedure. Business rule, transaction, concurrency và chuyển trạng thái sẽ nằm trong stored procedure.
- Không lưu server, user, password SQL hoặc token trong source code.

## Trạng thái theo wave

| Wave | Use case | Trạng thái mã nguồn | Điều kiện nghiệm thu còn lại |
|---|---|---|---|
| Foundation | React shell, API mỏng, SQL contract, test harness | Đã build | Cấu hình môi trường triển khai |
| W0 | AUTH-01, AUTH-02 | Đã deploy database DEV MMS | Smoke test đạt với user `00`; còn cấu hình IdP/JWT và UAT phân quyền |
| W1 | INB-04, INV-01, INV-02, INV-03, LOC-01, ADM-03 | Đã triển khai code | Review execution plan, deploy SQL, đối soát số liệu và UAT |
| W2 | ADM-01, ADM-02, QC-01 đến QC-06 | Đã triển khai code | Deploy SQL, UAT quyền quản trị và toàn bộ trạng thái QC |
| W3 | INB-01, INB-02, INB-03, INB-05 đến INB-08 | Đã triển khai code | Deploy SQL, UAT nhận hàng/nhập kho và đối soát batch |
| W4 | INV-04 đến INV-07, LOC-02 đến LOC-04 | Đã triển khai code | Deploy SQL, UAT concurrency và cân bằng transaction/batch |
| W5 | OUT-01 đến OUT-05 | Đã triển khai code | Deploy SQL, UAT định mức, sửa phiếu và phê duyệt nhiều bước |
| W6 | OUT-06 đến OUT-09 | Đã triển khai code | Deploy SQL, UAT soạn FIFO, concurrency batch, đóng và in phiếu xuất |
| W7 | RET-01 đến RET-03 | Đã triển khai code | Deploy SQL, UAT ba kết quả trả nội bộ, batch/transaction và tách batch |

Tổng hiện tại: **42/42 use case đã hoàn thành mã nguồn**. W0 đã được triển khai vào database MMS ngày 12/08/2026; W1–W7 vẫn staged, chưa triển khai.

## Bằng chứng kiểm tra hiện tại

- `.NET SDK 10.0.302`.
- API: `dotnet build` đạt 0 warning, 0 error.
- API runtime: `/health` trả `HTTP 200 Healthy`.
- Frontend: TypeScript type-check đạt.
- Frontend: ESLint đạt với `--max-warnings=0`.
- Frontend: Vitest 2 file, 4 test đều đạt.
- Frontend: Vite production build thành công, 236 module được chuyển đổi.
- W5: API build đạt 0 warning, 0 error; frontend type-check, ESLint, 4/4 test và production build đều đạt.
- W5 SQL: 12 stored procedure mới, 1 table type và smoke test contract; không dùng SQL động và không sửa bảng legacy.
- W6: 8 stored procedure, API .NET mỏng và 4 màn hình use case; type-check, lint, 4/4 test và production build đều đạt.
- W7: 8 stored procedure, 1 table type, API .NET mỏng và 3 màn hình use case; type-check, lint, 4/4 test và production build đều đạt.
- Toàn bộ API sau W7: `dotnet build` đạt 0 warning, 0 error.
- W0 live smoke: schema/view AUTH và hai SP đã deploy; `/api/v1/session` và `/api/v1/navigation` đều trả HTTP 200 với user DEV `00`.

## Contract đã tạo

### W0

- `api.usp_SEC_AUTH01_GetUserContext_v1`
- `api.usp_SEC_AUTH02_GetNavigation_v1`

### W1

- `api.usp_WMS_INB04_GetReceiptLog_v1`
- `api.usp_WMS_INV01_GetInventoryBalance_v1`
- `api.usp_WMS_INV02_GetBatchHistory_v1`
- `api.usp_WMS_INV03_GetMaterialHistory_v1`
- `api.usp_WMS_LOC01_GetLocationMap_v1`
- `api.usp_WMS_ADM03_GetOperationsSummary_v1`

### W2–W4

- W2: 16 contract quản trị/QC và các table type cho quyền, tiêu chí, đánh giá.
- W3: 16 contract nhận hàng, gắn PO, nhập kho, in tem batch và 4 table type.
- W4: 14 contract tồn kho/vị trí và 2 table type; ghi thay đổi bằng transaction có kiểm tra dữ liệu kỳ vọng.

### W5

- OUT-01: danh mục định mức và trình phiếu `trong`; SP khóa dòng định mức và tính cả lượng đang được giữ bởi phiếu chưa bị hủy/từ chối.
- OUT-02: danh mục vật tư và trình phiếu `ngoai`.
- OUT-03: danh mục định mức và trình phiếu `vuot` theo flow riêng.
- OUT-04: đọc/sửa phiếu atomically, kiểm tra `ExpectedChangedAt`, cấm sửa sau quyết định duyệt hoặc khi đã soạn hàng.
- OUT-05: hàng đợi theo dõi, duyệt nhiều bước, từ chối và hủy phiếu.
- Giữ nguyên mã legacy: `trang_thai_phieu` 0/1/4; `status_soanhang` 0/1/2; quyết định `approve`/`reject`; phân loại `trong`/`ngoai`/`vuot`.
- Script staged: `database/deploy-w5.sql`; kiểm tra object: `database/tests/w5_contract_smoke.sql`.

### W6

- OUT-06: hàng đợi chỉ nhận phiếu đã duyệt trạng thái `4`; bắt đầu soạn chuyển `status_soanhang` 0 → 1 và tạo/dùng lại phiếu `OUT_CON`.
- OUT-07: chọn batch FIFO; SP khóa phiếu, dòng yêu cầu và batch, kiểm tra tồn/vị trí kỳ vọng, không cho xuất vượt nhu cầu.
- OUT-08: chỉ đóng phiếu khi tất cả dòng đã soạn đủ; cập nhật yêu cầu và phiếu xuất về trạng thái hoàn thành `2` trong cùng transaction.
- OUT-09: danh sách và bản in phiếu xuất lấy từ dữ liệu yêu cầu, transaction và mapping batch.
- Script staged: `database/deploy-w6.sql`; kiểm tra object: `database/tests/w6_contract_smoke.sql`.

### W7

- RET-01: tạo header và các dòng trả nội bộ nguyên tử; giữ phân loại chất lượng `1/2` và trạng thái chờ kho `1`.
- RET-02: giữ ba kết quả hiện hành `1` đạt, `2` không đạt, `3` từ chối; thay cursor legacy bằng `MERGE`/insert set-based trong một transaction; kết quả nhập kho về trạng thái `4`.
- RET-03: chỉ tách batch thuộc chứng từ nhập trả `IN_PROD`, kiểm tra expected quantity và cân bằng transaction trước/sau thao tác.
- Script staged: `database/deploy-w7.sql`; kiểm tra object: `database/tests/w7_contract_smoke.sql`.

## Cổng nghiệm thu trên database MMS

1. DBA review từng script `database/deploy-w*.sql` và execution plan trên bản sao dữ liệu gần sản xuất.
2. Chạy script bằng `sqlcmd` mode trong đúng database `MMS`; script tự dừng nếu chọn nhầm database.
3. Gán service identity vào role `mms_api_runtime`, không dùng tài khoản cá nhân trong connection string ứng dụng.
4. Chạy smoke test tương ứng từng wave với user UAT có mapping role/screen thực tế.
5. Đối soát INV-01 và ADM-03 với báo cáo Power Apps hiện tại; mọi sai lệch phải có nguyên nhân và biên bản.
6. Chỉ mở W6 sau khi W4 và W5 đạt UAT; Power Apps giữ ở chế độ dự phòng, không ghi song song với React.
7. Chạy `database/parse-w5.sql`, `parse-w6.sql`, `parse-w7.sql` và toàn bộ smoke test trên bản sao MMS trước UAT. Lượt kiểm tra SQL live cuối chưa được chạy vì chưa có phê duyệt kết nối lại.
