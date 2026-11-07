# ChatGPT Studio Tab Bridge v5.0

Bản v5.0 hiện tại nhận cả ảnh dạng chuỗi lẫn object {data,name,url} do backend chuẩn hóa.
Chặn gửi prompt nếu ảnh nguồn không hợp lệ hoặc chưa upload đủ.

Mỗi tab có một ID độc lập dạng TAB-XXXXXXXXXXXX. Bấm ID trên widget hoặc popup để sao chép.
ID giữ nguyên khi tải lại trang hoặc đổi hội thoại. Tab mới/nhân bản được cấp ID mới; đóng tab kết thúc ID đó.

## Cài hoặc cập nhật

1. Giải nén chatgpt_unified_bridge.zip vào thư mục cố định.
2. Mở chrome://extensions, bật Developer mode, Load unpacked thư mục chứa manifest.json.
3. Nếu đã cài: cập nhật đúng thư mục cũ và bấm Reload của extension.
4. Mở/tải lại các tab https://chatgpt.com/ đã đăng nhập.
5. Trong popup: đặt tên máy, Server URL https://genai.toolxprint.com, bật Tự động nhận việc và lưu.
6. Mở https://genai.toolxprint.com/extension để xem tab, máy, tài khoản, job, kết quả và giao việc trực tiếp.

Yêu cầu Chrome 120 trở lên. Không cần OpenAI API key. Cookie/session token ChatGPT ở lại trong trình duyệt.

## Điều phối

- Background là bộ điều phối duy nhất; content script không tự poll server.
- Mỗi tab có một assignment. Tab cùng tài khoản xử lý lần lượt; tài khoản khác có thể chạy độc lập.
- Kết quả phân loại ảnh, nội dung, mã nguồn, hoặc ảnh kèm nội dung.
- Kết quả lưu outbox cục bộ trước khi gửi; giải phóng assignment sau ACK.
- Backend kiểm tra attempt/lease, từ chối kết quả cũ và xử lý gửi lại idempotently.
- Reload giữa tác vụ chờ đối soát; không tự gửi lại prompt đã gửi.
- Không tự mở/reload tab. Reset chat bị chặn khi tab bận.

## API bằng một Tab ID

Nội dung/Ruby: POST /api/chat/create

    {"target_tab_id":"TAB-XXXXXXXXXXXX","prompt":"Viết nội dung quảng cáo","job_type":"chat_code","new_chat":true}

Ảnh: POST /api/jobs/create

    {"target_tab_id":"TAB-XXXXXXXXXXXX","prompt":"Thiết kế bảng hiệu","new_chat":true}

Danh sách: GET /api/extension/tabs. Kết quả gần nhất: GET /api/extension/tab-results.
Backend vẫn hỗ trợ worker_id và Target PC cũ. Tab ID là worker routing ID; attempt/lease xử lý nội bộ.

## Bản sửa 5.3 — mở hội thoại mới

- Nhận diện thêm tên nút New chat, Trò chuyện mới và nút có title; bỏ qua editor/nút dừng bị ẩn.
- Nếu nút không mở được hội thoại sau 8 giây, điều phối chuyển chính tab về trang chat mới.
- Giữ nguyên Tab ID, job, attempt/lease, prompt và ảnh nguồn trong session; chỉ tiếp tục khi document mới có editor sẵn sàng.
- Chỉ điều hướng một lần trong giai đoạn trước khi gửi prompt. Reload ngoài luồng này vẫn yêu cầu đối soát; không tự gửi lại prompt đã gửi.
- Cập nhật: Reload extension tại chrome://extensions rồi tải lại tab xử lý. Phiên bản manifest: 5.3.
