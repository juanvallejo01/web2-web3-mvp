/**
 * SoundCloudConnect Component
 * Handles SoundCloud linking to wallet identity (mock or real OAuth)
 * 
 * PURPOSE: Link SoundCloud user ID to wallet for unified Web2+Web3 identity
 */

import { useState, useEffect } from 'react';
import { initiateSoundCloudAuth, handleSoundCloudCallback, fetchSoundCloudProfile, isMockMode, mockSoundCloudLogin } from '../utils/soundcloud';
import { linkExternalIdentity } from '../utils/identity';

export default function SoundCloudConnect({ identity, onIdentityUpdate }) {
  const [soundCloudProfile, setSoundCloudProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const mockMode = isMockMode();

  useEffect(() => {
    // Check if we have SoundCloud already linked
    if (identity?.externalIds?.soundcloud) {
      // Load from identity
      setSoundCloudProfile({
        id: identity.externalIds.soundcloud,
        username: identity.externalIds.soundcloud
      });
    }

    // Handle OAuth callback (only in real mode)
    if (!mockMode) {
      const token = handleSoundCloudCallback();
      if (token) {
        setLoading(true);
        fetchSoundCloudProfile()
          .then(profile => {
            setSoundCloudProfile(profile);
            // Link to identity
            const updatedIdentity = linkExternalIdentity('soundcloud', profile.id);
            onIdentityUpdate?.(updatedIdentity);
            setLoading(false);
          })
          .catch(err => {
            setError(err.message);
            setLoading(false);
          });
      }
    }
  }, [identity, onIdentityUpdate, mockMode]);

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    
    try {
      if (mockMode) {
        // Mock mode: direct login without OAuth redirect
        const profile = await mockSoundCloudLogin();
        setSoundCloudProfile(profile);
        const updatedIdentity = linkExternalIdentity('soundcloud', profile.id);
        onIdentityUpdate?.(updatedIdentity);
      } else {
        // Real mode: initiate OAuth flow
        initiateSoundCloudAuth();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #FF5500', borderRadius: '5px' }}>
      <h3>🎵 SoundCloud Integration</h3>
      
      {!soundCloudProfile ? (
        <div>
          <button 
            onClick={handleConnect} 
            disabled={loading || !identity}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: !identity || loading ? 'not-allowed' : 'pointer',
              backgroundColor: '#FF5500',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              opacity: !identity || loading ? 0.5 : 1
            }}
          >
            {loading ? 'Connecting...' : '🔗 Connect SoundCloud'}
          </button>
          
          {!identity && (
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              Connect wallet first
            </p>
          )}
          
          {mockMode && (
            <p style={{ fontSize: '11px', color: '#FF5500', marginTop: '8px', fontStyle: 'italic' }}>
              ⚙️ Mock mode enabled (development)
            </p>
          )}
          
          {error && (
            <p style={{ color: 'red', fontSize: '12px', marginTop: '8px' }}>
              ❌ {error}
            </p>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: '#fff3e0', padding: '12px', borderRadius: '4px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>
            ✅ <strong>SoundCloud Connected</strong>
          </p>
          <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
            User: <strong>{soundCloudProfile.username || soundCloudProfile.id}</strong>
          </p>
          {soundCloudProfile.full_name && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
              Name: {soundCloudProfile.full_name}
            </p>
          )}
          <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#999', fontStyle: 'italic' }}>
            Your wallet and SoundCloud are now linked for unified identity
          </p>
        </div>
      )}
      
      <div style={{ marginTop: '12px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontSize: '11px', color: '#666' }}>
        <strong>💡 How it works:</strong>
        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px' }}>
          <li>Link your SoundCloud account to your wallet</li>
          <li>Actions (like, follow) create "observed" events</li>
          <li>Sign events to verify them on-chain</li>
          <li>Configure tipping to automatically reward creators</li>
        </ul>
      </div>
    </div>
  );
}
