/**
 * SoundCloud Actions Component
 * Trigger SoundCloud actions (like, follow) that create "observed" events
 * 
 * FLOW:
 * 1. User enters track/user ID
 * 2. Click "Like Track" or "Follow Artist"
 * 3. Backend creates event with status="observed"
 * 4. Event appears in EventList with "Confirm & Sign" button
 */

import { useState } from 'react';

const API_BASE = 'http://localhost:3001';

export default function SoundCloudActions({ identity, onActionCompleted }) {
  const [trackId, setTrackId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const soundcloudConnected = identity?.externalIds?.soundcloud;

  const handleLikeTrack = async () => {
    if (!trackId.trim()) {
      setError('Please enter a track ID');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/soundcloud/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: trackId,
          walletAddress: identity.walletAddress,
          soundcloudUserId: identity.externalIds.soundcloud
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record like action');
      }

      setMessage(`✅ Like action recorded! Event #${data.event.id} (observed)`);
      setTrackId(''); // Clear input
      onActionCompleted?.(); // Refresh event list

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowArtist = async () => {
    if (!userId.trim()) {
      setError('Please enter an artist/user ID');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/soundcloud/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: userId,
          walletAddress: identity.walletAddress,
          soundcloudUserId: identity.externalIds.soundcloud
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to record follow action');
      }

      setMessage(`✅ Follow action recorded! Event #${data.event.id} (observed)`);
      setUserId(''); // Clear input
      onActionCompleted?.(); // Refresh event list

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!identity) {
    return (
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', opacity: 0.6 }}>
        <h3>🎵 SoundCloud Actions</h3>
        <p style={{ color: '#999', fontSize: '14px' }}>Connect wallet to perform actions</p>
      </div>
    );
  }

  if (!soundcloudConnected) {
    return (
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #FF5500', borderRadius: '5px' }}>
        <h3>🎵 SoundCloud Actions</h3>
        <p style={{ color: '#999', fontSize: '14px' }}>
          Connect SoundCloud above to perform actions
        </p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #FF5500', borderRadius: '5px' }}>
      <h3>🎵 SoundCloud Actions</h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3e0', borderRadius: '4px', fontSize: '12px' }}>
        <p style={{ margin: 0 }}>
          <strong>How it works:</strong> Actions create "observed" events → Confirm & Sign → Verified → Tip (optional)
        </p>
      </div>

      {/* Like Track */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>
          ❤️ Like Track
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Enter track ID (e.g., 123456)"
            value={trackId}
            onChange={(e) => setTrackId(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleLikeTrack}
            disabled={loading || !trackId.trim()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#FF5500',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !trackId.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !trackId.trim() ? 0.5 : 1
            }}
          >
            {loading ? '...' : 'Like'}
          </button>
        </div>
      </div>

      {/* Follow Artist */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>
          👤 Follow Artist
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Enter artist/user ID (e.g., 789012)"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            disabled={loading}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: '14px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <button
            onClick={handleFollowArtist}
            disabled={loading || !userId.trim()}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              backgroundColor: '#FF5500',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading || !userId.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !userId.trim() ? 0.5 : 1
            }}
          >
            {loading ? '...' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '13px', color: '#2e7d32' }}>
          {message}
        </div>
      )}
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#ffebee', borderRadius: '4px', fontSize: '13px', color: '#c62828' }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}
