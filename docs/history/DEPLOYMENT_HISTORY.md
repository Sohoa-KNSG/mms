# Nhật Ký Triển Khai MMS (Deployment History)

Tài liệu này ghi nhận toàn bộ lịch sử triển khai, kế hoạch (Implementation Plan) và báo cáo nghiệm thu (Walkthrough) của từng Use Case trong quá trình chuyển đổi và kết nối hệ thống MMS thực tế.

---

## Bảng Theo Dõi Tiến Độ Từng Use Case

| Mã Use Case | Tên Nghiệp Vụ | Wave | Kế Hoạch (Plan) | Báo Cáo (Walkthrough) | Trạng Thái | Ngày Cập Nhật |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-01** | Đăng nhập PC/Mobile & Quản lý phiên | W0 | [Xem Plan](./UC-01_Implementation_Plan.md) | [Xem Walkthrough](./UC-01_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-02** | Quản trị role và màn hình (Phân quyền mới) | W0/W2| [Xem Plan](./UC-02_Implementation_Plan.md) | [Xem Walkthrough](./UC-02_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-03** | Tạm nhận hàng theo PO (INB-01) | W3 | [Xem Plan](./UC-03_Implementation_Plan.md) | [Xem Walkthrough](./UC-03_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-04** | Nhận hàng không PO (INB-02) | W3 | [Xem Plan](./UC-04_05_Implementation_Plan.md) | [Xem Walkthrough](./UC-04_05_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-05** | Đối soát & Gắn PO cho phiếu nhận (INB-05) | W3 | [Xem Plan](./UC-04_05_Implementation_Plan.md) | [Xem Walkthrough](./UC-04_05_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-06** | Nhận & Hoàn trả hàng nội bộ (RET-01 & RET-02) | W7 | [Xem Plan](./UC-06_Implementation_Plan.md) | [Xem Walkthrough](./UC-06_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-07** | Lịch sử & Danh sách nhận hàng (INB-04) | W1 | [Xem Spec](../use-cases/UC-07_INB-04.md) | [Xem Walkthrough](./UC-07_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-08** | Cập nhật & Ghép nhiều PO nhập kho (INB-06) | W3 | [Xem Plan](./UC-08_Implementation_Plan.md) | [Xem Walkthrough](./UC-08_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-09** | Thủ tục nhập kho | W3 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-10** | Tách batch và in tem | W3/W4| *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-11** | Lưu kho lên kệ | W1/W4| *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-12** | Cấu hình QC | W2 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-13** | `QC-03` | **Lập phiếu kiểm QC** | Lập phiếu kiểm tra chất lượng tiếp nhận đầu vào cho vật tư. | [Xem Walkthrough](./UC-13_14_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-14** | `QC-04` | **Đánh giá vật tư QC** | Đánh giá chi tiết tiêu chí kỹ thuật & kết luận Đạt/Không đạt. | [Xem Walkthrough](./UC-13_14_Walkthrough.md) | **Completed** | 15/08/2026 |
| **UC-15** | Khai báo tồn kho | W4 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-16** | In tem tồn kho | W3/W4| *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-17** | Lịch sử batch | W1 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-18** | Kiểm kê batch | W4 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-19** | Tạo đề nghị xuất kho | W5 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-20** | Đề nghị xuất kho mobile | W5 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-21** | Lịch sử và sửa đề nghị | W5 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-22** | Soạn hàng (FIFO) | W6 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-23** | Thủ tục xuất kho & in phiếu | W6 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-24** | Phê duyệt phiếu xuất | W5 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-25** | Phiếu trả/nhập nội bộ | W7 | *Chưa bắt đầu* | *Chưa bắt đầu* | Pending | - |
| **UC-27** | `INV-08` | **Kiểm kê Cycle Count theo vật tư (Bước 1)** | Khởi tạo kế hoạch kiểm theo vật tư, snapshot batch & đếm thực tế hiện trường. | [Xem Plan](./UC-27_Implementation_Plan.md) | [Xem Walkthrough](./UC-27_Walkthrough.md) | **Completed** | 17/08/2026 |
| **UC-28** | `ADM-01` & `ADM-02` | **Quản trị người dùng & Nhóm phân quyền** | Quản lý danh sách 110+ tài khoản nhân viên, gán vai trò & cấu hình ma trận phân quyền 22 quyền x 7 vai trò. | [Xem Plan](../../C:/Users/Administrator/.gemini/antigravity/brain/c0227d72-56ec-43f1-8673-89d1f72318a4/implementation_plan.md) | [Xem Walkthrough](./UC-28_Walkthrough.md) | **Completed** | 17/08/2026 |

