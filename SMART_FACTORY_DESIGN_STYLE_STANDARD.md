# SMART FACTORY DESIGN STYLE STANDARD

**Tiêu chuẩn phong cách thiết kế cho ứng dụng, dashboard, báo cáo và slide**  
**Phiên bản:** 1.0  
**Ngày ban hành:** 11/08/2026  
**Phạm vi áp dụng:** Hệ sinh thái Smart Factory – Kềm Nghĩa Sài Gòn

---

## 1. Mục đích

Tài liệu này thiết lập ngôn ngữ thiết kế thống nhất cho toàn bộ hệ sinh thái Smart Factory, bao gồm:

- Ứng dụng web và portal nội bộ.
- Các module WMS, MES/Digital Production, MMS, QC/KPH/CAPA, OEM, HR và các module tương lai.
- Dashboard vận hành và dashboard quản trị.
- Báo cáo, tài liệu nghiệp vụ và biểu mẫu.
- Slide trình bày nội bộ và trình bày cấp lãnh đạo.
- Màn hình kiosk, tablet và thiết bị vận hành tại hiện trường.

Mục tiêu không phải làm mọi sản phẩm giống hệt nhau, mà bảo đảm người dùng luôn nhận ra cùng một hệ thống, hiểu thông tin nhanh và thực hiện đúng hành động.

---

## 2. Tuyên ngôn thiết kế

> **Rõ ràng trước trang trí. Dữ liệu trước cảm tính. Hành động trước hiệu ứng.**

Phong cách chủ đạo là **Industrial Minimalism**, kết hợp nguyên tắc của **Swiss / International Style**:

- Tối giản nhưng không sơ sài.
- Có cấu trúc và thứ bậc thông tin rõ ràng.
- Dùng lưới, khoảng trắng và typography để tổ chức nội dung.
- Đề cao dữ liệu thật, trạng thái thật và hành động thật.
- Hạn chế màu sắc, hiệu ứng và các yếu tố không tạo giá trị vận hành.
- Thiết kế cho môi trường nhà máy: nhanh, chính xác, dễ học và khó thao tác sai.

---

## 3. Các nguyên tắc cốt lõi

### 3.1. Business First

Mỗi màn hình phải phục vụ một quyết định, một tác vụ hoặc một nhu cầu theo dõi cụ thể. Không thêm biểu đồ, trường dữ liệu hoặc nút chức năng chỉ vì hệ thống có sẵn dữ liệu.

Trước khi thiết kế, phải trả lời được:

1. Ai sử dụng?
2. Người dùng cần hoàn thành công việc gì?
3. Thông tin nào cần thấy đầu tiên?
4. Quyết định nào cần đưa ra?
5. Sai sót nào phải phòng ngừa?
6. Trạng thái hoàn thành được xác định thế nào?

### 3.2. Clarity over Decoration

- Một màn hình có một mục tiêu chính.
- Một khu vực có một cấp thông tin chủ đạo.
- Một hành động chính được nhấn mạnh.
- Không dùng hình trang trí làm cạnh tranh với dữ liệu.
- Không dùng màu sắc thay cho cấu trúc nội dung.

### 3.3. Consistency over Creativity

Sự sáng tạo được áp dụng trong cách giải quyết bài toán, không phải bằng cách tự tạo màu, nút, icon hoặc layout mới cho từng module.

### 3.4. Data as Evidence

- KPI phải có tên, giá trị, đơn vị, kỳ dữ liệu và trạng thái.
- Biểu đồ phải trả lời được một câu hỏi quản trị.
- Không dùng hình minh họa thay cho bằng chứng.
- Không làm tròn hoặc rút gọn dữ liệu đến mức gây hiểu sai.

### 3.5. Action-oriented

- Trạng thái bất thường phải đi kèm khả năng xem nguyên nhân hoặc hành động tiếp theo.
- Cảnh báo phải cho biết: vấn đề gì, mức độ nào, ở đâu, từ khi nào và ai cần xử lý.
- Nút hành động phải dùng động từ rõ ràng: `Xác nhận nhập kho`, `Phê duyệt`, `Tạo lệnh bảo trì`.

### 3.6. Error Prevention

- Ưu tiên ngăn lỗi trước khi hiển thị thông báo lỗi.
- Hành động không hợp lệ phải bị vô hiệu hóa hoặc ẩn theo quyền.
- Hành động khó hoàn tác phải có xác nhận và mô tả tác động.
- Không dùng chỉ màu sắc để truyền đạt lỗi hoặc trạng thái.

### 3.7. Designed for the Factory Floor

- Nội dung chính phải đọc được nhanh trong điều kiện ánh sáng không ổn định.
- Vùng chạm trên tablet hoặc kiosk phải đủ lớn.
- Các thao tác quét mã phải có phản hồi tức thời bằng chữ, màu và âm thanh khi phù hợp.
- Luồng vận hành lặp lại phải giảm tối đa số lần bấm và nhập liệu.

---

## 4. Tỷ lệ phong cách

| Thành phần | Tỷ lệ định hướng | Vai trò |
|---|---:|---|
| Trắng, đen, xám | 80–90% | Nền, cấu trúc, nội dung và phân cấp |
| Màu nhấn chính | 10–20% | Hành động chính, lựa chọn, điểm cần chú ý |
| Màu trạng thái | Chỉ khi có ý nghĩa | Thành công, cảnh báo, lỗi, thông tin |

Màu nhấn không dùng để trang trí toàn bộ giao diện. Màu trạng thái không được thay thế bằng màu nhấn thương hiệu.

---

## 5. Hệ thống màu sắc

### 5.1. Bảng màu nền tảng

| Token | Mã màu | Mục đích |
|---|---|---|
| `color-neutral-0` | `#FFFFFF` | Nền chính, card |
| `color-neutral-50` | `#F7F8FA` | Nền phụ, vùng nhóm |
| `color-neutral-100` | `#ECEFF3` | Đường phân cách nhẹ, trạng thái hover nhẹ |
| `color-neutral-300` | `#C5CBD3` | Border, control disabled |
| `color-neutral-500` | `#6B7280` | Nội dung phụ, metadata |
| `color-neutral-700` | `#374151` | Nội dung thứ cấp |
| `color-neutral-900` | `#111827` | Nội dung chính, tiêu đề |
| `color-neutral-1000` | `#000000` | Chỉ dùng khi cần tương phản tối đa |

### 5.2. Màu nhấn chính

| Token | Mã màu | Mục đích |
|---|---|---|
| `color-primary-50` | `#EAF3FA` | Nền lựa chọn hoặc thông tin nhẹ |
| `color-primary-100` | `#D2E6F5` | Hover hoặc vùng được chọn |
| `color-primary-600` | `#0067A5` | Nút chính, link, focus, dữ liệu trọng tâm |
| `color-primary-700` | `#005486` | Hover của nút chính |
| `color-primary-800` | `#003F66` | Active hoặc tiêu đề nhấn |

Màu nhấn đề xuất là **Industrial Blue `#0067A5`**. Khi có Brand Guideline chính thức của công ty, bảng màu này phải được đối chiếu và phê duyệt lại.

### 5.3. Màu trạng thái

| Trạng thái | Màu chính | Nền nhạt | Ví dụ sử dụng |
|---|---|---|---|
| Success / Bình thường | `#18794E` | `#EAF7F0` | Hoàn thành, đạt chuẩn, máy đang chạy |
| Warning / Cảnh báo | `#A15C00` | `#FFF4D6` | Sắp trễ, cần theo dõi, tồn thấp |
| Danger / Nghiêm trọng | `#C62828` | `#FDECEC` | Lỗi, dừng máy, quá hạn, không phù hợp |
| Information | `#0067A5` | `#EAF3FA` | Hướng dẫn, trạng thái trung tính |

Quy tắc:

- Luôn kết hợp màu với icon, nhãn hoặc nội dung chữ.
- Không sử dụng đỏ cho nội dung không phải lỗi hoặc rủi ro.
- Không sử dụng xanh lá chỉ để làm giao diện “đẹp hơn”.
- Một trạng thái phải có cùng màu trên mọi module.

---

## 6. Typography

### 6.1. Font chữ

**Ứng dụng và dashboard:** `Inter`, dự phòng `Segoe UI`, `Arial`, `sans-serif`.  
**Tài liệu và slide:** `Aptos`, `Arial` hoặc font thương hiệu đã được phê duyệt.  
**Mã, ID và dữ liệu kỹ thuật:** `JetBrains Mono`, `Consolas`, `monospace`.

Không dùng quá hai họ font trong cùng một sản phẩm.

### 6.2. Thang chữ cho ứng dụng

| Style | Cỡ chữ | Line height | Weight | Mục đích |
|---|---:|---:|---:|---|
| Display | 32 px | 40 px | 600 | KPI hoặc tiêu đề đặc biệt |
| H1 | 28 px | 36 px | 600 | Tiêu đề trang |
| H2 | 22 px | 30 px | 600 | Tiêu đề khu vực |
| H3 | 18 px | 26 px | 600 | Tiêu đề card/nhóm |
| Body | 14–16 px | 22–24 px | 400 | Nội dung chính |
| Label | 13–14 px | 18–20 px | 500 | Nhãn trường, nút |
| Caption | 12 px | 16 px | 400 | Metadata, ghi chú |

### 6.3. Quy tắc typography

- Căn trái cho nội dung và nhãn; số trong bảng được căn phải.
- Dùng sentence case: `Quản lý nhập kho`, không dùng `QUẢN LÝ NHẬP KHO` cho đoạn dài.
- Chữ in hoa chỉ dùng cho mã, nhãn ngắn hoặc trạng thái đặc biệt.
- Không dùng italic cho nội dung vận hành chính.
- Không dùng nhiều hơn ba mức weight trên một màn hình.
- Giá trị số và đơn vị phải tách rõ: `1.250 pcs`, `92,4%`, `35 phút`.

---

## 7. Grid, spacing và bố cục

### 7.1. Hệ lưới

- Desktop: lưới 12 cột.
- Tablet: lưới 8 cột.
- Mobile hoặc thiết bị cầm tay: lưới 4 cột.
- Chiều rộng nội dung tối đa đề xuất: 1440 px.
- Sidebar cố định: 240–280 px; collapsed: 64–72 px.

### 7.2. Spacing system

Sử dụng hệ số cơ sở **4 px**:

`4, 8, 12, 16, 24, 32, 48, 64`

| Khoảng cách | Sử dụng |
|---:|---|
| 4 px | Khoảng rất nhỏ giữa icon và nhãn phụ |
| 8 px | Khoảng giữa các thành phần liên quan |
| 12–16 px | Padding control hoặc nhóm nhỏ |
| 24 px | Padding card và khoảng giữa các nhóm |
| 32–48 px | Khoảng giữa các section |
| 64 px | Phân tách vùng nội dung lớn |

Không sử dụng các giá trị tùy ý như 13 px, 19 px hoặc 27 px nếu không có lý do kỹ thuật rõ ràng.

### 7.3. Phân cấp bố cục

Mỗi trang ứng dụng nên theo cấu trúc:

1. Breadcrumb hoặc ngữ cảnh module.
2. Tiêu đề trang và trạng thái tổng quan.
3. Hành động chính.
4. Bộ lọc hoặc điều kiện tìm kiếm.
5. Nội dung chính.
6. Thông tin hỗ trợ, lịch sử hoặc audit.

---

## 8. Shape, border, shadow và icon

### 8.1. Shape

| Thành phần | Border radius |
|---|---:|
| Button, input, tag | 4–6 px |
| Card, modal | 6–8 px |
| Badge trạng thái | 999 px hoặc 4 px theo loại |

Không sử dụng bo góc lớn kiểu ứng dụng giải trí. Giao diện công nghiệp cần cảm giác chắc chắn, chính xác và có cấu trúc.

### 8.2. Border và shadow

- Border mặc định: `1px solid #C5CBD3`.
- Card ưu tiên border nhẹ thay vì shadow.
- Shadow chỉ dùng để thể hiện lớp nổi như modal, menu hoặc popover.
- Không dùng glow, gradient mạnh hoặc glassmorphism.

### 8.3. Icon

- Dùng một bộ icon duy nhất trong toàn hệ thống.
- Kích thước chuẩn: 16, 20 hoặc 24 px.
- Icon phải đi cùng nhãn khi ý nghĩa chưa phổ biến.
- Không dùng emoji làm icon nghiệp vụ chính thức.
- Không trộn icon outline và filled tùy ý.

---

## 9. Tiêu chuẩn component ứng dụng

### 9.1. Button

| Loại | Mục đích | Ví dụ |
|---|---|---|
| Primary | Hành động chính của màn hình | `Xác nhận nhập kho` |
| Secondary | Hành động hỗ trợ | `Lưu nháp` |
| Tertiary / Text | Hành động ít ưu tiên | `Xem lịch sử` |
| Danger | Hành động phá hủy hoặc khó hoàn tác | `Hủy phiếu` |

Quy tắc:

- Mỗi vùng chức năng chỉ có một nút Primary.
- Nhãn nút bắt đầu bằng động từ.
- Không dùng màu đỏ cho nút thông thường.
- Hành động không khả dụng phải có nguyên nhân khi người dùng cần biết.
- Trạng thái loading phải khóa thao tác lặp và giữ nguyên nhãn hành động.

### 9.2. Form

- Nhãn đặt phía trên trường nhập, không dùng placeholder thay cho label.
- Trường bắt buộc phải được chỉ rõ và giải thích ở cấp form.
- Sắp xếp trường theo trình tự nghiệp vụ, không theo cấu trúc database.
- Giá trị mặc định phải an toàn và có thể dự đoán.
- Validation định dạng hiển thị sớm; validation nghiệp vụ hiển thị sau phản hồi hệ thống.
- Thông báo lỗi đặt gần trường liên quan và nêu cách sửa.
- Với quét mã, focus phải tự động trở lại trường quét sau khi xử lý.

### 9.3. Data table

- Header luôn hiển thị rõ và có thể sticky khi bảng dài.
- Số căn phải; chữ căn trái; trạng thái dùng badge có chữ.
- Cột quan trọng đặt bên trái; hành động đặt bên phải.
- Không hiển thị quá nhiều cột mặc định; cho phép người dùng mở chi tiết.
- Dùng phân trang hoặc virtual scrolling cho dữ liệu lớn.
- Hỗ trợ empty state, loading state và error state riêng biệt.
- Không dùng zebra striping quá đậm; ưu tiên border nhẹ và hover row.

### 9.4. Status badge

Mỗi module phải dùng một bảng ánh xạ trạng thái được quản trị tập trung.

Ví dụ:

| Trạng thái nghiệp vụ | Nhãn hiển thị | Semantic color |
|---|---|---|
| `DRAFT` | Nháp | Neutral |
| `PENDING_APPROVAL` | Chờ phê duyệt | Warning |
| `APPROVED` | Đã phê duyệt | Information hoặc Success theo ngữ cảnh |
| `COMPLETED` | Hoàn thành | Success |
| `REJECTED` | Từ chối | Danger |
| `CANCELLED` | Đã hủy | Neutral |

### 9.5. Modal và drawer

- Modal dùng cho quyết định ngắn, xác nhận hoặc nhập ít dữ liệu.
- Drawer dùng cho chi tiết phụ nhưng vẫn cần giữ ngữ cảnh trang.
- Không đặt quy trình dài nhiều bước trong modal.
- Modal nguy hiểm phải nêu đối tượng và hậu quả của hành động.

### 9.6. Notification

| Loại | Sử dụng |
|---|---|
| Inline message | Lỗi hoặc hướng dẫn gắn với vùng nội dung |
| Toast | Xác nhận hành động ngắn, không cần quyết định |
| Banner | Vấn đề ảnh hưởng toàn trang hoặc toàn hệ thống |
| Alert dialog | Cần người dùng xác nhận trước khi tiếp tục |

Không dùng toast cho lỗi nghiêm trọng mà người dùng có thể bỏ lỡ.

### 9.7. Empty, loading và error state

Mỗi màn hình dữ liệu phải thiết kế đủ bốn trạng thái:

1. Loading.
2. Có dữ liệu.
3. Không có dữ liệu.
4. Lỗi hoặc mất kết nối.

Empty state phải phân biệt `chưa có dữ liệu`, `không có kết quả tìm kiếm` và `không có quyền truy cập`.

---

## 10. Dashboard và Data Visualization

### 10.1. Nguyên tắc

Dashboard không phải nơi tập hợp mọi KPI. Mỗi dashboard phải phục vụ một cấp quản lý và một nhịp quyết định.

| Cấp sử dụng | Mục tiêu | Nhịp dữ liệu |
|---|---|---|
| Hiện trường | Phát hiện và xử lý bất thường | Realtime / theo ca |
| Giám sát | Điều phối nguồn lực và tiến độ | Theo giờ / theo ca |
| Quản lý | Theo dõi xu hướng và hiệu quả | Ngày / tuần / tháng |
| Lãnh đạo | Đánh giá mục tiêu và giá trị | Tuần / tháng / quý |

### 10.2. KPI card

Một KPI card tối thiểu phải có:

- Tên KPI.
- Giá trị hiện tại.
- Đơn vị.
- Kỳ dữ liệu.
- So sánh với mục tiêu hoặc kỳ trước.
- Trạng thái.
- Khả năng mở chi tiết khi cần.

Không hiển thị mũi tên tăng là màu xanh nếu KPI tăng lại là điều xấu, ví dụ downtime hoặc phế phẩm.

### 10.3. Chọn loại biểu đồ

| Câu hỏi | Loại biểu đồ ưu tiên |
|---|---|
| Thay đổi theo thời gian? | Line chart |
| So sánh giữa các nhóm? | Bar chart |
| Cơ cấu đóng góp? | Stacked bar; chỉ dùng pie khi rất ít nhóm |
| Mức độ đạt mục tiêu? | Bullet chart hoặc progress bar |
| Phân bố dữ liệu? | Histogram hoặc box plot |
| Quan hệ giữa hai biến? | Scatter plot |
| Vị trí hoặc khu vực? | Sơ đồ layout có lớp dữ liệu |

Không dùng biểu đồ 3D, gauge trang trí hoặc nhiều pie chart trên cùng một trang.

### 10.4. Quy tắc biểu đồ

- Tiêu đề phải thể hiện nội dung hoặc câu hỏi, không chỉ ghi tên chỉ số.
- Trục, đơn vị và thời gian phải rõ ràng.
- Bar chart thường bắt đầu từ 0; nếu không, phải cho biết rõ.
- Sử dụng màu xám cho dữ liệu nền, màu nhấn cho điểm cần chú ý.
- Không dùng quá sáu màu categorical nếu không thật sự cần thiết.
- Dùng direct label khi có thể, hạn chế bắt người đọc dò legend.
- Tooltip chỉ bổ sung chi tiết, không chứa thông tin duy nhất cần cho quyết định.
- Nêu nguồn dữ liệu và thời điểm cập nhật khi có ý nghĩa quản trị.

---

## 11. Tiêu chuẩn theo loại sản phẩm

### 11.1. Ứng dụng nghiệp vụ

- Ưu tiên hiệu quả thao tác, tính chính xác và khả năng truy vết.
- Tên trang và chức năng bám ngôn ngữ vận hành.
- Màn hình chi tiết thể hiện trạng thái, dữ liệu chính, lịch sử và hành động hợp lệ.
- Không đưa cấu trúc bảng SQL hoặc thuật ngữ kỹ thuật ra giao diện người dùng.

### 11.2. Màn hình hiện trường và kiosk

- Cỡ chữ nội dung chính tối thiểu 16 px.
- Vùng chạm tối thiểu 44 × 44 px; ưu tiên 48 × 48 px.
- Tương phản cao; hạn chế nội dung phụ.
- Phản hồi quét thành công hoặc thất bại phải rõ ràng trong dưới một giây khi hệ thống đáp ứng.
- Màn hình phải phục hồi hợp lý sau mất mạng hoặc timeout.

### 11.3. Dashboard quản trị

- Bắt đầu từ mục tiêu, KPI và ngoại lệ.
- Tóm tắt trước, chi tiết sau.
- Cho phép drill-down theo thời gian, xưởng, line, máy, sản phẩm hoặc đơn hàng khi phù hợp.
- Không đặt quá 5–7 KPI ưu tiên trên vùng nhìn đầu tiên.

### 11.4. Báo cáo và tài liệu

- Trang đầu nêu mục đích, phạm vi và kết luận chính.
- Dùng heading phân cấp; không đánh số thủ công thiếu nhất quán.
- Bảng phải có tiêu đề, đơn vị và nguồn dữ liệu.
- Kết luận phải tách khỏi mô tả dữ liệu.
- Quyết định, owner và thời hạn phải nhìn thấy rõ.

### 11.5. Slide trình bày

- Một slide truyền đạt một thông điệp chính.
- Tiêu đề nên là kết luận, không chỉ là tên chủ đề.
- Ưu tiên dữ liệu, sơ đồ và ví dụ thật hơn ảnh trang trí.
- Không dùng quá 2 font, 3 cỡ chữ chính và 1 màu nhấn.
- Biểu đồ trên slide phải đọc được từ xa.
- Logo đặt nhất quán, không kéo giãn hoặc thay đổi màu tùy ý.

---

## 12. Navigation và Information Architecture

- Điều hướng được tổ chức theo business capability hoặc công việc người dùng, không theo tên bảng hay phòng kỹ thuật.
- Tên module, menu và màn hình phải nhất quán với Business Glossary.
- Menu cấp một nên giữ ổn định; không đưa từng use case nhỏ lên menu chính.
- Breadcrumb dùng khi cấu trúc sâu hơn hai cấp.
- Người dùng luôn biết mình đang ở module nào, đối tượng nào và trạng thái nào.
- Chức năng thường dùng ưu tiên khả năng tìm thấy; chức năng hiếm dùng đặt trong menu phụ.

---

## 13. Responsive và môi trường thiết bị

| Thiết bị | Ưu tiên thiết kế |
|---|---|
| Desktop văn phòng | Bảng dữ liệu, đa nhiệm, lọc và phân tích |
| Tablet hiện trường | Vùng chạm lớn, ít trường, thao tác tuần tự |
| Handheld scanner | Một tác vụ chính, quét nhanh, phản hồi rõ |
| Kiosk / Andon | Khoảng cách đọc xa, bất thường nổi bật |
| Mobile quản lý | KPI, cảnh báo, phê duyệt và tra cứu nhanh |

Không chỉ thu nhỏ màn hình desktop để tạo phiên bản mobile. Phải xác định lại tác vụ ưu tiên theo thiết bị.

---

## 14. Accessibility và khả năng sử dụng

- Tỷ lệ tương phản tối thiểu theo WCAG AA: 4.5:1 cho chữ thường và 3:1 cho chữ lớn.
- Không truyền đạt thông tin chỉ bằng màu sắc.
- Mọi control phải sử dụng được bằng bàn phím khi phù hợp.
- Focus state phải nhìn thấy rõ.
- Input phải có label và thông báo lỗi có thể được công nghệ hỗ trợ đọc.
- Thứ tự tab phải theo trình tự nghiệp vụ.
- Không dùng chuyển động nhấp nháy gây mất tập trung.
- Animation thông thường nên trong khoảng 120–240 ms và chỉ dùng để làm rõ thay đổi trạng thái.

---

## 15. Content Design và ngôn ngữ

### 15.1. Giọng điệu

- Ngắn gọn, trực tiếp, chuyên nghiệp.
- Dùng từ ngữ người vận hành hiểu và đang sử dụng.
- Tránh từ kỹ thuật phần mềm khi không cần thiết.
- Không đổ lỗi cho người dùng.

### 15.2. Mẫu nội dung

| Không nên dùng | Nên dùng |
|---|---|
| `Invalid input` | `Mã pallet không tồn tại. Kiểm tra và quét lại.` |
| `Operation failed` | `Chưa thể xác nhận nhập kho vì phiếu đã khóa.` |
| `Are you sure?` | `Hủy phiếu nhập PN-2026-001? Dữ liệu đã xác nhận sẽ không được tiếp tục sử dụng.` |
| `Submit` | `Gửi phê duyệt` |
| `OK` | `Đã hiểu` hoặc hành động cụ thể |

Ngày, giờ, số lượng và đơn vị phải theo một convention thống nhất trong toàn hệ thống.

---

## 16. Design tokens chuẩn

```css
:root {
  /* Color */
  --color-bg: #FFFFFF;
  --color-bg-subtle: #F7F8FA;
  --color-border: #C5CBD3;
  --color-text: #111827;
  --color-text-secondary: #374151;
  --color-text-muted: #6B7280;
  --color-primary: #0067A5;
  --color-primary-hover: #005486;
  --color-success: #18794E;
  --color-warning: #A15C00;
  --color-danger: #C62828;

  /* Typography */
  --font-ui: "Inter", "Segoe UI", Arial, sans-serif;
  --font-mono: "JetBrains Mono", Consolas, monospace;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;

  /* Shape */
  --radius-control: 6px;
  --radius-card: 8px;
  --border-default: 1px solid var(--color-border);

  /* Motion */
  --motion-fast: 120ms;
  --motion-normal: 200ms;
}
```

Không khai báo màu, spacing hoặc radius trực tiếp trong component nếu token tương ứng đã tồn tại.

---

## 17. Những phong cách không sử dụng làm mặc định

- Gradient nhiều màu.
- Glassmorphism.
- Neumorphism.
- Biểu đồ 3D.
- Shadow dày cho mọi card.
- Card bo tròn quá lớn.
- Hình stock trang trí không liên quan nghiệp vụ.
- Emoji hoặc sticker trong giao diện chính thức.
- Animation dài hoặc chuyển động liên tục.
- Dark mode tự phát cho từng module.
- Mỗi module tự chọn màu thương hiệu riêng.

Ngoại lệ phải có lý do sử dụng, mẫu thiết kế và phê duyệt của Design Owner.

---

## 18. Quy tắc thiết kế với AI

Khi yêu cầu AI tạo giao diện, prompt tối thiểu phải chỉ rõ:

1. Business capability và use case.
2. Actor và thiết bị sử dụng.
3. Mục tiêu của màn hình.
4. Dữ liệu và trạng thái cần hiển thị.
5. Hành động chính, hành động phụ và quyền thực hiện.
6. Trạng thái loading, empty, error, permission denied và offline nếu có.
7. Design tokens và component được phép sử dụng.
8. Yêu cầu responsive và accessibility.

AI không được tự tạo màu, trạng thái nghiệp vụ, business rule hoặc hành động chưa có trong đặc tả.

Mẫu prompt:

```text
Thiết kế màn hình [tên màn hình] cho actor [vai trò] thực hiện [use case].
Thiết bị chính: [desktop/tablet/handheld/kiosk].
Mục tiêu: [kết quả nghiệp vụ].
Hành động chính: [hành động].
Dữ liệu bắt buộc: [danh sách].
Trạng thái nghiệp vụ: [danh sách đã được xác nhận].
Áp dụng SMART_FACTORY_DESIGN_STYLE_STANDARD.md và design tokens hiện hành.
Phải thể hiện loading, empty, error và success state.
Không tự bổ sung business rule hoặc màu mới.
```

---

## 19. Governance và trách nhiệm

| Vai trò | Trách nhiệm |
|---|---|
| Design Owner | Quản lý tiêu chuẩn, token và phê duyệt ngoại lệ |
| Product Owner | Xác nhận mục tiêu, độ ưu tiên và giá trị nghiệp vụ |
| Business Analyst | Xác nhận actor, luồng, thuật ngữ, trạng thái và business rule |
| Frontend Developer | Sử dụng component, token và hành vi chuẩn |
| QA / Tester | Kiểm tra usability, responsive, accessibility và consistency |
| Module Owner | Bảo đảm module không tự tạo ngôn ngữ thiết kế riêng |

### 19.1. Quy trình phê duyệt thành phần mới

1. Chứng minh component hiện có không đáp ứng use case.
2. Mô tả hành vi, trạng thái, accessibility và responsive.
3. Thiết kế và kiểm thử trong ít nhất một use case thật.
4. Review bởi BA, Frontend Lead và Design Owner.
5. Bổ sung vào Design System dùng chung trước khi tái sử dụng.

### 19.2. Quản lý thay đổi

- Mọi thay đổi phải có version và ngày hiệu lực.
- Breaking change phải có hướng dẫn migration.
- Không thay đổi token hoặc component trực tiếp tại một module.
- Các ngoại lệ tạm thời phải có owner và thời hạn xử lý.

---

## 20. Definition of Ready cho thiết kế

Một màn hình chỉ sẵn sàng thiết kế khi có tối thiểu:

- Actor và mục tiêu nghiệp vụ.
- Trigger, precondition và kết quả cần đạt.
- Main flow và các ngoại lệ quan trọng.
- Business rule liên quan.
- Trạng thái nghiệp vụ và quyền thao tác.
- Danh sách dữ liệu bắt buộc.
- Thiết bị và bối cảnh sử dụng.
- Acceptance criteria cấp nghiệp vụ.

---

## 21. Definition of Done cho giao diện

Giao diện được xem là hoàn thành khi:

- Đúng use case, business rule và quyền đã duyệt.
- Dùng đúng design tokens và component chuẩn.
- Có đủ loading, empty, error, success và disabled state.
- Responsive trên thiết bị mục tiêu.
- Hỗ trợ bàn phím và focus state khi phù hợp.
- Màu sắc và tương phản đạt yêu cầu.
- Nội dung dùng đúng Business Glossary.
- Không có thao tác lặp gây ghi nhận trùng.
- Có audit hoặc lịch sử khi nghiệp vụ yêu cầu.
- Được BA, Product Owner và QA xác nhận.

---

## 22. Design Review Checklist

### Business và nội dung

- [ ] Màn hình có một mục tiêu chính rõ ràng.
- [ ] Actor và ngữ cảnh sử dụng đã được xác nhận.
- [ ] Tên trường, trạng thái và hành động đúng ngôn ngữ nghiệp vụ.
- [ ] Hành động chính nổi bật và chỉ xuất hiện khi hợp lệ.
- [ ] Cảnh báo cho biết vấn đề và hành động tiếp theo.

### Visual consistency

- [ ] Tỷ lệ trắng/đen/xám và màu nhấn được kiểm soát.
- [ ] Không phát sinh màu, font, spacing hoặc radius tùy ý.
- [ ] Typography và phân cấp nội dung rõ ràng.
- [ ] Icon thuộc bộ chuẩn và có nhãn khi cần.
- [ ] Border và shadow đúng quy tắc.

### Component và trạng thái

- [ ] Chỉ có một Primary action trong một vùng chức năng.
- [ ] Form có label, validation và thông báo lỗi rõ ràng.
- [ ] Bảng có định dạng số, trạng thái và hành động nhất quán.
- [ ] Có loading, empty, error và permission state.
- [ ] Hành động nguy hiểm có xác nhận và mô tả tác động.

### Dashboard và dữ liệu

- [ ] Mỗi KPI có đơn vị, kỳ dữ liệu và mục tiêu so sánh.
- [ ] Loại biểu đồ phù hợp với câu hỏi cần trả lời.
- [ ] Màu trạng thái phản ánh đúng ý nghĩa tốt/xấu của KPI.
- [ ] Nguồn và thời điểm cập nhật dữ liệu rõ ràng khi cần.
- [ ] Dashboard hỗ trợ đi từ tổng quan đến nguyên nhân.

### Usability và accessibility

- [ ] Nội dung đọc được trong điều kiện sử dụng thực tế.
- [ ] Kích thước vùng chạm phù hợp thiết bị.
- [ ] Không truyền đạt thông tin chỉ bằng màu.
- [ ] Focus state và thứ tự bàn phím hợp lý.
- [ ] Tương phản đạt WCAG AA.

### Delivery

- [ ] Thiết kế liên kết với requirement hoặc use case ID.
- [ ] Component mới đã được phê duyệt và đưa vào dùng chung.
- [ ] Không chứa business rule do designer, developer hoặc AI tự suy đoán.
- [ ] Đã kiểm tra responsive trên thiết bị mục tiêu.
- [ ] Đã có bằng chứng review và acceptance.

---

## 23. Lộ trình áp dụng

### Giai đoạn 1 – Foundation

- Chốt bảng màu, font, spacing và component nền tảng.
- Xây dựng thư viện UI dùng chung cho React.
- Chuẩn hóa Button, Input, Select, Table, Badge, Modal và Notification.
- Chọn 2–3 màn hình WMS làm mẫu chuẩn.

### Giai đoạn 2 – Adoption

- Áp dụng cho chức năng mới.
- Đánh giá các module hiện có theo checklist.
- Xử lý các lỗi nghiêm trọng về consistency, usability và accessibility.
- Xây dựng template dashboard, báo cáo và slide.

### Giai đoạn 3 – Governance

- Đưa design review vào Definition of Done và Pull Request.
- Quản lý version của token và component library.
- Theo dõi ngoại lệ và technical/design debt.
- Đo hiệu quả bằng thời gian thao tác, tỷ lệ lỗi, thời gian đào tạo và mức độ chấp nhận của người dùng.

---

## 24. Chỉ số đánh giá hiệu quả thiết kế

| KPI | Ý nghĩa |
|---|---|
| Task completion rate | Tỷ lệ người dùng hoàn thành đúng tác vụ |
| Time on task | Thời gian hoàn thành thao tác trọng yếu |
| User error rate | Tỷ lệ nhập sai, thao tác sai hoặc phải làm lại |
| Duplicate transaction rate | Tỷ lệ giao dịch trùng do thao tác hoặc phản hồi chậm |
| Training time | Thời gian cần để người mới sử dụng thành thạo |
| Support request rate | Số yêu cầu hỗ trợ liên quan giao diện |
| Design consistency score | Mức tuân thủ token, component và pattern chuẩn |
| User adoption rate | Tỷ lệ sử dụng thực tế so với đối tượng mục tiêu |

---

## 25. Nguyên tắc ưu tiên khi có xung đột

Khi các yêu cầu thiết kế mâu thuẫn, ưu tiên theo thứ tự:

1. An toàn con người và vận hành.
2. Tính đúng của nghiệp vụ và dữ liệu.
3. Khả năng phòng ngừa sai sót.
4. Khả năng hoàn thành tác vụ.
5. Accessibility và khả năng đọc.
6. Tính nhất quán hệ thống.
7. Tính thẩm mỹ.

> Một giao diện đẹp nhưng làm người dùng hiểu sai trạng thái, thao tác nhầm hoặc bỏ lỡ cảnh báo là một thiết kế không đạt.

---

## Phụ lục A – Cấu trúc thư viện UI đề xuất

```text
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   └── motion.ts
│   ├── components/
│   │   ├── Button/
│   │   ├── Form/
│   │   ├── DataTable/
│   │   ├── StatusBadge/
│   │   ├── Modal/
│   │   ├── Notification/
│   │   └── KPI/
│   ├── patterns/
│   │   ├── ListPage/
│   │   ├── DetailPage/
│   │   ├── ApprovalFlow/
│   │   ├── ScanFlow/
│   │   └── Dashboard/
│   └── index.ts
└── modules/
    ├── wms/
    ├── production/
    ├── quality/
    └── maintenance/
```

Module nghiệp vụ được sử dụng Design System nhưng không sửa trực tiếp component dùng chung.

---

## Phụ lục B – Decision log cho ngoại lệ thiết kế

| Trường | Nội dung |
|---|---|
| Decision ID | DS-ADR-xxx |
| Module / Use Case | Phạm vi áp dụng |
| Vấn đề | Điều gì không thể giải quyết bằng chuẩn hiện tại? |
| Phương án | Các lựa chọn đã xem xét |
| Quyết định | Phương án được chọn |
| Tác động | UX, kỹ thuật, vận hành, bảo trì |
| Owner | Người chịu trách nhiệm |
| Ngày hết hạn | Thời điểm review lại ngoại lệ |

---

## Phụ lục C – Tài liệu liên quan

- `SMART_FACTORY_CODING_STANDARD.md`
- Business Capability Map.
- Business Glossary.
- Use Case Specification.
- Business Rules Catalog.
- Frontend Component Library.
- Brand Guideline của Kềm Nghĩa khi được ban hành hoặc cập nhật.

