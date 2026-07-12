const STATUS_MAP = {
  // vehicles
  Available: { color: 'green', pulse: false },
  'On Trip': { color: 'blue', pulse: true },
  'In Shop': { color: 'amber', pulse: false },
  Retired: { color: 'grey', pulse: false },
  // drivers
  'Off Duty': { color: 'grey', pulse: false },
  Suspended: { color: 'red', pulse: false },
  // trips
  Draft: { color: 'grey', pulse: false },
  Dispatched: { color: 'blue', pulse: true },
  Completed: { color: 'green', pulse: false },
  Cancelled: { color: 'red', pulse: false },
  // maintenance
  Open: { color: 'amber', pulse: true },
  Closed: { color: 'green', pulse: false },
};

export default function StatusBadge({ status }) {
  const conf = STATUS_MAP[status] || { color: 'grey', pulse: false };
  return (
    <span
      className="status"
      style={{
        color: `var(--${conf.color})`,
        background: `var(--${conf.color}-dim)`,
      }}
    >
      <span
        className={`dot${conf.pulse ? ' pulse' : ''}`}
        style={{ background: `var(--${conf.color})` }}
      />
      {status}
    </span>
  );
}
