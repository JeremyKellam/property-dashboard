import React, { useState } from 'react';
import RentTab from './components/RentTab';
import ExpensesTab from './components/ExpensesTab';
import TripsTab from './components/TripsTab';
import SummaryTab from './components/SummaryTab';
import './App.css';

const TABS = ['Summary', 'Rent', 'Expenses', 'Trips'];

function App() {
  const [activeTab, setActiveTab] = useState('Summary');
  const [apiKey, setApiKey] = useState(localStorage.getItem('apiKey') || '');
  const [keyInput, setKeyInput] = useState('');
  const [authError, setAuthError] = useState(false);

  if (!apiKey) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <form onSubmit={(e) => {
          e.preventDefault();
          localStorage.setItem('apiKey', keyInput);
          setApiKey(keyInput);
          setAuthError(false);
        }} style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '280px' }}>
          <h2 style={{ margin: 0 }}>Property Dashboard</h2>
          <input
            type="password"
            placeholder="Password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            autoFocus
          />
          {authError && <span style={{ color: 'red', fontSize: '0.85em' }}>Incorrect password</span>}
          <button type="submit">Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Property Dashboard</h1>
        <nav>
          {TABS.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {activeTab === 'Summary' && <SummaryTab />}
        {activeTab === 'Rent' && <RentTab />}
        {activeTab === 'Expenses' && <ExpensesTab />}
        {activeTab === 'Trips' && <TripsTab />}
      </main>
    </div>
  );
}

export default App;
