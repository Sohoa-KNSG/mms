---
title: "Hồ sơ tổng thể ứng dụng Quản lý kho vật tư – MMS"
version: "1.0"
date: "2026-08-11"
status: "Tài liệu nội bộ"
format: "Markdown – nguồn giao tiếp chuẩn"
---

# Hồ sơ tổng thể ứng dụng Quản lý kho vật tư – MMS

**Kiến trúc • Nghiệp vụ • Use case • Dữ liệu • Vận hành**

| THÔNG TIN | GIÁ TRỊ |
| --- | --- |
| Phạm vi | Power Apps desktop, Power Apps mobile và SQL Server MMS |
| Phiên bản hồ sơ | 1.0 |
| Ngày lập | 11/08/2026 |
| Mức độ | Tài liệu nội bộ |
| Nguồn | Mã nguồn ứng dụng, schema SQL và kết quả App Checker hiện có |

Nguyên tắc bảo mật  Hồ sơ không lưu mật khẩu, chuỗi kết nối hoặc địa chỉ hạ tầng nhạy cảm. Các số liệu schema được đối chiếu theo cấu hình hiện tại.

## 1. Mục đích và phạm vi

Hồ sơ này mô tả hiện trạng toàn bộ hệ thống MMS phục vụ quản lý kho vật tư trong hệ sinh thái Smart Factory. Tài liệu đóng vai trò nguồn tham chiếu chung cho nghiệp vụ, phát triển, vận hành, kiểm thử, quản trị dữ liệu và cải tiến hệ thống.

- Hai ứng dụng Power Apps: ứng dụng desktop “Quản lý kho vật tư” và ứng dụng mobile “Kho vật tư”.

- Cơ sở dữ liệu SQL Server MMS, gồm bảng, view và stored procedure phục vụ nghiệp vụ.

- Các kết nối SQL, Power Automate/Logic Flows, Azure Blob Storage và Power BI được khai báo trong ứng dụng.

- Toàn bộ use case được tách theo tác nhân và module, có truy vết tới màn hình và nhóm dữ liệu.

### 1.1 Giới hạn xác minh

Các kết luận về cấu trúc và chức năng dựa trên gói ứng dụng, mã Power Fx/YAML, schema MMS.sql và metadata App Checker. Dữ liệu gán quyền đang vận hành và dữ liệu giao dịch thực tế không được trích xuất vào hồ sơ.

## 2. Tóm tắt điều hành

| THÀNH PHẦN | ĐỊNH DẠNG | QUY MÔ | GHI CHÚ |
| --- | --- | --- | --- |
| Power Apps desktop | 1920 × 900, landscape | 37 màn hình | 72 nguồn dữ liệu |
| Power Apps mobile | 768 × 1250, portrait | 27 màn hình | 54 nguồn dữ liệu |
| SQL Server MMS | Schema nghiệp vụ | 59 bảng / 36 view | 203 stored procedure |
| App Checker desktop | 0 parser/binding error | 2.155 phát hiện | Tập trung accessibility |
| App Checker mobile | 0 parser/binding error | 708 phát hiện | Tập trung accessibility |

Nhận định chính  Hệ thống đã bao phủ chuỗi nghiệp vụ kho tương đối đầy đủ: nhận hàng, QC, nhập kho, lưu kho, kiểm kê, đề nghị xuất, soạn hàng, xuất kho, trả nội bộ và quản trị. Rủi ro nổi bật nằm ở quy mô Power Fx lớn, truy cập dữ liệu trực tiếp, số lượng cảnh báo accessibility cao và sự phụ thuộc đồng thời vào SQL cùng nhiều flow.

## 3. Kiến trúc tổng thể

| LỚP | CÔNG NGHỆ | TRÁCH NHIỆM |
| --- | --- | --- |
| Người dùng | Desktop / tablet / thiết bị cầm tay | Thao tác nghiệp vụ theo vai trò |
| Lớp ứng dụng | Power Apps Canvas | Giao diện, điều phối thao tác, validation và trạng thái cục bộ |
| Lớp tích hợp | Power Automate / Logic Flows | Gọi stored procedure, HTTP, xử lý tệp và tích hợp ngoài |
| Lớp dữ liệu | SQL Server – MMS | Bảng giao dịch, danh mục, view tổng hợp và stored procedure |
| Lưu trữ tệp | Azure Blob Storage | Ảnh nhận hàng và tài nguyên liên quan |
| Phân tích | Power BI | Hiển thị dashboard tại ứng dụng desktop |

Luồng chuẩn  Người dùng → Power Apps → SQL trực tiếp hoặc Flow → Stored procedure / bảng / view → phản hồi trạng thái → ghi log và hiển thị kết quả.

## 4. Tác nhân nghiệp vụ

| MÃ | TÁC NHÂN | TRÁCH NHIỆM |
| --- | --- | --- |
| ACT-01 | Nhân viên nhận hàng | Tạo/điều chỉnh thông tin nhận hàng có PO hoặc không PO, ảnh và chi tiết vật tư. |
| ACT-02 | Nhân viên QC | Lập phiếu kiểm, đánh giá vật tư, cập nhật kết quả và tra cứu lịch sử QC. |
| ACT-03 | Thủ kho | Nhập kho, lưu kho, chuyển vị trí, kiểm kê, soạn và xuất hàng. |
| ACT-04 | Bộ phận yêu cầu / sản xuất | Lập đề nghị xuất theo kế hoạch, ngoài kế hoạch hoặc vượt định mức. |
| ACT-05 | Người phê duyệt | Xem xét và quyết định các đề nghị/phiếu thuộc luồng phê duyệt. |
| ACT-06 | Quản lý kho | Theo dõi tồn kho, nhật ký, ngoại lệ và điều phối hoạt động kho. |
| ACT-07 | Quản trị ứng dụng | Quản lý vai trò, quyền màn hình và cấu hình nghiệp vụ/QC. |
| ACT-08 | Hệ thống tích hợp | Flow, SQL, Blob và Power BI thực thi xử lý nền và cung cấp dữ liệu. |

## 5. Bản đồ use case

| NHÓM | TIỀN TỐ | SỐ UC | TÁC NHÂN CHÍNH |
| --- | --- | --- | --- |
| Xác thực & truy cập | AUTH | 2 | Tất cả người dùng, quản trị |
| Nhận hàng & nhập kho | INB | 8 | Nhận hàng, thủ kho |
| Kiểm soát chất lượng | QC | 6 | QC, quản trị QC |
| Tồn kho & truy vết | INV | 7 | Thủ kho, quản lý kho |
| Lưu kho & vị trí | LOC | 4 | Thủ kho |
| Đề nghị & xuất kho | OUT | 9 | Bộ phận yêu cầu, phê duyệt, thủ kho |
| Trả nội bộ | RET | 3 | Bộ phận trả, thủ kho |
| Quản trị & giám sát | ADM | 3 | Quản trị, quản lý kho |

## 6. Đặc tả use case chi tiết

Quy ước: mỗi use case là một đơn vị nghiệp vụ độc lập, có mã ổn định để dùng trong backlog, kiểm thử, tài liệu đào tạo và truy vết thay đổi.

### XÁC THỰC VÀ TRUY CẬP

#### AUTH-01  |  Đăng nhập hệ thống

Tác nhân: Tất cả người dùng

Mục tiêu: Xác thực người dùng và khởi tạo phiên làm việc.

Điều kiện trước: Tài khoản tồn tại và đang hoạt động.

Luồng chính: Nhập thông tin → đối chiếu danh mục người dùng → tải quyền/cấu hình → chuyển tới màn hình chính.

Ngoại lệ/kiểm soát: Sai thông tin hoặc tài khoản không hợp lệ: thông báo và giữ tại màn hình đăng nhập.

Màn hình: scr_login; scr_mob_login

Dữ liệu/xử lý: tbl_dm_user, tbl_user_ql, log_user_screen

#### AUTH-02  |  Hiển thị chức năng theo vai trò

Tác nhân: Người dùng, quản trị

Mục tiêu: Chỉ cho phép truy cập module/màn hình được cấp.

Điều kiện trước: Đăng nhập thành công.

Luồng chính: Đọc vai trò → đối chiếu role-screen → tạo menu/tác vụ khả dụng → ghi nhận màn hình truy cập.

Ngoại lệ/kiểm soát: Thiếu quyền: ẩn/vô hiệu hóa chức năng và ngăn điều hướng trực tiếp.

Màn hình: scr_main; scr_admin_role_app

Dữ liệu/xử lý: tbl_role, tbl_role_screen, tbl_dm_screen_pc

### NHẬN HÀNG VÀ NHẬP KHO

#### INB-01  |  Nhận hàng theo PO

Tác nhân: Nhân viên nhận hàng

Mục tiêu: Ghi nhận vật tư giao theo đơn đặt hàng.

Điều kiện trước: PO còn hiệu lực và còn số lượng nhận.

Luồng chính: Tìm PO → chọn dòng hàng → nhập số lượng/đơn vị/ghi chú → đính kèm ảnh → lưu phiếu.

Ngoại lệ/kiểm soát: PO không tồn tại, nhận vượt hoặc thiếu dữ liệu: cảnh báo và không hoàn tất.

Màn hình: scr_tam_nhanhang_po; scr_nhanhang_po; scr_nhanhang_po_chitiet

Dữ liệu/xử lý: tbl_ChiTietDDH, tbl_phieu_nhan_hang, tbl_chitiet_nhanhang

#### INB-02  |  Nhận hàng không PO

Tác nhân: Nhân viên nhận hàng

Mục tiêu: Ghi nhận lô hàng không gắn đơn đặt hàng.

Điều kiện trước: Người dùng có quyền nhận không PO.

Luồng chính: Nhập nhà cung cấp/nguồn → chọn vật tư → nhập số lượng → ảnh/ghi chú → tạo phiếu.

Ngoại lệ/kiểm soát: Vật tư không hợp lệ hoặc thiếu căn cứ: giữ phiếu ở trạng thái chưa hoàn tất.

Màn hình: scr_nhanhang_khong_po; scr_tam_nhanhang

Dữ liệu/xử lý: tbl_phieu_nhan_hang, tbl_chitiet_nhanhang

#### INB-03  |  Tạo mới và chỉnh sửa phiếu nhận

Tác nhân: Nhân viên nhận hàng

Mục tiêu: Bổ sung hoặc hiệu chỉnh phiếu trước khi xử lý tiếp.

Điều kiện trước: Phiếu ở trạng thái cho phép chỉnh sửa.

Luồng chính: Mở phiếu → sửa thông tin/chỉ tiêu → kiểm tra lại → lưu cập nhật.

Ngoại lệ/kiểm soát: Phiếu đã khóa hoặc đã nhập kho: từ chối cập nhật.

Màn hình: scr_nhanhang_po_nhapmoi; scr_nhanhang_po_edit

Dữ liệu/xử lý: tbl_phieu_nhan_hang, tbl_chitiet_nhanhang

#### INB-04  |  Tra cứu nhật ký nhận hàng

Tác nhân: Nhân viên nhận hàng, quản lý

Mục tiêu: Theo dõi lịch sử và trạng thái phiếu nhận.

Điều kiện trước: Có quyền xem nhật ký.

Luồng chính: Lọc theo ngày/PO/trạng thái → xem danh sách → mở chi tiết.

Ngoại lệ/kiểm soát: Không có dữ liệu phù hợp: hiển thị empty state.

Màn hình: scr_tam_nhanhang_log; scr_nhanhang_log

Dữ liệu/xử lý: vw_status_phieu_nhanhang, tbl_his_chitiet_nhanhang

#### INB-05  |  Cập nhật nhận hàng theo PO

Tác nhân: Thủ kho/nhận hàng desktop

Mục tiêu: Điều chỉnh chi tiết PO trước khi nhập kho.

Điều kiện trước: Phiếu nhận có PO và chưa chốt.

Luồng chính: Chọn phiếu → cập nhật dòng PO → kiểm tra số lượng → lưu.

Ngoại lệ/kiểm soát: Không khớp PO hoặc vượt số lượng: thông báo lỗi.

Màn hình: scr_nhapkho_update_po

Dữ liệu/xử lý: tbl_ChiTietDDH, tbl_chitiet_nhanhang

#### INB-06  |  Cập nhật nhiều PO

Tác nhân: Thủ kho/nhận hàng desktop

Mục tiêu: Gộp xử lý nhiều dòng PO trong một lượt.

Điều kiện trước: Các PO hợp lệ và cùng ngữ cảnh nhận.

Luồng chính: Chọn nhiều PO → đối chiếu dòng hàng → nhập số lượng → xác nhận cập nhật.

Ngoại lệ/kiểm soát: Dòng trùng hoặc sai đơn vị: loại dòng lỗi và yêu cầu sửa.

Màn hình: scr_nhapkho_update_nhieu_po

Dữ liệu/xử lý: tbl_ChiTietDDH, tbl_chitiet_nhanhang

#### INB-07  |  Thực hiện thủ tục nhập kho

Tác nhân: Thủ kho

Mục tiêu: Chuyển phiếu nhận đủ điều kiện thành tồn kho.

Điều kiện trước: Phiếu nhận hoàn tất; QC đạt hoặc có trạng thái cho phép.

Luồng chính: Chọn phiếu → kiểm tra chi tiết → xác nhận nhập → tạo batch và transaction → cập nhật trạng thái.

Ngoại lệ/kiểm soát: Dữ liệu không đồng nhất: rollback và trả thông báo.

Màn hình: scr_nhapkho_thutuc; scr_nhapkho_ql

Dữ liệu/xử lý: tbl_batch_inv, tbl_transaction, tbl_phieu_transaction; sp_insert_nhapkho

#### INB-08  |  Xem và in tem batch nhập

Tác nhân: Thủ kho

Mục tiêu: Nhận diện lô sau khi nhập kho.

Điều kiện trước: Batch được tạo thành công.

Luồng chính: Mở batch → xem thông tin → tạo nội dung tem → in/dán tem.

Ngoại lệ/kiểm soát: Thiếu mã vật tư hoặc đơn vị: cảnh báo trước khi in.

Màn hình: scr_nhapkho_batch

Dữ liệu/xử lý: vw_batch_print, tbl_batch_inv

### KIỂM SOÁT CHẤT LƯỢNG

#### QC-01  |  Khai báo nhóm và tiêu chí QC

Tác nhân: Quản trị QC

Mục tiêu: Duy trì bộ tiêu chí kiểm tra theo nhóm vật tư.

Điều kiện trước: Có quyền quản trị QC.

Luồng chính: Chọn nhóm → thêm/sửa tiêu chí → thiết lập cấp khai báo → lưu.

Ngoại lệ/kiểm soát: Trùng hoặc thiếu tiêu chí: không lưu và chỉ rõ trường lỗi.

Màn hình: scr_qc_update_nhom_admin; scr_qc_info_tieuchi

Dữ liệu/xử lý: tbl_nhom_qc, tbl_tieuchi_kiem, tbl_dm_tieuchi_kiem

#### QC-02  |  Gán cấu hình QC cho vật tư

Tác nhân: Quản trị QC

Mục tiêu: Ánh xạ vật tư/nhóm vật tư với mã kiểm.

Điều kiện trước: Vật tư và tiêu chí đã tồn tại.

Luồng chính: Tìm vật tư → chọn nhóm/mã kiểm → lưu → đồng bộ cờ kiểm tra đầu vào.

Ngoại lệ/kiểm soát: Ánh xạ không hợp lệ: từ chối và giữ cấu hình cũ.

Màn hình: scr_qc_update_vattu

Dữ liệu/xử lý: tbl_khaibao_qc, tbl_nhom_vattu_qc, tbl_dm_vattu; sp_update_ma_kiem

#### QC-03  |  Lập phiếu kiểm

Tác nhân: Nhân viên QC

Mục tiêu: Tạo hồ sơ kiểm tra cho phiếu nhận/vật tư.

Điều kiện trước: Phiếu nhận cần kiểm tra đầu vào.

Luồng chính: Chọn phiếu → tải tiêu chí → nhập kết quả → đính kèm ghi chú → lưu phiếu.

Ngoại lệ/kiểm soát: Thiếu tiêu chí bắt buộc: chưa cho hoàn tất.

Màn hình: scr_qc_phieukiem

Dữ liệu/xử lý: tbl_qc_phieu_kiem, tbl_qc_kiem, vw_tieuchi_kiem

#### QC-04  |  Đánh giá vật tư

Tác nhân: Nhân viên QC

Mục tiêu: Kết luận đạt/không đạt theo kết quả kiểm.

Điều kiện trước: Có phiếu kiểm và dữ liệu tiêu chí.

Luồng chính: Xem kết quả → đánh giá từng tiêu chí → kết luận → cập nhật trạng thái.

Ngoại lệ/kiểm soát: Kết quả mâu thuẫn hoặc thiếu: yêu cầu bổ sung.

Màn hình: scr_qc_danhgia_vattu; scr_qc_info_danhgia

Dữ liệu/xử lý: vw_danhgia_vattu_qc, vw_ketqua_vattu_qc

#### QC-05  |  Tra cứu và hiệu chỉnh lịch sử QC

Tác nhân: QC, quản lý

Mục tiêu: Theo dõi phiếu kiểm và sửa thông tin được phép.

Điều kiện trước: Có quyền xem/sửa lịch sử.

Luồng chính: Lọc phiếu → mở chi tiết → cập nhật trường được phép → lưu audit.

Ngoại lệ/kiểm soát: Phiếu đã khóa: chỉ cho xem.

Màn hình: scr_qc_log_phieu_kiem; scr_qc_log_phieu_nhanhang; scr_qc_log_info_edit

Dữ liệu/xử lý: tbl_qc_phieu_kiem, tbl_qc_kiem, vw_ketqua_phieu_qc

#### QC-06  |  In phiếu kiểm

Tác nhân: Nhân viên QC

Mục tiêu: Phát hành bản in kết quả kiểm tra.

Điều kiện trước: Phiếu kiểm đã có kết luận.

Luồng chính: Mở phiếu → dựng biểu mẫu → kiểm tra → in/xuất.

Ngoại lệ/kiểm soát: Dữ liệu thiếu: đánh dấu rõ và ngăn phát hành chính thức.

Màn hình: scr_qc_phieukiem_print

Dữ liệu/xử lý: vw_phieukiem_group_qc, vw_phieukiem_vattu_qc

### TỒN KHO VÀ TRUY VẾT

#### INV-01  |  Tra cứu tồn kho

Tác nhân: Thủ kho, quản lý

Mục tiêu: Xem tồn theo vật tư, batch và vị trí.

Điều kiện trước: Dữ liệu tồn đã đồng bộ.

Luồng chính: Nhập điều kiện → lọc tồn → xem chi tiết batch/vị trí.

Ngoại lệ/kiểm soát: Không có kết quả: phân biệt không tồn và không có quyền.

Màn hình: scr_tonkho_intem

Dữ liệu/xử lý: vw_tong_tonkho, v_ton_he_thong, v_ton_theo_vi_tri

#### INV-02  |  Tra cứu lịch sử batch

Tác nhân: Thủ kho, quản lý

Mục tiêu: Truy vết toàn bộ biến động của một lô.

Điều kiện trước: Có mã batch.

Luồng chính: Quét/nhập batch → tải giao dịch và sự kiện → hiển thị timeline.

Ngoại lệ/kiểm soát: Batch không tồn tại: thông báo rõ.

Màn hình: scr_his_id_batch

Dữ liệu/xử lý: tbl_transaction, tbl_batch_event, v_batch_event_full

#### INV-03  |  Tra cứu lịch sử vật tư

Tác nhân: Thủ kho, quản lý

Mục tiêu: Truy vết các batch và giao dịch theo vật tư.

Điều kiện trước: Có mã vật tư.

Luồng chính: Tìm vật tư → xem tồn/batch → mở lịch sử giao dịch.

Ngoại lệ/kiểm soát: Mã vật tư không hợp lệ: không truy vấn tiếp.

Màn hình: scr_his_vattu

Dữ liệu/xử lý: tbl_dm_vattu, v_transaction_all, v_batch_all

#### INV-04  |  Khai báo tồn kho

Tác nhân: Quản lý kho

Mục tiêu: Ghi nhận tồn ban đầu hoặc điều chỉnh được phê duyệt.

Điều kiện trước: Có căn cứ và quyền khai báo.

Luồng chính: Chọn vật tư → nhập số lượng/đơn vị/vị trí → xác nhận → tạo batch/transaction.

Ngoại lệ/kiểm soát: Thiếu căn cứ hoặc số lượng không hợp lệ: từ chối.

Màn hình: scr_tonkho_khaibao

Dữ liệu/xử lý: tbl_batch_inv, tbl_transaction; sp_insert_tonkho

#### INV-05  |  Tách batch

Tác nhân: Thủ kho

Mục tiêu: Tách một phần số lượng sang batch mới mà vẫn cân bằng tồn.

Điều kiện trước: Batch gốc còn đủ số lượng và trạng thái hợp lệ.

Luồng chính: Chọn batch → nhập số lượng tách → xác nhận → tạo batch mới và giao dịch đối ứng.

Ngoại lệ/kiểm soát: Nếu tồn batch và transaction lệch: rollback toàn bộ.

Màn hình: scr_nhapkho_tachbatch_intem

Dữ liệu/xử lý: tbl_batch_inv, tbl_transaction; sp_split_batch

#### INV-06  |  Kiểm kê theo batch

Tác nhân: Thủ kho

Mục tiêu: Đối chiếu số lượng thực tế của từng batch.

Điều kiện trước: Đợt kiểm kê đang mở.

Luồng chính: Quét batch → nhập số lượng thực tế → so sánh hệ thống → ghi nhận kết quả.

Ngoại lệ/kiểm soát: Sai batch/vị trí: cảnh báo và yêu cầu xác minh.

Màn hình: scr_kiemke_batch

Dữ liệu/xử lý: tbl_batch_inv; sp_kiemke_batch

#### INV-07  |  Kiểm kê theo vị trí kệ

Tác nhân: Thủ kho

Mục tiêu: Kiểm tra các batch tại một vị trí.

Điều kiện trước: Vị trí hợp lệ.

Luồng chính: Quét vị trí → tải danh sách batch → quét/đếm → xác nhận chênh lệch.

Ngoại lệ/kiểm soát: Batch ngoài vị trí: đánh dấu ngoại lệ.

Màn hình: scr_kiemke_vitri_ke

Dữ liệu/xử lý: tbl_dm_location, tbl_batch_inv, v_batch_location_all

### LƯU KHO VÀ VỊ TRÍ

#### LOC-01  |  Xem sơ đồ và danh mục vị trí

Tác nhân: Thủ kho, quản lý

Mục tiêu: Xác định vị trí lưu trữ khả dụng.

Điều kiện trước: Danh mục vị trí đã khai báo.

Luồng chính: Chọn khu vực/tầng/kệ → xem trạng thái → mở chi tiết.

Ngoại lệ/kiểm soát: Vị trí không hoạt động: không cho chọn.

Màn hình: scr_luukho_so_do; scr_luukho_vitri_ke

Dữ liệu/xử lý: tbl_dm_location, tbl_dm_location_ma_khu_vuc, tbl_dm_location_ma_tang

#### LOC-02  |  Đưa batch lên kệ

Tác nhân: Thủ kho

Mục tiêu: Gán batch vào vị trí lưu kho.

Điều kiện trước: Batch chưa có vị trí hoặc được phép chuyển.

Luồng chính: Quét batch → quét vị trí → kiểm tra sức chứa/quy tắc → xác nhận.

Ngoại lệ/kiểm soát: Sai vị trí hoặc batch: không cập nhật.

Màn hình: scr_luukho_len_ke; scr_luukho_ql

Dữ liệu/xử lý: tbl_batch_inv, tbl_location_event; sp_update_location

#### LOC-03  |  Đổi vị trí kệ

Tác nhân: Thủ kho

Mục tiêu: Di chuyển batch giữa các vị trí.

Điều kiện trước: Batch đang ở vị trí nguồn hợp lệ.

Luồng chính: Quét batch → xác nhận nguồn → quét đích → cập nhật và ghi sự kiện.

Ngoại lệ/kiểm soát: Đích không hợp lệ: giữ nguyên vị trí cũ.

Màn hình: scr_luukho_doi_ke

Dữ liệu/xử lý: tbl_batch_inv, tbl_location_event

#### LOC-04  |  Đưa batch xuống kệ

Tác nhân: Thủ kho

Mục tiêu: Xóa gán vị trí để phục vụ xuất/điều chuyển.

Điều kiện trước: Batch đang có vị trí.

Luồng chính: Quét batch → xác nhận → bỏ location → ghi sự kiện xuống kệ.

Ngoại lệ/kiểm soát: Batch không tìm thấy: trả Failure.

Màn hình: scr_luukho; scr_luukho_ql

Dữ liệu/xử lý: tbl_batch_inv, tbl_location_event; sp_update_xuong_ke

### ĐỀ NGHỊ VÀ XUẤT KHO

#### OUT-01  |  Lập đề nghị xuất theo kế hoạch

Tác nhân: Bộ phận yêu cầu

Mục tiêu: Tạo nhu cầu xuất bám kế hoạch/định mức.

Điều kiện trước: Kế hoạch và định mức đã khai báo.

Luồng chính: Chọn kế hoạch → chọn vật tư → nhập số lượng → kiểm tra phần còn lại → gửi đề nghị.

Ngoại lệ/kiểm soát: Vượt phần còn lại: chuyển luồng vượt hoặc yêu cầu điều chỉnh.

Màn hình: scr_denghi_xuatkho_planning; scr_mob_denghi_xuatkho_planning

Dữ liệu/xử lý: tbl_dm_kehoach, tbl_dinhmuc, tbl_phieu_yeucau

#### OUT-02  |  Lập đề nghị ngoài kế hoạch

Tác nhân: Bộ phận yêu cầu

Mục tiêu: Tạo đề nghị không gắn kế hoạch sản xuất.

Điều kiện trước: Có lý do nghiệp vụ.

Luồng chính: Chọn vật tư → nhập số lượng/lý do → gửi đề nghị.

Ngoại lệ/kiểm soát: Thiếu lý do hoặc dữ liệu: không gửi.

Màn hình: scr_denghi_xuatkho_no_planning; scr_mob_denghi_xuatkho_no_planning

Dữ liệu/xử lý: tbl_phieu_yeucau, tbl_phieu_yeucau_chitiet

#### OUT-03  |  Lập đề nghị vượt định mức

Tác nhân: Bộ phận yêu cầu

Mục tiêu: Xin xuất số lượng vượt kế hoạch/định mức.

Điều kiện trước: Có kế hoạch và căn cứ vượt.

Luồng chính: Chọn dòng vượt → nhập số lượng/lý do → gửi phê duyệt tăng cường.

Ngoại lệ/kiểm soát: Không có quyền hoặc thiếu căn cứ: từ chối.

Màn hình: scr_denghi_xuatkho_planning_vuot; scr_mob_denghi_xuatkho_planning_vuot

Dữ liệu/xử lý: tbl_kehoach_dinhmuc, tbl_flow_pheduyet

#### OUT-04  |  Chỉnh sửa đề nghị/bao bì

Tác nhân: Bộ phận yêu cầu, admin

Mục tiêu: Sửa đề nghị còn ở trạng thái cho phép.

Điều kiện trước: Phiếu chưa phê duyệt/chưa soạn.

Luồng chính: Mở phiếu → chỉnh vật tư/số lượng/bao bì → kiểm tra → lưu.

Ngoại lệ/kiểm soát: Phiếu đã xử lý: chỉ xem hoặc tạo yêu cầu thay đổi.

Màn hình: scr_chinhsua_denghi_baobi; scr_admin_chinhsua_denghi

Dữ liệu/xử lý: tbl_phieu_yeucau, tbl_phieu_yeucau_chitiet

#### OUT-05  |  Theo dõi và phê duyệt đề nghị

Tác nhân: Người phê duyệt, bộ phận yêu cầu

Mục tiêu: Ra quyết định và theo dõi trạng thái đề nghị.

Điều kiện trước: Phiếu đã gửi và có luồng phê duyệt.

Luồng chính: Mở danh sách → xem chi tiết/căn cứ → duyệt hoặc từ chối → ghi lịch sử.

Ngoại lệ/kiểm soát: Thiếu người duyệt hoặc trạng thái đổi đồng thời: tải lại và không ghi đè.

Màn hình: scr_denghi_xuatkho_request; scr_denghi_xuatkho_log

Dữ liệu/xử lý: tbl_pheduyet_flow, tbl_pheduyet_process, tbl_his_pheduyet

#### OUT-06  |  Lập danh sách soạn hàng

Tác nhân: Thủ kho

Mục tiêu: Chuyển phiếu đã duyệt thành nhiệm vụ soạn.

Điều kiện trước: Phiếu được duyệt và còn nhu cầu.

Luồng chính: Chọn phiếu → tải chi tiết → phân bổ tồn → tạo danh sách soạn.

Ngoại lệ/kiểm soát: Thiếu tồn: hiển thị thiếu hụt và không xác nhận đủ.

Màn hình: scr_soanhang; scr_soanhang_chitiet

Dữ liệu/xử lý: v_yeucau_soanhang, vw_status_soan_vattu

#### OUT-07  |  Soạn hàng theo batch

Tác nhân: Thủ kho

Mục tiêu: Chọn đúng batch và số lượng để xuất.

Điều kiện trước: Danh sách soạn đã tạo.

Luồng chính: Quét batch → kiểm tra vật tư/vị trí → nhập số lượng → xác nhận dòng soạn.

Ngoại lệ/kiểm soát: Sai batch, thiếu tồn hoặc sai vị trí: cảnh báo tức thời.

Màn hình: scr_soanhang_batch

Dữ liệu/xử lý: vw_batch_xuatkho, tbl_batch_inv

#### OUT-08  |  Xuất kho trực tiếp/thủ tục xuất

Tác nhân: Thủ kho

Mục tiêu: Ghi giảm tồn và hoàn tất giao dịch xuất.

Điều kiện trước: Phiếu đủ điều kiện hoặc có quyền xuất trực tiếp.

Luồng chính: Kiểm tra chi tiết → xác nhận xuất → tạo transaction → cập nhật tồn và trạng thái phiếu.

Ngoại lệ/kiểm soát: Bất nhất tồn: rollback và báo lỗi.

Màn hình: scr_xuatkho_tructiep; scr_xuatkho_thutuc

Dữ liệu/xử lý: tbl_transaction, tbl_batch_inv; sp_insert_xuatkho

#### OUT-09  |  In phiếu xuất kho

Tác nhân: Thủ kho, quản lý

Mục tiêu: Phát hành chứng từ xuất.

Điều kiện trước: Giao dịch xuất hoàn tất.

Luồng chính: Mở phiếu → chọn mẫu → kiểm tra dữ liệu → in.

Ngoại lệ/kiểm soát: Thiếu thông tin chứng từ: không đánh dấu đã phát hành.

Màn hình: scr_xuatkho_phieu_print; scr_xuatkho_phieu_print_20

Dữ liệu/xử lý: vw_phieu_xuatkho, tbl_phieu_transaction

### TRẢ NỘI BỘ

#### RET-01  |  Lập phiếu trả nội bộ

Tác nhân: Bộ phận trả

Mục tiêu: Ghi nhận vật tư trả về kho.

Điều kiện trước: Vật tư và đơn vị trả hợp lệ.

Luồng chính: Tạo phiếu → nhập chi tiết/số lượng/lý do → gửi kho xác nhận.

Ngoại lệ/kiểm soát: Thiếu vật tư hoặc số lượng không hợp lệ: không gửi.

Màn hình: scr_phieutra_noibo

Dữ liệu/xử lý: tbl_phieu_nhap_noibo, tbl_chitiet_nhap_noibo

#### RET-02  |  Kho xác nhận phiếu trả nội bộ

Tác nhân: Thủ kho

Mục tiêu: Chấp nhận đạt, không đạt hoặc từ chối phiếu trả.

Điều kiện trước: Phiếu đang chờ xử lý.

Luồng chính: Mở phiếu → kiểm tra → chọn kết quả → tạo batch/transaction nếu nhận → hoàn tất.

Ngoại lệ/kiểm soát: Phiếu không có chi tiết hoặc đã xử lý: rollback/từ chối.

Màn hình: scr_thukho_xacnhan_noibo

Dữ liệu/xử lý: usp_xacnhan_phieu_nhap_noibo, tbl_phieu_nhap_noibo

#### RET-03  |  Tách batch nhập trả

Tác nhân: Thủ kho

Mục tiêu: Tách phần vật tư trả thành batch độc lập.

Điều kiện trước: Batch nguồn và số lượng trả hợp lệ.

Luồng chính: Chọn batch → nhập số lượng trả → tách → gắn với luồng nhập trả.

Ngoại lệ/kiểm soát: Không đủ tồn hoặc lệch transaction: rollback.

Màn hình: scr_nhaptra_tachbatch_intem

Dữ liệu/xử lý: sp_split_batch, sp_insert_nhaptra

### QUẢN TRỊ VÀ GIÁM SÁT

#### ADM-01  |  Quản lý vai trò và quyền màn hình

Tác nhân: Quản trị ứng dụng

Mục tiêu: Duy trì ma trận quyền truy cập.

Điều kiện trước: Có quyền quản trị.

Luồng chính: Chọn vai trò → chọn màn hình → lưu ánh xạ → áp dụng khi đăng nhập.

Ngoại lệ/kiểm soát: Cấu hình khiến mất quyền quản trị cuối cùng: cần chặn/xác nhận tăng cường.

Màn hình: scr_admin_role_app

Dữ liệu/xử lý: tbl_role, tbl_role_screen, tbl_dm_screen_pc

#### ADM-02  |  Quản trị danh mục và cấu hình

Tác nhân: Quản trị ứng dụng/QC

Mục tiêu: Duy trì dữ liệu nền phục vụ nghiệp vụ.

Điều kiện trước: Có quyền phù hợp.

Luồng chính: Chọn danh mục → thêm/sửa → kiểm tra tham chiếu → lưu.

Ngoại lệ/kiểm soát: Bản ghi đang được tham chiếu: không xóa cứng.

Màn hình: Các màn hình admin/QC

Dữ liệu/xử lý: tbl_dm_*, tbl_khaibao_qc, tbl_nhom_vattu_qc

#### ADM-03  |  Theo dõi log và dashboard

Tác nhân: Quản lý kho, quản trị

Mục tiêu: Giám sát hoạt động, trạng thái và ngoại lệ.

Điều kiện trước: Có quyền xem dữ liệu tổng hợp.

Luồng chính: Chọn kỳ/bộ lọc → xem KPI/log → mở chi tiết xử lý.

Ngoại lệ/kiểm soát: Dữ liệu chậm hoặc lỗi kết nối: hiển thị trạng thái và thời điểm cập nhật.

Màn hình: Các màn hình log; Power BI control

Dữ liệu/xử lý: log_user_screen, các view tổng hợp, Power BI

## 7. Danh mục màn hình ứng dụng

### 7.1 Ứng dụng desktop – Quản lý kho vật tư

| STT | MÀN HÌNH | KÊNH |
| --- | --- | --- |
| 1 | scr_login | Desktop |
| 2 | scr_main | Desktop |
| 3 | scr_nhapkho_update_po | Desktop |
| 4 | scr_nhapkho_update_nhieu_po | Desktop |
| 5 | scr_nhapkho_thutuc | Desktop |
| 6 | scr_nhapkho_ql | Desktop |
| 7 | scr_nhapkho_batch | Desktop |
| 8 | scr_tam_nhanhang | Desktop |
| 9 | scr_tam_nhanhang_po | Desktop |
| 10 | scr_tam_nhanhang_log | Desktop |
| 11 | scr_qc_update_nhom_admin | Desktop |
| 12 | scr_qc_update_vattu | Desktop |
| 13 | scr_qc_info_tieuchi | Desktop |
| 14 | scr_qc_phieukiem | Desktop |
| 15 | scr_qc_phieukiem_print | Desktop |
| 16 | scr_xuatkho_tructiep | Desktop |
| 17 | scr_xuatkho_thutuc | Desktop |
| 18 | scr_xuatkho_phieu_print | Desktop |
| 19 | scr_xuatkho_phieu_print_20 | Desktop |
| 20 | scr_denghi_xuatkho_request | Desktop |
| 21 | scr_denghi_xuatkho_no_planning | Desktop |
| 22 | scr_denghi_xuatkho_planning | Desktop |
| 23 | scr_denghi_xuatkho_planning_vuot | Desktop |
| 24 | scr_denghi_xuatkho_log | Desktop |
| 25 | scr_chinhsua_denghi_baobi | Desktop |
| 26 | scr_admin_chinhsua_denghi | Desktop |
| 27 | scr_admin_role_app | Desktop |
| 28 | scr_luukho | Desktop |
| 29 | scr_luukho_ql | Desktop |
| 30 | scr_luukho_so_do | Desktop |
| 31 | scr_mob_login | Desktop |
| 32 | scr_mob_denghi_xuatkho_no_planning | Desktop |
| 33 | scr_mob_denghi_xuatkho_planning | Desktop |
| 34 | scr_mob_denghi_xuatkho_planning_vuot | Desktop |
| 35 | scr_mob_denghi_xuatkho_log | Desktop |
| 36 | scr_phieutra_noibo | Desktop |
| 37 | scr_thukho_xacnhan_noibo | Desktop |

### 7.2 Ứng dụng mobile – Kho vật tư

| STT | MÀN HÌNH | KÊNH |
| --- | --- | --- |
| 1 | scr_login | Mobile |
| 2 | scr_main | Mobile |
| 3 | scr_nhanhang_log | Mobile |
| 4 | scr_nhanhang_po_edit | Mobile |
| 5 | scr_nhanhang_khong_po | Mobile |
| 6 | scr_nhanhang_po | Mobile |
| 7 | scr_nhanhang_po_chitiet | Mobile |
| 8 | scr_nhanhang_po_nhapmoi | Mobile |
| 9 | scr_qc_info_danhgia | Mobile |
| 10 | scr_qc_log_phieu_kiem | Mobile |
| 11 | scr_qc_log_phieu_nhanhang | Mobile |
| 12 | scr_qc_log_info_edit | Mobile |
| 13 | scr_qc_danhgia_vattu | Mobile |
| 14 | scr_kiemke_batch | Mobile |
| 15 | scr_nhapkho_tachbatch_intem | Mobile |
| 16 | scr_luukho_vitri_ke | Mobile |
| 17 | scr_luukho_len_ke | Mobile |
| 18 | scr_luukho_doi_ke | Mobile |
| 19 | scr_tonkho_intem | Mobile |
| 20 | scr_tonkho_khaibao | Mobile |
| 21 | scr_soanhang | Mobile |
| 22 | scr_soanhang_chitiet | Mobile |
| 23 | scr_soanhang_batch | Mobile |
| 24 | scr_his_id_batch | Mobile |
| 25 | scr_his_vattu | Mobile |
| 26 | scr_kiemke_vitri_ke | Mobile |
| 27 | scr_nhaptra_tachbatch_intem | Mobile |

## 8. Mô hình dữ liệu nghiệp vụ

| NHÓM | ĐỐI TƯỢNG CHÍNH | Ý NGHĨA |
| --- | --- | --- |
| Danh mục | tbl_dm_vattu, tbl_dm_user, tbl_dm_location, tbl_dm_nghiepvu_kho, tbl_dm_kehoach | Vật tư, người dùng, vị trí, nghiệp vụ, kế hoạch |
| Nhận hàng | tbl_phieu_nhan_hang, tbl_chitiet_nhanhang, tbl_phieu_nhan_hang_image | Phiếu, dòng vật tư và ảnh |
| QC | tbl_qc_phieu_kiem, tbl_qc_kiem, tbl_khaibao_qc, tbl_tieuchi_kiem | Phiếu kiểm, kết quả và cấu hình |
| Tồn kho | tbl_batch_inv, tbl_transaction, tbl_phieu_transaction | Số dư batch, biến động và chứng từ |
| Vị trí | tbl_batch_event, tbl_location_event, tbl_dm_location_event | Lịch sử batch và vị trí |
| Đề nghị xuất | tbl_phieu_yeucau, tbl_phieu_yeucau_chitiet, tbl_dinhmuc | Nhu cầu, chi tiết và định mức |
| Phê duyệt | tbl_flow_pheduyet, tbl_pheduyet_process, tbl_his_pheduyet | Luồng, bước xử lý và lịch sử |
| Trả nội bộ | tbl_phieu_nhap_noibo, tbl_chitiet_nhap_noibo | Phiếu trả và dòng vật tư |
| Phân quyền | tbl_role, tbl_role_screen, tbl_dm_screen_pc | Vai trò và màn hình được phép |

## 9. Tích hợp và phụ thuộc

| THÀNH PHẦN | MỤC ĐÍCH | MỨC PHỤ THUỘC | KIỂM SOÁT |
| --- | --- | --- | --- |
| SQL connector | Đọc/ghi bảng và view MMS | Cao | Mất kết nối ảnh hưởng hầu hết chức năng |
| Logic Flows | Thực thi xử lý nghiệp vụ và stored procedure | Cao | Cần quản lý owner, connection reference và retry |
| Azure Blob Storage | Lưu/đọc ảnh | Trung bình | Cần chính sách quyền và vòng đời tệp |
| HTTP integration | Trao đổi với hệ thống/dịch vụ khác | Trung bình | Cần timeout, xác thực và log lỗi |
| Power BI | Dashboard trên desktop | Thấp–trung bình | Không nên chặn luồng vận hành chính |

## 10. Chất lượng hiện trạng

| KHÍA CẠNH | HIỆN TRẠNG | ĐÁNH GIÁ | HÀNH ĐỘNG |
| --- | --- | --- | --- |
| Parser/binding | 0 lỗi ở cả hai ứng dụng | Tốt | Duy trì kiểm tra trước phát hành |
| Accessibility | TabIndex, focus border, accessible label | Cần cải thiện | Ưu tiên control tương tác và luồng quét |
| Hiệu năng Power Fx | Refresh nhiều, CountRows Gallery.AllItems, ForAll mutation | Cần rà soát | Giảm gọi lặp, gom truy vấn, dùng Concurrent có kiểm soát |
| Tài nguyên | Có cảnh báo media không dùng | Trung bình | Dọn asset sau khi xác minh tham chiếu |
| Dữ liệu | Nhiều thao tác trực tiếp và qua flow | Rủi ro nhất quán | Chuẩn hóa contract stored procedure và transaction |

## 11. Rủi ro và khuyến nghị

| MÃ | MỨC | RỦI RO | KHUYẾN NGHỊ |
| --- | --- | --- | --- |
| R-01 | Cao | Thông tin xác thực/connection bị chia sẻ thủ công | Dùng connection reference, secret vault; xoay vòng mật khẩu đã lộ. |
| R-02 | Cao | Quyền thực tế chưa được kiểm chứng trong hồ sơ | Xuất ma trận role-screen từ môi trường vận hành và phê duyệt định kỳ. |
| R-03 | Cao | Logic nghiệp vụ phân tán giữa Power Fx, flow và SQL | Xác định owner; chuyển rule trọng yếu về stored procedure có contract chuẩn. |
| R-04 | Trung bình | Số lượng cảnh báo accessibility lớn | Lập backlog theo màn hình ưu tiên; hoàn tất label, focus, keyboard navigation. |
| R-05 | Trung bình | Refresh và thao tác collection có thể gây chậm | Đo thời gian tải; giảm truy vấn lặp và tránh mutation trong ForAll. |
| R-06 | Trung bình | Tên màn hình/đối tượng chưa hoàn toàn nhất quán | Ban hành naming convention và mapping tên kỹ thuật–nghiệp vụ. |
| R-07 | Trung bình | Stored procedure gồm cả đối tượng replication/system-generated | Tách danh mục SP nghiệp vụ khỏi SP hệ thống khi quản trị phiên bản. |

## 12. Ma trận truy vết kiểm thử

Mỗi use case nên có tối thiểu một kiểm thử luồng chính, một kiểm thử validation và một kiểm thử phân quyền. Các nhóm ưu tiên phát hành:

| ƯU TIÊN | USE CASE | TRỌNG TÂM |
| --- | --- | --- |
| P0 | AUTH-01/02, INB-07, INV-05, OUT-08, RET-02 | Bảo mật, giao dịch tồn và rollback |
| P1 | INB-01–06/08, QC-03–06, INV-01–07, LOC-01–04, OUT-01–07/09 | Nghiệp vụ vận hành hằng ngày |
| P2 | QC-01/02, ADM-01–03 | Cấu hình và quản trị |

## 13. Quản trị hồ sơ

- Owner nghiệp vụ: Quản lý kho và đại diện các bộ phận Nhận hàng, QC, Sản xuất.

- Owner kỹ thuật: Nhóm Smart Factory/Power Platform và quản trị SQL Server.

- Cập nhật hồ sơ khi thay đổi màn hình, role, datasource, stored procedure hoặc business rule.

- Mỗi thay đổi cần liên kết tới mã use case, bằng chứng kiểm thử và kế hoạch rollback.

- Rà soát tối thiểu mỗi quý hoặc ngay sau một bản phát hành lớn.

## Phụ lục A. Chỉ số kỹ thuật tham chiếu

| PHẠM VI | CHỈ SỐ |
| --- | --- |
| Desktop Power Fx | Patch 97; Refresh 174; Notify 138; Filter 170; LookUp 107 |
| Mobile Power Fx | Patch 15; Refresh 129; Notify 75; Filter 56; LookUp 60 |
| App Checker desktop | 984 TabIndex; 508 focus border; 500 accessible label; các cảnh báo khác |
| App Checker mobile | 376 TabIndex; 216 accessible label; 69 focus border; các cảnh báo khác |

## Phụ lục B. Quy ước trạng thái hồ sơ

| TRẠNG THÁI | Ý NGHĨA |
| --- | --- |
| Đã xác minh cấu trúc | Có bằng chứng từ gói ứng dụng hoặc schema SQL. |
| Suy luận nghiệp vụ | Được suy ra từ tên màn hình, công thức và đối tượng dữ liệu; cần owner xác nhận. |
| Chưa xác minh dữ liệu vận hành | Không trích xuất dữ liệu người dùng, phân quyền hoặc giao dịch thực tế. |
