# Kế Hoạch Triển Khai UC-01: Đăng Nhập Hệ Thống & Quản Lý Phiên Làm Việc

Tài liệu này đặc tả chi tiết kế hoạch thực hiện **UC-01 (AUTH-01)** kết nối giao diện React với Stored Procedure `api.usp_SEC_AUTH01_GetUserContext_v1` / `api.usp_SEC_AUTH01_AuthenticateLegacy_v1` thông qua Backend .NET Core API.

---

## 1. Yêu Cầu Nghiệm Thu & Đánh Giá (User Review Required)

> [!IMPORTANT]
> - **Cơ chế xác thực**: Hệ thống sử dụng Cookie Authentication kết hợp Stored Procedure `api.usp_SEC_AUTH01_AuthenticateLegacy_v1` để xác thực username/password đối chiếu bảng người dùng `tbl_dm_user`.
> - **Phiên làm việc (User Context)**: Khi đã đăng nhập hoặc trong môi trường DEV, hệ thống tự động gọi `GET /api/v1/session` (thực thi Stored Procedure `api.usp_SEC_AUTH01_GetUserContext_v1`) để lấy đầy đủ thông tin: Mã nhân viên (`UserId`), Tên hiển thị (`DisplayName`), Vai trò (`RoleCode`, `RoleName`), Phòng ban (`DepartmentCode`, `BravoDepartmentName`).

---

## 2. Các Thay Đổi Dự Kiến Triển Khai (Proposed Changes)

### A. Tầng Dịch Vụ API Frontend (Services)
- **[NEW] apps/web/src/services/authService.ts**
  - Hàm `login(username, password)`: Gửi yêu cầu `POST /api/v1/auth/login`.
  - Hàm `getSession()`: Gửi yêu cầu `GET /api/v1/session` lấy context từ CSDL.
  - Hàm `logout()`: Gửi yêu cầu `POST /api/v1/auth/logout`.

### B. Tầng Giao Diện Người Dùng (Components)
- **[NEW] apps/web/src/components/LoginModal.tsx**
  - Form đăng nhập chuẩn thiết kế Smart Factory: Input mã nhân viên, mật khẩu, trạng thái loading, hiển thị lỗi rõ ràng khi sai thông tin.
- **[MODIFY] apps/web/src/components/Navbar.tsx**
  - Hiển thị thông tin người dùng thật (`DisplayName`, `RoleName`, `BravoDepartmentName`).
  - Thêm nút Đăng nhập / Đăng xuất thực tế gọi API.

### C. Quản Lý Trạng Thái (Store Integration)
- **[MODIFY] apps/web/src/services/warehouseStore.tsx**
  - Khởi tạo `currentUser` tự động từ `authService.getSession()`.
  - Khi chưa đăng nhập hoặc phiên hết hạn, hiển thị LoginModal hoặc cho phép đăng nhập nhanh.

---

## 3. Kế Hoạch Kiểm Thử (Verification Plan)

### Kiểm Thử Tự Động & Build
1. Kiểm tra build frontend: `pnpm run build --filter @mms/web`.
2. Kiểm tra typecheck TypeScript: `pnpm run typecheck --filter @mms/web`.

### Kiểm Thử Chức Năng (Manual Verification)
1. Mở trang web -> Ứng dụng tự động kiểm tra phiên qua `GET /api/v1/session`.
2. Kiểm tra đăng nhập với tài khoản:
   - Thử nhập sai mật khẩu -> Hệ thống hiển thị thông báo lỗi 401.
   - Đăng nhập với tài khoản hợp lệ -> Chuyển vào hệ thống, Navbar hiển thị đúng họ tên và vai trò từ CSDL.
3. Thử thao tác Đăng xuất -> Xóa phiên và hiển thị lại form đăng nhập.
