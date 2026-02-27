

# Nền tảng Admake

Kho mã nguồn này gồm các dịch vụ và ứng dụng web của Admake: backend Flask
chính, dashboard quản trị, và trình biên tập 3D.

## Cấu trúc dự án

| Thư mục | Mô tả |
| --- | --- |
| `main-be/` | Backend API (Flask), Socket.IO, SQLAlchemy models, templates, static. |
| `quangcao_web/` | Dashboard quản trị (React + Vite). |
| `editor/` | Trình biên tập/3D editor (React + Vite + three.js). |
| `nginx/` | Cấu hình Nginx triển khai sản phẩm. |
| `lead-be/` | Static cho tính năng lead cũ (lead management hiện nằm trong `main-be`). |
| `static/` | Static assets và file triển khai khác. |

## Sơ đồ kiến trúc (tổng quan)

```
                 +--------------------+
                 |  Nginx (SSL, proxy)|
                 +---------+----------+
                           |
          +----------------+-----------------+
          |                                  |
  admake.vn (landing)                quanly.admake.vn
  /static, /api, /socket.io          dashboard build
          |                                  |
          +---------------+------------------+
                          |
                  +-------v-------+
                  |   main-be     |
                  | Flask +       |
                  | Socket.IO     |
                  +-------+-------+
                          |
                    PostgreSQL
```

## Tech stack (tổng quát)

- Backend: Flask, Flask-SocketIO, SQLAlchemy, PostgreSQL
- Dashboard: React 19, Vite, MUI, Ant Design, Tailwind, Redux Toolkit,
  React Query, Socket.IO client
- Editor: React, three.js, @react-three/fiber, GSAP, Zustand

## Hướng dẫn chạy local

### Backend (main-be)

1) Tạo và kích hoạt virtualenv.
2) Cài dependencies:
   ```bash
   pip install -r main-be/requirements.txt
   ```
3) Khai báo biến môi trường trong `main-be/.env`.
4) Chạy server:
   ```bash
   python main-be/app.py
   ```
   Mặc định chạy ở port `6000`.

### Dashboard (quangcao_web)

1) Cài dependencies:
   ```bash
   npm --prefix quangcao_web install
   ```
2) Cấu hình `.env` trong `quangcao_web/.env`.
3) Chạy dev:
   ```bash
   npm --prefix quangcao_web run dev
   ```
4) Build production:
   ```bash
   npm --prefix quangcao_web run build
   ```

### Editor (editor)

1) Cài dependencies:
   ```bash
   npm --prefix editor install
   ```
2) Chạy dev:
   ```bash
   npm --prefix editor run dev
   ```
3) Build production:
   ```bash
   npm --prefix editor run build
   ```
4) Preview:
   ```bash
   npm --prefix editor run start
   ```

## Biến môi trường (không commit bí mật)

Backend (`main-be/.env`) thường có:
- `HOST`
- `PORT`
- `DATABASE_URL`

Dashboard (`quangcao_web/.env`) thường có:
- `VITE_API_HOST_LOCAL`
- `VITE_API_HOST`
- `VITE_APP_API_HOST`
- `VITE_APP_SOCKET`
- `VITE_APP_STATIC`
- `VITE_GOONG_MAPTILES_KEY`
- `VITE_GOONG_API_KEY`

## API (tóm tắt route chính)

> Lưu ý: Đây là tóm tắt theo các Blueprint hiện có trong `main-be/api`.

### Auth (`/api/auth`)
- `POST /login`
- `POST /logout`
- `GET /status`
- `GET /me`

### User (`/api/user`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`
- `DELETE /<id>`
- `PUT /<user_id>/password`
- `POST /<user_id>/check-password`
- Quyền xem: `GET|POST|PUT|DELETE /<user_id>/can-view`, `GET /<user_id>/can-view-all`

### Role (`/api/role`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`
- `GET /role/list/permission/`

### Workspace (`/api/workspace`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`
- `DELETE /<workspace_id>`
- `PUT /<id>/pin`
- `GET /<id>/tasks`
- `PUT /<workspace_id>/column_name`
- `PUT /<workspace_id>/reward`

### Task (`/api/task`)
- `GET /all`
- `GET /inlead/<lead_id>`
- `GET /<id>`
- `PUT /<id>`
- `POST /`
- `DELETE /<id>`
- `PUT /<id>/status`
- `PUT /<id>/upload-icon`
- `PUT /<id>/upload`
- `PUT /<id>/message`
- `GET /<user_id>/by_user`
- `GET /<user_id>/salary`
- Trash: `GET /trash/inlead/<lead_id>`, `DELETE /trash/clear/inlead/<lead_id>`,
  `PUT /restore/<id>`, `DELETE /<id>/forever`

### Message (`/api/message`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`
- `DELETE /<message_id>`
- `PUT /<id>/favourite`
- `POST /message`
- `POST /upload`

### Lead (`/api/lead`)
- `GET /`
- `POST /`
- `GET /<lead_id>`
- `DELETE /<lead_id>`
- `PUT /<lead_id>/assign-user`
- `PUT /<lead_id>/check`
- `PUT /<lead_id>/activate`
- `PUT /<lead_id>/level`
- Content: `GET|PUT /content/`, `PUT /content/pricing-image`, `OPTIONS /content/`

### Lead manage (public) (`/lead-manage`)
- `GET /`

### Workpoint (`/api/workpoint`)
- `GET /all`
- `GET /`
- `GET /today/<user_id>`
- `GET /<user_id>`
- `PUT /<id>/`
- `POST /message`
- `GET /<user_id>/salary`
- `GET /page`
- `GET /by_user/<user_id>`
- `GET /check-access/<user_id>`
- `POST /check/<user_id>/`
- `PUT /remove/<user_id>/`
- `GET|PUT /setting/<lead_id>/`

### Customer (`/api/customer`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`
- `DELETE /<workspace_id>`

### Material (`/api/material`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`

### Supplier (`/api/supplier`)
- `GET /`
- `POST /`
- `GET /<id>`
- `PUT /<id>`
- `DELETE /<id>`

### Group (`/api/group`)
- `GET /<id>`
- `PUT /<workspace_id>`
- `PUT /<workspace_id>/status`
- `POST /<workspace_id>/messages`
- `GET /<workspace_id>/messages`
- `GET /check-access/<workspace_id>/`

### Leave (`/api/leave`)
- `GET /`
- `POST /`
- `GET /<leave_id>`
- `DELETE /<leave_id>`

### Notify (`/api/notify`)
- `GET /all`
- `GET /<lead_id>`
- `POST /`
- `DELETE /<id>`

### Setting (`/api/setting`)
- `GET /get-setting`

### Fureal (`/api/fureal`)
- `POST /save`
- `POST /load`

## Editor: quy trình & hướng dẫn chi tiết

### Tối ưu asset 3D (GLB + texture)

Xem chi tiết tại `editor/docs/asset-compression.md`. Quy trình gợi ý:
1) Nén mesh GLB bằng Draco.
2) Chuyển texture sang KTX2 (BasisU).
3) Repack GLB để tham chiếu KTX2.
4) Thay file `.glb` trong `editor/public/models` sau khi tối ưu.

### Chạy & kiểm tra editor

- Dev: `npm --prefix editor run dev`
- Build: `npm --prefix editor run build`
- Preview: `npm --prefix editor run start`

## Ghi chú triển khai

- `docker-compose.yml` chạy backend trên port `6000`.
- Nginx configs:
  - `nginx/sites-enabled/admake.vn`: landing + proxy `/api`, `/socket.io`,
    `/static`, `/lead-manage`.
  - `nginx/sites-enabled/quanly.admake.vn`: phục vụ dashboard build ở
    `/var/www/admake`, proxy `/lead-manage` về backend.

Ví dụ triển khai:
```bash
npm --prefix frontend run build
scp -r nginx root@31.97.76.62:/etc
scp -r frontend/dist/* root@31.97.76.62:/var/www/admake
```



