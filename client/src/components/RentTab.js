import React, { useEffect, useState } from 'react';
import { getRent, createRent, payRent, applyLateFee, getPayments, deleteRent, updateRent, getTenants, saveTenant } from '../api';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function RentTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [records, setRecords] = useState([]);
  const [setupForm, setSetupForm] = useState({ unit_number: 1, amount_due: '', month: now.getMonth() + 1 });
  const [payForm, setPayForm] = useState({ id: null, amount: '', payment_date: '', notes: '' });
  const [editForm, setEditForm] = useState(null);
  const [payments, setPayments] = useState({});
  const [tenants, setTenants] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);

  const load = () => getRent({ year }).then((r) => setRecords(r.data));
  const loadTenants = () => getTenants().then((r) => setTenants(r.data));

  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { loadTenants(); }, []);

  const handleSetup = async (e) => {
    e.preventDefault();
    await createRent({ ...setupForm, year });
    load();
    setSetupForm({ unit_number: 1, amount_due: '', month: now.getMonth() + 1 });
  };

  const handlePay = async (e) => {
    e.preventDefault();
    await payRent(payForm.id, { amount: payForm.amount, payment_date: payForm.payment_date, notes: payForm.notes });
    load();
    setPayForm({ id: null, amount: '', payment_date: '', notes: '' });
  };

  const handleLateFee = async (id) => {
    await applyLateFee(id);
    load();
  };

  const handleEditRent = async (e) => {
    e.preventDefault();
    await updateRent(editForm.id, { amount_due: editForm.amount_due });
    load();
    setEditForm(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rent record and all its payments?')) return;
    await deleteRent(id);
    load();
  };

  const loadPayments = async (id) => {
    if (payments[id]) {
      setPayments((p) => { const n = { ...p }; delete n[id]; return n; });
    } else {
      const r = await getPayments(id);
      setPayments((p) => ({ ...p, [id]: r.data }));
    }
  };

  const handleSaveTenant = async (e) => {
    e.preventDefault();
    await saveTenant(editingTenant);
    loadTenants();
    setEditingTenant(null);
  };

  const handleQuickAddRent = async (unit) => {
    const tenant = tenants.find((t) => t.unit_number === unit);
    if (!tenant || !tenant.monthly_rent) return;
    const month = now.getMonth() + 1;
    await createRent({ unit_number: unit, year, month, amount_due: tenant.monthly_rent });
    load();
  };

  const handleQuickAddAllRent = async () => {
    const month = now.getMonth() + 1;
    for (const t of tenants) {
      if (t.monthly_rent) {
        await createRent({ unit_number: t.unit_number, year, month, amount_due: t.monthly_rent });
      }
    }
    load();
  };

  const handleQuickMarkPaid = async (unit) => {
    const month = now.getMonth() + 1;
    const record = records.find((r) => r.unit_number === unit && r.month === month);
    if (!record || record.status === 'paid') return;
    const balance = parseFloat(record.amount_due) + parseFloat(record.late_fee) - parseFloat(record.amount_paid);
    const today = `${year}-${String(month).padStart(2, '0')}-01`;
    await payRent(record.id, { amount: balance, payment_date: today, notes: '' });
    load();
  };

  const years = [];
  for (let y = now.getFullYear(); y >= 2020; y--) years.push(y);

  const currentMonth = now.getMonth() + 1;

  return (
    <div>
      <div className="year-selector">
        <label>Year</label>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ marginBottom: 0 }}>Units</h2>
          {tenants.length > 0 && year === now.getFullYear() && (
            <button className="primary" onClick={handleQuickAddAllRent}>
              Add All Rent — {MONTHS[currentMonth - 1]}
            </button>
          )}
        </div>
        <div className="grid-4">
          {[1, 2, 3, 4].map((unit) => {
            const tenant = tenants.find((t) => t.unit_number === unit);
            const currentRecord = records.find((r) => r.unit_number === unit && r.month === currentMonth);
            return (
              <div className="stat" key={unit} style={{ position: 'relative' }}>
                <label>Unit {unit}</label>
                {tenant ? (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{tenant.tenant_name || 'No tenant'}</div>
                    {tenant.monthly_rent && (
                      <div style={{ fontSize: 13, color: '#666', marginTop: 2 }}>{fmt(tenant.monthly_rent)}/mo</div>
                    )}
                    {tenant.phone && <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{tenant.phone}</div>}
                    {tenant.email && <div style={{ fontSize: 12, color: '#888' }}>{tenant.email}</div>}
                    {tenant.lease_end && (
                      <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        Lease ends {new Date(tenant.lease_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}
                      </div>
                    )}
                    {year === now.getFullYear() && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                        {!currentRecord && tenant.monthly_rent && (
                          <button className="small" onClick={() => handleQuickAddRent(unit)}>
                            + {MONTHS[currentMonth - 1]}
                          </button>
                        )}
                        {currentRecord && currentRecord.status !== 'paid' && (
                          <button className="small" onClick={() => handleQuickMarkPaid(unit)}>
                            Mark Paid
                          </button>
                        )}
                        {currentRecord && currentRecord.status === 'paid' && (
                          <span className="badge paid" style={{ fontSize: 11 }}>Paid</span>
                        )}
                      </div>
                    )}
                    <button className="small" style={{ marginTop: 8 }} onClick={() => setEditingTenant({
                      unit_number: unit,
                      tenant_name: tenant.tenant_name || '',
                      phone: tenant.phone || '',
                      email: tenant.email || '',
                      lease_start: tenant.lease_start ? tenant.lease_start.slice(0, 10) : '',
                      lease_end: tenant.lease_end ? tenant.lease_end.slice(0, 10) : '',
                      monthly_rent: tenant.monthly_rent || '',
                    })}>Edit</button>
                  </div>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ color: '#999', fontSize: 13 }}>No tenant info</div>
                    <button className="small" style={{ marginTop: 8 }} onClick={() => setEditingTenant({
                      unit_number: unit, tenant_name: '', phone: '', email: '',
                      lease_start: '', lease_end: '', monthly_rent: '',
                    })}>Add Tenant</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {editingTenant && (
        <div className="card">
          <h2>{tenants.find((t) => t.unit_number === editingTenant.unit_number) ? 'Edit' : 'Add'} Tenant — Unit {editingTenant.unit_number}</h2>
          <form onSubmit={handleSaveTenant}>
            <label>Name
              <input type="text" value={editingTenant.tenant_name}
                onChange={(e) => setEditingTenant({ ...editingTenant, tenant_name: e.target.value })}
                placeholder="Tenant name" />
            </label>
            <label>Phone
              <input type="text" value={editingTenant.phone}
                onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                placeholder="(555) 555-5555" />
            </label>
            <label>Email
              <input type="email" value={editingTenant.email}
                onChange={(e) => setEditingTenant({ ...editingTenant, email: e.target.value })}
                placeholder="email@example.com" />
            </label>
            <label>Monthly Rent
              <input type="number" step="0.01" value={editingTenant.monthly_rent}
                onChange={(e) => setEditingTenant({ ...editingTenant, monthly_rent: e.target.value })}
                placeholder="0.00" />
            </label>
            <label>Lease Start
              <input type="date" value={editingTenant.lease_start}
                onChange={(e) => setEditingTenant({ ...editingTenant, lease_start: e.target.value })} />
            </label>
            <label>Lease End
              <input type="date" value={editingTenant.lease_end}
                onChange={(e) => setEditingTenant({ ...editingTenant, lease_end: e.target.value })} />
            </label>
            <button type="submit" className="primary">Save</button>
            <button type="button" className="danger" onClick={() => setEditingTenant(null)}>Cancel</button>
          </form>
        </div>
      )}

      <div className="card">
        <h2>Set Rent Due</h2>
        <form onSubmit={handleSetup}>
          <label>Month
            <select value={setupForm.month} onChange={(e) => setSetupForm({ ...setupForm, month: parseInt(e.target.value) })}>
              {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </label>
          <label>Unit
            <select value={setupForm.unit_number} onChange={(e) => setSetupForm({ ...setupForm, unit_number: parseInt(e.target.value) })}>
              {[1,2,3,4].map((u) => <option key={u} value={u}>Unit {u}</option>)}
            </select>
          </label>
          <label>Amount Due
            <input type="number" step="0.01" value={setupForm.amount_due}
              onChange={(e) => setSetupForm({ ...setupForm, amount_due: e.target.value })}
              placeholder="0.00" required />
          </label>
          <button type="submit" className="primary">Set</button>
        </form>
      </div>

      <div className="card">
        <h2>Rent Status — {year}</h2>
        {records.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14 }}>No rent records for this year.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Unit</th>
                <th>Due</th>
                <th>Late Fee</th>
                <th>Paid</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const totalOwed = parseFloat(r.amount_due) + parseFloat(r.late_fee);
                const balance = totalOwed - parseFloat(r.amount_paid);
                const tenant = tenants.find((t) => t.unit_number === r.unit_number);
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>{MONTHS[r.month - 1]}</td>
                      <td>Unit {r.unit_number}{tenant?.tenant_name ? ` — ${tenant.tenant_name}` : ''}</td>
                      <td>{fmt(r.amount_due)}</td>
                      <td>{parseFloat(r.late_fee) > 0 ? fmt(r.late_fee) : '—'}</td>
                      <td>{fmt(r.amount_paid)}</td>
                      <td>{fmt(balance)}</td>
                      <td><span className={`badge ${r.status}`}>{r.status}</span></td>
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="small" onClick={() => setPayForm({ id: r.id, amount: '', payment_date: '', notes: '' })}>
                          Pay
                        </button>
                        {parseFloat(r.late_fee) === 0 && r.status !== 'paid' && (
                          <button className="danger" onClick={() => handleLateFee(r.id)}>+Late</button>
                        )}
                        <button className="small" onClick={() => loadPayments(r.id)}>
                          {payments[r.id] ? 'Hide' : 'History'}
                        </button>
                        <button className="small" onClick={() => setEditForm({ id: r.id, unit_number: r.unit_number, amount_due: r.amount_due })}>Edit</button>
                        <button className="danger" onClick={() => handleDelete(r.id)}>Delete</button>
                      </td>
                    </tr>
                    {editForm && editForm.id === r.id && (
                      <tr>
                        <td colSpan={8} style={{ background: '#fafafa', padding: '8px 24px' }}>
                          <form onSubmit={handleEditRent} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <label>Amount Due
                              <input type="number" step="0.01" value={editForm.amount_due}
                                onChange={(e) => setEditForm({ ...editForm, amount_due: e.target.value })}
                                required />
                            </label>
                            <button type="submit" className="primary">Save</button>
                            <button type="button" className="danger" onClick={() => setEditForm(null)}>Cancel</button>
                          </form>
                        </td>
                      </tr>
                    )}
                    {payments[r.id] && (
                      <tr>
                        <td colSpan={8} style={{ background: '#fafafa', padding: '8px 24px' }}>
                          {payments[r.id].length === 0 ? (
                            <span style={{ color: '#999', fontSize: 13 }}>No payments recorded.</span>
                          ) : (
                            <table>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Amount</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {payments[r.id].map((p) => (
                                  <tr key={p.id}>
                                    <td>{new Date(p.payment_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td>
                                    <td>{fmt(p.amount)}</td>
                                    <td>{p.notes || '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {payForm.id && (
        <div className="card">
          <h2>Record Payment — Unit {records.find((r) => r.id === payForm.id)?.unit_number}</h2>
          <form onSubmit={handlePay}>
            <label>Amount
              <input type="number" step="0.01" value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                placeholder="0.00" required />
            </label>
            <label>Date
              <input type="date" value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                required />
            </label>
            <label>Notes
              <input type="text" value={payForm.notes}
                onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
                placeholder="e.g. Venmo" />
            </label>
            <button type="submit" className="primary">Save</button>
            <button type="button" className="danger" onClick={() => setPayForm({ id: null, amount: '', payment_date: '', notes: '' })}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
