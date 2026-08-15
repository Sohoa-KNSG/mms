import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'docs', 'use-cases');
fs.mkdirSync(outDir, { recursive: true });

const dossier = fs.readFileSync(path.join(root, 'HO_SO_TONG_THE_UNG_DUNG_MMS.md'), 'utf8');
const routeSource = fs.readFileSync(path.join(root, 'apps', 'web', 'src', 'app', 'routeRegistry.ts'), 'utf8');
const ids = [...dossier.matchAll(/^#### ((?:AUTH|INB|QC|INV|LOC|OUT|RET|ADM)-\d{2})\s+\|\s+(.+)$/gm)]
  .map((match) => ({ id: match[1], title: match[2].trim(), index: match.index }));

const walk = (dir, extension) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
  const full = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(full, extension) : entry.name.endsWith(extension) ? [full] : [];
});
const sqlFiles = walk(path.join(root, 'database', 'stored-procedures'), '.sql');
const csFiles = walk(path.join(root, 'apps', 'api', 'Modules'), '.cs');

const rel = (file) => path.relative(root, file).replaceAll('\\', '/');
const clean = (value = '') => value.trim().replace(/\s+/g, ' ');
const field = (block, label) => clean(block.match(new RegExp(`^${label}:\\s*(.+)$`, 'mi'))?.[1]);
const list = (value) => value ? value.split(/;\s*/).map(clean).filter(Boolean) : [];
const esc = (value) => value.replaceAll('|', '\\|');

function routeMap() {
  const result = new Map();
  const entryRegex = /^\s*([a-zA-Z0-9_]+):\s*\[(.*?)\],?\s*$/gms;
  for (const match of routeSource.matchAll(entryRegex)) {
    const routes = [...match[2].matchAll(/route\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g)]
      .map((item) => ({ path: item[1], label: item[2], id: item[3] }));
    if (routes.length) result.set(match[1], routes);
  }
  for (const match of routeSource.matchAll(/^\s*([a-zA-Z0-9_]+):\s*\[route\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)\],?$/gm)) {
    result.set(match[1], [{ path: match[2], label: match[3], id: match[4] }]);
  }
  return result;
}
const routes = routeMap();

function blockFor(item, next) {
  return dossier.slice(item.index, next?.index ?? dossier.length);
}

function proceduresFor(id) {
  const compact = id.replace('-', '');
  return sqlFiles.filter((file) => path.basename(file).toUpperCase().includes(`_${compact}_`));
}

function procedureFacts(files) {
  const facts = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const name = text.match(/CREATE OR ALTER PROCEDURE\s+([^\s]+)/i)?.[1] ?? path.basename(file, '.sql');
    const signature = clean(text.match(/CREATE OR ALTER PROCEDURE[\s\S]*?\nAS\s*\nBEGIN/i)?.[0]
      ?.replace(/CREATE OR ALTER PROCEDURE\s+/i, '').replace(/\s+AS\s+BEGIN$/i, ''));
    const objects = [...new Set([...text.matchAll(/\b(?:dbo|api)\.([A-Za-z0-9_]+)/g)].map((match) => `${match[0].startsWith('api.') ? 'api' : 'dbo'}.${match[1]}`))]
      .filter((object) => object !== name);
    const errors = [...new Set([...text.matchAll(/THROW\s+(510\d+),\s*N'([^']+)'/g)].map((match) => `${match[1]} — ${match[2]}`))];
    facts.push({ file, name, signature, objects, errors });
  }
  return facts;
}

function endpointsFor(id) {
  const names = [];
  const sources = [];
  for (const file of csFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const found = [...text.matchAll(/WithName\("([^"]+)"\)/g)].map((match) => match[1]).filter((name) => name.startsWith(id));
    if (found.length) {
      names.push(...found);
      sources.push(file);
    }
  }
  return { names: [...new Set(names)], sources: [...new Set(sources)] };
}

function moduleOf(id) {
  const prefix = id.split('-')[0];
  return ({ AUTH: 'Xác thực & truy cập', INB: 'Nhận hàng & nhập kho', QC: 'Kiểm soát chất lượng', INV: 'Tồn kho & truy vết', LOC: 'Lưu kho & vị trí', OUT: 'Đề nghị & xuất kho', RET: 'Trả nội bộ', ADM: 'Quản trị & giám sát' })[prefix];
}

function waveOf(id) {
  if (id.startsWith('AUTH')) return 'W0';
  if (['INB-04', 'INV-01', 'INV-02', 'INV-03', 'LOC-01', 'ADM-03'].includes(id)) return 'W1';
  if (id.startsWith('QC') || ['ADM-01', 'ADM-02'].includes(id)) return 'W2';
  if (id.startsWith('INB')) return 'W3';
  if (id.startsWith('INV') || id.startsWith('LOC')) return 'W4';
  if (/OUT-0[1-5]/.test(id)) return 'W5';
  if (/OUT-0[6-9]/.test(id)) return 'W6';
  return 'W7';
}

function kindOf(facts) {
  const hasWrite = facts.some((fact) => /_(Create|Save|Update|Assign|Evaluate|Declare|Split|Count|PutAway|Relocate|TakeDown|Submit|Decide|Cancel|Start|Pick|Complete|Confirm)/i.test(fact.name));
  return hasWrite ? 'Query + Command' : 'Read-only Query';
}

function render(item, block) {
  const actor = field(block, 'Tác nhân') || 'Theo phân quyền màn hình MMS';
  const goal = field(block, 'Mục tiêu') || item.title;
  const precondition = field(block, 'Điều kiện trước') || 'Người dùng có phiên hợp lệ và quyền use case.';
  const flow = field(block, 'Luồng chính') || 'Mở màn hình → nhập/chọn dữ liệu → hệ thống kiểm tra → trả kết quả.';
  const exception = field(block, 'Ngoại lệ/kiểm soát') || 'Dữ liệu hoặc quyền không hợp lệ: từ chối thao tác và trả mã truy vết.';
  const screens = list(field(block, 'Màn hình'));
  const legacyData = list(field(block, 'Dữ liệu/xử lý'));
  const routeItems = screens.flatMap((screen) => routes.get(screen) ?? []).filter((route) => route.id === item.id);
  const routePaths = [...new Set(routeItems.map((route) => route.path))];
  const facts = procedureFacts(proceduresFor(item.id));
  const endpoints = endpointsFor(item.id);
  const allObjects = [...new Set(facts.flatMap((fact) => fact.objects))];
  const allErrors = [...new Set(facts.flatMap((fact) => fact.errors))];
  const write = kindOf(facts) === 'Query + Command';
  const spRows = facts.length ? facts.map((fact) => `| \`${fact.name}\` | \`${rel(fact.file)}\` |`).join('\n') : '| Chưa có SP riêng | Logic dùng contract/module liên quan |';
  const endpointRows = endpoints.names.length ? endpoints.names.map((name) => `| \`${name}\` | .NET endpoint đã định danh |`).join('\n') : '| Theo endpoint module | Không có `WithName` riêng hoặc contract được dùng gián tiếp |';
  const objectRows = [...new Set([...legacyData, ...allObjects])].length
    ? [...new Set([...legacyData, ...allObjects])].map((object) => `| \`${esc(object)}\` | ${object.startsWith('api.') ? 'Contract API/view/type' : 'Dữ liệu nghiệp vụ legacy'} | SP |`).join('\n')
    : '| Theo contract nguồn | Cần đối chiếu khi thay đổi | SP |';
  const errorRows = allErrors.length ? allErrors.map((error) => {
    const [number, message] = error.split(' — ');
    const http = ({ '51001': '403', '51002': '400', '51004': '404', '51009': '409', '51022': '422' })[number] ?? '500';
    return `| ${number} | ${http} | ${esc(message ?? '')} |`;
  }).join('\n') : '| 51001/51002/51004/51009/51022 | 403/400/404/409/422 | Theo middleware lỗi nghiệp vụ |';
  const routeText = routePaths.length ? routePaths.map((value) => `\`${value}\``).join(', ') : 'Theo điều hướng phân quyền hiện tại';
  const screenText = screens.length ? screens.map((value) => `\`${value}\``).join(', ') : 'Theo contract quyền hiện hành';
  const flowSteps = flow.split(/\s*→\s*/).filter(Boolean);
  const mermaidSteps = flowSteps.map((step, index) => `    S${index}["${step.replaceAll('"', "'")}"]`).join('\n');
  const mermaidLinks = flowSteps.slice(1).map((_, index) => `    S${index} --> S${index + 1}`).join('\n');

  return `---
title: "Đặc tả ${item.id} - ${item.title}"
use_case_id: "${item.id}"
version: "1.0"
date: "2026-08-13"
status: "Đặc tả theo hồ sơ và contract mã nguồn hiện tại"
format: "Markdown - nguồn giao tiếp chuẩn"
---

# ${item.id} – ${item.title}

> Tài liệu thuộc bộ đặc tả 42 use case MMS. Nguồn sự thật gồm hồ sơ tổng thể, React route, .NET endpoint và SQL contract versioned trong workspace.

## Thông tin kiểm soát

| Thuộc tính | Giá trị |
| --- | --- |
| Module | ${moduleOf(item.id)} |
| Wave | ${waveOf(item.id)} |
| Tác nhân | ${esc(actor)} |
| Loại xử lý | ${kindOf(facts)} |
| Route React | ${routeText} |
| Màn hình quyền | ${screenText} |
| Trạng thái | Contract đã có trong workspace; triển khai/UAT theo checklist chung |

---

## 1. Business Logic (Logic nghiệp vụ)

### 1.1. Mục tiêu

${goal}

### 1.2. Điều kiện trước và sau

| Loại | Nội dung |
| --- | --- |
| Điều kiện trước | ${esc(precondition)} |
| Thành công | Hoàn tất đúng luồng '${item.id}', trả dữ liệu/kết quả contract và ghi audit khi có command. |
| Thất bại | Không để dữ liệu dở dang; trả lỗi nghiệp vụ hoặc 'traceId'. |

### 1.3. Luồng chính

${flowSteps.map((step, index) => (index + 1) + '. ' + step + '.').join('\n')}

### 1.4. Ngoại lệ và kiểm soát

${exception}

### 1.5. Business Rules

| Mã | Quy tắc |
| --- | --- |
| BR-${item.id}-01 | User phải có phiên xác thực và quyền màn hình tương ứng. |
| BR-${item.id}-02 | Dữ liệu bắt buộc phải được trim và kiểm tra tại API lẫn stored procedure. |
| BR-${item.id}-03 | Không tin 'UserId', trạng thái hoặc giá trị suy diễn do client tự gửi. |
| BR-${item.id}-04 | Stored procedure là nơi thực thi logic nghiệp vụ và phân quyền dữ liệu. |
| BR-${item.id}-05 | ${write ? 'Command phải nguyên tử, rollback khi bất kỳ bước nào lỗi.' : 'Query không được làm thay đổi dữ liệu nghiệp vụ.'} |
| BR-${item.id}-06 | Giữ nguyên cấu trúc bảng và mã trạng thái legacy. |
| BR-${item.id}-07 | Lỗi nghiệp vụ phải dùng mã ổn định; lỗi ngoài dự kiến phải có 'traceId'. |
| BR-${item.id}-08 | React không truy cập bảng SQL trực tiếp. |

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

- Header hiển thị mã '${item.id}' và tên “${item.title}”.
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
${screens.length ? screens.map((screen) => '| ' + screen + ' | ' + ((routes.get(screen) ?? []).filter((route) => route.id === item.id).map((route) => route.path).join(', ') || 'Theo route registry') + ' |').join('\n') : '| Theo quyền module | Theo route registry |'}

### 3.2. .NET endpoint contract

| Endpoint name | Vai trò |
| --- | --- |
${endpointRows}

Nguồn endpoint: ${endpoints.sources.length ? endpoints.sources.map((file) => rel(file)).join(', ') : 'module API tương ứng'}.

### 3.3. Stored procedure contract

| Stored procedure | File nguồn |
| --- | --- |
${spRows}

${facts.map((fact) => fact.signature ? '**' + fact.name + '**\n\n~~~sql\n' + fact.signature + '\n~~~' : '').filter(Boolean).join('\n\n')}

### 3.4. Error contract

| SQL number | HTTP | Ý nghĩa |
| --- | --- | --- |
${errorRows}
| Khác | 500 | Lỗi hệ thống; không lộ chi tiết nhạy cảm, bắt buộc có 'traceId' |

### 3.5. Concurrency và idempotency

${write
    ? '- Command phải chạy trong transaction với XACT_ABORT ON.\n- Cập nhật trạng thái cần expected state/time hoặc khóa phù hợp.\n- Client không tự retry POST/PUT khi chưa có idempotency key.\n- Retry không được tạo giao dịch trùng.'
    : '- Query phải nhất quán với trạng thái hiện tại và có phân trang khi danh sách lớn.\n- Hủy request ở client không được tạo side effect.\n- Thứ tự kết quả phải xác định.'}

---

## 4. Data Logic

### 4.1. Ma trận dữ liệu

| Object | Vai trò | Truy cập qua |
| --- | --- | --- |
${objectRows}

### 4.2. Nguyên tắc dữ liệu

- Không thay đổi 59 bảng legacy hoặc mã trạng thái hiện hữu trong use case này.
- Mọi truy cập từ ứng dụng đi qua schema 'api' và stored procedure versioned.
- User/audit lấy từ phiên xác thực.
- ${write ? 'Tất cả ghi nghiệp vụ liên quan phải cùng commit hoặc cùng rollback.' : 'Use case read-only không được phát sinh UPDATE/INSERT/DELETE.'}

### 4.3. State model

~~~text
[Chưa đủ điều kiện]
        |
        | kiểm tra quyền + business rules
        v
[Sẵn sàng xử lý ${item.id}]
        |
        | ${write ? 'command SP' : 'query SP'}
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
    participant UI as React ${item.id}
    participant API as .NET API
    participant SP as SQL Contract
    participant DB as MMS Legacy Tables
    User->>UI: Thực hiện ${item.title}
    UI->>API: Request đã validate sơ bộ
    API->>SP: UserId + contract input
    SP->>DB: Kiểm tra quyền và business rules
    alt Hợp lệ
        SP->>DB: ${write ? 'Transaction/query nghiệp vụ' : 'Đọc dữ liệu phân quyền'}
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
${mermaidSteps || '    S0["Mở use case"]\n    S1["Xử lý"]'}
${mermaidLinks || '    S0 --> S1'}
    S${Math.max(0, flowSteps.length - 1)} --> V{"Hợp lệ?"}
    V -- Có --> OK["Hoàn tất ${item.id}"]
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
| AC-${item.id}-01 | User có quyền mở use case | Màn hình và dữ liệu đúng phạm vi được hiển thị |
| AC-${item.id}-02 | User không có quyền | HTTP 403, không lộ dữ liệu |
| AC-${item.id}-03 | Dữ liệu hợp lệ | Hoàn tất đúng luồng chính |
| AC-${item.id}-04 | Thiếu dữ liệu bắt buộc | HTTP 400/422, chỉ rõ lỗi |
| AC-${item.id}-05 | Đối tượng không tồn tại | HTTP 404, không ghi dở dang |
| AC-${item.id}-06 | Dữ liệu đã thay đổi đồng thời | HTTP 409 hoặc kết quả nhất quán |
| AC-${item.id}-07 | Lỗi hệ thống | HTTP 500 với 'traceId' |
| AC-${item.id}-08 | Kiểm tra audit | User, thời gian và hành động đúng contract |
| AC-${item.id}-09 | Kiểm tra phân quyền dữ liệu | Không thấy dữ liệu ngoài phạm vi |
| AC-${item.id}-10 | Kiểm tra Power Apps dự phòng | Bảng và trạng thái legacy vẫn tương thích |

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
| Hồ sơ nghiệp vụ | 'HO_SO_TONG_THE_UNG_DUNG_MMS.md' – ${item.id} |
| Route registry | 'apps/web/src/app/routeRegistry.ts' |
| API source | ${endpoints.sources.length ? endpoints.sources.map((file) => rel(file)).join(', ') : 'Module API tương ứng'} |
| SQL source | ${facts.length ? facts.map((fact) => rel(fact.file)).join(', ') : 'Contract liên quan'} |
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
`;
}

for (let index = 0; index < ids.length; index += 1) {
  const item = ids[index];
  const target = path.join(outDir, `${item.id}.md`);
  if (item.id === 'INB-01') {
    fs.copyFileSync(path.join(root, 'UC01_Receive_With_PO.md'), target);
  } else if (item.id === 'INB-02') {
    fs.copyFileSync(path.join(root, 'UC02_Receive_Without_PO.md'), target);
  } else {
    fs.writeFileSync(target, render(item, blockFor(item, ids[index + 1])), 'utf8');
  }
}

const grouped = Object.groupBy(ids, (item) => item.id.split('-')[0]);
const indexText = `# Bộ đặc tả toàn bộ use case MMS

Phiên bản: 1.0  
Ngày tạo: 13/08/2026  
Chuẩn: Markdown, React + .NET API + SQL stored procedure

## Tổng quan

| Chỉ tiêu | Giá trị |
| --- | ---: |
| Tổng use case | ${ids.length} |
| AUTH | ${grouped.AUTH.length} |
| INB | ${grouped.INB.length} |
| QC | ${grouped.QC.length} |
| INV | ${grouped.INV.length} |
| LOC | ${grouped.LOC.length} |
| OUT | ${grouped.OUT.length} |
| RET | ${grouped.RET.length} |
| ADM | ${grouped.ADM.length} |

## Danh mục tài liệu

${Object.entries(grouped).map(([group, items]) => `### ${group}\n\n| Use case | Tên | Wave | Tài liệu |\n| --- | --- | --- | --- |\n${items.map((item) => `| ${item.id} | ${item.title} | ${waveOf(item.id)} | [Mở tài liệu](./${item.id}.md) |`).join('\n')}`).join('\n\n')}

## Quy ước

- Mỗi use case là một file độc lập, có business, UI/UX, programming, data, diagram, UAT, cutover và traceability.
- Bảng và mã trạng thái legacy không thay đổi.
- Logic nghiệp vụ ghi dữ liệu đặt trong stored procedure.
- Power Apps chỉ là phương án dự phòng sau cutover React.
`;
fs.writeFileSync(path.join(outDir, 'README.md'), indexText, 'utf8');
console.log(`Generated ${ids.length} use-case documents in ${outDir}`);
