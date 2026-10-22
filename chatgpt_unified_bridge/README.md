# ChatGPT AI Studio & Worker Bridge v4.0 (Unified All-in-One)

Extension Chrome hợp nhất chuyên dụng kết nối ChatGPT với hệ thống backend **Admake** và **Toolx GenImgs**.

---

## 🌟 Tính Năng Nổi Bật

1. **Hợp Nhất 3-trong-1 (All-in-One Engine)**:
   - **Truy vấn nội dung (Text Chat & Vision Analysis)**: Đính kèm ảnh mẫu, phân tích hình ảnh, trả lời câu hỏi nghiệp vụ.
   - **Trích xuất mã SketchUp Ruby (`.rb`) & BOM**: Tự động bóc tách code block Ruby dựng hình 3D và bảng thống kê cấu kiện vật tư.
   - **Tạo ảnh DALL-E & Sửa ảnh (Inpainting)**: Đính kèm ảnh tham chiếu, tạo ảnh HD, trích xuất ảnh xem trước tức thì và ảnh gốc không nén.

2. **Khắc Phục Triệt Để Bug "Kẹt New Chat & Dính Hội Thoại Cũ"**:
   - **Nguyên nhân bug cũ**: ChatGPT là Single Page Application (Next.js/React). Thao tác New Chat cũ chỉ click nút và đợi 1s trong khi URL chưa chuyển sang `/`, dẫn đến việc ProseMirror editor vẫn giữ draft của phiên trước hoặc DOM turn count bị đo sai lệch (đếm turns của hội thoại cũ), khiến tiến trình chờ vô tận (240s timeout) hoặc gửi prompt đè lên hội thoại cũ.
   - **Giải pháp v4.0**:
     - **Clean Session Guarantee**: Kiểm tra URL chuyển hẳn sang `/` và toàn bộ turns cũ đã biến mất. Nếu sau 3.5s giao diện vẫn kẹt, tự động thực thi `window.location.replace("https://chatgpt.com/")` để reset 100% bộ nhớ SPA.
     - **ProseMirror Transaction Reset**: Xóa sạch toàn bộ văn bản và draft trong ProseMirror doc bằng `MAIN` world script trước khi chèn prompt mới.
     - **Atomic Text Injection**: Thay thế toàn bộ nội dung từ 0 đến cuối văn bản bằng prompt mới, tuyệt đối không bao giờ nối (append) vào rác cũ.

3. **Tính Năng Chọn Đúng PC (Target PC / Extension Name Routing)**:
   - Mỗi Extension cho phép cấu hình một mã **Định Danh Máy Tính (Target PC)** riêng biệt (ví dụ: `PC_BUU_01`, `PC_DESIGN_KE_TOAN`, `PC_OFFICE_MAIN`).
   - Server khi giao việc có thể chỉ định đích danh `target_pc`. Chỉ duy nhất máy tính có tên này mới nhận và xử lý tác vụ.
   - Nếu không chỉ định `target_pc`, tác vụ sẽ được phân phối tự động theo hàng đợi chung (FIFO) cho bất kỳ máy nào rảnh rỗi.

---

## 🚀 Hướng Dẫn Cài Đặt (Load Unpacked)

1. Mở trình duyệt Google Chrome, truy cập: `chrome://extensions/`
2. Bật công tắc **Chế độ dành cho nhà phát triển (Developer mode)** ở góc trên bên phải.
3. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.
4. Chọn thư mục:
   `D:\Dropbox\_Documents\Admake\chatgpt_unified_bridge`
   (hoặc `D:\Dropbox\_Documents\GenImgs\chatgpt_unified_bridge`)
5. Sau khi cài đặt, ghim icon extension lên thanh công cụ Chrome.

---

## ⚙️ Cấu Hình Extension

1. Bấm vào icon extension trên thanh công cụ để mở Popup:
   - **Định danh máy tính (Target PC)**: Nhập tên máy viết hoa (VD: `PC_MAIN`, `PC_DESIGN_01`).
   - **Tên Worker hiển thị**: Tên gợi nhớ (VD: `Máy Bửu - Thiết Kế`).
   - **Server URL**: Địa chỉ server Admake (Mặc định: `https://admake.vn`, hoặc local `http://localhost:6000`).
   - **Tự động nhận việc (Auto-Poll)**: Bật công tắc để worker sẵn sàng nhận lệnh.
2. Bấm nút **💾 Lưu Cấu Hình**.
3. Bấm nút **⚡ Kiểm Tra Kết Nối Server** để xác nhận kết nối thành công.
4. Bấm nút **🧹 Mở Chat Mới Sạch (Reset Session)** để kiểm tra tính năng reset phiên chat sạch ngay lập tức.
