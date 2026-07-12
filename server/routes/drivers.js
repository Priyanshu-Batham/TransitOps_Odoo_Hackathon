const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const VALID_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];

router.use(authenticateToken);

router.post('/', requireRole('FleetManager', 'SafetyOfficer'), (req, res) => {
  try {
    const { name, license_number, license_category, license_expiry, contact } = req.body;

    if (!name || !license_number || !license_expiry) {
      return res.status(400).json({ error: 'name, license_number, and license_expiry are required' });
    }

    const result = db
      .prepare(
        'INSERT INTO drivers (name, license_number, license_category, license_expiry, contact) VALUES (?, ?, ?, ?, ?)'
      )
      .run(name, license_number, license_category || null, license_expiry, contact || null);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /drivers?status=Available
router.get('/', (req, res) => {
  const { status } = req.query;
  if (status) {
    return res.json(db.prepare('SELECT * FROM drivers WHERE status = ?').all(status));
  }
  res.json(db.prepare('SELECT * FROM drivers').all());
});

// Mandatory rule: drivers with expired licenses or Suspended status cannot
// be assigned to trips. This is what the trip-creation UI should call to
// populate its driver dropdown.
router.get('/available', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  res.json(
    db
      .prepare(
        "SELECT * FROM drivers WHERE status = 'Available' AND (license_expiry IS NULL OR license_expiry >= ?)"
      )
      .all(today)
  );
});

router.get('/:id', (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  res.json(driver);
});

router.put('/:id', requireRole('FleetManager', 'SafetyOfficer'), (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  const { name, license_number, license_category, license_expiry, contact, safety_score, status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  db.prepare(
    `UPDATE drivers SET
      name = COALESCE(?, name),
      license_number = COALESCE(?, license_number),
      license_category = COALESCE(?, license_category),
      license_expiry = COALESCE(?, license_expiry),
      contact = COALESCE(?, contact),
      safety_score = COALESCE(?, safety_score),
      status = COALESCE(?, status)
    WHERE id = ?`
  ).run(name, license_number, license_category, license_expiry, contact, safety_score, status, req.params.id);

  res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
});

router.put('/:id/suspend', requireRole('SafetyOfficer', 'FleetManager'), (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  if (driver.status === 'On Trip') {
    return res.status(400).json({ error: 'Cannot suspend a driver who is currently On Trip' });
  }

  db.prepare("UPDATE drivers SET status = 'Suspended' WHERE id = ?").run(req.params.id);
  res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
});

router.put('/:id/reinstate', requireRole('SafetyOfficer', 'FleetManager'), (req, res) => {
  const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });

  db.prepare("UPDATE drivers SET status = 'Available' WHERE id = ?").run(req.params.id);
  res.json(db.prepare('SELECT * FROM drivers WHERE id = ?').get(req.params.id));
});

module.exports = router;
