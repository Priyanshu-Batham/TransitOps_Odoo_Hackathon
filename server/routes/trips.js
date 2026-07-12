const express = require('express');
const db = require('../db');
const tripService = require('../services/tripService');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

router.post('/', requireRole('Driver', 'FleetManager'), (req, res) => {
  try {
    const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue } = req.body;

    if (!source || !destination || !vehicle_id || !driver_id || cargo_weight == null) {
      return res
        .status(400)
        .json({ error: 'source, destination, vehicle_id, driver_id, and cargo_weight are required' });
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicle_id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    // Mandatory rule: cargo weight must not exceed the vehicle's max load capacity.
    // Checked here at creation time too (not just at dispatch) so the driver
    // gets immediate feedback while filling out the trip form.
    if (cargo_weight > vehicle.max_load) {
      return res
        .status(400)
        .json({ error: `Cargo weight ${cargo_weight}kg exceeds vehicle max load ${vehicle.max_load}kg` });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const result = db
      .prepare(
        'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance, revenue) VALUES (?, ?, ?, ?, ?, ?, ?)'
      )
      .run(source, destination, vehicle_id, driver_id, cargo_weight, planned_distance || 0, revenue || 0);

    res.status(201).json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /trips?status=Draft
router.get('/', (req, res) => {
  const { status } = req.query;
  if (status) {
    return res.json(db.prepare('SELECT * FROM trips WHERE status = ?').all(status));
  }
  res.json(db.prepare('SELECT * FROM trips').all());
});

router.get('/:id', (req, res) => {
  const trip = db.prepare('SELECT * FROM trips WHERE id = ?').get(req.params.id);
  if (!trip) return res.status(404).json({ error: 'Trip not found' });
  res.json(trip);
});

router.post('/:id/dispatch', requireRole('Driver', 'FleetManager'), (req, res) => {
  try {
    res.json(tripService.dispatchTrip(req.params.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/complete', requireRole('Driver', 'FleetManager'), (req, res) => {
  try {
    res.json(tripService.completeTrip(req.params.id, req.body.final_odometer, req.body.fuel_consumed));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.post('/:id/cancel', requireRole('Driver', 'FleetManager'), (req, res) => {
  try {
    res.json(tripService.cancelTrip(req.params.id));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
