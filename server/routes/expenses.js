const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Driver', 'FleetManager', 'FinancialAnalyst'), (req, res) => {
  try {
    const { vehicle_id, type, amount, date } = req.body;
    if (!vehicle_id || !type || amount == null) {
      return res.status(400).json({ error: 'vehicle_id, type, and amount are required' });
    }

    const vehicle = db.prepare('SELECT id FROM vehicles WHERE id = ?').get(vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const result = db
      .prepare('INSERT INTO expenses (vehicle_id, type, amount, date) VALUES (?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))')
      .run(vehicle_id, type, amount, date || null);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /expenses?vehicle_id=1
router.get('/', (req, res) => {
  const { vehicle_id } = req.query;
  if (vehicle_id) {
    return res.json(db.prepare('SELECT * FROM expenses WHERE vehicle_id = ?').all(vehicle_id));
  }
  res.json(db.prepare('SELECT * FROM expenses').all());
});

module.exports = router;
