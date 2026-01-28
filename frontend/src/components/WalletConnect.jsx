/**
 * WalletConnect Component
 * Handles MetaMask wallet connection with session management
 */

import { useState, useEffect } from 'react';
import { connectWallet, getCurrentWallet, isMetaMaskInstalled } from '../utils/web3';
import { getOrCreateSession, clearSession, loadSession } from '../utils/session';
import { getOrCreateIdentity, clearIdentity } from '../utils/identity';

export default function WalletConnect({ onWalletChange, onIdentityChange }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [session, setSession] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if already connected on mount and restore session
    const checkConnection = async () => {
      const address = await getCurrentWallet();
      if (address) {
        // Get or create session for this wallet
        const walletSession = getOrCreateSession(address);
        const walletIdentity = getOrCreateIdentity(walletSession);
        
        setWalletAddress(address);
        setSession(walletSession);
        setIdentity(walletIdentity);
        
        onWalletChange(address);
        onIdentityChange?.(walletIdentity);
      } else {
        // Try to load existing session
        const existingSession = loadSession();
        if (existingSession) {
          // Session exists but wallet not connected - clear it
          clearSession();
          clearIdentity();
        }
      }
    };
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        const newAddress = accounts[0] || null;
        
        if (newAddress) {
          // Wallet changed - create new session
          const newSession = getOrCreateSession(newAddress);
          const newIdentity = getOrCreateIdentity(newSession);
          
          setWalletAddress(newAddress);
          setSession(newSession);
          setIdentity(newIdentity);
          
          onWalletChange(newAddress);
          onIdentityChange?.(newIdentity);
        } else {
          // Wallet disconnected
          clearSession();
          clearIdentity();
          setWalletAddress(null);
          setSession(null);
          setIdentity(null);
          onWalletChange(null);
          onIdentityChange?.(null);
        }
      });
    }
  }, [onWalletChange, onIdentityChange]);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled()) {
      setError('MetaMask not installed. Please install MetaMask extension.');
      return;
    }

    setConnecting(true);
    setError(null);

    try {
      const address = await connectWallet();
      
      // Create session and identity for new connection
      const newSession = getOrCreateSession(address);
      const newIdentity = getOrCreateIdentity(newSession);
      
      setWalletAddress(address);
      setSession(newSession);
      setIdentity(newIdentity);
      
      onWalletChange(address);
      onIdentityChange?.(newIdentity);
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(false);
    }
  };

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h3>Wallet Connection</h3>
      
      {!walletAddress ? (
        <div>
          <button 
            onClick={handleConnect} 
            disabled={connecting}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              cursor: connecting ? 'not-allowed' : 'pointer',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            {connecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
        </div>
      ) : (
        <div>
          <p style={{ margin: '10px 0', color: '#4CAF50', fontWeight: 'bold' }}>
            ✅ Connected: {formatAddress(walletAddress)}
          </p>
          <p style={{ fontSize: '12px', color: '#666' }}>
            Full address: {walletAddress}
          </p>
          {session && (
            <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
              <p style={{ fontSize: '11px', color: '#666', margin: '2px 0' }}>
                Session ID: {session.sessionId.slice(0, 8)}...
              </p>
              <p style={{ fontSize: '11px', color: '#666', margin: '2px 0' }}>
                Connected: {new Date(session.connectedAt).toLocaleTimeString()}
              </p>
            </div>
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
