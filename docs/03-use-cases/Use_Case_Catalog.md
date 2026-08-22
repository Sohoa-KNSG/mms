# Use Case Catalog

| UC | Tên nghiệp vụ | Tài liệu chi tiết | Trạng thái |
|---|---|---|---|
| UC01 | Đăng nhập PC/Mobile | [UC01_ng_nh_p_PC_Mobile.md](./UC01_ng_nh_p_PC_Mobile.md) | Hoàn thành |
| UC02 | Quản trị role và màn hình | [UC02_Qu_n_tr_role_v_m_n_h_nh.md](./UC02_Qu_n_tr_role_v_m_n_h_nh.md) | Hoàn thành |
| UC03 | Tạm nhận hàng | [UC03_T_m_nh_n_h_ng.md](./UC03_T_m_nh_n_h_ng.md) | Hoàn thành |
| UC04 | Nhận hàng theo PO | [UC04_Nh_n_h_ng_theo_PO.md](./UC04_Nh_n_h_ng_theo_PO.md) | Hoàn thành |
| UC05 | Nhận hàng không PO | [UC05_Nh_n_h_ng_kh_ng_PO.md](./UC05_Nh_n_h_ng_kh_ng_PO.md) | Hoàn thành |
| UC06 | Nhận hàng nội bộ | [UC06_Nh_n_h_ng_n_i_b.md](./UC06_Nh_n_h_ng_n_i_b.md) | Hoàn thành |
| UC07 | Lịch sử nhận hàng | [UC07_L_ch_s_nh_n_h_ng.md](./UC07_L_ch_s_nh_n_h_ng.md) | Hoàn thành |
| UC08 | Cập nhật PO nhập kho | [UC08_C_p_nh_t_PO_nh_p_kho.md](./UC08_C_p_nh_t_PO_nh_p_kho.md) | Hoàn thành |
| UC09 | Thủ tục nhập kho | [UC09_Th_t_c_nh_p_kho.md](./UC09_Th_t_c_nh_p_kho.md) | Hoàn thành |
| UC10 | Tách batch và in tem | [UC10_T_ch_batch_v_in_tem.md](./UC10_T_ch_batch_v_in_tem.md) | Hoàn thành |
| UC11 | Lưu kho lên kệ | [UC11_L_u_kho_l_n_k.md](./UC11_L_u_kho_l_n_k.md) | Hoàn thành |
| UC12 | Cấu hình QC | [UC12_C_u_h_nh_QC.md](./UC12_C_u_h_nh_QC.md) | Hoàn thành |
| UC13 | Phiếu kiểm QC | [UC13_Phi_u_ki_m_QC.md](./UC13_Phi_u_ki_m_QC.md) | Hoàn thành |
| UC14 | Đánh giá vật tư QC | [UC14_nh_gi_v_t_t_QC.md](./UC14_nh_gi_v_t_t_QC.md) | Hoàn thành |
| UC15 | Khai báo tồn kho | [UC15_Khai_b_o_t_n_kho.md](./UC15_Khai_b_o_t_n_kho.md) | Hoàn thành |
| UC16 | In tem tồn kho | [UC16_In_tem_t_n_kho.md](./UC16_In_tem_t_n_kho.md) | Hoàn thành |
| UC17 | Lịch sử batch | [UC17_L_ch_s_batch.md](./UC17_L_ch_s_batch.md) | Hoàn thành |
| UC18 | Kiểm kê batch | [UC18_Ki_m_k_batch.md](./UC18_Ki_m_k_batch.md) | Hoàn thành |
| UC19 | Tạo đề nghị xuất kho | [UC19_T_o_ngh_xu_t_kho.md](./UC19_T_o_ngh_xu_t_kho.md) | Hoàn thành |
| UC20 | Đề nghị xuất kho mobile | [UC20_ngh_xu_t_kho_mobile.md](./UC20_ngh_xu_t_kho_mobile.md) | Hoàn thành |
| UC21 | Lịch sử và chỉnh sửa đề nghị xuất kho | [UC21_L_ch_s_v_ch_nh_s_a_ngh_xu_t_kho.md](./UC21_L_ch_s_v_ch_nh_s_a_ngh_xu_t_kho.md) | Hoàn thành |
| UC22 | Soạn hàng | [UC22_So_n_h_ng.md](./UC22_So_n_h_ng.md) | Hoàn thành |
| UC23 | Thủ tục xuất kho | [UC23_Th_t_c_xu_t_kho.md](./UC23_Th_t_c_xu_t_kho.md) | Hoàn thành |
| UC24 | Phê duyệt phiếu | [UC24_Ph_duy_t_phi_u.md](./UC24_Ph_duy_t_phi_u.md) | Hoàn thành |
| UC25 | Phiếu trả/nhập nội bộ | [UC25_Phi_u_tr_nh_p_n_i_b.md](./UC25_Phi_u_tr_nh_p_n_i_b.md) | Hoàn thành |
| UC26 | Báo cáo tồn và giao dịch | [UC26_B_o_c_o_t_n_v_giao_d_ch.md](./UC26_B_o_c_o_t_n_v_giao_d_ch.md) | Hoàn thành |

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
