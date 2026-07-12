const NAV = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'trips', label: 'Trips' },
  { key: 'vehicles', label: 'Vehicles' },
  { key: 'drivers', label: 'Drivers' },
  { key: 'maintenance', label: 'Maintenance' },
];

export default function Sidebar({ page, setPage, counts }) {
  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span className="mark" />
        <h1>TransitOps</h1>
        <p>Dispatch Terminal</p>
      </div>
      <nav>
        {NAV.map((item) => (
          <button
            key={item.key}
            className={`nav-item${page === item.key ? ' active' : ''}`}
            onClick={() => setPage(item.key)}
          >
            {item.label}
            {counts?.[item.key] != null && (
              <span className="nav-count">{counts[item.key]}</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
