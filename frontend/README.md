# Frontend Dashboard Admake

Thư mục này là frontend production hiện tại của dashboard Admake. Đừng nhầm với `quangcao_web/` cũ.

## Scripts

```powershell
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

Dev server chạy bằng `vite --host`, mặc định ở `http://localhost:5173`.

## Multi-entry build

Build hiện xuất ra các entry chính:

- `dist/dashboard.html`
- `dist/chat.html`
- `dist/point.html`
- `dist/login.html`

## Khu vực source đáng mở đầu tiên

- `src/common/app/dashboard/accounting/`: các tab kế toán.
- `src/common/app/dashboard/materials/`: route quản lý vật tư và các tab kho.
- `src/common/components/dashboard/work-tables/`: modal và form của bảng công việc.
- `src/common/common/layouts/`: shell layout, sidebar, header.
- `src/dashboard/menu/`: menu desktop/mobile.
- `src/common/services/`: HTTP service layer gọi backend.

## Ghi chú UI hiện tại

- Kế toán có nav tab thu gọn bằng mũi tên trái/phải.
- Payroll có sub-row cho `thưởng`, `phạt`, `tạm ứng`, và adjustment lưu bền ở backend.
- `FormTask` đã gộp `Tài liệu & Bình luận` vào cuối tab `Thông tin`, có collapse và scroll dọc riêng.
- `Quản lý vật liệu` dùng paging `50` item/trang.
- Sub-row quy cách vật tư đang dùng nền sáng và form inline `Màu / Quy cách / Đơn vị / Giá / Lưu`.

## Debugging notes

- Nếu app hiện trang 404 sau một action trong dashboard, kiểm tra console frontend trước; nhiều lỗi render bị router che mất.
- Với bug số liệu kế toán hoặc vật tư, kiểm tra payload API và state query trước khi đổi UI.
- Với màn `materials`, nhớ kiểm tra cả pagination response `page`, `per_page`, `total`, `pages`.
- Với màn `accounting`, ưu tiên đọc service trước rồi mới đọc component tab.

## Build và deploy

Build static:

```powershell
cd frontend
npm run build
```

Static build được deploy lên production tại:

- `/var/www/admake`

Smoke test sau deploy thường dùng:

- `https://quanly.admake.vn/dashboard.html`
- `https://quanly.admake.vn/api/accounting/metadata`
- `https://quanly.admake.vn/api/inventory/items?lead=<lead_id>&page=1&limit=50`
