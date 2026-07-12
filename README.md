# TransitOps — Smart Transport Operations Platform

Backend API for managing vehicles, drivers, trips, maintenance, fuel, expenses, and reporting for a logistics fleet.

## Stack

- Node.js + Express
- SQLite (via `better-sqlite3`) — zero-config, file-based
- JWT auth with role-based access control (RBAC)

## Setup

```bash
cd server
npm install
npm rebuild better-sqlite3   # only needed if you see a NODE_MODULE_VERSION error
cp .env.example .env         # optional — sensible defaults are baked in
npm run seed                 # creates one demo login per role
npm start                    # runs on http://localhost:4000
```

Verify it's alive:
```bash
curl http://localhost:4000/health
```

## Demo logins

Created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Fleet Manager | fleetmanager@transitops.com | password123 |
| Driver | driver@transitops.com | password123 |
| Safety Officer | safety@transitops.com | password123 |
| Financial Analyst | finance@transitops.com | password123 |

`POST /auth/login` with one of these returns a JWT. Send it as `Authorization: Bearer <token>` on every other request.

## Verifying everything still works

After pulling changes or making edits, run the server in one terminal and the smoke test in another:
```bash
npm start
# in a second terminal:
npm run smoke-test
```
This exercises every mandatory business rule (unique registration numbers, cargo weight limits, expired-license/suspended-driver blocking, double-booking prevention, maintenance status transitions, dashboard/report endpoints) and prints a pass/fail summary.

## API overview

All routes except `/health`, `/auth/register`, and `/auth/login` require `Authorization: Bearer <token>`.

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

### Roles

`FleetManager`, `Driver`, `SafetyOfficer`, `FinancialAnalyst` — passed at registration and enforced per-route (e.g. only a Fleet Manager can register a vehicle; only a Safety Officer or Fleet Manager can suspend a driver).

### Mandatory business rules implemented

- Vehicle registration number is unique (DB-enforced + friendly 409 response)
- Retired / In Shop vehicles never appear in `/vehicles/available`
- Suspended drivers or drivers with an expired license never appear in `/drivers/available`, and are blocked server-side at dispatch even if the client sends their ID directly
- A vehicle or driver already `On Trip` cannot be assigned to a second trip
- Cargo weight is validated against the vehicle's max load both at trip creation and at dispatch
- Dispatching a trip sets both vehicle and driver to `On Trip`; completing or cancelling restores both to `Available`
- Opening a maintenance record sets the vehicle to `In Shop`; closing it restores `Available` (unless the vehicle is `Retired`)
- Vehicle ROI = `(Revenue − (Maintenance + Fuel)) / Acquisition Cost`, computed from completed trips' `revenue` field
- CSV export available at `/reports/fleet/csv`

## Project structure

```
server/
  db.js                  — schema + lightweight migrations
  index.js                — app entrypoint, wires routers together
  seed.js                 — creates demo login accounts
  middleware/auth.js       — JWT verification + role guard
  routes/                 — one router per resource
  services/tripService.js  — trip/maintenance state-transition engine
  scripts/smoke-test.js    — end-to-end business-rule test
```

## Not included in this build

Frontend (React client) — being built separately. Bonus features not yet implemented: PDF export, email reminders for expiring licenses, vehicle document management, dark mode.
