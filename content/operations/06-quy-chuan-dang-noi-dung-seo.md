# Quy chuẩn đăng nội dung GMTECH

## Các trường trong Decap CMS

| Trường | Cách điền |
| --- | --- |
| Tiêu đề / Tên sản phẩm / Tên dịch vụ | Tiêu đề chính người đọc thấy; đúng nội dung, riêng cho từng trang. |
| Tiêu đề SEO (tùy chọn) | Chỉ điền khi cần tiêu đề tìm kiếm khác. Để trống sẽ dùng tiêu đề chính. Website tự thêm `| GMTECH` đúng một lần. |
| Mô tả ngắn | Tóm tắt để hiển thị trên trang và thẻ nội dung. |
| Mô tả SEO (tùy chọn) | Để trống sẽ dùng mô tả ngắn. Tóm tắt đúng trang, không liệt kê từ khóa. Khoảng 120–160 ký tự là gợi ý biên tập, không phải giới hạn Google. |
| Mô tả ảnh đại diện (alt) | Mô tả nội dung thật của ảnh, ví dụ “Cổng kết nối bên trái ThinkPad X13 Gen 1”. Để trống sẽ dùng tiêu đề. |
| Nội dung | Dùng `##` cho đề mục, `###` cho mục nhỏ. H1 chính được tạo tự động. Ảnh chèn trong bài viết bằng cú pháp `![Mô tả ảnh](đường-dẫn-ảnh)`. |

Các trường mới không bắt buộc. Bài cũ vẫn hiển thị khi không có các trường này.

## Nội dung theo loại trang

- Dịch vụ: nhu cầu, phạm vi, quy trình, điều kiện phục vụ, cách báo giá và liên hệ. Thêm Quảng Ngãi khi phù hợp địa bàn phục vụ. Không tự cam kết lấy ngay, trực 24/7 hoặc bảo đảm kết quả.
- Sản phẩm: đúng mã máy, cấu hình, tình trạng, ảnh thật, giá và bảo hành đã xác nhận. Không tự ghi nhập Mỹ, nguyên bản hoặc còn hàng khi chưa kiểm chứng.
- Kiến thức: giải quyết một câu hỏi cụ thể, có bước làm và giới hạn áp dụng. Không bắt buộc gắn địa danh.
- Bản tin: nguồn trực tiếp, ngày công bố, diễn biến và điều kiện áp dụng. Tác động/hành động nội bộ GMTECH chỉ gửi riêng, không đăng công khai.

Không quy định số lần lặp từ khóa. Không dùng chung một mô tả cho mọi bài. Thêm liên kết đến bài, dịch vụ hoặc sản phẩm thật sự liên quan, bằng câu mô tả rõ ràng. Giữ URL đã xuất bản; nếu cần đổi phải có chuyển hướng phù hợp.

## Ảnh

Tên tệp ngắn, dễ hiểu, ưu tiên chữ không dấu và dấu gạch nối. Giữ ảnh gốc rõ, đúng tỷ lệ; không ép dưới 200 KB nếu làm mất chữ hoặc chi tiết sản phẩm. Logo dùng nguyên mẫu đã thống nhất, không vẽ lại bằng AI.

Mỗi lần dựng website, ảnh JPG/PNG/WebP nội bộ trong `assets/uploads` được tạo bản WebP theo chiều rộng tối đa 480/800/1200 px, không phóng lớn, không cắt hoặc kéo méo. Trang chọn bản phù hợp màn hình bằng `srcset`. Ảnh gốc vẫn được giữ. Không tự tải hoặc chuyển đổi ảnh bên ngoài, ảnh động, SVG, logo/sprite trong `assets/design` hoặc ảnh nền CSS.

Hệ thống không hứa mọi ảnh dưới 200 KB hoặc điểm tốc độ tuyệt đối. Kiểm tra độ rõ trên điện thoại, giá, trạng thái hàng và đường dẫn liên hệ trước khi công bố.

## Tham khảo

- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/crawling-indexing/links-crawlable

Google có thể chọn lại tiêu đề và đoạn mô tả hiển thị. Tối ưu nội dung và gửi sitemap không bảo đảm được lập chỉ mục hoặc thứ hạng cụ thể.
