# Admake

Admake is the production repository for the internal operations platform used at `admake.vn`. The active stack in this repo is a React/Vite dashboard frontend and a Flask backend backed by PostgreSQL.

## Production scope

- Frontend production source: `frontend/`
- Backend production source: `backend/`
- Database: PostgreSQL `admake_chat`
- Reverse proxy: Nginx config at repo root and `nginx/`
- Backend runtime: port `6000`, restarted in production with `pm2 restart admake-api`

## Repo layout

- `frontend/`: React 19 + Vite dashboard, multi-entry build
- `backend/`: Flask API, Flask-SocketIO, SQLAlchemy models, migrations, tests
- `nginx/`: Nginx site configs
- `guidance/`: internal runbooks and domain notes
- `editor/`: separate editor app
- `admake-landing-page/`: public landing page project
- `static/`: uploaded/static assets

## Frontend

The frontend is a multi-entry Vite app. Main HTML outputs:

- `dashboard.html`
- `chat.html`
- `point.html`
- `login.html`

Key source areas:

- `frontend/src/common/app/dashboard/accounting/`: accounting screens
- `frontend/src/common/app/dashboard/materials/`: inventory and materials screens
- `frontend/src/common/components/dashboard/work-tables/`: task board, task modal, workspace UI
- `frontend/src/common/services/`: API client layer

Run locally:

```powershell
cd frontend
npm install
npm run dev
```

Build:

```powershell
cd frontend
npm run build
```

## Backend

The backend uses Flask, Flask-JWT-Extended, Flask-Login, Flask-SocketIO, SQLAlchemy, and PostgreSQL.

Important files:

- `backend/app.py`: app bootstrap and blueprint registration
- `backend/models.py`: models and shared helpers
- `backend/api/`: API modules
- `backend/requirements.txt`: Python dependencies

Run locally:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

Default production behavior:

- backend listens on `6000`
- Nginx proxies `/api/`, `/static/`, `/lead-manage/`, `/socket.io/`

## Current product rules

- AR payment types are intentionally split:
  - `phat_sinh` only increases receivable value and must not create/link `daily_cash` or `journal`
  - `tam_ung` is the real money collection flow and can link `daily_cash` plus `journal`
- Payroll adjustments are persisted in backend table `payroll_adjustments`
- User payroll profile currently includes `salary`, `allowance`, `bhyt`, `bhxh`
- Materials page currently uses paging at `50` items per page
- Inventory item `code` is editable via `PUT /api/inventory/items/:id`
- Inventory item delete is allowed only when the item has no stock transaction
- In `FormTask`, `Tai lieu & Binh luan` lives inside the `Thong tin` tab as a collapsible section

## Recent migrations

- `backend/migrations/20260407_user_payroll_fields.sql`
- `backend/migrations/20260407_ar_phat_sinh_cleanup.sql`
- `backend/migrations/20260407_payroll_adjustments.sql`

## Local checks

Frontend:

```powershell
cd frontend
npm run build
```

Backend tests commonly used in this repo:

```powershell
backend\.venv\Scripts\python.exe -m unittest \
  backend.tests.test_accounting_erp_logic \
  backend.tests.test_accounting_erp_simulation \
  backend.tests.test_inventory_logic \
  backend.tests.test_inventory_simulation \
  backend.tests.test_inventory_item_crud \
  backend.tests.test_workpoints_logic
```

## Deployment notes

Build frontend and deploy static files:

```powershell
cd frontend
npm run build
scp -r dist/* root@31.97.76.62:/var/www/admake
```

Backend deployment notes:

- sync changed backend files
- run required migrations
- restart with `pm2 restart admake-api`

## Debugging rules

- If the UI shows a 404 page after an in-app action, inspect the frontend console first. Router error boundaries can hide render errors.
- For attendance/workpoint bugs, verify month handling in both frontend `WorkDays.tsx` and backend `backend/api/workpoints.py`.
- When correctness is unclear, validate directly against PostgreSQL `admake_chat` before changing logic.
- Production backend source is `backend/`, not `main-be/`.
