# TransitOps — Smart Transport Operations Platform

TransitOps is a fleet-management application for vehicles, drivers, trips, maintenance, fuel, expenses, and operational reporting. It provides a React frontend and an Express/SQLite API with role-based access control.

## Stack

- Frontend: React, Vite, Vanilla CSS (`new_client/`)
- Backend: Node.js, Express, SQLite via `better-sqlite3` (`server/`)
- Security: JWT authentication, role-based access control, Helmet

## Setup

Install and run the backend:

```bash
cd server
npm install
npm rebuild better-sqlite3   # only if you see a NODE_MODULE_VERSION error
cp .env.example .env         # optional; defaults are included
npm run seed                 # creates the demo users
npm start                    # http://localhost:4000
```

Install and run the frontend in another terminal:

```bash
cd new_client
npm install
npm run dev                  # http://localhost:5173
```

Confirm the API is running:

```bash
curl http://localhost:4000/health
```

## Demo logins

`npm run seed` creates the following accounts:

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleetmanager@transitops.com | password123 |
| Driver | driver@transitops.com | password123 |
| Safety Officer | safety@transitops.com | password123 |
| Financial Analyst | finance@transitops.com | password123 |

Use `POST /auth/login` to obtain a JWT, then send it as `Authorization: Bearer <token>` on protected requests.

## Verification

Run the backend, then execute the smoke test from `server/`:

```bash
npm run smoke-test
```

It covers registration uniqueness, load limits, license and suspension checks, double-booking prevention, maintenance transitions, and dashboard/report endpoints.

## API overview

All routes except `/health`, `/auth/register`, and `/auth/login` require authentication.

| Area | Routes |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Vehicles | `POST/GET /vehicles`, `GET /vehicles/available`, `GET/PUT /vehicles/:id`, `PUT /vehicles/:id/retire` |
| Drivers | `POST/GET /drivers`, `GET /drivers/available`, `GET/PUT /drivers/:id`, `PUT /drivers/:id/suspend`, `PUT /drivers/:id/reinstate` |
| Trips | `POST/GET /trips`, `GET /trips/:id`, `POST /trips/:id/dispatch`, `POST /trips/:id/complete`, `POST /trips/:id/cancel` |
| Maintenance | `POST/GET /maintenance`, `POST /maintenance/:id/close` |
| Fuel | `POST/GET /fuel-logs` |
| Expenses | `POST/GET /expenses` |
| Reports | `GET /reports/vehicle/:id`, `GET /reports/fleet`, `GET /reports/fleet/csv`, `GET /reports/dashboard` |

## Business rules

- Vehicle registration numbers are unique.
- Retired or in-shop vehicles cannot be dispatched.
- Suspended drivers and drivers with expired licences cannot be assigned.
- Vehicles and drivers already on a trip cannot be double-booked.
- Cargo weight cannot exceed a vehicle's maximum load.
- Dispatching marks the assigned vehicle and driver as `On Trip`; completing or cancelling restores availability.
- Opening maintenance marks a vehicle `In Shop`; closing it restores availability unless it is retired.
- Fleet reports include vehicle ROI; CSV export is available at `/reports/fleet/csv`.

## Project structure

```text
server/
  db.js                  # schema and lightweight migrations
  index.js               # API entrypoint
  seed.js                # demo user seed script
  middleware/auth.js     # JWT verification and role guard
  routes/                # resource routers
  services/tripService.js
  scripts/smoke-test.js
new_client/
  src/                   # React application
  public/
  package.json
```
