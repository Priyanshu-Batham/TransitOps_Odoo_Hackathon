const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
const VALID_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];

router.use(authenticateToken);

router.post('/', requireRole('FleetManager'), (req, res) => {
  try {
    const { reg_number, name, type, max_load, acquisition_cost, region } = req.body;

    if (!reg_number || !name || max_load == null) {
      return res.status(400).json({ error: 'reg_number, name, and max_load are required' });
    }
    if (max_load <= 0) {
      return res.status(400).json({ error: 'max_load must be a positive number' });
    }

    const result = db
      .prepare(
        'INSERT INTO vehicles (reg_number, name, type, max_load, acquisition_cost, region) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(reg_number, name, type || null, max_load, acquisition_cost || 0, region || null);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    if (e.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ error: 'A vehicle with this registration number already exists' });
    }
    res.status(400).json({ error: e.message });
  }
});

// GET /vehicles?type=Van&status=Available&region=West
router.get('/', (req, res) => {
  const { type, status, region } = req.query;
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (region) {
    query += ' AND region = ?';
    params.push(region);
  }
  res.json(db.prepare(query).all(...params));
});

// Mandatory rule: Retired or In Shop vehicles must never appear in the
// dispatch selection pool. This endpoint is what the trip-creation UI
// should call to populate its vehicle dropdown.
router.get('/available', (req, res) => {
  res.json(db.prepare("SELECT * FROM vehicles WHERE status = 'Available'").all());
});

router.get('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(vehicle);
});

router.put('/:id', requireRole('FleetManager'), (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const { name, type, max_load, odometer, acquisition_cost, region, status } = req.body;
  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  try {
    db.prepare(
      `UPDATE vehicles SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        max_load = COALESCE(?, max_load),
        odometer = COALESCE(?, odometer),
        acquisition_cost = COALESCE(?, acquisition_cost),
        region = COALESCE(?, region),
        status = COALESCE(?, status)
      WHERE id = ?`
    ).run(name, type, max_load, odometer, acquisition_cost, region, status, req.params.id);

    res.json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id/retire', requireRole('FleetManager'), (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  if (vehicle.status === 'On Trip') {
    return res.status(400).json({ error: 'Cannot retire a vehicle that is currently On Trip' });
  }

  db.prepare("UPDATE vehicles SET status = 'Retired' WHERE id = ?").run(req.params.id);
  res.json(db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id));
});

module.exports = router;
