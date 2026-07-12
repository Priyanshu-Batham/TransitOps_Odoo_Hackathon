import { useState } from 'react';
import './App.css';
import { DataProvider, useData } from './DataContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Trips from './pages/Trips';
import Maintenance from './pages/Maintenance';

const PAGES = {
  dashboard: Dashboard,
  vehicles: Vehicles,
  drivers: Drivers,
  trips: Trips,
  maintenance: Maintenance,
};

function Shell() {
  const [page, setPage] = useState('dashboard');
  const { vehicles, drivers, trips, maintenanceLogs, loading, connectionError } = useData();
  const Page = PAGES[page];

  const counts = {
    vehicles: vehicles.length,
    drivers: drivers.length,
    trips: trips.length,
    maintenance: maintenanceLogs.length,
  };

  return (
    <div className="shell">
      <Sidebar page={page} setPage={setPage} counts={counts} />
      <div className="main">
        {connectionError ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="glyph" style={{ color: 'var(--red)' }}>Connection failed</div>
            {connectionError}
            <div style={{ marginTop: 4 }}>Start the API with <span className="mono">node index.js</span> on port 4000.</div>
          </div>
        ) : loading && vehicles.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 60 }}>
            <div className="glyph">Loading dispatch data…</div>
          </div>
        ) : (
          <Page />
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </DataProvider>
  );
}
