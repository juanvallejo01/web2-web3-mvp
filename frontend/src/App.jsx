/**
 * Main App Component - Productized UI
 * Web2-Web3 Bridge MVP Frontend with MetaMask-style layout
 */

import { useState, useEffect } from 'react';
import AppShell from './components/layout/AppShell';
import Dashboard from './views/Dashboard';
import Fan from './views/Fan';
import Creator from './views/Creator';
import Activity from './views/Activity';
import Admin from './views/Admin';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currentView, setCurrentView] = useState('dashboard');
  const [events, setEvents] = useState([]);

  // Load identity from localStorage on mount
  useEffect(() => {
    const storedIdentity = localStorage.getItem('web3_identity');
    if (storedIdentity) {
      try {
        setIdentity(JSON.parse(storedIdentity));
      } catch (e) {
        console.error('Failed to parse stored identity:', e);
      }
    }
  }, []);

  // Load events for dashboard stats
  useEffect(() => {
    const loadEvents = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/events');
        if (response.ok) {
          const data = await response.json();
          setEvents(data.events || []);
        }
      } catch (err) {
        console.error('Failed to load events:', err);
      }
    };
    loadEvents();
    
    // Refresh when counter changes
    if (refreshCounter > 0) {
      loadEvents();
    }
  }, [refreshCounter]);

  const handleWalletChange = (address) => {
    setWalletAddress(address);
  };

  const handleIdentityChange = (newIdentity) => {
    setIdentity(newIdentity);
    // Persist to localStorage
    if (newIdentity) {
      localStorage.setItem('web3_identity', JSON.stringify(newIdentity));
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
  };

  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <Dashboard
            identity={identity}
            onIdentityChange={handleIdentityChange}
            walletAddress={walletAddress}
            onWalletChange={handleWalletChange}
            events={events}
          />
        );
      
      case 'fan':
        return (
          <Fan
            identity={identity}
            onIdentityChange={handleIdentityChange}
            walletAddress={walletAddress}
            events={events}
            refreshTrigger={refreshCounter}
          />
        );
      
      case 'creator':
        return (
          <Creator
            walletAddress={walletAddress}
          />
        );
      
      case 'activity':
        return (
          <Activity
            walletAddress={walletAddress}
            events={events}
            refreshTrigger={refreshCounter}
          />
        );
      
      case 'admin':
        return <Admin />;
      
      default:
        return <Dashboard {...{identity, onIdentityChange, walletAddress, onWalletChange, events}} />;
    }
  };

  return (
    <AppShell
      identity={identity}
      walletAddress={walletAddress}
      currentView={currentView}
      onViewChange={handleViewChange}
    >
      {renderView()}
    </AppShell>
  );
}

export default App;
