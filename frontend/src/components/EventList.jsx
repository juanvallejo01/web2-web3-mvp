/**
 * EventList Component
 * Displays events with status badges and confirmation actions
 * 
 * STATUS FLOW:
 * - observed: Action happened, needs user confirmation (shows "Confirm & Sign")
 * - verified: Signature verified (shows checkmark)
 * - paid: Tip sent (shows tx hash)
 */

import { useState, useEffect } from 'react';
import { constructMessage, signMessage } from '../utils/web3';
import { executeTip } from '../utils/tipViem';

const API_BASE = 'http://localhost:3001';

export default function EventList({ refreshTrigger, walletAddress }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmError, setConfirmError] = useState(null);
  const [quotes, setQuotes] = useState({}); // eventId -> quote data
  const [quotingId, setQuotingId] = useState(null);
  const [tippingId, setTippingId] = useState(null);
  const [tipError, setTipError] = useState(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/events`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmEvent = async (event) => {
    if (!walletAddress) {
      setConfirmError('Please connect wallet first');
      return;
    }

    setConfirmingId(event.id);
    setConfirmError(null);

    try {
      // Reconstruct message from event data
      const message = constructMessage({
        platform: event.platform,
        action: event.action,
        actor: event.actor,
        target: event.target,
        timestamp: event.timestamp,
        walletAddress: event.walletAddress
      });

      // Sign with MetaMask
      const signature = await signMessage(message, walletAddress);

      // Send confirmation to backend
      const response = await fetch(`${API_BASE}/api/events/${event.id}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to confirm event');
      }

      // Refresh events
      await loadEvents();
      setConfirmError(null);

    } catch (err) {
      console.error('Confirmation error:', err);
      
      // Handle specific error types
      let errorMessage = 'Failed to confirm event';
      
      if (err.code === 4001 || err.message.includes('User rejected')) {
        errorMessage = 'Signature cancelled by user';
      } else if (err.message.includes('network')) {
        errorMessage = 'Network error - check your connection';
      } else if (err.message.includes('wallet')) {
        errorMessage = 'Wallet disconnected - please reconnect';
      } else {
        errorMessage = err.message;
      }
      
      setConfirmError(errorMessage);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleQuoteTip = async (event) => {
    setQuotingId(event.id);
    setTipError(null);

    try {
      const response = await fetch(`${API_BASE}/api/tipping/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id })
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to get quote');
      }

      if (!data.shouldTip) {
        setTipError(data.reason || 'Tipping not available for this event');
        return;
      }

      // Store quote
      setQuotes(prev => ({
        ...prev,
        [event.id]: data
      }));

    } catch (err) {
      console.error('Quote error:', err);
      setTipError(err.message);
    } finally {
      setQuotingId(null);
    }
  };

  const handleSendTip = async (event) => {
    const quote = quotes[event.id];
    if (!quote) return;

    setTippingId(event.id);
    setTipError(null);

    try {
      // Execute transfer with viem
      const { txHash } = await executeTip({
        tokenAddress: quote.token.address,
        recipient: quote.recipient,
        amount: quote.amount,
        decimals: quote.token.decimals
      });

      console.log('Tip sent, txHash:', txHash);

      // Record payment in backend
      const response = await fetch(`${API_BASE}/api/tipping/recordPayment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: event.id,
          txHash,
          amount: quote.amount,
          token: quote.token
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record payment');
      }

      // Clear quote and refresh events
      setQuotes(prev => {
        const newQuotes = { ...prev };
        delete newQuotes[event.id];
        return newQuotes;
      });
      
      await loadEvents();
      setTipError(null);

    } catch (err) {
      console.error('Tip error:', err);
      setTipError(err.message);
    } finally {
      setTippingId(null);
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

  const getStatusBadge = (event) => {
    const status = event.status || (event.verified ? 'verified' : 'unknown');
    
    switch (status) {
      case 'observed':
        return (
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 8px', 
            backgroundColor: '#fff3e0', 
            color: '#e65100', 
            borderRadius: '3px',
            fontWeight: 'bold'
          }}>
            👁️ OBSERVED
          </span>
        );
      case 'verified':
        return (
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 8px', 
            backgroundColor: '#e8f5e9', 
            color: '#2e7d32', 
            borderRadius: '3px',
            fontWeight: 'bold'
          }}>
            ✓ VERIFIED
          </span>
        );
      case 'paid':
        return (
          <span style={{ 
            fontSize: '11px', 
            padding: '2px 8px', 
            backgroundColor: '#e3f2fd', 
            color: '#1565c0', 
            borderRadius: '3px',
            fontWeight: 'bold'
          }}>
            💰 PAID
          </span>
        );
      default:
        return null;
    }
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

      {confirmError && (
        <div style={{ 
          padding: '10px', 
          marginTop: '10px',
          backgroundColor: '#ffebee', 
          borderRadius: '4px', 
          color: '#c62828',
          fontSize: '13px'
        }}>
          ❌ {confirmError}
        </div>
      )}

      {tipError && (
        <div style={{ 
          padding: '10px', 
          marginTop: '10px',
          backgroundColor: '#fff3e0', 
          borderRadius: '4px', 
          color: '#e65100',
          fontSize: '13px'
        }}>
          ⚠️ {tipError}
        </div>
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
                padding: '12px', 
                margin: '10px 0', 
                backgroundColor: '#f5f5f5', 
                borderRadius: '4px',
                borderLeft: `4px solid ${event.status === 'observed' ? '#FF5500' : event.status === 'verified' ? '#4CAF50' : '#2196F3'}`
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                <div>
                  <strong>#{event.id}</strong>
                  {getStatusBadge(event)}
                </div>
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
              </div>

              {/* Confirm button for observed events */}
              {event.status === 'observed' && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    onClick={() => handleConfirmEvent(event)}
                    disabled={confirmingId === event.id || !walletAddress}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: confirmingId === event.id || !walletAddress ? 'not-allowed' : 'pointer',
                      opacity: confirmingId === event.id || !walletAddress ? 0.5 : 1
                    }}
                  >
                    {confirmingId === event.id ? '🔐 Signing...' : '🔐 Confirm & Sign'}
                  </button>
                  {!walletAddress && (
                    <span style={{ marginLeft: '10px', fontSize: '11px', color: '#999' }}>
                      (Connect wallet to confirm)
                    </span>
                  )}
                </div>
              )}

              {/* Quote & Tip buttons for verified events */}
              {event.status === 'verified' && (
                <div style={{ marginTop: '10px' }}>
                  {!quotes[event.id] ? (
                    <button
                      onClick={() => handleQuoteTip(event)}
                      disabled={quotingId === event.id}
                      style={{
                        padding: '6px 12px',
                        fontSize: '13px',
                        backgroundColor: '#2196F3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: quotingId === event.id ? 'not-allowed' : 'pointer',
                        opacity: quotingId === event.id ? 0.5 : 1
                      }}
                    >
                      {quotingId === event.id ? '💭 Getting quote...' : '💭 Quote Tip'}
                    </button>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px', fontSize: '12px' }}>
                        💰 Tip: <strong>{quotes[event.id].amount} {quotes[event.id].token.symbol}</strong>
                        <br />
                        To: {quotes[event.id].recipient.slice(0, 10)}...{quotes[event.id].recipient.slice(-8)}
                      </div>
                      <button
                        onClick={() => handleSendTip(event)}
                        disabled={tippingId === event.id}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          backgroundColor: '#FF9800',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: tippingId === event.id ? 'not-allowed' : 'pointer',
                          opacity: tippingId === event.id ? 0.5 : 1
                        }}
                      >
                        {tippingId === event.id ? '💸 Sending...' : '💸 Send Tip'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Show provider receipt for observed events */}
              {event.providerReceipt && (
                <div style={{ fontSize: '11px', color: '#999', marginTop: '5px', fontStyle: 'italic' }}>
                  Receipt: {event.providerReceipt}
                </div>
              )}

              {/* Show tx hash for paid events */}
              {event.txHash && (
                <div style={{ fontSize: '11px', color: '#1565c0', marginTop: '5px' }}>
                  Tx: {event.txHash.slice(0, 10)}...{event.txHash.slice(-8)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
