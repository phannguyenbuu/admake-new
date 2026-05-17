# Quay Lại Nhanh Dự Án Admake

Tài liệu này dành cho lúc quay lại repo sau một thời gian và cần bắt nhịp nhanh mà không phải dò lại toàn bộ lịch sử chat hay commit.

## 1. Mở gì trước

- `README.md`
- `AGENTS.md`
- `backend/app.py`
- `backend/models.py`
- `backend/api/accounting.py`
- `backend/api/accounting_erp.py`
- `backend/api/workpoints.py`
- `backend/api/inventory.py`
- `frontend/src/common/app/dashboard/accounting/page.tsx`
- `frontend/src/common/app/dashboard/materials/page.tsx`
- `frontend/src/common/components/dashboard/work-tables/FormTask.tsx`

## 2. Những thay đổi quan trọng gần đây

### 2.1. Kế toán

- AR đã tách đúng `phát sinh` và `tạm ứng`.
- `phát sinh` chỉ làm tăng nghĩa vụ phải thu.
- `tạm ứng` mới đi vào `Thu chi hằng ngày` và liên kết bút toán.
- Khi sửa hoặc xóa payment, link `daily_cash` và `journal` cần được sync hoặc soft delete đúng cách.

### 2.2. Lương nhân viên

- Payroll adjustments được lưu bền backend trong `payroll_adjustments`.
- Hồ sơ user có thêm `allowance`, `bhyt`, `bhxh`.
- Payroll summary có sub-row kiểu expand/collapse cho `thưởng`, `phạt`, `tạm ứng`.

### 2.3. Vật tư

- `Mã vật tư` sửa được qua API update item.
- Xóa vật tư là xóa mềm và chỉ cho phép khi item chưa có `stock transaction`.
- Danh sách item dùng paging mặc định `50` item/trang.
- Expand item để thêm row `Màu / Quy cách / Đơn vị / Giá`.

### 2.4. Bảng công việc

- `Tài liệu & Bình luận` không còn là tab riêng; nội dung đã được đưa xuống cuối tab `Thông tin`.
- Phần đó có nút collapse bằng icon và có scroll dọc.

## 3. Production map

- VPS: `31.97.76.62`
- Frontend static root: `/var/www/admake`
- Backend process: `pm2` process `admake-api`
- Backend local port: `6000`
- Domain quản trị: `quanly.admake.vn`
- Database chính của dự án: `admake_chat`

## 4. Migration cần nhớ

- `backend/migrations/20260407_user_payroll_fields.sql`
- `backend/migrations/20260407_ar_phat_sinh_cleanup.sql`
- `backend/migrations/20260407_payroll_adjustments.sql`

Nếu sửa model hoặc logic phụ thuộc schema trong các khu vực payroll, AR, inventory thì kiểm tra lại ba migration này trước.

## 5. Lệnh chạy nhanh hay dùng

Frontend dev:

```powershell
cd frontend
npm run dev
```

Frontend build:

```powershell
cd frontend
npm run build
```

Backend local:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python app.py
```

Backend test logic từ repo root:

```powershell
$env:DATABASE_URL="sqlite:///:memory:"
backend\.venv\Scripts\python.exe -m unittest `
  backend.tests.test_accounting_erp_logic `
  backend.tests.test_accounting_erp_simulation `
  backend.tests.test_workpoints_logic `
  backend.tests.test_inventory_logic `
  backend.tests.test_inventory_simulation `
  backend.tests.test_inventory_item_crud
```

## 6. Smoke test sau deploy

- `https://quanly.admake.vn/dashboard.html`
- `https://quanly.admake.vn/api/accounting/metadata`
- `https://quanly.admake.vn/api/workpoint/payroll-summary?month=YYYY-MM&lead=<lead_id>`
- `https://quanly.admake.vn/api/inventory/items?lead=<lead_id>&page=1&limit=50`

## 7. Các bẫy dễ quên

- Đừng dùng lại logic `localStorage` cho payroll adjustment.
- Đừng để `phát sinh` AR sinh phiếu thu hoặc journal.
- Đừng giả định item inventory xóa được nếu đã có transaction.
- Nếu UI hiện 404 sau thao tác nội bộ, kiểm tra console frontend trước.
- Với bug số liệu, kiểm tra DB `admake_chat` rồi mới sửa code.

## 8. Ghi chú vận hành VPS

- Cron backup PostgreSQL hiện chạy mỗi `2 giờ` và chỉ giữ `3` bản local gần nhất.
- Cron sync static lên Google Drive hiện chạy `24 giờ / lần`.
- Nếu VPS đầy ổ, kiểm tra `/root/backup` trước.
- Các database ngoài `admake_chat` từng gây phình ổ là `jsql` và `GoPrinx`; không nên đổ lỗi mặc định cho database chính của dự án.
