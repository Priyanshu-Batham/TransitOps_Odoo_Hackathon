import { useState } from 'react';
import { api } from '../api';
import { useData } from '../DataContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Plate from '../components/Plate';
import Drawer from '../components/Drawer';

const EMPTY = { reg_number: '', name: '', type: '', max_load: '', acquisition_cost: '' };

export default function Vehicles() {
  const { vehicles, refreshAll } = useData();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.reg_number || !form.name || !form.max_load) {
      notify.error('Reg number, name, and max load are required.');
      return;
    }
    setSaving(true);
    try {
      await api.createVehicle({
        ...form,
        max_load: Number(form.max_load),
        acquisition_cost: form.acquisition_cost ? Number(form.acquisition_cost) : 0,
      });
      notify.success(`Vehicle ${form.reg_number} added to the fleet.`);
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
          <h2>Vehicles</h2>
          <div className="sub">{vehicles.length} in fleet</div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + New Vehicle
        </button>
      </div>

      <div className="board">
        {vehicles.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">Fleet is empty</div>
            Add the first vehicle to start dispatching trips.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Plate</th>
                <th>Name</th>
                <th>Type</th>
                <th>Max Load</th>
                <th>Odometer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((v) => (
                <tr key={v.id}>
                  <td><Plate>{v.reg_number}</Plate></td>
                  <td>{v.name}</td>
                  <td className="muted">{v.type || '—'}</td>
                  <td className="mono">{v.max_load} kg</td>
                  <td className="mono">{v.odometer ?? 0} km</td>
                  <td><StatusBadge status={v.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Drawer
          title="New Vehicle"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Add Vehicle'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Reg Number</label>
            <input value={form.reg_number} onChange={set('reg_number')} placeholder="UP32 AB 1234" />
          </div>
          <div className="field">
            <label>Name</label>
            <input value={form.name} onChange={set('name')} placeholder="Tata Ace — Yard 3" />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Type</label>
              <input value={form.type} onChange={set('type')} placeholder="Mini Truck" />
            </div>
            <div className="field">
              <label>Max Load (kg)</label>
              <input type="number" value={form.max_load} onChange={set('max_load')} placeholder="750" />
            </div>
          </div>
          <div className="field">
            <label>Acquisition Cost</label>
            <input type="number" value={form.acquisition_cost} onChange={set('acquisition_cost')} placeholder="0" />
          </div>
        </Drawer>
      )}
    </div>
  );
}
