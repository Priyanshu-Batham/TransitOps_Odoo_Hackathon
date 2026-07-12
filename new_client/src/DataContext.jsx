import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  // The API has no GET /maintenance route, so logs opened this session
  // are tracked here in memory (seeded from each POST /maintenance response).
  const [maintenanceLogs, setMaintenanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      const [v, d, t] = await Promise.all([
        api.listVehicles(),
        api.listDrivers(),
        api.listTrips(),
      ]);
      setVehicles(v);
      setDrivers(d);
      setTrips(t);
      setConnectionError(null);
    } catch (err) {
      setConnectionError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const vehicleById = (id) => vehicles.find((v) => v.id === Number(id));
  const driverById = (id) => drivers.find((d) => d.id === Number(id));

  const addMaintenanceLog = (log) => setMaintenanceLogs((l) => [log, ...l]);
  const updateMaintenanceLog = (id, patch) =>
    setMaintenanceLogs((l) => l.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  return (
    <DataContext.Provider
      value={{
        vehicles,
        drivers,
        trips,
        maintenanceLogs,
        loading,
        connectionError,
        refreshAll,
        vehicleById,
        driverById,
        addMaintenanceLog,
        updateMaintenanceLog,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}
