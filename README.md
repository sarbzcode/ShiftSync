# ShiftSync

ShiftSync is a workforce management suite for attendance tracking, shift scheduling, and payroll automation. The repo ships with a FastAPI backend, a React admin web app, and an Expo mobile app for employees.

## Features
- Authentication and roles: JWT login with admin/employee roles, account disable/archival, admin-triggered password resets.
- Employee management: create/update/delete (archive) employees, pay rate tracking, search, last clock-out insight, roster export to Excel or PDF.
- Attendance: employee clock in/out with weekly summaries; admins can clock users in/out; completed shifts can auto-generate attendance.
- Shift scheduling: calendar-based assignment with statuses (assigned/completed), employee search, and time-window validation.
- Pay and payroll:
  - Weekly pay approvals with overtime calculation, adjustments (add/deduct, flat or percent, caps, global or per-employee), hold/unhold, bulk approval, and employee pay history.
  - Legacy bi-weekly payroll generation (APScheduler) plus manual run/approval endpoints.
- Settings and analytics: dashboard metrics (labor vs payroll, utilization, coverage heatmap, exceptions), timezone/currency/budget settings, and recent activity feed.
- Clients: Web admin console (React/Vite/Tailwind) and mobile employee app (React Native/Expo).
- API docs: interactive docs at `/docs` and `/redoc` on the backend.

## Tech Stack
- Backend: FastAPI, Beanie (MongoDB), APScheduler, bcrypt + jose JWT, Pydantic v2, Python 3.11.
- Frontend: React 18 + TypeScript, Vite, TailwindCSS, Recharts, Axios, react-router.
- Mobile: React Native / Expo (SDK 54), React Navigation, Axios.
- Testing: Pytest + HTTPX.

## Services and Ports
- Backend API: `http://localhost:8000`
- Frontend dev server: `http://localhost:5173`
- Mobile (Expo): uses `EXPO_PUBLIC_API_URL` pointing to the backend (use your LAN IP for physical devices).

## Quick Start (local)
1) Clone or unzip the project and open the repo root.

2) Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # On macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt

# Copy env template and set values
copy .env.example .env   # use `cp` on macOS/Linux
# Edit .env with your MongoDB URI and secrets (see Environment below)

# Seed the initial admin user
python app/seed/seed_admin.py

# Run the API
uvicorn app.main:app --reload --port 8000
```

3) Frontend (web admin)
```bash
cd frontend
npm install
# Ensure .env contains: VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

4) Mobile (Expo)
```bash
cd mobile
npm install
# Set EXPO_PUBLIC_API_URL to your backend (LAN IP if using a device)
npx expo start --tunnel   # or --localhost for simulator
```

Login with the seeded admin user (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) and change the password immediately.

## Environment Variables
Backend (`backend/.env`)
- `MONGODB_URI` - MongoDB connection string.
- `DB_NAME` - database name (default `shiftsync`).
- `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_AUDIENCE`, `JWT_EXPIRE_MINUTES` - auth settings.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_NAME` - initial admin seed values.
- `FRONTEND_ORIGIN` - allowed origin for CORS.

Frontend (`frontend/.env`)
- `VITE_API_BASE_URL` - base URL of the backend API.

Mobile (`mobile/.env`)
- `EXPO_PUBLIC_API_URL` - base URL of the backend API.

## Data Seeding and Fixtures
Run from `backend` with the virtualenv activated:
- `python app/seeds/seed_admin.py` - create admin (idempotent).

## API and Domain Notes
- Auth: `POST /auth/login` returns JWT; include `Authorization: Bearer <token>`.
- Roles: admins manage users, shifts, attendance overrides, pay approvals, settings; employees access their own shifts, attendance, and pay.
- Attendance: employees clock via `/attendance/start` and `/attendance/end`; admins can act on behalf of employees.
- Scheduling: `/schedule/shifts` CRUD for admin; `/schedule/my` for employee view.
- Pay (weekly approvals): `/pay/generate`, `/pay/pending`, `/pay/{id}/approve`, `/pay/{id}/hold`, `/pay/approve-all`; employees read via `/pay/my` and `/pay/my/{id}`.
- Payroll (bi-weekly legacy): `/payroll/run`, `/payroll/pending`, `/payroll/approve/{id}`, `/payroll/my`.
- Settings: timezone/currency/budget via `/settings/*`; supported lists at `/settings/timezones` and `/settings/currencies`.
- Dashboard: stats, analytics, and recent activity at `/dashboard/*`.
- API docs: `http://localhost:8000/docs` (Swagger) and `/redoc`.

## Payroll and Automation
- APScheduler runs `generate_payroll` every 14 days on API startup; you can also trigger manually via `/payroll/run`.
- Pay approvals use completed shifts to compute base/overtime pay and apply adjustments (flat/percentage, add/deduct, optional caps, global or per-employee). Pending records can be held, unheld, or bulk approved.



## Project Structure
```
backend/
  app/
    main.py, config.py, database.py
    routers/ (auth, users, attendance, schedule, pay, payroll, settings, adjustments, dashboard)
    models/, schemas/, services/ (system settings), utils/ (security, scheduler, deps)
    seed/ (admin)
  requirements.txt, Dockerfile
frontend/
  src/ (pages, components, context, lib)
  package.json, vite.config.ts, tailwind.config.cjs, Dockerfile
mobile/
  src/ (screens, navigation, context, hooks, components)
  package.json, app.json
README.md
```

## Security and Deployment Tips
- Use strong values for `JWT_SECRET` and the admin password; rotate after initial login.
- Restrict MongoDB network access (IP allowlist) and prefer MongoDB Atlas or a managed instance.
- Set `FRONTEND_ORIGIN` and `VITE_API_BASE_URL` to your deployed URLs; enable HTTPS in production.
- Dockerfiles are provided for backend and frontend; create your own docker-compose if you need multi-service orchestration.
