# TÀI LIỆU QUY TRÌNH NGHIỆP VỤ: KIỂM KÊ TỒN KHO XOAY VÒNG (CYCLE COUNT)
## MÃ QUY TRÌNH: MMS-WMS-SOP-INV-08 | USE CASE: UC-27 (PHIÊN BẢN 3.0)

---

| Thông Tin Tài Liệu | Chi Tiết |
| :--- | :--- |
| **Hệ thống áp dụng** | Hệ Thống Quản Lý Kho & Sản Xuất (MMS WMS) |
| **Phân hệ** | Quản Lý Tồn Kho - Kiểm Kê Xoay Vòng (Cycle Count / INV-08 & INV-09) |
| **Đối tượng xem & phê duyệt** | Process Owner (Chủ trì nghiệp vụ Kho), Quản lý Kho, Kế toán Kho, Ban Giám Đốc |
| **Mục đích tài liệu** | Thuyết minh quy trình vận hành kiểm kê xoay vòng 3 bước tự động hóa, cơ chế kiểm đếm theo từng thùng, tách lô định danh, khóa chống gửi trùng lệnh (Debounce Lock), tự động reset về 0, tự động bật pop-up in tem dán tại chỗ và đối soát số liệu sổ sách kế toán. |

---

## 1. MỤC ĐÍCH & PHẠM VI ÁP DỤNG

### 1.1. Mục đích
- Thiết lập quy trình kiểm kê cuốn chiếu định kỳ (Cycle Count) theo từng mặt hàng/khu vực mà không làm gián đoạn hoạt động xuất - nhập kho.
- Đảm bảo kiểm đếm chính xác đến từng kiện/thùng hàng thực tế tại ô kệ (Box-level Counting).
- Tự động hóa việc tách lô con (Sub-batch), cấp mã định danh và tự động bật Pop-up in tem mã vạch dán thùng ngay tại hiện trường.
- Triệt tiêu hoàn toàn tình trạng bấm nhiều lần sinh nhiều lô con nhờ cơ chế khóa Debounce In-Flight Lock.
- Đối soát số liệu giữa Tồn vật lý hệ thống, Tồn sổ sách kế toán và Thực tế kiểm đếm; tự động xử lý chốt cặn và hạch toán hao hụt khi hoàn thành.

### 1.2. Phạm vi áp dụng
- Áp dụng cho toàn bộ hoạt động kiểm kê định kỳ và kiểm kê đột xuất tại Kho Vật Tư.
- Thực hiện bởi nhân viên vận hành kho sử dụng máy quét cầm tay (PDA) và máy tính trạm quản lý kho.

---

## 2. MA TRẬN PHÂN QUYỀN TRÁCH NHIỆM (RACI)

| Hoạt Động Nghiệp Vụ | Kế Toán Kho | Quản Lý Kho / Process Owner | Thủ Kho / NV Kiểm Kê | Hệ Thống WMS |
| :--- | :---: | :---: | :---: | :---: |
| 1. Cung cấp số liệu tồn sổ sách | **R** (Thực hiện) | **A** (Chịu trách nhiệm) | **I** (Theo dõi) | **S** (Hỗ trợ) |
| 2. Tạo kế hoạch kiểm kê & Chốt Snapshot | **I** | **A** | **R** | **A** (Tự động) |
| 3. Quét kệ, đếm từng thùng, tách lô | **I** | **I** | **R** | **S** |
| 4. In tem nhãn dán thùng tại hiện trường | **I** | **I** | **R** | **A** (Tự động Pop-up) |
| 5. Kiểm tra bảng cân bằng đối soát 4 chiều | **C** (Tham vấn) | **R / A** | **R** | **S** |
| 6. Phê duyệt & Chốt sổ hoàn tất kiểm kê | **C** | **A** | **I** | **A** (Tự động) |

---

## 3. CÁC ĐỊNH NGHĨA & CÔNG THỨC NGHIỆP VỤ

### 3.1. Các chỉ số số lượng đối soát
1. **Số lượng hệ thống (System Quantity):** Tổng số lượng vật lý đang được ghi nhận tại các vị trí kệ kho tại thời điểm tạo kế hoạch kiểm kê.
2. **Số lượng sổ sách (Book Quantity):** Số lượng tồn theo số liệu kế toán do bộ phận kế toán/chủ hàng cung cấp tại thời điểm kiểm kê.
3. **Số lượng thực tế (Physical Quantity):** Tổng số lượng đếm được từ tất cả các thùng/kiện hàng được nhân viên ghi nhận tại hiện trường:
   $$\text{Số Lượng Thực Tế} = \sum (\text{Số Lượng Đếm Từng Thùng})$$
4. **Chênh lệch kiểm kê (Variance):**
   $$\text{Chênh Lệch} = \text{Số Lượng Thực Tế} - \text{Số Lượng Sổ Sách}$$

---

## 4. QUY TRÌNH THỰC HIỆN CHI TIẾT (3 BƯỚC HIỆN TRƯỜNG TỰ ĐỘNG HÓA)

```mermaid
flowchart TD
    Start(["Bắt đầu"]) --> Step1["1. Lập Kế Hoạch Kiểm Kê (INV-08)<br/>Chọn SKU, Snapshot Lô tồn kho"]
    Step1 --> Step2["2. PDA BƯỚC 1: Quét Ô Kệ<br/>(Auto focus, Bắn laser dầm kệ, Ẩn B1)"]
    Step2 --> Step3["3. PDA BƯỚC 2: Quét Barcode Lô Thùng<br/>(Auto focus, Bắn tem trên thùng, Ẩn B2)"]
    Step3 --> Step4["4. PDA BƯỚC 3: Nhập Số Đếm 1 Thùng<br/>(Reset về 0, Enter / Bấm Xác Nhận)"]
    Step4 --> Lock["5. Khóa In-Flight Debounce Lock<br/>(Chống bấm đúp / tạo trùng lô)"]
    Lock --> Split["6. Tách Lô Con & Ghi CSDL: sp_wms_log_count_and_split"]
    Split --> Popup["7. Tự động bật Modal Popup In Tem (z-index 99999)<br/>Reset ô đếm về 0, Quay về BƯỚC 2"]
    Popup --> Next{"Còn thùng hàng<br/>cần đếm?"}
    Next -- Còn thùng --> Step3
    Next -- Đã đếm hết --> Reconcile["8. Tổng hợp Bảng Đối Soát 4 Chiều<br/>(Hệ Thống - Sổ Sách - Thực Tế - Chênh Lệch)"]
    Reconcile --> Finish["9. Phê Duyệt & Chốt Hoàn Tất Kiểm Kê (INV-09)<br/>Khấu trừ thất thoát tự động (Chốt cặn)"]
    Finish --> End(["Kết thúc kiểm kê & Ký biên bản"])
```

---

### Giai đoạn 1: Khởi tạo kế hoạch kiểm kê
1. Quản lý / Thủ kho mở chức năng **Kiểm Kê Tồn Kho (UC-27)** trên phần mềm MMS WMS.
2. Chọn Mã vật tư cần kiểm kê, hệ thống tự động gợi ý tồn máy và số lượng Lô đang lưu kho.
3. Nhập số lượng tồn theo sổ sách kế toán và bấm **Khởi Tạo Kế Hoạch & Snapshot**.

---

### Giai đoạn 2: Kiểm đếm hiện trường PDA 3 bước tự động hóa

1. **Bước 1: Quét Ô Kệ**:
   - Con trỏ `autoFocus` sẵn vào ô quét kệ.
   - Bắn súng quét vào mã dầm kệ (VD: `01-01011`). Hệ thống tự động nhận diện, ẩn Bước 1 và mở Bước 2.
2. **Bước 2: Quét Barcode Lô Thùng**:
   - Con trỏ `autoFocus` vào ô quét tem thùng.
   - Bắn súng quét vào mã vạch thùng. Hệ thống nhận diện Lô, ẩn Bước 2 và mở Bước 3.
   - *Hỗ trợ nút `[🖨️ In Tem]` trực tiếp trên từng thẻ Lô để in tem nhanh.*
3. **Bước 3: Nhập Số Lượng Đếm & Xác Nhận Tách Thùng**:
   - Con trỏ `autoFocus` vào ô số lượng đếm (Mặc định reset về `0`).
   - Nhập cân nặng / số cái, sau đó nhấn phím **`Enter`** hoặc bấm **`[XÁC NHẬN SỐ ĐẾM & TÁCH THÙNG NÀY]`**.
   - **Khóa In-Flight Lock:** Nút bấm lập tức chuyển sang trạng thái Disabled + Spinner quay tròn, ngăn chặn 100% việc tạo nhiều lô con do thao tác spam nút.
   - **Tự động Reset & In Tem:** Sau khi ghi nhận CSDL, ô số lượng tự động về `0`, **Popup Modal In Tem Nhãn bật lên ngay lập tức** (hiển thị SKU, Tên vật tư, Khối lượng, Vị trí ô kệ, Barcode 128, QR Code và Nút in LAN `10.17.16.102:8080`).
   - **Chuẩn bị cho thùng kế tiếp:** Giao diện tự động quay về Bước 2 để nhân viên có thể bắn ngay vào thùng tiếp theo.

---

### Giai đoạn 3: Đối soát số liệu & Chốt hoàn tất kiểm kê (INV-09)
1. Trên màn hình Quản lý: Xem bảng đối soát 4 chiều (**Tồn Máy**, **Sổ Sách**, **Thực Tế**, **Chênh Lệch**).
2. Xem chi tiết các Lô con mới sinh tại Tab **Nhật Ký Quét Thùng & Lô Con** (có nút `[🖨️ In Lại Tem]`).
3. Khi Process Owner / Quản Lý xác nhận số liệu: Bấm **Phê Duyệt & Chốt Hoàn Thành (INV-09)**.
   - Hệ thống tự động trừ sạch tồn các lô gốc còn dư thừa về 0 (xử lý cặn do thất thoát vật lý) và ghi nhận giao dịch `ADJ_DWN` vào sổ cái kho.

---

## 3. Programming Logic (Logic Lập Trình)

Quy trình xử lý mã lệnh được chia thành 2 lớp rõ rệt: **Frontend (React)** và **Backend (ASP.NET Core kết hợp SQL Stored Procedure)**.

### 3.1. Frontend (React - Component View)
- **State Management & Local Processing:**
  - Gọi API kéo dữ liệu cần thiết vào React State.
  - Sử dụng các hàm mảng JavaScript (`filter`, `map`, `reduce`) để xử lý gom nhóm, lọc tìm kiếm in-memory, tối ưu hóa băng thông và tạo trải nghiệm mượt mà không độ trễ.
- **UI Interaction & Ergonomics:**
  - Sử dụng cấu trúc Collapse / Accordion / Modal xem trước để tối ưu không gian hiển thị trên màn hình Handheld PDA và Desktop Web.

### 3.2. Backend (ASP.NET Core & SQL Server Stored Procedure)
- **Thin API Gateway Pattern:**
  - ASP.NET Core Minimal API / Controller không xử lý logic tính toán nghiệp vụ mà chỉ làm cổng Gateway mỏng (Xác thực JWT Cookie, kiểm tra quyền màn hình `vw_SEC_UserScreenAccess_v1`) và ủy thác toàn bộ cho SQL Server Stored Procedure.
- **Tận Dụng Multi-Result Set & ACID Transaction:**
  - SQL Stored Procedure trả về đồng thời nhiều Result Sets (Header info, Summary KPIs, Detailed Lines) trong một lần truy vấn duy nhất.
  - Các lệnh ghi dữ liệu áp dụng `SET XACT_ABORT ON`, `BEGIN TRANSACTION` và khóa dòng dữ liệu `WITH (UPDLOCK, HOLDLOCK)` đảm bảo an toàn tuyệt đối.

---

## 4. Data Logic & Schema Model (Thiết kế Dữ Liệu Chuyên Sâu)

### 4.1. Entity Relationship Diagram (ERD) & Schema Details
```mermaid
erDiagram
    tbl_dm_user ||--o{ tbl_sec_user_roles : "Co Vai Tro"
    tbl_sec_roles ||--|{ tbl_sec_role_screens : "Phan Quyen Man Hinh"
    tbl_dm_user ||--o{ tbl_sec_audit_log : "Ghi Vet Nhat Ky"
```

- **Bảng Người Dùng (`dbo.tbl_dm_user`):** `user_n` (PK), `msnv`, `hoten`, `matkhau`, `status_active`.
- **View Phân Quyền (`api.vw_SEC_UserScreenAccess_v1`):** Ánh xạ `UserId` $ightarrow$ `ScreenCode`.

### 4.2. Data Layer Architecture (Data Flow & Transaction Locking)

```mermaid
flowchart TD
    Start(["Người Dùng Bấm: Xác Nhận Thao Tác"]) --> Lock["BEGIN SQL TRANSACTION &<br/>Lock Target Rows WITH (UPDLOCK, HOLDLOCK)"]
    Lock --> Check1{"1. Người dùng có quyền<br/>truy cập màn hình chức năng?"}
    
    Check1 -- Không có quyền --> Err1["Rollback & Return 403:<br/>Forbidden Access"]
    Check1 -- Hợp lệ --> Check2{"2. Dữ liệu đầu vào hợp lệ<br/>& đúng trạng thái nghiệp vụ?"}
    
    Check2 -- Không hợp lệ --> Err2["Rollback & Return 400:<br/>Invalid State / Data Constraint"]
    Check2 -- Hợp lệ --> Execute["Thực thi biến động dữ liệu &<br/>Ghi nhận nhật ký Sổ Cái Kép"]
    
    Execute --> Audit["Ghi nhật ký Audit Log (UserId, IP, Time)"]
    Audit --> Commit["COMMIT TRANSACTION &<br/>Return 200: OperationSuccess"]
    
    style Err1 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Err2 fill:#fee2e2,stroke:#ef4444,color:#b91c1c
    style Commit fill:#d1fae5,stroke:#10b981,color:#065f46
    style Lock fill:#ede9fe,stroke:#8b5cf6,color:#5b21b6
```

### 4.3. Conceptual State Model & Transition Rules
| Trạng Thái User | Thao Tác | Trạng Thái Sau | Quyền Hạn |
| :--- | :--- | :--- | :--- |
| **`ACTIVE (1)`** | Đăng nhập thành công (AUTH-01) | Sinh JWT Cookie (8h) | Truy cập các màn hình được cấp quyền |
| **`ACTIVE (1)`** | Khóa tài khoản (ADM-01) | `INACTIVE (0)` | Chặn đăng nhập và thu hồi token tức thì |
