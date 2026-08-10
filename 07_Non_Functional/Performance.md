# Performance

| Hạng mục | Nguyên tắc |
|---|---|
| Danh sách lớn | Phân trang server-side |
| Tra cứu tồn kho | Dùng view/index hoặc read-only SP tối ưu |
| Ghi nhiều bảng | SP transaction ngắn, index đúng field trạng thái |
| Mobile | Tối ưu màn hình quét/chọn, giảm payload |
| Danh mục | Cache client hoặc API cache có kiểm soát |
