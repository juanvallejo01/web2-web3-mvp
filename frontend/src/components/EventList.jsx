/**
 * EventList Component
 * Displays events fetched from backend
 */

import { useState, useEffect } from 'react';
import { fetchEvents } from '../utils/web3';

export default function EventList({ refreshTrigger }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchEvents();
      setEvents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [refreshTrigger]);

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Event History ({events.length})</h3>
        <button 
          onClick={loadEvents}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            cursor: 'pointer',
            backgroundColor: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {loading && <p>Loading events...</p>}

      {error && (
        <p style={{ color: 'red' }}>
          ❌ Error loading events: {error}
        </p>
      )}

      {!loading && !error && events.length === 0 && (
        <p style={{ color: '#999' }}>No events yet. Trigger an action above!</p>
      )}

      {!loading && events.length > 0 && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {events.map((event) => (
            <div 
              key={event.id} 
              style={{ 
                padding: '10px', 
                margin: '10px 0', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                borderLeft: '4px solid #2196F3'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <strong>#{event.id}</strong>
                <span style={{ fontSize: '12px', color: '#666' }}>
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              
              <div style={{ fontSize: '14px', marginBottom: '5px' }}>
                <strong>{event.action.toUpperCase()}</strong> on <strong>{event.platform}</strong>
              </div>
              
              <div style={{ fontSize: '13px', color: '#666' }}>
                Target: {event.target}
              </div>
              
              <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                Wallet: {formatAddress(event.walletAddress)}
                {event.verified && <span style={{ color: '#4CAF50', marginLeft: '10px' }}>✓ Verified</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
