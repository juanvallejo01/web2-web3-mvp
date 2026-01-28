/**
 * Main App Component
 * Web2-Web3 Bridge MVP Frontend
 */

import { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import SpotifyConnect from './components/SpotifyConnect';
import EventTrigger from './components/EventTrigger';
import EventList from './components/EventList';

function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [refreshCounter, setRefreshCounter] = useState(0);

  const handleWalletChange = (address) => {
    setWalletAddress(address);
  };

  const handleIdentityChange = (newIdentity) => {
    setIdentity(newIdentity);
  };

  const handleEventSubmitted = () => {
    // Trigger EventList refresh
    setRefreshCounter(prev => prev + 1);
  };

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>Web2 → Web3 Bridge MVP</h1>
        <p style={{ color: '#666' }}>
          Simulate Web2 actions and verify them with Web3 signatures
        </p>
      </header>

      <WalletConnect 
        onWalletChange={handleWalletChange}
        onIdentityChange={handleIdentityChange}
      />
      
      <SpotifyConnect 
        identity={identity}
        onIdentityUpdated={handleIdentityChange}
      />
      
      <EventTrigger 
        walletAddress={walletAddress}
        identity={identity}
        onEventSubmitted={handleEventSubmitted}
      />
      
      <EventList refreshTrigger={refreshCounter} />

      <footer style={{ 
        marginTop: '30px', 
        padding: '15px', 
        textAlign: 'center', 
        fontSize: '12px', 
        color: '#999',
        borderTop: '1px solid #ccc'
      }}>
        <p>Backend: http://localhost:3001 | Frontend: Vite + React</p>
        <p>Session-based wallet identity with localStorage persistence</p>
      </footer>
    </div>
  );
}

export default App;
