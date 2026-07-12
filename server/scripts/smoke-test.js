// Run with: node scripts/smoke-test.js
// Requires the server to already be running on PORT (default 4000) and
// the demo users to already be seeded (node seed.js).
//
// Exercises the mandatory business rules end-to-end so you can confirm
// the whole chain still works after making changes, without manually
// re-typing curl commands and tracking IDs by hand.

const BASE = process.env.BASE_URL || 'http://localhost:4000';

let pass = 0;
let fail = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  \x1b[32m✓\x1b[0m ${label}`);
    pass++;
  } else {
    console.log(`  \x1b[31m✗\x1b[0m ${label}`);
    fail++;
  }
}

async function api(method, path, body, token) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function main() {
  console.log(`\nRunning smoke test against ${BASE}\n`);

  // --- Auth ---
  console.log('Auth');
  const login = await api('POST', '/auth/login', {
    email: 'fleetmanager@transitops.com',
    password: 'password123',
  });
  check('Fleet manager can log in', login.status === 200 && !!login.data.token);
  const fmToken = login.data.token;

  const badLogin = await api('POST', '/auth/login', { email: 'nope@x.com', password: 'wrong' });
  check('Invalid login is rejected', badLogin.status === 401);

  // --- Vehicles ---
  console.log('\nVehicles');
  const uniqueReg = `SMOKE-${Date.now()}`;
  const v1 = await api(
    'POST',
    '/vehicles',
    { reg_number: uniqueReg, name: 'Test Van', type: 'Van', max_load: 500, acquisition_cost: 20000 },
    fmToken
  );
  check('Vehicle created', v1.status === 201 && !!v1.data.id);
  const vehicleId = v1.data.id;

  const dupe = await api(
    'POST',
    '/vehicles',
    { reg_number: uniqueReg, name: 'Dupe', max_load: 100 },
    fmToken
  );
  check('Duplicate reg_number is rejected', dupe.status === 409);

  const noAuth = await api('POST', '/vehicles', { reg_number: 'X', name: 'X', max_load: 100 });
  check('Unauthenticated request is rejected', noAuth.status === 401);

  // --- Drivers ---
  console.log('\nDrivers');
  const goodDriver = await api(
    'POST',
    '/drivers',
    {
      name: 'Test Driver',
      license_number: `DL-${Date.now()}`,
      license_expiry: '2030-01-01',
      contact: '9999999999',
    },
    fmToken
  );
  check('Driver with valid license created', goodDriver.status === 201);
  const driverId = goodDriver.data.id;

  const expiredDriver = await api(
    'POST',
    '/drivers',
    {
      name: 'Expired Driver',
      license_number: `DL-EXP-${Date.now()}`,
      license_expiry: '2020-01-01',
      contact: '8888888888',
    },
    fmToken
  );
  const expiredDriverId = expiredDriver.data.id;

  // --- Trips ---
  console.log('\nTrips');
  const overweightTrip = await api(
    'POST',
    '/trips',
    { source: 'A', destination: 'B', vehicle_id: vehicleId, driver_id: driverId, cargo_weight: 999 },
    fmToken
  );
  check('Overweight cargo is rejected at creation', overweightTrip.status === 400);

  const trip = await api(
    'POST',
    '/trips',
    { source: 'Mumbai', destination: 'Pune', vehicle_id: vehicleId, driver_id: driverId, cargo_weight: 450, planned_distance: 150, revenue: 5000 },
    fmToken
  );
  check('Valid trip created in Draft status', trip.status === 201);
  const tripId = trip.data.id;

  const expiredTrip = await api(
    'POST',
    '/trips',
    { source: 'A', destination: 'B', vehicle_id: vehicleId, driver_id: expiredDriverId, cargo_weight: 100 },
    fmToken
  );
  const expiredTripId = expiredTrip.data.id;
  const expiredDispatch = await api('POST', `/trips/${expiredTripId}/dispatch`, null, fmToken);
  check('Trip with expired-license driver cannot dispatch', expiredDispatch.status === 400);

  const dispatch = await api('POST', `/trips/${tripId}/dispatch`, null, fmToken);
  check('Trip dispatches successfully', dispatch.status === 200 && dispatch.data.status === 'Dispatched');

  const vehicleAfterDispatch = await api('GET', `/vehicles/${vehicleId}`, null, fmToken);
  check('Vehicle status becomes On Trip after dispatch', vehicleAfterDispatch.data.status === 'On Trip');

  const doubleBook = await api(
    'POST',
    '/trips',
    { source: 'X', destination: 'Y', vehicle_id: vehicleId, driver_id: driverId, cargo_weight: 100 },
    fmToken
  );
  const doubleBookDispatch = await api('POST', `/trips/${doubleBook.data.id}/dispatch`, null, fmToken);
  check('Already On-Trip vehicle cannot be double-booked', doubleBookDispatch.status === 400);

  const complete = await api(
    'POST',
    `/trips/${tripId}/complete`,
    { final_odometer: 150, fuel_consumed: 12 },
    fmToken
  );
  check(
    'Trip completes with correct final_odometer/fuel_consumed in response',
    complete.status === 200 && complete.data.final_odometer === 150 && complete.data.fuel_consumed === 12
  );

  const vehicleAfterComplete = await api('GET', `/vehicles/${vehicleId}`, null, fmToken);
  check('Vehicle status returns to Available after completion', vehicleAfterComplete.data.status === 'Available');

  // --- Maintenance ---
  console.log('\nMaintenance');
  const maint = await api(
    'POST',
    '/maintenance',
    { vehicle_id: vehicleId, description: 'Oil change', cost: 500 },
    fmToken
  );
  check('Maintenance log created', maint.status === 201);

  const vehicleInShop = await api('GET', `/vehicles/${vehicleId}`, null, fmToken);
  check('Vehicle status becomes In Shop', vehicleInShop.data.status === 'In Shop');

  const vehiclesAvailablePool = await api('GET', '/vehicles/available', null, fmToken);
  check(
    'In Shop vehicle is excluded from the dispatch pool',
    !vehiclesAvailablePool.data.some((v) => v.id === vehicleId)
  );

  const closeMaint = await api('POST', `/maintenance/${maint.data.id}/close`, null, fmToken);
  check('Closing maintenance restores vehicle to Available', closeMaint.data.status === 'Closed');

  // --- Reports ---
  console.log('\nReports');
  const report = await api('GET', `/reports/vehicle/${vehicleId}`, null, fmToken);
  check('Vehicle report returns operational cost and ROI fields', report.status === 200 && 'roi' in report.data);

  const dashboard = await api('GET', '/reports/dashboard', null, fmToken);
  check('Dashboard KPIs endpoint responds', dashboard.status === 200 && 'fleet_utilization_pct' in dashboard.data);

  console.log(`\n${pass} passed, ${fail} failed\n`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Smoke test crashed:', e);
  process.exit(1);
});
