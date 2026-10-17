# Quy tắc vận hành AI và bước tiếp nhận tên miền

## Phạm vi ủy quyền đã thống nhất
AI chủ động phân tích, soạn nội dung, chuẩn bị biểu mẫu, viết mã trên nhánh riêng, kiểm thử và tạo PR. Tự quyết định các chi tiết thông thường trong phạm vi nhiệm vụ. Gom thông tin thiếu thành một lượt hỏi khi ảnh hưởng đến kết quả.

Chủ GMTECH kiểm duyệt nội dung trước khi công bố/gửi khách; quyết định giá, ngân sách, cam kết thương mại và phương án có tác động đáng kể. Khi chủ đã duyệt mẫu/nội dung và yêu cầu triển khai, thực hiện trong phạm vi đó mà không xin lại.

Không tự gửi tin nhắn hoặc email cho người khác khi chưa có yêu cầu rõ về người nhận và mục đích. Không tự mua dịch vụ, chạy quảng cáo trả phí hoặc thêm quyền truy cập. Không tuyên bố tự vận hành giữa các phiên khi chưa có tác vụ tự động và kết nối phù hợp.

## Kỷ luật website
- Bảo vệ bản đang chạy; phát triển trên nhánh và PR.
- Kiểm tra build trước merge, xác nhận bản triển khai sau merge.
- Chỉ thay OAuth, CMS, GitHub Actions hoặc Cloudflare khi có nhu cầu hoặc lỗi được chứng minh.
- Nội dung nháp và mẫu nghiệp vụ nằm trong content/operations, ngoài ba bộ sưu tập xuất bản.

## Khi chủ GMTECH quay lại với tên miền
Thông tin cần nhận: tên miền đã đăng ký, nhà cung cấp, khả năng quản lý DNS, tên miền chính mong muốn có/không www; xác nhận có email đang sử dụng trên tên miền hay chưa. Không yêu cầu gửi mật khẩu hoặc mã xác thực trong chat.

Thực hiện sau khi có thông tin và quyền thao tác phù hợp:
1. Đọc cấu hình hiện tại, ghi nhận bản website đang hoạt động và các bản ghi DNS liên quan.
2. Chuẩn bị phương án gắn tên miền vào Cloudflare Pages; giữ địa chỉ pages.dev làm đường truy cập dự phòng trong quá trình kiểm tra.
3. Bảo toàn bản ghi email hiện có; không tự thay nameserver hoặc bản ghi khi chưa xác định ảnh hưởng.
4. Kiểm tra HTTPS, trang chủ, URL chi tiết, tài nguyên và liên hệ trên tên miền mới.
5. Chuẩn bị PR cập nhật canonical, địa chỉ chia sẻ và metadata hiện còn trỏ gmtech.pages.dev; kiểm tra build rồi triển khai theo phạm vi được duyệt.
6. Kiểm tra CMS/OAuth với tên miền mới; chỉ chỉnh khi thực tế cần, không thay thông tin xác thực đang hoạt động tùy tiện.
7. Chỉ quyết định chuyển hướng địa chỉ cũ sau khi xác nhận tên miền mới và các đường dẫn hoạt động.

Đây là checklist chuẩn bị; chưa đổi DNS, tên miền, canonical hoặc OAuth trong đợt này.
