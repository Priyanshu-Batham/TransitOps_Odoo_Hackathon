const express = require('express');
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

function computeVehicleReport(vehicle) {
  const fuelTotal = db
    .prepare('SELECT COALESCE(SUM(cost),0) as total, COALESCE(SUM(liters),0) as liters FROM fuel_logs WHERE vehicle_id = ?')
    .get(vehicle.id);
  const maintenanceTotal = db
    .prepare('SELECT COALESCE(SUM(cost),0) as total FROM maintenance_logs WHERE vehicle_id = ?')
    .get(vehicle.id);
  const expenseTotal = db
    .prepare('SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE vehicle_id = ?')
    .get(vehicle.id);
  const tripAgg = db
    .prepare(
      "SELECT COALESCE(SUM(planned_distance),0) as distance, COALESCE(SUM(revenue),0) as revenue FROM trips WHERE vehicle_id = ? AND status = 'Completed'"
    )
    .get(vehicle.id);

  const operationalCost = fuelTotal.total + maintenanceTotal.total + expenseTotal.total;
  const fuelEfficiency = fuelTotal.liters > 0 ? +(tripAgg.distance / fuelTotal.liters).toFixed(2) : null;

  // Vehicle ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
  const roi =
    vehicle.acquisition_cost > 0
      ? +((tripAgg.revenue - (maintenanceTotal.total + fuelTotal.total)) / vehicle.acquisition_cost).toFixed(4)
      : null;

  return {
    vehicle_id: vehicle.id,
    reg_number: vehicle.reg_number,
    fuel_cost: fuelTotal.total,
    maintenance_cost: maintenanceTotal.total,
    other_expenses: expenseTotal.total,
    operational_cost: operationalCost,
    total_distance: tripAgg.distance,
    total_revenue: tripAgg.revenue,
    fuel_efficiency_km_per_liter: fuelEfficiency,
    roi,
  };
}

router.get('/vehicle/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
  res.json(computeVehicleReport(vehicle));
});

router.get('/fleet', requireRole('FleetManager', 'FinancialAnalyst'), (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles').all();
  res.json(vehicles.map(computeVehicleReport));
});

// CSV export of the fleet-wide report (mandatory: "Support CSV export")
router.get('/fleet/csv', requireRole('FleetManager', 'FinancialAnalyst'), (req, res) => {
  const vehicles = db.prepare('SELECT * FROM vehicles').all();
  const rows = vehicles.map(computeVehicleReport);

  const headers = [
    'vehicle_id',
    'reg_number',
    'fuel_cost',
    'maintenance_cost',
    'other_expenses',
    'operational_cost',
    'total_distance',
    'total_revenue',
    'fuel_efficiency_km_per_liter',
    'roi',
  ];
  const csvLines = [headers.join(',')];
  for (const row of rows) {
    csvLines.push(headers.map((h) => row[h] ?? '').join(','));
  }
  const csv = csvLines.join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fleet_report.csv"');
  res.send(csv);
});

router.get('/dashboard', (req, res) => {
  const vehiclesByStatus = db.prepare('SELECT status, COUNT(*) as count FROM vehicles GROUP BY status').all();
  const driversByStatus = db.prepare('SELECT status, COUNT(*) as count FROM drivers GROUP BY status').all();
  const tripsByStatus = db.prepare('SELECT status, COUNT(*) as count FROM trips GROUP BY status').all();

  const totalVehicles = db.prepare('SELECT COUNT(*) as c FROM vehicles').get().c;
  const availableVehicles = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status = 'Available'").get().c;
  const inMaintenance = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status = 'In Shop'").get().c;
  const onTrip = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status = 'On Trip'").get().c;
  const activeVehicles = db.prepare("SELECT COUNT(*) as c FROM vehicles WHERE status != 'Retired'").get().c;
  const activeTrips = db.prepare("SELECT COUNT(*) as c FROM trips WHERE status = 'Dispatched'").get().c;
  const pendingTrips = db.prepare("SELECT COUNT(*) as c FROM trips WHERE status = 'Draft'").get().c;
  const driversOnDuty = db.prepare("SELECT COUNT(*) as c FROM drivers WHERE status = 'On Trip'").get().c;

  res.json({
    active_vehicles: activeVehicles,
    available_vehicles: availableVehicles,
    vehicles_in_maintenance: inMaintenance,
    active_trips: activeTrips,
    pending_trips: pendingTrips,
    drivers_on_duty: driversOnDuty,
    fleet_utilization_pct: totalVehicles > 0 ? +((onTrip / totalVehicles) * 100).toFixed(1) : 0,
    vehicles_by_status: vehiclesByStatus,
    drivers_by_status: driversByStatus,
    trips_by_status: tripsByStatus,
  });
});

module.exports = router;
