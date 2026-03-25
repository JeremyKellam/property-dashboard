import React, { useState } from 'react';
import RentTab from './components/RentTab';
import ExpensesTab from './components/ExpensesTab';
import TripsTab from './components/TripsTab';
import SummaryTab from './components/SummaryTab';
import './App.css';

const TABS = ['Summary', 'Rent', 'Expenses', 'Trips'];

function App() {
  const [activeTab, setActiveTab] = useState('Summary');

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
