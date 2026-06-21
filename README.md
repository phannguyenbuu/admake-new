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

## 5. Các Điểm Lưu Ý Đặc Biệt Về Nghiệp Vụ (Business Logic Rules)
Để bàn giao cho đội kỹ thuật tiếp quản của khách hàng, cần lưu ý các quy tắc nghiệp vụ quan trọng đã được thống nhất:
*   **Phân loại công nợ phải thu (AR Payment Types):**
    *   `phat_sinh` (Phát sinh): Chỉ làm tăng giá trị công nợ phải thu của khách hàng, tuyệt đối không tự động tạo giao dịch trong quỹ tiền mặt (`daily_cash`) hay sổ nhật ký chung (`journal`).
    *   `tam_ung` (Tạm ứng): Đây là luồng thu tiền mặt thực tế, hệ thống sẽ tự động liên kết tạo bản ghi vào `daily_cash` và `journal`.
*   **Hồ sơ bảng lương (Payroll adjustments):** Lưu trữ tập trung tại bảng `payroll_adjustments` trên PostgreSQL database. Không sử dụng `localStorage` của trình duyệt làm nguồn lưu thông tin cấu hình lương tránh sai lệch dữ liệu.
*   **Xóa danh mục kho (Inventory delete):** Chỉ cho phép xóa mặt hàng kho khi mặt hàng đó chưa phát sinh bất kỳ giao dịch kho nào (`stock transaction`). Nếu đã có giao dịch, Backend sẽ chặn và trả về mã lỗi nhằm bảo toàn lịch sử dữ liệu.
*   **Xác thực API (Authorization Header):** Tất cả các lệnh gọi API tĩnh hoặc động từ Frontend đến các endpoint cần quyền hạn (ví dụ `/api/statistics/dashboard`) đều bắt buộc phải đính kèm Header `Authorization: Bearer ${token}`.

---

## 6. Tổng Quan Kiến Trúc Nâng Cao (Classes, Components & Features)

Phần này liệt kê chi tiết các thành phần cốt lõi của hệ thống, giúp các nhà phát triển dễ dàng tra cứu và nắm bắt cấu trúc mã nguồn cũng như ánh xạ tới các tính năng trên giao diện.

### 6.1. Backend (Flask + SQLAlchemy)

Backend sử dụng kiến trúc phân hệ (Blueprint) để quản lý các tính năng.

**Các Database Models (Classes) chính (`backend/models.py`):**
- **Nhân sự & Phân quyền:** `User`, `Role`, `UserCanView`
- **Quản lý công việc (Workspaces & Tasks):** `Workspace`, `Task`, `Message`, `Notify`, `Workpoint`, `WorkpointSetting`, `Leave`
- **Khách hàng & Thầu phụ:** `Customer`, `LeadPayload`
- **Kế toán (Accounting ERP):** `ChartOfAccount`, `TaxCode`, `AccountingPeriod`, `JournalEntry`, `JournalEntryLine`, `ARInvoice`, `ARInvoicePayment`, `APBill`, `APBillPayment`, `PayrollAdjustment`, `AccountingDailyCash`, `AccountingDocument`, `AccountingRecord`, `AccountingLink`
- **Tài sản cố định:** `FixedAsset`, `FixedAssetDepreciation`, `FixedAssetEvent`
- **Kho & Vật tư (Inventory & Materials):** `Material`, `MaterialTransaction`, `Warehouse`, `ItemCategory`, `InventoryItem`, `StockAdjustmentReason`, `InventoryAccountMapping`, `InventoryBalance`, `StockTransaction`
- **Trung tâm tài liệu:** `DocumentCenterDocument`, `DocumentCenterAttachment`, `DocumentCenterLink`, `DocumentCenterAuditLog`

**Các API Modules (`backend/api/`):**
Mỗi module xử lý logic routing, validation và tương tác CSDL cho từng phân hệ:
- `auth.py`: Đăng nhập, phân quyền JWT.
- `users.py`: Quản lý hồ sơ nhân viên.
- `workpoints.py`: Logic chấm công và tính điểm.
- `tasks.py`, `works.py`: Xử lý bảng công việc (Kanban), giao việc.
- `accounting_erp.py`, `accounting.py`: Xử lý sổ cái, công nợ, chứng từ kế toán.
- `inventory.py`, `materials.py`: Logic xuất/nhập/tồn kho và danh mục vật liệu.
- `lead_manage.py`, `leads.py`: Quản lý khách hàng tiềm năng, phễu bán hàng.

### 6.2. Frontend (React + Vite)

Frontend được chia thành nhiều ứng dụng độc lập (`dashboard`, `chat`, `login`, `point`). Dưới đây là ánh xạ các tính năng chính trên Quản trị (Dashboard) theo menu/router (`frontend/src/dashboard/router.tsx`):

- **`/` (Trang chủ / Bảng điều khiển):** Tổng quan hệ thống.
- **`/workpoints` (Chấm công & Điểm công việc):**
  - **Tính năng:** Quản lý chấm công hàng ngày, tính toán công thợ, xem bảng lương tổng hợp (`SalaryBoard`).
  - **Components chính:** `WorkDays`, `FormTask`, `SalaryBoard`.
- **`/users` (Quản lý nhân sự):**
  - **Tính năng:** Quản lý hồ sơ nhân viên, phân quyền truy cập (`UserCanView`).
  - **Components chính:** `FormUser`.
- **`/supplier` (Quản lý thầu phụ):**
  - **Tính năng:** Quản lý thông tin và theo dõi công nợ thầu phụ.
- **`/customers` (Quản lý khách hàng):**
  - **Tính năng:** Quản lý danh sách khách hàng định danh.
  - **Components chính:** `FormCustomer`.
- **`/lead-manage` (Quản lý Khách hàng tiềm năng / Leads):**
  - **Tính năng:** Theo dõi quá trình tư vấn (phễu CRM), lên báo giá, chốt hợp đồng. Hỗ trợ tạo hợp đồng và theo dõi các khoản thanh toán tạm ứng ban đầu.
- **`/work-tables` (Bảng công việc / Workspaces):**
  - **Tính năng:** Quản lý dự án dạng bảng Kanban (tương tự Trello). Cho phép kéo thả công việc, giao việc, đính kèm tài liệu và thảo luận nội bộ.
  - **Components chính:** `WorkspaceBoard`, `DragableTaskCard`, `FormTask`, `JobDescription`.
- **`/statistics` (Phân tích):**
  - **Tính năng:** Cung cấp biểu đồ thống kê doanh thu, chi phí, và báo cáo hiệu suất công việc.
- **`/accounting` (Kế toán ERP):**
  - **Tính năng:** Quản lý khoản phải thu (AR), khoản phải trả (AP). Quản lý quỹ tiền mặt, sổ nhật ký chung, bảng cân đối. Tích hợp chặt chẽ việc xử lý các loại thanh toán `phat_sinh` và `tam_ung`.
  - **Components chính:** `AccountsReceivableTab`, `AccountsPayableTab`, `PayrollSummaryTab`, `ReportsTab`.
- **`/materials` (Quản lý vật liệu & Kho):**
  - **Tính năng:** Quản lý danh mục vật tư, tồn kho, các giao dịch xuất/nhập/điều chỉnh. Hỗ trợ cấu hình thuộc tính động (Specs) cho vật tư và phân hệ thử nghiệm vật liệu 3D (`MaterialLab`).
  - **Components chính:** `MaterialSphereViewer`, `FormMaterial`, `ThreeCanvas` (cho không gian 3D).
- **`/invoices` (Báo giá):**
  - **Tính năng:** Tạo và theo dõi các báo giá gửi khách hàng.
- **`/infor` (Hồ sơ cá nhân):**
  - **Tính năng:** Xem và chỉnh sửa thông tin cá nhân của user đang đăng nhập.

### 6.3. Landing Page (`admake-landing-page/`)

Trang web giới thiệu (Front-facing website) dành cho khách hàng bên ngoài.
- **Tính năng:**
  - Giới thiệu dịch vụ của Admake.
  - Cung cấp form liên hệ để thu thập thông tin khách hàng tiềm năng (Leads), đẩy dữ liệu về hệ thống Backend.
  - Tích hợp bảng giá dịch vụ tương tác.
- **Thành phần cấu trúc:**
  - `index.html`: Giao diện chính (Static/HTML).
  - Thư mục `pricing/`: Một ứng dụng React nhỏ (Mini React App) nhúng vào landing page để hiển thị bảng giá tương tác phức tạp.

---

## 7. Thông Tin Máy Chủ (VPS) & Cơ Sở Dữ Liệu

### 7.1. Cấu Hình VPS Production
*   **VPS_IP:** `31.97.76.62`
*   **VPS_PASSWORD:** `@baoLong0511`

### 7.2. Các Bảng Cơ Sở Dữ Liệu (PostgreSQL Tables)
Danh sách các bảng thực tế được định nghĩa trong cơ sở dữ liệu `admake_chat` (mapping từ `models.py`):
*   **Hệ thống & Phân quyền:** `user`, `role`, `user_can_view`, `using`
*   **Quản lý Công việc & Nhân sự:** `workspace`, `task`, `message`, `notification`, `workpoint`, `workpoint_setting`, `leave`
*   **Khách hàng & Kinh doanh:** `customer`, `lead`
*   **Vật tư & Kho:** `material`, `material_transaction`, `warehouses`, `item_categories`, `inventory_items`, `stock_adjustment_reasons`, `inventory_account_mappings`, `inventory_balances`, `stock_transactions`
*   **Kế toán ERP:** `chart_of_accounts`, `tax_codes`, `accounting_periods`, `journal_entries`, `journal_entry_lines`, `accounting_daily_cash`, `accounting_document`, `accounting_records`, `accounting_links`, `ar_invoices`, `ar_invoice_payments`, `ap_bills`, `ap_bill_payments`, `payroll_adjustments`
*   **Tài sản cố định:** `fixed_assets`, `fixed_asset_depreciations`, `fixed_asset_events`
*   **Trung tâm tài liệu:** `document_center_document`, `document_center_attachment`, `document_center_link`, `document_center_audit_log`
