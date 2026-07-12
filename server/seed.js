// Run with: node seed.js
// Creates one demo login per role so the app can be demoed immediately
// without needing to register accounts first.
const bcrypt = require('bcryptjs');
const db = require('./db');

const users = [
  { name: 'Fleet Manager', email: 'fleetmanager@transitops.com', password: 'password123', role: 'FleetManager' },
  { name: 'Driver Alex', email: 'driver@transitops.com', password: 'password123', role: 'Driver' },
  { name: 'Safety Officer', email: 'safety@transitops.com', password: 'password123', role: 'SafetyOfficer' },
  { name: 'Financial Analyst', email: 'finance@transitops.com', password: 'password123', role: 'FinancialAnalyst' },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)'
);

for (const u of users) {
  const password_hash = bcrypt.hashSync(u.password, 10);
  insert.run(u.name, u.email, password_hash, u.role);
}

console.log('Seeded demo users (email / password):');
users.forEach((u) => console.log(`  ${u.role.padEnd(16)} ${u.email} / ${u.password}`));
