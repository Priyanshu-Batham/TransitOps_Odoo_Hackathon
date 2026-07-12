# TransitOps

## Smart Transport Operations Platform

TransitOps is a centralized fleet management platform built for an 8-hour hackathon. It streamlines vehicle, driver, trip, maintenance, fuel, expense, and analytics management through a modern web application.

## Features

- Authentication & Role-Based Access Control (RBAC)
- Dashboard with KPIs
- Vehicle Registry
- Driver Management
- Trip Management
- Maintenance Workflow
- Fuel & Expense Tracking
- Reports & Analytics
- CSV Export (PDF optional)
- Responsive UI

## Tech Stack

### Frontend
- React
- Vite
- Vanilla CSS

### Backend
- Node.js
- Express.js

### Database
- SQLite
- better-sqlite3

## System Architecture

```text
Browser
   |
React + Vite
   |
Express REST API
   |
Business Logic
   |
SQLite Database
```

## User Roles

### Fleet Manager
- Vehicle lifecycle
- Maintenance
- Fleet utilization

### Driver
- Trip management
- Delivery updates

### Safety Officer
- License compliance
- Safety monitoring

### Financial Analyst
- Fuel & expense analysis
- Operational reports

## Database Schema

### vehicles
| Column | Type |
|---|---|
| id | INTEGER |
| reg_number | TEXT UNIQUE |
| name | TEXT |
| type | TEXT |
| max_load | REAL |
| odometer | REAL |
| acquisition_cost | REAL |
| status | TEXT |

### drivers
| Column | Type |
|---|---|
| id | INTEGER |
| name | TEXT |
| license_number | TEXT |
| license_category | TEXT |
| license_expiry | TEXT |
| contact | TEXT |
| safety_score | REAL |
| status | TEXT |

### trips
| Column | Type |
|---|---|
| id | INTEGER |
| source | TEXT |
| destination | TEXT |
| vehicle_id | INTEGER |
| driver_id | INTEGER |
| cargo_weight | REAL |
| planned_distance | REAL |
| status | TEXT |
| final_odometer | REAL |
| fuel_consumed | REAL |
| created_at | TEXT |

### maintenance_logs
| Column | Type |
|---|---|
| id | INTEGER |
| vehicle_id | INTEGER |
| description | TEXT |
| cost | REAL |
| status | TEXT |
| created_at | TEXT |

### fuel_logs
| Column | Type |
|---|---|
| id | INTEGER |
| vehicle_id | INTEGER |
| liters | REAL |
| cost | REAL |
| date | TEXT |

### expenses
| Column | Type |
|---|---|
| id | INTEGER |
| vehicle_id | INTEGER |
| type | TEXT |
| amount | REAL |
| date | TEXT |

## Business Rules

- Vehicle registration number must be unique.
- Retired and In Shop vehicles cannot be dispatched.
- Suspended or expired-license drivers cannot be assigned.
- A vehicle or driver already On Trip cannot be assigned again.
- Cargo weight must not exceed vehicle max load.
- Dispatch automatically marks vehicle and driver as **On Trip**.
- Completing a trip restores both to **Available**.
- Cancelling a dispatched trip restores availability.
- Opening maintenance changes vehicle status to **In Shop**.
- Closing maintenance restores vehicle status unless retired.

## API Documentation

### Vehicles

| Method | Endpoint |
|---|---|
| POST | `/vehicles` |
| GET | `/vehicles` |

### Drivers

| Method | Endpoint |
|---|---|
| POST | `/drivers` |
| GET | `/drivers` |

### Trips

| Method | Endpoint |
|---|---|
| POST | `/trips` |
| GET | `/trips` |
| POST | `/trips/:id/dispatch` |
| POST | `/trips/:id/complete` |
| POST | `/trips/:id/cancel` |

### Maintenance

| Method | Endpoint |
|---|---|
| POST | `/maintenance` |
| POST | `/maintenance/:id/close` |

## Folder Structure

```text
TransitOps/
├── backend/
│   ├── services/
│   ├── db.js
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Installation

```bash
git clone <repository-url>
cd TransitOps
```

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Backend: http://localhost:5000

Frontend: http://localhost:5173

## Workflow

1. Register Vehicle
2. Register Driver
3. Create Trip
4. Validate Business Rules
5. Dispatch Trip
6. Complete Trip
7. Update Vehicle & Driver Status
8. Record Fuel Usage
9. Create Maintenance Record
10. Generate Reports

## Future Enhancements

- Live GPS Tracking
- Email reminders
- Vehicle document management
- Predictive maintenance
- Cloud deployment
- Mobile application

## License

Developed for educational and hackathon purposes.
