/**
 * SpotifyConnect Component
 * Handles Spotify linking to wallet identity (mock or real OAuth)
 */

import { useState, useEffect } from 'react';
import { initiateSpotifyAuth, handleSpotifyCallback, fetchSpotifyProfile, isMockMode, mockSpotifyLogin } from '../utils/spotify';
import { linkExternalIdentity } from '../utils/identity';

export default function SpotifyConnect({ identity, onIdentityUpdate }) {
  const [spotifyProfile, setSpotifyProfile] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const mockMode = isMockMode();

  useEffect(() => {
    // Check if we have Spotify already linked
    if (identity?.externalIds?.spotify) {
      // Load from identity
      setSpotifyProfile({
        id: identity.externalIds.spotify,
        display_name: identity.externalIds.spotify // We don't store full profile
      });
    }

    // Handle OAuth callback (only in real mode)
    if (!mockMode) {
      const token = handleSpotifyCallback();
      if (token) {
        setLoading(true);
        fetchSpotifyProfile()
          .then(profile => {
            setSpotifyProfile(profile);
            // Link to identity
            const updatedIdentity = linkExternalIdentity('spotify', profile.id);
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
        const profile = await mockSpotifyLogin();
        setSpotifyProfile(profile);
        const updatedIdentity = linkExternalIdentity('spotify', profile.id);
        onIdentityUpdate?.(updatedIdentity);
      } else {
        // Real mode: initiate OAuth flow
        initiateSpotifyAuth();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #1DB954', borderRadius: '5px' }}>
      <h3>Spotify Integration</h3>
      
      {!spotifyProfile ? (
        <div>
          <button 
            onClick={handleConnect} 
            disabled={loading || !identity}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: (loading || !identity) ? 'not-allowed' : 'pointer',
              backgroundColor: '#1DB954',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              opacity: (loading || !identity) ? 0.5 : 1
            }}
          >
            {loading ? 'Connecting...' : 'Connect Spotify'}
          </button>
          
          {!identity && (
            <p style={{ fontSize: '12px', color: '#999', marginTop: '10px' }}>
              Connect your wallet first
            </p>
          )}
        </div>
      ) : (
        <div>
          <p style={{ margin: '10px 0', color: '#1DB954', fontWeight: 'bold' }}>
            ✅ Spotify Connected {mockMode && '(mock)'}
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            User: {spotifyProfile.display_name || spotifyProfile.id}
          </p>
          {spotifyProfile.email && (
            <p style={{ fontSize: '12px', color: '#666' }}>
              Email: {spotifyProfile.email}
            </p>
          )}
        </div>
      )}

      {error && (
        <p style={{ color: 'red', marginTop: '10px' }}>
          ❌ {error}
        </p>
      )}
    </div>
  );
}
