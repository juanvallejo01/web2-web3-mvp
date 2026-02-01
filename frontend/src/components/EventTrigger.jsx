/**
 * EventTrigger Component
 * Simulates Web2 actions and submits signed events to backend
 */

import { useState } from 'react';
import { constructMessage, signMessage, submitEvent } from '../utils/web3';
import { createActor } from '../utils/identity';

export default function EventTrigger({ walletAddress, identity, onEventSubmitted }) {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  const triggerEvent = async (platform, action, target) => {
    if (!walletAddress || !identity) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      // Create actor object from identity
      // WHY: Actor represents who is performing the action
      // Future: Can include linked Web2 identities
      const actor = createActor(identity);

      // Create event data with actor object
      const eventData = {
        platform,
        action,
        actor, // Now an object: { type, address, sessionId }
        target,
        timestamp: Date.now(),
        walletAddress
      };

      // Construct deterministic message (with serialized actor)
      const message = constructMessage(eventData);

      // Request signature from MetaMask
      const signature = await signMessage(message, walletAddress);

      // Submit to backend (serialize actor for backend compatibility)
      // Backend expects actor as string, so we serialize it
      const actorString = `${actor.type}:${actor.address}:${actor.sessionId}`;
      
      const payload = {
        platform: eventData.platform,
        action: eventData.action,
        actor: actorString, // Serialized actor string
        target: eventData.target,
        timestamp: eventData.timestamp,
        walletAddress: eventData.walletAddress,
        signature
      };

      const result = await submitEvent(payload);

      setResponse(result);
      onEventSubmitted();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const actionButtons = [
    { platform: 'spotify', action: 'play', target: 'Bohemian Rhapsody - Queen', emoji: '▶️' },
    { platform: 'spotify', action: 'like', target: 'Shape of You - Ed Sheeran', emoji: '❤️' },
    { platform: 'twitter', action: 'comment', target: 'Post #12345', emoji: '💬' },
    { platform: 'youtube', action: 'follow', target: 'Channel: TechTalks', emoji: '👥' }
  ];

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Simulate Web2 Actions</h3>
      
      {!walletAddress || !identity ? (
        <p style={{ color: '#999' }}>Connect wallet to trigger events</p>
      ) : (
        <>
          <div style={{ marginBottom: '10px', padding: '8px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
            <p style={{ fontSize: '11px', color: '#1976d2', margin: '2px 0' }}>
              🔐 Acting as: wallet ({identity.sessionId.slice(0, 8)}...)
              {identity.externalIds?.soundcloud && (
                <span style={{ marginLeft: '8px', color: '#FF5500', fontWeight: 'bold' }}>
                  + SoundCloud ({identity.externalIds.soundcloud.slice(0, 20)}...)
                </span>
              )}
            </p>
            {!identity.externalIds?.soundcloud ? (
              <p style={{ fontSize: '10px', color: '#666', margin: '2px 0', fontStyle: 'italic' }}>
                Link SoundCloud above to prove unified Web2+Web3 identity
              </p>
            ) : (
              <p style={{ fontSize: '10px', color: '#FF5500', margin: '2px 0', fontWeight: 'bold' }}>
                ✅ Unified identity: Your signature proves you own both wallet AND SoundCloud account
              </p>
            )}
          </div>

          <div style={{ marginBottom: '15px' }}>
            {actionButtons.map((btn, index) => (
              <button
                key={index}
                onClick={() => triggerEvent(btn.platform, btn.action, btn.target)}
                disabled={loading}
                style={{
                  margin: '5px',
                  padding: '10px 15px',
                  fontSize: '14px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  backgroundColor: '#2196F3',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px'
                }}
              >
                {btn.emoji} {btn.action.toUpperCase()} on {btn.platform}
              </button>
            ))}
          </div>

          {loading && (
            <p style={{ color: '#2196F3', fontWeight: 'bold' }}>
              🔄 Waiting for signature...
            </p>
          )}

          {response && (
            <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', marginTop: '10px' }}>
              <p style={{ color: '#4CAF50', fontWeight: 'bold', margin: '5px 0' }}>
                ✅ Success: {response.message}
              </p>
              <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
                Event ID: {response.event?.id}
              </p>
            </div>
          )}

          {error && (
            <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', marginTop: '10px' }}>
              <p style={{ color: '#f44336', fontWeight: 'bold', margin: '5px 0' }}>
                ❌ Error: {error}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
