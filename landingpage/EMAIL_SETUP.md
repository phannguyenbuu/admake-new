# Hướng dẫn cấu hình Email cho Form Lead

## 🚀 Các dịch vụ email được hỗ trợ

### 1. **Resend** (Khuyến nghị - Dễ nhất)
- **Miễn phí**: 3,000 email/tháng
- **Ưu điểm**: API đơn giản, tích hợp tốt với Next.js, không cần cấu hình SMTP
- **Website**: [resend.com](https://resend.com)

### 2. **SendGrid**
- **Miễn phí**: 100 email/ngày
- **Ưu điểm**: API mạnh mẽ, nhiều tính năng, hỗ trợ template
- **Website**: [sendgrid.com](https://sendgrid.com)

### 3. **Mailgun**
- **Miễn phí**: 5,000 email/tháng (3 tháng đầu)
- **Ưu điểm**: API RESTful đơn giản, deliverability cao
- **Website**: [mailgun.com](https://mailgun.com)

### 4. **Gmail SMTP**
- **Miễn phí**: Không giới hạn
- **Ưu điểm**: Quen thuộc, không cần đăng ký dịch vụ mới
- **Nhược điểm**: Cần bật 2FA và tạo App Password

---

## 📧 Cấu hình Resend (Khuyến nghị)

### Bước 1: Đăng ký tài khoản
1. Vào [resend.com](https://resend.com)
2. Đăng ký tài khoản miễn phí
3. Xác thực email

### Bước 2: Lấy API Key
1. Vào Dashboard > API Keys
2. Tạo API Key mới
3. Copy API Key

### Bước 3: Cấu hình file .env.local
```env
# Resend (Khuyến nghị)
RESEND_API_KEY=re_1234567890abcdef
RESEND_FROM_EMAIL=your-email@yourdomain.com

# Hoặc sử dụng email mặc định của Resend
RESEND_FROM_EMAIL=onboarding@resend.dev
```

---

## 📧 Cấu hình SendGrid

### Bước 1: Đăng ký tài khoản
1. Vào [sendgrid.com](https://sendgrid.com)
2. Đăng ký tài khoản miễn phí
3. Xác thực email

### Bước 2: Lấy API Key
1. Vào Settings > API Keys
2. Tạo API Key mới
3. Copy API Key

### Bước 3: Cấu hình file .env.local
```env
# SendGrid
SENDGRID_API_KEY=SG.1234567890abcdef
SENDGRID_FROM_EMAIL=your-email@yourdomain.com
```

---

## 📧 Cấu hình Mailgun

### Bước 1: Đăng ký tài khoản
1. Vào [mailgun.com](https://mailgun.com)
2. Đăng ký tài khoản miễn phí
3. Xác thực domain

### Bước 2: Lấy thông tin đăng nhập
1. Vào Settings > API Keys
2. Copy API Key và domain

### Bước 3: Cấu hình file .env.local
```env
# Mailgun
MAILGUN_USER=your-mailgun-user
MAILGUN_PASS=your-mailgun-password
MAILGUN_FROM_EMAIL=your-email@yourdomain.com
```

---

## 📧 Cấu hình Gmail SMTP

### Bước 1: Bật 2FA
1. Vào [Google Account](https://myaccount.google.com/)
2. Chọn "Security"
3. Bật "2-Step Verification"

### Bước 2: Tạo App Password
1. Vào "Security" > "2-Step Verification"
2. Cuộn xuống và chọn "App passwords"
3. Chọn "Mail" và "Other (Custom name)"
4. Đặt tên (ví dụ: "Website Lead Form")
5. Copy password được tạo ra

### Bước 3: Cấu hình file .env.local
```env
# Gmail SMTP
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop  # App Password
```

---

## 🔧 Cấu hình dịch vụ mặc định

Để thay đổi dịch vụ mặc định, cập nhật file `app/api/lead/route.ts`:

```typescript
// Sử dụng Resend (mặc định)
import { sendLeadEmailDefault } from "@/lib/email"
const emailResult = await sendLeadEmailDefault(body)

// Hoặc chỉ định dịch vụ cụ thể
import { sendLeadEmail } from "@/lib/email"
const emailResult = await sendLeadEmail(body, 'sendgrid') // 'resend', 'sendgrid', 'mailgun', 'gmail'
```

---

## ✅ Kiểm tra hoạt động

1. Khởi động lại server development:
   ```bash
   bun dev
   ```

2. Điền và submit form lead trên website
3. Kiểm tra email `nctuan.dev@gmail.com` để xem có nhận được thông báo không
4. Kiểm tra console của server để xem log

---

## 💡 Lưu ý quan trọng

### Bảo mật
- **KHÔNG BAO GIỜ** commit file `.env.local` lên git
- File `.env.local` đã được thêm vào `.gitignore`
- Chỉ sử dụng API Key, không dùng mật khẩu thật

### So sánh dịch vụ
| Dịch vụ | Dễ cấu hình | Miễn phí | Tính năng | Khuyến nghị |
|---------|-------------|----------|-----------|-------------|
| **Resend** | ⭐⭐⭐⭐⭐ | 3,000/tháng | Cơ bản | ✅ Cho người mới |
| **SendGrid** | ⭐⭐⭐⭐ | 100/ngày | Nâng cao | ✅ Cho dự án lớn |
| **Mailgun** | ⭐⭐⭐⭐ | 5,000/tháng | Trung bình | ✅ Cho deliverability |
| **Gmail** | ⭐⭐⭐ | Không giới hạn | Cơ bản | ⚠️ Phức tạp hơn |

### Xử lý lỗi thường gặp

#### Lỗi "Invalid API Key":
- Kiểm tra API Key trong file .env.local
- Đảm bảo API Key đã được kích hoạt

#### Lỗi "Domain not verified":
- Đối với SendGrid/Mailgun: Xác thực domain
- Đối với Resend: Sử dụng email mặc định hoặc xác thực domain

#### Email không gửi được:
- Kiểm tra console của server
- Kiểm tra cấu hình dịch vụ
- Đảm bảo tài khoản không bị khóa
