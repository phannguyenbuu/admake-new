# TÀI LIỆU BÀN GIAO & TỔNG QUAN DỰ ÁN: ADMAKE

Tài liệu này cung cấp cái nhìn toàn diện về kiến trúc hệ thống, mã nguồn, cách thức triển khai (Deployment) và vận hành hệ thống Admake trên môi trường Production (VPS, Domain, Nginx).

---

## 1. Thông Tin Mã Nguồn (Github Repository)
*   **Repository Name:** `phannguyenbuu/admake-new`
*   **Cấu trúc thư mục chính:**
    *   `frontend/`: Mã nguồn ứng dụng giao diện (React + Vite, TypeScript).
    *   `backend/`: Mã nguồn ứng dụng API Server & Socket (Flask + Flask-SocketIO).
    *   `admake-landing-page/`: Mã nguồn trang giới thiệu/landing page của Admake.
    *   `admake.vn`: File cấu hình Nginx gốc của dự án.

---

## 2. Kiến Trúc Hệ Thống & Môi Trường Vận Hành (Runtime Architecture)

### 2.1. Client-Side (Frontend)
*   **Công nghệ:** React, Vite, TypeScript, TailwindCSS/Vanilla CSS.
*   **Cơ chế Đa Trang (Multi-entry):** Giao diện được chia thành các phân hệ độc lập để tối ưu hiệu năng tải trang:
    *   `dashboard.html`: Trang quản trị trung tâm (quản lý công việc, kế toán, nguyên vật liệu, thống kê).
    *   `chat.html`: Phân hệ chat nội bộ & tương tác thời gian thực.
    *   `point.html`: Phân hệ theo dõi chấm công và tính điểm công việc (Workpoints).
    *   `login.html`: Phân hệ xác thực người dùng.

### 2.2. Server-Side (Backend)
*   **Công nghệ:** Python, Flask Framework, Flask-SocketIO (cho tính năng cập nhật thời gian thực như Chat và Notification).
*   **Database:** PostgreSQL. Cơ sở dữ liệu chính có tên là `admake_chat`.
*   **Quản lý tiến trình (Process Manager):** Sử dụng **PM2** để chạy ngầm và tự động khởi động lại dịch vụ backend (tên tiến trình trên VPS: `admake-api`).
*   **Cổng dịch vụ:** Backend chạy nội bộ tại port `6000` trên VPS và được Proxy qua Nginx.

### 2.3. Reverse Proxy (Nginx) & Tên Miền
*   **Domain chính:** `admake.vn`
*   **Nginx Configuration:** File cấu hình Nginx điều hướng các request đi vào VPS như sau:
    *   `/*` (Root): Phục vụ các file tĩnh của Frontend (React build) nằm tại thư mục `/var/www/admake`.
    *   `/api/`: Điều hướng (Reverse Proxy) sang Backend (`http://127.0.0.1:6000/api/`).
    *   `/socket.io/`: Điều hướng các kết nối WebSocket đến Backend (`http://127.0.0.1:6000/socket.io/`) nhằm đảm bảo tính năng thời gian thực.
    *   `/static/`: Tài nguyên tĩnh do Flask Backend quản lý (ví dụ: file tải lên).
    *   `/lead-manage/`: Quản trị thông tin khách hàng tiềm năng (Leads).

---

## 3. Hướng Dẫn Cài Đặt và Chạy Local (Local Development)

### 3.1. Chạy Frontend
Yêu cầu đã cài đặt Node.js (phiên bản khuyến nghị >= 18).
```bash
cd frontend
npm install
npm run dev
```

### 3.2. Chạy Backend
Yêu cầu đã cài đặt Python 3.10+ và PostgreSQL.
```bash
cd backend
python -m venv .venv
# Trên Windows:
.venv\Scripts\activate
# Trên macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python app.py
```

---

## 4. Quy Trình Triển Khai Lên VPS (Deployment Guide)

Hạ tầng hiện tại chạy trên VPS IP: `31.97.76.62`

### 4.1. Deploy Frontend (Static files)
Mỗi khi có thay đổi ở Frontend, chạy lệnh build và upload folder `dist` lên thư mục gốc của Web server trên VPS:
1.  **Build mã nguồn:**
    ```bash
    cd frontend
    npm run build
    ```
2.  **Upload lên VPS:**
    ```bash
    # Upload đè các file build tĩnh vào thư mục Nginx static trên VPS
    scp -r frontend/dist/* root@31.97.76.62:/var/www/admake
    ```

### 4.2. Deploy Backend & Restart Service
Mỗi khi cập nhật code Python backend hoặc migrations database:
1.  Đẩy code mới lên VPS (thông qua Git pull hoặc các công cụ đồng bộ như SCP).
2.  **Restart dịch vụ Backend:** SSH vào VPS và sử dụng PM2 để làm mới ứng dụng:
    ```bash
    pm2 restart admake-api
    ```

---
