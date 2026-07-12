const Database = require('better-sqlite3');
const db = new Database('transitops.db');

db.exec(`
CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reg_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  max_load REAL NOT NULL,
  odometer REAL DEFAULT 0,
  acquisition_cost REAL DEFAULT 0,
  status TEXT DEFAULT 'Available' -- Available, On Trip, In Shop, Retired
);

CREATE TABLE IF NOT EXISTS drivers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  license_number TEXT,
  license_category TEXT,
  license_expiry TEXT,
  contact TEXT,
  safety_score REAL DEFAULT 100,
  status TEXT DEFAULT 'Available' -- Available, On Trip, Off Duty, Suspended
);

CREATE TABLE IF NOT EXISTS trips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT,
  destination TEXT,
  vehicle_id INTEGER,
  driver_id INTEGER,
  cargo_weight REAL,
  planned_distance REAL,
  status TEXT DEFAULT 'Draft', -- Draft, Dispatched, Completed, Cancelled
  final_odometer REAL,
  fuel_consumed REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  description TEXT,
  cost REAL DEFAULT 0,
  status TEXT DEFAULT 'Open', -- Open, Closed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  liters REAL,
  cost REAL,
  date TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  type TEXT,
  amount REAL,
  date TEXT DEFAULT CURRENT_TIMESTAMP
);
`);

module.exports = db;
