# API Overview

Back to the [README](../README.md).

All routes are under `/api`. Apart from the public routes, every route needs an `Authorization: Bearer <token>` header and the listed role.

| Area | Method and path | Role |
| --- | --- | --- |
| Auth | `POST /auth/login`, `POST /auth/register-patient`, `POST /auth/activate` | public |
| | `POST /auth/change-password` | signed in |
| Doctors | `GET /doctors`, `GET /doctors/:id/photo` | public |
| Health | `GET /health` (checks the database too; 503 when it is down) | public |
| Demo | `POST /demo/reset` (header `X-Demo-Reset-Token`) | reset token |
| Patient | `GET`, `PUT /patient/profile` | patient |
| | `GET`, `POST /patient/appointments` | patient |
| | `PUT /patient/appointments/:id` (move), `DELETE /patient/appointments/:id` (cancel) | patient |
| | `GET /patient/records`, `GET /patient/doctors` | patient |
| | `GET /patient/availability?days=` (free times per doctor) | patient |
| Doctor | `GET /doctor/profile`, `POST /doctor/photo`, `PUT /doctor/availability` | doctor |
| | `GET /doctor/appointments`, `PUT /doctor/appointments/:id` | doctor |
| | `GET /doctor/patients`, `GET /doctor/patients/:id` | doctor |
| | `POST /doctor/records`, `PUT /doctor/records/:id` | doctor |
| Front desk | `GET`, `POST /receptionist/patients`, `PUT /receptionist/patients/:id` | receptionist |
| | `POST /receptionist/patients/:id/activation-code` | receptionist |
| | `GET /receptionist/doctors`, `GET /receptionist/availability?days=` | receptionist |
| | `GET`, `POST /receptionist/appointments`, `GET /receptionist/appointments/day?date=` | receptionist |
| | `PUT /receptionist/appointments/:id`, `PUT /receptionist/checkin/:appointmentId` | receptionist |
| Administration | `GET`, `POST /admin/users`, `DELETE /admin/users/:id` | admin |
| | `POST /admin/users/:id/reset-password` | admin |
| | `GET /admin/doctors`, `PUT /admin/doctors/:id`, `POST /admin/doctors/:id/photo` | admin |
| | `GET /admin/analytics?days=7\|30`, `GET /admin/activity` | admin |

Every error answer has the same shape, `{ "message": "..." }`, with a status that says what went wrong: `400` invalid input (including malformed JSON), `401` missing or invalid token, `403` the role may not do this (or a demo account), `404` unknown route or a record the user may not see, `409` a conflict with existing data (a taken username or slot, a visit note that already exists, an account with medical history), `429` too many attempts, `500` an unexpected server error (details are only logged, never sent).

Example:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"<username>","password":"<password>"}'
```
