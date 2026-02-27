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
- Backend runs on port `6000`, proxied by Nginx for:
- `/api/`
- `/static/`
- `/lead-manage/`
- `/socket.io/`

## Debugging rules
- If UI shows a 404 page after an in-app action, inspect frontend console first for render errors; router error boundary can mask runtime issues.
- For attendance/workpoint bugs, verify month handling in both:
- frontend `WorkDays.tsx` date indexing logic,
- backend `backend/api/workpoints.py` `/api/workpoint/page` month filtering.
- When data correctness is in doubt, validate directly against PostgreSQL `admake_chat` before changing logic.
