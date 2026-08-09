import React, { useEffect, useState } from 'react';
import { getExpenses, addExpense, updateExpense, deleteExpense } from '../api';

const CATEGORIES = {
  mortgage: 'Mortgage Interest',
  insurance_homeowner: 'Insurance (Homeowner)',
  insurance_flood: 'Insurance (Flood)',
  taxes: 'Property Taxes',
  water_sewer: 'Utilities',
  maintenance: 'Repairs & Maintenance',
  supplies: 'Supplies',
  professional_fees: 'Legal & Professional Fees',
  depreciation: 'Depreciation',
};

const fmt = (n) => `$${parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

export default function ExpensesTab() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({
    category: 'mortgage',
    amount: '',
    description: '',
    expense_date: '',
  });
  const [editForm, setEditForm] = useState(null);

  const load = () => getExpenses({ year }).then((r) => setExpenses(r.data));

  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    const [y, m] = form.expense_date.split('-').map(Number);
    await addExpense({
      ...form,
      year: y,
      month: m,
    });
    load();
    setForm({ category: 'mortgage', amount: '', description: '', expense_date: '' });
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    await updateExpense(editForm.id, {
      category: editForm.category,
      amount: editForm.amount,
      description: editForm.description,
      expense_date: editForm.expense_date,
    });
    load();
    setEditForm(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await deleteExpense(id);
    load();
  };

  const years = [];
  for (let y = now.getFullYear(); y >= 2020; y--) years.push(y);

  const totals = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + parseFloat(e.amount);
    return acc;
  }, {});

  return (
    <div>
      <div className="year-selector">
        <label>Year</label>
        <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
          {years.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      <div className="card">
        <h2>Add Expense</h2>
        <form onSubmit={handleSubmit}>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Amount
            <input type="number" step="0.01" value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00" required />
          </label>
          <label>Date
            <input type="date" value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              required />
          </label>
          <label>Description
            <input type="text" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional" />
          </label>
          <button type="submit" className="primary">Add</button>
        </form>
      </div>

      <div className="card">
        <h2>Category Totals — {year}</h2>
        <div className="grid-4" style={{ marginBottom: 0 }}>
          {Object.entries(CATEGORIES).map(([k, v]) => (
            <div className="stat" key={k}>
              <label>{v}</label>
              <div className="value negative">{fmt(totals[k] || 0)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <h2>All Expenses — {year}</h2>
        {expenses.length === 0 ? (
          <p style={{ color: '#999', fontSize: 14 }}>No expenses logged.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <React.Fragment key={e.id}>
                  <tr>
                    <td>{new Date(e.expense_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })}</td>
                    <td>{CATEGORIES[e.category]}</td>
                    <td>{fmt(e.amount)}</td>
                    <td>{e.description || '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="small" onClick={() => setEditForm({ id: e.id, category: e.category, amount: e.amount, description: e.description || '', expense_date: e.expense_date.slice(0, 10) })}>Edit</button>
                      <button className="danger" onClick={() => handleDelete(e.id)}>Delete</button>
                    </td>
                  </tr>
                  {editForm && editForm.id === e.id && (
                    <tr>
                      <td colSpan={5} style={{ background: '#fafafa', padding: '8px 24px' }}>
                        <form onSubmit={handleEdit} style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                          <label>Category
                            <select value={editForm.category} onChange={(ev) => setEditForm({ ...editForm, category: ev.target.value })}>
                              {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                            </select>
                          </label>
                          <label>Amount
                            <input type="number" step="0.01" value={editForm.amount}
                              onChange={(ev) => setEditForm({ ...editForm, amount: ev.target.value })}
                              required />
                          </label>
                          <label>Date
                            <input type="date" value={editForm.expense_date}
                              onChange={(ev) => setEditForm({ ...editForm, expense_date: ev.target.value })}
                              required />
                          </label>
                          <label>Description
                            <input type="text" value={editForm.description}
                              onChange={(ev) => setEditForm({ ...editForm, description: ev.target.value })} />
                          </label>
                          <button type="submit" className="primary">Save</button>
                          <button type="button" className="danger" onClick={() => setEditForm(null)}>Cancel</button>
                        </form>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
