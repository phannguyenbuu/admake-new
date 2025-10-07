# Trang web mẫu

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/nctuanits-projects/v0-trang-web-mau)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/NoJyqUZAiDS)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Tính năng chính

### 🎯 Form Lead với Email Notification
- Form đăng ký demo tự động gửi email thông báo đến `nctuan.dev@gmail.com`
- Thu thập thông tin khách hàng: tên, công ty, email, điện thoại, ngành nghề, quy mô, nhu cầu
- Email được format đẹp với HTML responsive
- Xử lý lỗi và thông báo thành công cho người dùng

### 📧 Hỗ trợ nhiều dịch vụ email
- **Resend** (Khuyến nghị): 3,000 email/tháng miễn phí, dễ cấu hình
- **SendGrid**: 100 email/ngày miễn phí, nhiều tính năng
- **Mailgun**: 5,000 email/tháng miễn phí (3 tháng đầu)
- **Gmail SMTP**: Không giới hạn, cần cấu hình 2FA

### 🚀 Công nghệ sử dụng
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Email**: Nodemailer + Resend/SendGrid/Mailgun/Gmail
- **UI Components**: Radix UI, shadcn/ui
- **Package Manager**: Bun

## Cài đặt và chạy

```bash
# Cài đặt dependencies
bun install

# Chạy development server
bun dev

# Build production
bun run build
```

## Cấu hình Email

### 🚀 Resend (Khuyến nghị - Dễ nhất)

1. Đăng ký tại [resend.com](https://resend.com)
2. Tạo file `.env.local`:
```env
RESEND_API_KEY=re_1234567890abcdef
RESEND_FROM_EMAIL=your-email@yourdomain.com
```

### 📧 Các dịch vụ khác

Xem chi tiết cấu hình trong file `EMAIL_SETUP.md`

## Test Email

```bash
# Test chức năng gửi email
bun dev
# Sau đó submit form lead trên website
```

## Deployment

Your project is live at:

**[https://vercel.com/nctuanits-projects/v0-trang-web-mau](https://vercel.com/nctuanits-projects/v0-trang-web-mau)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/NoJyqUZAiDS](https://v0.dev/chat/projects/NoJyqUZAiDS)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Cấu trúc dự án

```
├── app/
│   ├── api/lead/route.ts    # API endpoint xử lý form lead
│   └── page.tsx             # Trang chính
├── components/
│   ├── lead-form.tsx        # Form đăng ký demo
│   └── ui/                  # UI components
├── lib/
│   └── email.ts             # Cấu hình và gửi email (đa dịch vụ)
├── EMAIL_SETUP.md           # Hướng dẫn cấu hình tất cả dịch vụ email
└── README.md                # Tài liệu dự án
```

## So sánh dịch vụ email

| Dịch vụ | Dễ cấu hình | Miễn phí | Tính năng | Khuyến nghị |
|---------|-------------|----------|-----------|-------------|
| **Resend** | ⭐⭐⭐⭐⭐ | 3,000/tháng | Cơ bản | ✅ Cho người mới |
| **SendGrid** | ⭐⭐⭐⭐ | 100/ngày | Nâng cao | ✅ Cho dự án lớn |
| **Mailgun** | ⭐⭐⭐⭐ | 5,000/tháng | Trung bình | ✅ Cho deliverability |
| **Gmail** | ⭐⭐⭐ | Không giới hạn | Cơ bản | ⚠️ Phức tạp hơn |