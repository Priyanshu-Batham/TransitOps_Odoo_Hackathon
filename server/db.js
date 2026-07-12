const Database = require('better-sqlite3');
const db = new Database(process.env.DB_PATH || 'transitops.db');

db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL, -- FleetManager, Driver, SafetyOfficer, FinancialAnalyst
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reg_number TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  region TEXT,
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
  revenue REAL DEFAULT 0,
  status TEXT DEFAULT 'Draft', -- Draft, Dispatched, Completed, Cancelled
  final_odometer REAL,
  fuel_consumed REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id)
);

CREATE TABLE IF NOT EXISTS maintenance_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  description TEXT,
  cost REAL DEFAULT 0,
  status TEXT DEFAULT 'Open', -- Open, Closed
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS fuel_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  liters REAL,
  cost REAL,
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);

CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER,
  type TEXT,
  amount REAL,
  date TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
);
`);

// Lightweight migration helper: adds a column to an existing table if it's
// not already there. This lets teammates pull latest code without needing
// to delete their local transitops.db (which would wipe test data).
function ensureColumn(table, column, definition) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

ensureColumn('vehicles', 'region', 'TEXT');
ensureColumn('trips', 'revenue', 'REAL DEFAULT 0');

module.exports = db;
