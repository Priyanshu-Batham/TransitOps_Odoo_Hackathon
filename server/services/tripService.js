const db = require("../db");

function dispatchTrip(tripId) {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Draft")
    throw new Error("Only Draft trips can be dispatched");

  const vehicle = db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(trip.vehicle_id);
  const driver = db
    .prepare("SELECT * FROM drivers WHERE id = ?")
    .get(trip.driver_id);

  if (!vehicle || vehicle.status !== "Available")
    throw new Error("Vehicle not available");
  if (!driver || driver.status !== "Available")
    throw new Error("Driver not available");
  if (driver.status === "Suspended") throw new Error("Driver is suspended");
  if (driver.license_expiry && new Date(driver.license_expiry) < new Date())
    throw new Error("Driver license expired");
  if (trip.cargo_weight > vehicle.max_load)
    throw new Error(
      `Cargo weight ${trip.cargo_weight}kg exceeds max load ${vehicle.max_load}kg`,
    );

  db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(
    "On Trip",
    vehicle.id,
  );
  db.prepare("UPDATE drivers SET status = ? WHERE id = ?").run(
    "On Trip",
    driver.id,
  );
  db.prepare("UPDATE trips SET status = ? WHERE id = ?").run(
    "Dispatched",
    tripId,
  );

  return { ...trip, status: "Dispatched" };
}

function completeTrip(tripId, finalOdometer, fuelConsumed) {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Dispatched")
    throw new Error("Only Dispatched trips can be completed");

  db.prepare("UPDATE vehicles SET status = ?, odometer = ? WHERE id = ?").run(
    "Available",
    finalOdometer,
    trip.vehicle_id,
  );
  db.prepare("UPDATE drivers SET status = ? WHERE id = ?").run(
    "Available",
    trip.driver_id,
  );
  db.prepare(
    "UPDATE trips SET status = ?, final_odometer = ?, fuel_consumed = ? WHERE id = ?",
  ).run("Completed", finalOdometer, fuelConsumed, tripId);

  if (fuelConsumed) {
    db.prepare(
      "INSERT INTO fuel_logs (vehicle_id, liters, cost) VALUES (?, ?, ?)",
    ).run(trip.vehicle_id, fuelConsumed, 0);
  }

  return {
    ...trip,
    status: "Completed",
    final_odometer: finalOdometer,
    fuel_consumed: fuelConsumed,
  };
}

function cancelTrip(tripId) {
  const trip = db.prepare("SELECT * FROM trips WHERE id = ?").get(tripId);
  if (!trip) throw new Error("Trip not found");
  if (trip.status !== "Dispatched")
    throw new Error("Only Dispatched trips can be cancelled");

  db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(
    "Available",
    trip.vehicle_id,
  );
  db.prepare("UPDATE drivers SET status = ? WHERE id = ?").run(
    "Available",
    trip.driver_id,
  );
  db.prepare("UPDATE trips SET status = ? WHERE id = ?").run(
    "Cancelled",
    tripId,
  );

  return { ...trip, status: "Cancelled" };
}

function openMaintenance(vehicleId, description, cost = 0) {
  const vehicle = db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(vehicleId);
  if (!vehicle) throw new Error("Vehicle not found");
  if (vehicle.status === "On Trip")
    throw new Error("Cannot service a vehicle that is On Trip");

  const result = db
    .prepare(
      "INSERT INTO maintenance_logs (vehicle_id, description, cost, status) VALUES (?, ?, ?, ?)",
    )
    .run(vehicleId, description, cost, "Open");
  db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(
    "In Shop",
    vehicleId,
  );

  return {
    id: result.lastInsertRowid,
    vehicle_id: vehicleId,
    description,
    cost,
    status: "Open",
  };
}

function closeMaintenance(maintenanceId) {
  const log = db
    .prepare("SELECT * FROM maintenance_logs WHERE id = ?")
    .get(maintenanceId);
  if (!log) throw new Error("Maintenance log not found");

  db.prepare("UPDATE maintenance_logs SET status = ? WHERE id = ?").run(
    "Closed",
    maintenanceId,
  );

  const vehicle = db
    .prepare("SELECT * FROM vehicles WHERE id = ?")
    .get(log.vehicle_id);
  if (vehicle.status !== "Retired") {
    db.prepare("UPDATE vehicles SET status = ? WHERE id = ?").run(
      "Available",
      log.vehicle_id,
    );
  }

  return { ...log, status: "Closed" };
}

module.exports = {
  dispatchTrip,
  completeTrip,
  cancelTrip,
  openMaintenance,
  closeMaintenance,
};
