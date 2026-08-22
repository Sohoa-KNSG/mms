# Danh mục use case – WMS Kho Thành Phẩm

## 1. Phạm vi khảo sát

- Ứng dụng tham chiếu: `http://10.17.16.164:5173/`
- Phiên bản hiển thị: WMS Kho Thành Phẩm v5.0 / ASP.NET Core 8.0
- Ngày khảo sát: 2026-08-15
- Nguồn: dashboard của tài khoản quản trị và màn hình báo cáo Sổ Cái Kép.
- Quy ước: giữ nguyên mã UC được ứng dụng công bố; mục chưa có mã dùng mã đề xuất theo miền nghiệp vụ.

## 2. Danh mục use case nguyên tử

| STT | Mã UC | Nhóm | Use case | Tác nhân chính | Kết quả nghiệp vụ |
|---:|---|---|---|---|---|
| 1 | AUTH-R01 | Xác thực | Đăng nhập WMS | Tất cả người dùng | Khởi tạo phiên theo tài khoản và vai trò |
| 2 | INB-R01 | Nhập kho | Quét nhận Thùng 60 | Nhân viên tiếp nhận | Ghi nhận thùng theo phiếu bàn giao |
| 3 | INB-R02 | Nhập kho | Duyệt phiếu nhập kho | Thủ kho | Xác nhận nhập và tăng tồn chính thức |
| 4 | INB-R03 | Nhập kho | Nhập kho hàng lẻ | Nhân viên kho | Xử lý lô lệch số lượng hoặc nhập thiếu |
| 5 | PKG-R01 | Đóng gói | Đóng gói Kiện 360 | Nhân viên đóng gói | Gom Thùng 60, cân và in tem TSPL |
| 6 | PKG-R02 | Đóng gói | Đóng gói kiện Repack | Nhân viên đóng gói | Tạo kiện từ hàng lẻ sau xử lý Repack |
| 7 | PKG-R03 | Đóng gói | Tách thùng khỏi kiện | Nhân viên kho | Giải phóng Thùng 60 khỏi Kiện 360 |
| 8 | PKG-R04 | Đóng gói | Chuyển đơn OEM Pack360 | Điều phối OEM | Chuyển các thùng trong kiện sang đơn OEM mới |
| 9 | LOC-R01 | Lưu trữ | Quản lý pallet và vị trí kho | Nhân viên kho | Tạo/hạ pallet và chuyển vị trí kệ |
| 10 | OUT-R01 | Xuất kho | Lập và thực hiện đơn soạn hàng | Nhân viên soạn hàng | Pick theo vị trí, hỗ trợ tách thùng lẻ |
| 11 | OUT-R02 | Xuất kho | Duyệt xuất kho | Thủ kho | Ký duyệt hàng đủ điều kiện xuất |
| 12 | OUT-R03 | Xuất kho | Kiểm cổng bảo vệ | Bảo vệ | Kiểm soát xe và hàng trước khi rời cổng |
| 13 | OUT-R04 | Xuất kho | Xác nhận phiếu xuất bến và vận chuyển | Điều phối vận chuyển | Xuất xe và ghi giảm tồn trên sổ cái |
| 14 | UC18-A | Xuất tạm | Tạo phiếu xuất tạm thành phẩm | Thủ kho/Điều phối | Xuất hàng mẫu hoặc hàng triển lãm có theo dõi |
| 15 | UC18-B | Xuất tạm | Hoàn nhập hàng xuất tạm | Thủ kho | Nhận trả và hoàn nhập tồn kho |
| 16 | UC12 | Truy vết | Tra cứu hồ sơ tài sản | Kho/QC/Quản trị | Xem phả hệ Thùng 60–Pack360–Pallet, cân nặng và sổ cái |
| 17 | RPT-R01 | Báo cáo | Báo cáo tồn kho và truy vết | Quản lý kho | Xem tồn Macro/Micro và vòng đời thùng |
| 18 | UC22.2 | Báo cáo | Báo cáo Sổ Cái Kép | Kế toán kho/Quản lý | Đối soát sổ SKU và sổ chi tiết đơn vị phiếu |
| 19 | OEM-R01 | OEM | Quản lý đơn hàng OEM | Điều phối OEM | Theo dõi tiến độ sản xuất và đóng gói |
| 20 | UC13 | Kiểm soát tồn | Khóa tồn kho | Thủ kho/Quản trị | Ngăn tồn bị sử dụng trong giao dịch mới |
| 21 | UC14 | Kiểm soát tồn | Release tồn kho | Thủ kho/Quản trị | Mở khóa và giải phóng tồn hợp lệ |
| 22 | ADM-R01 | Quản trị | Quản lý master data | Quản trị viên | Quản lý vị trí kệ, sản phẩm và khách hàng |
| 23 | ADM-R02 | Quản trị | Quản trị người dùng | IT Admin | Phân quyền tài khoản và cấp lại mật khẩu |

## 3. Nhóm menu cấp cao trên dashboard

1. Nhập Kho & Tiếp Nhận: INB-R01 đến INB-R03.
2. Lưu Trữ & Đóng Gói: PKG-R01 đến PKG-R04 và LOC-R01.
3. Soạn Hàng & Xuất Bến: OUT-R01 đến OUT-R04 và UC18-A/UC18-B.
4. Kiểm Soát & Quản Trị: UC12, RPT-R01, UC22.2, OEM-R01, UC13, UC14, ADM-R01, ADM-R02.

## 4. Ghi chú chuẩn hóa

- `UC18`, `UC13`, `UC14`, `UC12` và `UC22.2` là mã hiển thị trực tiếp trong ứng dụng.
- Các mã có hậu tố `-R` là mã tham chiếu đề xuất, chưa phải mã legacy chính thức.
- Một số thẻ dashboard chứa nhiều mục tiêu nghiệp vụ nên được tách thành use case nguyên tử: duyệt xuất/kiểm cổng, xuất tạm/hoàn nhập, khóa/release.
- Cần bổ sung actor–role matrix và trạng thái dữ liệu chi tiết sau khi khảo sát từng màn hình chức năng.

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

## 4. Data Logic (Thiết kế Dữ Liệu)

### 4.1. Ma trận phân quyền CRUD

| Bảng / Thực thể Dữ Liệu | Create (Tạo) | Read (Đọc) | Update (Cập nhật) | Delete (Xóa) | Ý nghĩa nghiệp vụ trong Use Case |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `dbo.tbl_dm_user` | **X** | **X** | **X** | - | Quản lý danh mục tài khoản, mật khẩu băm, trạng thái hoạt động |
| `dbo.api.vw_SEC_UserScreenAccess_v1` | - | **X** | - | - | Đọc ma trận phân quyền màn hình theo UserId |
| `dbo.tbl_sec_audit_log` | **X** | **X** | - | - | Ghi vết nhật ký truy cập kiểm toán hệ thống (`UserId`, `IP`, `Action`) |

### 4.2. Định nghĩa Trạng thái (Conceptual State Model)

| Cột / Biến | Kiểu Dữ Liệu | Giá Trị Sau Confirm | Ý nghĩa Nghiệp vụ |
| :--- | :--- | :--- | :--- |
| `status_active` (trong `tbl_dm_user`) | `INT` | `1` (`'ACTIVE'`) | Tài khoản đang hoạt động, được phép đăng nhập hệ thống |
| `must_change_password` | `INT` | `0` | Đã hoàn tất đổi mật khẩu lần đầu |

### 4.3. Data Layer Architecture (Data Flow & Transaction Locking)

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

---
