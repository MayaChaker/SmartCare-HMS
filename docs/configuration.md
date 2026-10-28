# Environment Variables

Back to the [README](../README.md).

**Backend** (`backend/.env`, see [backend/.env.example](../backend/.env.example))

| Variable | Required | Description |
| --- | --- | --- |
| `JWT_SECRET` | yes | Secret used to sign login tokens; the server will not start without it |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | first run | First admin account, created only if it does not exist |
| `DATABASE_URL` | one of | Full MySQL connection URL for a hosted database (SSL enabled) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | one of | Local MySQL connection settings |
| `CORS_ORIGINS` | production | Comma-separated frontend URLs allowed to call the API |
| `NODE_ENV` | production | Set to `production` when deployed |
| `DEMO_PASSWORD` | no | Enables the public demo accounts and sets their password (8+ characters) |
| `DEMO_RESET_TOKEN` | no | Secret required by `POST /api/demo/reset` |
| `CLINIC_TIME_ZONE` | no | The hospital's time zone, default `Asia/Beirut` |
| `PORT` | no | API port, default `5000` |

**Frontend** (`frontend/.env`, see [frontend/.env.example](../frontend/.env.example))

| Variable | Description |
| --- | --- |
| `VITE_API_BASE_URL` | Backend URL ending in `/api`; only needed for production builds |
| `VITE_DEMO_PASSWORD` | Shows the demo sign-in buttons on the login page; must match the backend's `DEMO_PASSWORD` |
