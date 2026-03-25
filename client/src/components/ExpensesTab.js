import React, { useEffect, useState } from 'react';
import { getExpenses, addExpense, deleteExpense } from '../api';

const CATEGORIES = {
  mortgage: 'Mortgage',
  insurance_homeowner: 'Insurance (Homeowner)',
  insurance_flood: 'Insurance (Flood)',
  water_sewer: 'Water & Sewer',
  maintenance: 'Maintenance',
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

  const load = () => getExpenses({ year }).then((r) => setExpenses(r.data));

  useEffect(() => { load(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    const date = new Date(form.expense_date);
    await addExpense({
      ...form,
      year: date.getFullYear(),
      month: date.getMonth() + 1,
    });
    load();
    setForm({ category: 'mortgage', amount: '', description: '', expense_date: '' });
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
                <tr key={e.id}>
                  <td>{e.expense_date}</td>
                  <td>{CATEGORIES[e.category]}</td>
                  <td>{fmt(e.amount)}</td>
                  <td>{e.description || '—'}</td>
                  <td><button className="danger" onClick={() => handleDelete(e.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
