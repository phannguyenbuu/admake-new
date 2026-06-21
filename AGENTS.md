@RTK.md

# AGENTS.md

## Scope
- This repo has both frontend and backend used in production.
- Production backend source is `backend/` (not `main-be/`).

## Runtime architecture
- Frontend: `frontend/` (React + Vite, multi-entry: `dashboard.html`, `chat.html`, `point.html`, `login.html`).
- Backend: `backend/` (Flask + Flask-SocketIO).
- Database: PostgreSQL database name `admake_chat`.
- Reverse proxy: Nginx (`admake.vn` config at repo root).

## Key backend paths
- `backend/app.py`: app bootstrap and blueprint registration.
- `backend/models.py`: SQLAlchemy models and shared helpers.
- `backend/api/*.py`: API modules (auth, users, workpoints, tasks, customers, supplier, leave, etc.).
- `backend/requirements.txt`: backend dependencies.

## Local run commands
- Frontend:
- `cd frontend`
- `npm install`
- `npm run dev`
- Backend:
- `cd backend`
- `python -m venv .venv`
- `.venv\\Scripts\\activate`
- `pip install -r requirements.txt`
- `python app.py`

## Deployment notes
- Build frontend:
- `cd frontend && npm run build`
- Deploy static build:
- `scp -r frontend/dist/* root@31.97.76.62:/var/www/admake`
- Backend production hiện được restart qua `pm2 restart admake-api`
- Backend runs on port `6000`, proxied by Nginx for:
- `/api/`
- `/static/`
- `/lead-manage/`
- `/socket.io/`

## Current product notes
- AR payment types are intentionally split:
- `phat_sinh` only increases receivable value and must not create/link `daily_cash` or `journal`.
- `tam_ung` is the real money collection flow and can link `daily_cash` plus `journal`.
- Payroll adjustments are persisted in backend table `payroll_adjustments`; do not reintroduce browser-only `localStorage` as the source of truth.
- User payroll profile currently includes `salary`, `allowance`, `bhyt`, `bhxh`.
- `frontend/src/common/app/dashboard/materials/page.tsx` currently uses paging at `50` items per page.
- Inventory item `code` is editable via `PUT /api/inventory/items/:id`.
- Inventory item delete is allowed only when the item has no `stock transaction`; otherwise backend returns `Item already has stock transactions`.
- Materials item spec rows are edited in the expanded sub-row under each item.
- In `FormTask`, `Tài liệu & Bình luận` now lives inside the `Thông tin` tab as a collapsible section.
- Material images (`JobAsset`) have been removed from the main `/materials` UI and moved entirely into the Material Create/Update modals. Draft images during creation are managed via `tmpTaskCreatedAssets`/`tmpTaskCreatedMessages` and flushed after the backend responds.
- The `fetch` calls in the frontend components (like `frontend/src/common/app/dashboard/statistic/page.tsx` for `/api/statistics/dashboard`) must explicitly pass the `Authorization: Bearer ${token}` header, as `require_can_view` decorators on the backend will block requests returning a `401 Unauthorized` without it.

## Recent migrations to know
- `backend/migrations/20260407_user_payroll_fields.sql`
- `backend/migrations/20260407_ar_phat_sinh_cleanup.sql`
- `backend/migrations/20260407_payroll_adjustments.sql`

## Debugging rules
- If UI shows a 404 page after an in-app action, inspect frontend console first for render errors; router error boundary can mask runtime issues.
- For attendance/workpoint bugs, verify month handling in both:
- frontend `WorkDays.tsx` date indexing logic,
- backend `backend/api/workpoints.py` `/api/workpoint/page` month filtering.
- When data correctness is in doubt, validate directly against PostgreSQL `admake_chat` before changing logic.

## Codex runtime rules
- At the start of a Codex session, run `rtk --version` to check whether RTK is available.
- If RTK is installed, prefer `rtk`-wrapped commands for verbose shell work such as `git`, `rg`, `find`, `tree`, `pytest`, `npm test`, `pnpm test`, `vitest`, `cargo test`, `docker ps`, `kubectl get pods`, and large `ls`.
- If raw command output is required for debugging, state why before running the non-RTK command.
- This machine is configured to launch `codex` with `--sandbox danger-full-access --ask-for-approval never` by default. If a higher-priority runtime policy overrides that, state it explicitly.
