const express = require('express');
const cors = require('cors');
const db = require('./db');
const tripService = require('./services/tripService');

const app = express();
app.use(cors());
app.use(express.json());

// Vehicles
app.post('/vehicles', (req, res) => {
  try {
    const { reg_number, name, type, max_load, acquisition_cost } = req.body;
    const result = db.prepare(
      'INSERT INTO vehicles (reg_number, name, type, max_load, acquisition_cost) VALUES (?, ?, ?, ?, ?)'
    ).run(reg_number, name, type, max_load, acquisition_cost || 0);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/vehicles', (req, res) => {
  res.json(db.prepare('SELECT * FROM vehicles').all());
});

// Drivers
app.post('/drivers', (req, res) => {
  try {
    const { name, license_number, license_category, license_expiry, contact } = req.body;
    const result = db.prepare(
      'INSERT INTO drivers (name, license_number, license_category, license_expiry, contact) VALUES (?, ?, ?, ?, ?)'
    ).run(name, license_number, license_category, license_expiry, contact);
    res.json({ id: result.lastInsertRowid });
  } catch (e) { res.status(400).json({ error: e.message }); }
});
app.get('/drivers', (req, res) => {
  res.json(db.prepare('SELECT * FROM drivers').all());
});

// Trips
app.post('/trips', (req, res) => {
  const { source, destination, vehicle_id, driver_id, cargo_weight, planned_distance } = req.body;
  const result = db.prepare(
    'INSERT INTO trips (source, destination, vehicle_id, driver_id, cargo_weight, planned_distance) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(source, destination, vehicle_id, driver_id, cargo_weight, planned_distance);
  res.json({ id: result.lastInsertRowid });
});
app.get('/trips', (req, res) => {
  res.json(db.prepare('SELECT * FROM trips').all());
});
app.post('/trips/:id/dispatch', (req, res) => {
  try { res.json(tripService.dispatchTrip(req.params.id)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/trips/:id/complete', (req, res) => {
  try { res.json(tripService.completeTrip(req.params.id, req.body.final_odometer, req.body.fuel_consumed)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/trips/:id/cancel', (req, res) => {
  try { res.json(tripService.cancelTrip(req.params.id)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Maintenance
app.post('/maintenance', (req, res) => {
  try { res.json(tripService.openMaintenance(req.body.vehicle_id, req.body.description, req.body.cost)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.post('/maintenance/:id/close', (req, res) => {
  try { res.json(tripService.closeMaintenance(req.params.id)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

app.listen(4000, () => console.log('TransitOps API running on http://localhost:4000'));
