import { useState } from 'react';
import { api } from '../api';
import { useData } from '../DataContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Plate from '../components/Plate';
import Drawer from '../components/Drawer';

const EMPTY = {
  name: '', license_number: '', license_category: '', license_expiry: '', contact: '',
};

function isExpired(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function Drivers() {
  const { drivers, refreshAll } = useData();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.name) {
      notify.error('Driver name is required.');
      return;
    }
    setSaving(true);
    try {
      await api.createDriver(form);
      notify.success(`${form.name} added to the roster.`);
      setForm(EMPTY);
      setOpen(false);
      refreshAll();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Drivers</h2>
          <div className="sub">{drivers.length} on roster</div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + New Driver
        </button>
      </div>

      <div className="board">
        {drivers.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">Roster is empty</div>
            Add a driver before dispatching a trip.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>License</th>
                <th>Category</th>
                <th>Expiry</th>
                <th>Safety Score</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => (
                <tr key={d.id}>
                  <td>{d.name}</td>
                  <td><Plate>{d.license_number}</Plate></td>
                  <td className="muted">{d.license_category || '—'}</td>
                  <td className={isExpired(d.license_expiry) ? 'mono' : 'mono muted'} style={isExpired(d.license_expiry) ? { color: 'var(--red)' } : undefined}>
                    {d.license_expiry || '—'}
                  </td>
                  <td className="mono">{d.safety_score}</td>
                  <td><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Drawer
          title="New Driver"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Add Driver'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Ramesh Kumar" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>License Number</label>
              <input value={form.license_number} onChange={set('license_number')} placeholder="UP32 2020 0001" />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.license_category} onChange={set('license_category')} placeholder="LMV" />
            </div>
          </div>
          <div className="field">
            <label>License Expiry</label>
            <input type="date" value={form.license_expiry} onChange={set('license_expiry')} />
          </div>
          <div className="field">
            <label>Contact</label>
            <input value={form.contact} onChange={set('contact')} placeholder="+91 90000 00000" />
          </div>
        </Drawer>
      )}
    </div>
  );
}
