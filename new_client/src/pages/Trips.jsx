import { useState } from 'react';
import { api } from '../api';
import { useData } from '../DataContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Plate from '../components/Plate';
import Drawer from '../components/Drawer';

const EMPTY = {
  source: '', destination: '', vehicle_id: '', driver_id: '', cargo_weight: '', planned_distance: '',
};

export default function Trips() {
  const { trips, vehicles, drivers, vehicleById, driverById, refreshAll } = useData();
  const notify = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const [completingTrip, setCompletingTrip] = useState(null);
  const [completeForm, setCompleteForm] = useState({ final_odometer: '', fuel_consumed: '' });
  const [busyId, setBusyId] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.source || !form.destination || !form.vehicle_id || !form.driver_id) {
      notify.error('Source, destination, vehicle, and driver are required.');
      return;
    }
    setSaving(true);
    try {
      await api.createTrip({
        ...form,
        vehicle_id: Number(form.vehicle_id),
        driver_id: Number(form.driver_id),
        cargo_weight: form.cargo_weight ? Number(form.cargo_weight) : 0,
        planned_distance: form.planned_distance ? Number(form.planned_distance) : 0,
      });
      notify.success(`Trip ${form.source} → ${form.destination} created as Draft.`);
      setForm(EMPTY);
      setOpen(false);
      refreshAll();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const dispatch = async (trip) => {
    setBusyId(trip.id);
    try {
      await api.dispatchTrip(trip.id);
      notify.success(`Trip #${trip.id} dispatched.`);
      refreshAll();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancel = async (trip) => {
    setBusyId(trip.id);
    try {
      await api.cancelTrip(trip.id);
      notify.success(`Trip #${trip.id} cancelled.`);
      refreshAll();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const openComplete = (trip) => {
    setCompletingTrip(trip);
    setCompleteForm({ final_odometer: trip.vehicle_id ? vehicleById(trip.vehicle_id)?.odometer ?? '' : '', fuel_consumed: '' });
  };

  const submitComplete = async () => {
    if (!completeForm.final_odometer) {
      notify.error('Final odometer reading is required.');
      return;
    }
    setSaving(true);
    try {
      await api.completeTrip(
        completingTrip.id,
        Number(completeForm.final_odometer),
        completeForm.fuel_consumed ? Number(completeForm.fuel_consumed) : 0
      );
      notify.success(`Trip #${completingTrip.id} completed.`);
      setCompletingTrip(null);
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
          <h2>Trips</h2>
          <div className="sub">{trips.length} on the manifest</div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + New Trip
        </button>
      </div>

      <div className="board">
        {trips.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">No trips yet</div>
            Create a Draft trip, then dispatch it once vehicle and driver are ready.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Route</th>
                <th>Vehicle</th>
                <th>Driver</th>
                <th>Cargo</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...trips].reverse().map((t) => {
                const vehicle = vehicleById(t.vehicle_id);
                const driver = driverById(t.driver_id);
                const isBusy = busyId === t.id;
                return (
                  <tr key={t.id}>
                    <td>
                      <div className="mono" style={{ fontSize: 13 }}>
                        {t.source} → {t.destination}
                      </div>
                      <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>#{t.id}</div>
                    </td>
                    <td><Plate>{vehicle?.reg_number}</Plate></td>
                    <td>{driver?.name || <span className="muted">—</span>}</td>
                    <td className="mono">{t.cargo_weight ? `${t.cargo_weight} kg` : '—'}</td>
                    <td><StatusBadge status={t.status} /></td>
                    <td>
                      <div className="row-actions">
                        {t.status === 'Draft' && (
                          <button className="btn btn-sm btn-primary" disabled={isBusy} onClick={() => dispatch(t)}>
                            Dispatch
                          </button>
                        )}
                        {t.status === 'Dispatched' && (
                          <>
                            <button className="btn btn-sm" disabled={isBusy} onClick={() => openComplete(t)}>
                              Complete
                            </button>
                            <button className="btn btn-sm btn-danger" disabled={isBusy} onClick={() => cancel(t)}>
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <Drawer
          title="New Trip"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Create Draft'}
              </button>
            </>
          }
        >
          <div className="field-row">
            <div className="field">
              <label>Source</label>
              <input value={form.source} onChange={set('source')} placeholder="Lucknow" />
            </div>
            <div className="field">
              <label>Destination</label>
              <input value={form.destination} onChange={set('destination')} placeholder="Kanpur" />
            </div>
          </div>
          <div className="field">
            <label>Vehicle</label>
            <select value={form.vehicle_id} onChange={set('vehicle_id')}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.reg_number} — {v.name} ({v.status})
                </option>
              ))}
            </select>
            <span className="hint">Vehicle must be Available at dispatch time.</span>
          </div>
          <div className="field">
            <label>Driver</label>
            <select value={form.driver_id} onChange={set('driver_id')}>
              <option value="">Select driver…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.status})
                </option>
              ))}
            </select>
            <span className="hint">Driver must be Available and license valid at dispatch time.</span>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Cargo Weight (kg)</label>
              <input type="number" value={form.cargo_weight} onChange={set('cargo_weight')} placeholder="400" />
            </div>
            <div className="field">
              <label>Planned Distance (km)</label>
              <input type="number" value={form.planned_distance} onChange={set('planned_distance')} placeholder="80" />
            </div>
          </div>
        </Drawer>
      )}

      {completingTrip && (
        <Drawer
          title={`Complete Trip #${completingTrip.id}`}
          onClose={() => setCompletingTrip(null)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setCompletingTrip(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={submitComplete} disabled={saving}>
                {saving ? 'Saving…' : 'Mark Completed'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Final Odometer (km)</label>
            <input
              type="number"
              value={completeForm.final_odometer}
              onChange={(e) => setCompleteForm((f) => ({ ...f, final_odometer: e.target.value }))}
            />
          </div>
          <div className="field">
            <label>Fuel Consumed (litres)</label>
            <input
              type="number"
              value={completeForm.fuel_consumed}
              onChange={(e) => setCompleteForm((f) => ({ ...f, fuel_consumed: e.target.value }))}
              placeholder="Optional"
            />
            <span className="hint">Logged to fuel_logs automatically if entered.</span>
          </div>
        </Drawer>
      )}
    </div>
  );
}
