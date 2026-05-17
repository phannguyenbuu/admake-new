# Admake Mobile App (Native Flutter)

Đây là mã nguồn **Native Framework 100% bằng Flutter** cho hệ thống Admake, thiết kế theo chuẩn Restful API để giải quyết bài toán:
1. Giao tiếp với API Admake (`/api/auth`, `/api/statistics`) thay vì load WebView web page.
2. Có tính năng **ghi trực tiếp file (Tài liệu/Hình ảnh) vào Storage cục bộ** của điện thoại (Download/Save files) mà WebView thông thường không thể làm được.
3. Các UI phức tạp trên Web (React-Three-Fiber 3D editor) đã được tách riêng hoàn toàn và bỏ qua trên App Mobile này nhằm tối ưu hóa bộ nhớ thiết bị theo yêu cầu của bạn.

## Cấu trúc mã nguồn Native này:
- `lib/main.dart`: Entry point gốc. Không dùng Webview.
- `lib/services/api_service.dart`: Gọi API bằng `Dio` và ghi nhớ phiên đăng nhập bằng `SharedPreferences`.
- `lib/screens/login_screen.dart`: Giao diện Đăng nhập Native (Username / Password).
- `lib/screens/dashboard_screen.dart`: View Demo Native Storage cho việc ghi lên Storage (Sử dụng `path_provider` & `dio download`).

---

## Làm sao để xuất file APK ngay bây giờ?
Tương tự như hướng dẫn cũ, vì máy tính của bạn không tự chạy lệnh build cục bộ được, hãy sử dụng server tự động của **GitHub Actions** mà tôi đã cài đặt sẵn ở góc kia:

**Bước 1:** Push project này lêm Github
```bash
cd D:\Dropbox\_Documents\Admake\admake_flutter_mobile
git init
git add .
git commit -m "Chuyển sang Native App - Bỏ Webview, thêm tính năng download write storage"
git branch -M main
# Điền link repo của bạn:
git remote add origin https://github.com/TenCuaBan/RepoCuaBan.git 
git push -u origin main
```
**Bước 2:** Vào Repo Github đó, mục **Actions**. Chờ quá trình `Build Admake APK` chạy (khoảng 2 phút).
**Bước 3:** Ở mục Artifacts, tải file `Admake-App-Release.apk`. 

Bạn sẽ có một ứng dụng đăng nhập độc lập cực nhanh lưu vào ổ cứng cho điện thoại của bạn!
