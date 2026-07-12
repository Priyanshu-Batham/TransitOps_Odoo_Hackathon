const express = require('express');
const db = require('../db');
const tripService = require('../services/tripService');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('FleetManager'), (req, res) => {
  try {
    const { vehicle_id, description, cost } = req.body;
    if (!vehicle_id || !description) {
      return res.status(400).json({ error: 'vehicle_id and description are required' });
    }
    res.status(201).json(tripService.openMaintenance(vehicle_id, description, cost));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /maintenance?vehicle_id=1&status=Open
router.get('/', (req, res) => {
  const { vehicle_id, status } = req.query;
  let query = 'SELECT * FROM maintenance_logs WHERE 1=1';
  const params = [];
  if (vehicle_id) {
    query += ' AND vehicle_id = ?';
    params.push(vehicle_id);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  res.json(db.prepare(query).all(...params));
});

router.post('/:id/close', requireRole('FleetManager'), (req, res) => {
  try {
    res.json(tripService.closeMaintenance(req.params.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
