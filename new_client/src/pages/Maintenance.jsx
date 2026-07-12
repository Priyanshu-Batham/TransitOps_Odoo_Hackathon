import { useState } from 'react';
import { api } from '../api';
import { useData } from '../DataContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import Plate from '../components/Plate';
import Drawer from '../components/Drawer';

const EMPTY = { vehicle_id: '', description: '', cost: '' };

export default function Maintenance() {
  const { vehicles, vehicleById, maintenanceLogs, addMaintenanceLog, updateMaintenanceLog, refreshAll } = useData();
  const notify = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async () => {
    if (!form.vehicle_id || !form.description) {
      notify.error('Vehicle and description are required.');
      return;
    }
    setSaving(true);
    try {
      const log = await api.openMaintenance({
        vehicle_id: Number(form.vehicle_id),
        description: form.description,
        cost: form.cost ? Number(form.cost) : 0,
      });
      addMaintenanceLog(log);
      notify.success(`Maintenance log #${log.id} opened.`);
      setForm(EMPTY);
      setOpen(false);
      refreshAll();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const close = async (log) => {
    setBusyId(log.id);
    try {
      await api.closeMaintenance(log.id);
      updateMaintenanceLog(log.id, { status: 'Closed' });
      notify.success(`Maintenance log #${log.id} closed. Vehicle back in service.`);
      refreshAll();
    } catch (err) {
      notify.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Maintenance</h2>
          <div className="sub">{maintenanceLogs.length} log{maintenanceLogs.length === 1 ? '' : 's'} this session</div>
        </div>
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          + Open Log
        </button>
      </div>

      <div className="section-note">
        The API has no route to list past maintenance logs, so this board only shows logs opened
        during this session. Add a GET /maintenance route on the server to persist this across reloads.
      </div>

      <div className="board">
        {maintenanceLogs.length === 0 ? (
          <div className="empty-state">
            <div className="glyph">No logs opened yet</div>
            Open a maintenance log to take a vehicle out of service.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Description</th>
                <th>Cost</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {maintenanceLogs.map((log) => {
                const vehicle = vehicleById(log.vehicle_id);
                return (
                  <tr key={log.id}>
                    <td><Plate>{vehicle?.reg_number}</Plate></td>
                    <td>{log.description}</td>
                    <td className="mono">₹{log.cost || 0}</td>
                    <td><StatusBadge status={log.status} /></td>
                    <td>
                      <div className="row-actions">
                        {log.status === 'Open' && (
                          <button className="btn btn-sm" disabled={busyId === log.id} onClick={() => close(log)}>
                            Close
                          </button>
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
          title="Open Maintenance Log"
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={submit} disabled={saving}>
                {saving ? 'Saving…' : 'Open Log'}
              </button>
            </>
          }
        >
          <div className="field">
            <label>Vehicle</label>
            <select value={form.vehicle_id} onChange={set('vehicle_id')}>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.status === 'On Trip'}>
                  {v.reg_number} — {v.name} ({v.status})
                </option>
              ))}
            </select>
            <span className="hint">Vehicles On Trip can't be sent to the shop.</span>
          </div>
          <div className="field">
            <label>Description</label>
            <textarea rows={3} value={form.description} onChange={set('description')} placeholder="Brake pad replacement" />
          </div>
          <div className="field">
            <label>Cost</label>
            <input type="number" value={form.cost} onChange={set('cost')} placeholder="0" />
          </div>
        </Drawer>
      )}
    </div>
  );
}
