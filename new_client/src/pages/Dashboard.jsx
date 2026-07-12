import { useData } from '../DataContext';
import StatusBadge from '../components/StatusBadge';
import Plate from '../components/Plate';

export default function Dashboard() {
  const { vehicles, drivers, trips } = useData();

  const onTrip = vehicles.filter((v) => v.status === 'On Trip').length;
  const inShop = vehicles.filter((v) => v.status === 'In Shop').length;
  const activeTrips = trips.filter((t) => t.status === 'Dispatched');
  const draftTrips = trips.filter((t) => t.status === 'Draft').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <div className="sub">Fleet status at a glance</div>
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi-card">
          <div className="label">Fleet Size</div>
          <div className="value">{vehicles.length}</div>
        </div>
        <div className="kpi-card">
          <div className="label">On Trip</div>
          <div className="value blue">{onTrip}</div>
        </div>
        <div className="kpi-card">
          <div className="label">In Shop</div>
          <div className="value amber">{inShop}</div>
        </div>
        <div className="kpi-card">
          <div className="label">Draft Trips</div>
          <div className="value">{draftTrips}</div>
        </div>
      </div>

      <h3 style={{ fontSize: 14, marginBottom: 12, color: 'var(--text-dim)' }}>Active Trips</h3>
      <div className="board">
        {activeTrips.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">Nothing on the road</div>
            Dispatch a Draft trip to see it here.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeTrips.map((t) => {
                const vehicle = vehicles.find((v) => v.id === t.vehicle_id);
                const driver = drivers.find((d) => d.id === t.driver_id);
                return (
                  <tr key={t.id}>
                    <td className="mono">{t.source} → {t.destination}</td>
                    <td><Plate>{vehicle?.reg_number}</Plate></td>
                    <td>{driver?.name || '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
