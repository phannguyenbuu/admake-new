# Kiểm Thử Nhanh Kế Toán Và Vật Tư

Tài liệu này là checklist regression ngắn cho hai khu vực dễ lệch số liệu nhất của dự án: `Kế toán` và `Quản lý vật liệu`.

## 1. Kế toán

### 1.1. Công nợ phải thu

Case cần test:

- Tạo một invoice AR mới, xác nhận invoice, kiểm tra công nợ tăng.
- Thêm payment loại `phát sinh`, kiểm tra:
- `Công nợ phải thu` tăng đúng.
- Không sinh phiếu thu trong `Thu chi hằng ngày`.
- Không có link `daily_cash` hoặc `journal` cho payment đó.
- Thêm payment loại `tạm ứng`, kiểm tra:
- `Đã thu` tăng.
- `Còn phải thu` giảm.
- Có thể truy ra `daily_cash` và `journal` liên quan.

API và file cần đọc khi lỗi:

- `backend/api/accounting.py`
- `backend/api/accounting_erp.py`
- `frontend/src/common/app/dashboard/accounting/AccountsReceivableTab.tsx`

### 1.2. Bảng lương nhân viên

Case cần test:

- Mở payroll summary theo tháng, xác nhận summary load được.
- Tạo `thưởng`, `phạt`, `tạm ứng` trong sub-row, refresh trang, xác nhận dữ liệu vẫn còn.
- Kiểm tra `phụ cấp`, `BHYT`, `BHXH` lấy đúng từ hồ sơ user.
- Kiểm tra `thực nhận` thay đổi đúng khi thêm adjustment.

Nguồn dữ liệu hiện tại:

- Bảng `payroll_adjustments`
- Field user: `salary`, `allowance`, `bhyt`, `bhxh`

API và file cần đọc khi lỗi:

- `backend/api/workpoints.py`
- `backend/models.py`
- `frontend/src/common/app/dashboard/accounting/PayrollSummaryTab.tsx`
- `frontend/src/common/components/dashboard/user/FormUser.tsx`

## 2. Vật tư

### 2.1. Danh mục vật tư

Case cần test:

- Sửa `mã vật tư`, lưu thành công, reload danh sách vẫn giữ mã mới.
- Xóa vật tư chưa có giao dịch, backend trả thành công và item biến mất khỏi danh sách active.
- Xóa vật tư đã có `stock transaction`, backend phải chặn và trả lỗi.
- Kiểm tra danh sách item trả về đúng paging `50` item/trang.

Rule hiện tại:

- `DELETE /api/inventory/items/:id` chỉ cho xóa khi item chưa có transaction.
- `PUT /api/inventory/items/:id` cho phép đổi `code`, nhưng vẫn chặn trùng mã trong cùng lead.

### 2.2. Sub-row quy cách / màu sắc

Case cần test:

- Expand một item, thêm row `Màu / Quy cách / Đơn vị / Giá`.
- Nhấn `Lưu`, reload lại item, kiểm tra row vẫn còn.
- Kiểm tra UI đang dùng nền sáng, không còn nút `Demo`.

API và file cần đọc khi lỗi:

- `backend/api/inventory.py`
- `frontend/src/common/app/dashboard/materials/page.tsx`

## 3. Smoke checklist sau deploy

- `https://quanly.admake.vn/dashboard.html`
- `https://quanly.admake.vn/api/accounting/metadata`
- `https://quanly.admake.vn/api/workpoint/payroll-summary?month=YYYY-MM&lead=<lead_id>`
- `https://quanly.admake.vn/api/inventory/items?lead=<lead_id>&page=1&limit=50`

## 4. Ghi nhớ nhanh

- Sai số kế toán thường nằm ở ngữ nghĩa `phát sinh` so với `tạm ứng`.
- Sai số payroll thường nằm ở adjustment chưa lưu backend hoặc profile user thiếu `allowance/BHYT/BHXH`.
- Sai số vật tư thường nằm ở pagination, item code validation, hoặc item đã có transaction nên không xóa được.
