import React, { useEffect, useState } from 'react';
import { getRent, createRent, payRent, applyLateFee, getPayments } from '../api';

const MONTHS = ['January','February','March','April','May','June',
  'July','August','September','October','November','December'];

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function RentTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState([]);
  const [setupForm, setSetupForm] = useState({ unit_number: 1, amount_due: '' });
  const [payForm, setPayForm] = useState({ id: null, amount: '', payment_date: '', notes: '' });
  const [payments, setPayments] = useState({});

  const load = () => getRent({ year, month }).then((r) => setRecords(r.data));

  useEffect(() => { load(); }, [year, month]);

  const handleSetup = async (e) => {
    e.preventDefault();
    await createRent({ ...setupForm, year, month });
    load();
    setSetupForm({ unit_number: 1, amount_due: '' });
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

  const loadPayments = async (id) => {
    if (payments[id]) {
      setPayments((p) => { const n = { ...p }; delete n[id]; return n; });
    } else {
      const r = await getPayments(id);
      setPayments((p) => ({ ...p, [id]: r.data }));
    }
  };

  const years = [];
  for (let y = now.getFullYear(); y >= 2020; y--) years.push(y);

  return (
    <div>
      <div className="year-selector">
        <label>Month</label>
        <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
          {MONTHS.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
        <label>Year</label>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="card">
        <h2>Set Rent Due</h2>
        <form onSubmit={handleSetup}>
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
        <h2>Rent Status — {MONTHS[month-1]} {year}</h2>
        {records.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14 }}>No rent records for this month. Set rent due above.</p>
        ) : (
          <table>
            <thead>
              <tr>
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
                return (
                  <React.Fragment key={r.id}>
                    <tr>
                      <td>Unit {r.unit_number}</td>
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
                      </td>
                    </tr>
                    {payments[r.id] && (
                      <tr>
                        <td colSpan={7} style={{ background: '#fafafa', padding: '8px 24px' }}>
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
                                    <td>{p.payment_date}</td>
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
