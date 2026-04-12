# SmartCare

SmartCare is a full‑stack web application for managing a small hospital/clinic workflow. It supports multiple roles (Admin, Doctor, Receptionist, Patient) so each user sees the tools they need without extra complexity.

## Project Goal

- Provide one place to manage patients, visits (appointments), and medical records
- Make booking and managing visits simple for patients and staff
- Give admins clear reporting and oversight

## Tech Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL + Sequelize (ORM)
- Auth: JSON Web Tokens (JWT)
- File uploads: Multer (doctor photos)

## Key Features

- Patients: view profile, book visits, change time, cancel/remove past visits
- Doctors: view schedule, manage patient records, update visit status
- Receptionists: manage daily appointments, check-in patients, update visit status
- Admins: manage users/doctors/patients, view reports and basic system metrics

## Requirements

- Node.js (LTS recommended)
- npm
- MySQL server running locally

## Installation

### 1) Backend (API)

```bash
cd backend
npm install
```

Create your environment file:

```bash
copy .env.example .env
```

Update `backend/.env` with your local database details and a strong JWT secret:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=replace_with_secure_random_string

DB_NAME=smartcare_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
DB_PORT=3306
DB_DIALECT=mysql
```

Create the database in MySQL (example):

```sql
CREATE DATABASE smartcare_db;
```

Start the API:

```bash
npm run dev
```

API base URL:

- http://localhost:5000

### 2) Frontend (Web App)

```bash
cd ../frontend
npm install
npm run dev
```

App URL:

- http://localhost:5173

The frontend dev server proxies `/api` requests to the backend at `http://localhost:5000`.

## Environment Variables

Backend variables (see [backend/.env.example](file:///C:/Users/USER/Desktop/SmareCareProject/backend/.env.example)):

- `PORT`: API port (default: 5000)
- `NODE_ENV`: `development` or `production`
- `JWT_SECRET`: secret used to sign login tokens
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_DIALECT`: MySQL connection settings

Optional backend variables:

- `CORS_ORIGINS`: comma-separated list of allowed origins (in addition to `http://localhost:<port>`)
- `SEED_DEMO_DOCTOR=true`: creates/ensures a demo doctor user on startup

## Demo Accounts (Development)

The backend ensures an Admin account on startup:

- Admin: `admin` / `admin123`

If you set `SEED_DEMO_DOCTOR=true` in `backend/.env`, the backend also ensures:

- Doctor: `doc` / `doc123`

## Usage Examples

### Login (example)

```bash
curl -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"admin123\"}"
```

### Check API status

```bash
curl http://localhost:5000/
```

## Project Structure

```text
SmareCareProject/
  backend/                 Express API + Sequelize models + routes
  frontend/                React (Vite) web application
```

## Common Scripts

Backend (`backend/package.json`)

- `npm run dev`: start API with auto-reload (nodemon)
- `npm start`: start API without auto-reload
- `npm run init-db`: initialize database (if used in your setup)

Frontend (`frontend/package.json`)

- `npm run dev`: start the Vite dev server

## Contributing Guidelines

- Create a new branch for each change: `feature/...` or `fix/...`
- Keep UI text clear and user-friendly (avoid technical jargon)
- Keep changes focused and easy to review
- Before opening a pull request, run the app locally and confirm the main flows still work (login, view dashboards, create/manage visits)


