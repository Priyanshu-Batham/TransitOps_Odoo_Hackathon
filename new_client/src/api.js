const BASE_URL = 'http://localhost:4000';

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new Error('Cannot reach the API at localhost:4000. Is the server running?');
  }
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

const get = (path) => request(path);
const post = (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) });

export const api = {
  // Vehicles
  listVehicles: () => get('/vehicles'),
  createVehicle: (data) => post('/vehicles', data),

  // Drivers
  listDrivers: () => get('/drivers'),
  createDriver: (data) => post('/drivers', data),

  // Trips
  listTrips: () => get('/trips'),
  createTrip: (data) => post('/trips', data),
  dispatchTrip: (id) => post(`/trips/${id}/dispatch`),
  completeTrip: (id, final_odometer, fuel_consumed) =>
    post(`/trips/${id}/complete`, { final_odometer, fuel_consumed }),
  cancelTrip: (id) => post(`/trips/${id}/cancel`),

  // Maintenance (no GET endpoint exists on the server — logs are tracked
  // client-side for the session, see MaintenanceContext)
  openMaintenance: (data) => post('/maintenance', data),
  closeMaintenance: (id) => post(`/maintenance/${id}/close`),
};
