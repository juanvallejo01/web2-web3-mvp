/**
 * Circle Email OTP Login Component
 * Handles Circle Web3 Services authentication via email OTP
 * 
 * FLOW:
 * 1. User enters email → generate/load deviceId
 * 2. Request OTP → backend calls Circle API
 * 3. User enters OTP code → W3S SDK verifies
 * 4. On success → update identity.externalIds.circle
 * 
 * NOTE: This is an AUTH PROVIDER, not a wallet provider.
 * MetaMask is still used for signing and payments.
 */

import { useState, useEffect } from 'react';
import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk';

const API_BASE = 'http://localhost:3001';
const DEVICE_ID_KEY = 'circle_device_id';

export default function CircleOtpLogin({ identity, onIdentityChange }) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [deviceId, setDeviceId] = useState(null);
  const [step, setStep] = useState('email'); // 'email' | 'otp' | 'complete'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  
  // Circle SDK state
  const [userToken, setUserToken] = useState(null);
  const [userId, setUserId] = useState(null);
  const [encryptionKey, setEncryptionKey] = useState(null);
  const [challengeId, setChallengeId] = useState(null);
  const [sdk, setSdk] = useState(null);

  const circleConnected = identity?.externalIds?.circle?.email;

  // Generate or load deviceId on mount
  useEffect(() => {
    let storedDeviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!storedDeviceId) {
      storedDeviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(DEVICE_ID_KEY, storedDeviceId);
    }
    setDeviceId(storedDeviceId);
  }, []);

  // Initialize Circle SDK on mount
  useEffect(() => {
    const initSdk = async () => {
      try {
        // Use env var directly for App ID (public, safe to expose)
        const appId = import.meta.env.VITE_CIRCLE_APP_ID;
        
        if (!appId) {
          console.error('VITE_CIRCLE_APP_ID not configured');
          setError('Circle App ID not configured. Please set VITE_CIRCLE_APP_ID in .env');
          return;
        }

        console.log('[Circle] Initializing SDK with appId:', appId);

        const w3sSdk = new W3SSdk();
        await w3sSdk.setAppSettings({ appId });
        
        setSdk(w3sSdk);
        console.log('[Circle] SDK initialized successfully');
      } catch (err) {
        console.error('[Circle] Failed to initialize SDK:', err);
        setError(`SDK initialization failed: ${err.message}`);
      }
    };

    initSdk();
  }, []);

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!deviceId) {
      setError('Device ID not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      console.log('[Circle] Requesting OTP for:', email.trim());

      const response = await fetch(`${API_BASE}/api/circle/requestEmailOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          deviceId: deviceId
        })
      });

      const data = await response.json();
      console.log('[Circle] OTP request response:', data);

      if (!response.ok) {
        throw new Error(data.error || data.details?.message || 'Failed to request OTP');
      }

      // Store tokens for OTP verification
      setUserToken(data.userToken);
      setUserId(data.userId);
      setEncryptionKey(data.encryptionKey);
      setChallengeId(data.challengeId);

      console.log('[Circle] OTP sent, challengeId:', data.challengeId);
      setMessage('✅ OTP sent! Check your email.');
      setStep('otp');

    } catch (err) {
      console.error('[Circle] Request OTP error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      setError('Please enter the OTP code');
      return;
    }

    if (!challengeId) {
      setError('No challenge ID available. Please request OTP again.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const devMode = import.meta.env.VITE_CIRCLE_DEV_MODE === 'true';
      
      console.log('[Circle] Verifying OTP with backend:', { 
        email, 
        otpCode: otp, 
        challengeId,
        devMode 
      });

      // DEV MODE: Accept any 6-digit code for testing
      if (devMode && otp.length === 6) {
        console.log('[Circle] DEV MODE: Bypassing OTP verification');
        
        // Update identity with Circle data
        const updatedIdentity = {
          ...identity,
          externalIds: {
            ...identity.externalIds,
            circle: {
              email: email.trim(),
              userId: userId,
              userToken: userToken,
              verifiedAt: Date.now(),
              devMode: true
            }
          }
        };

        localStorage.setItem('web3_identity', JSON.stringify(updatedIdentity));
        console.log('[Circle] Identity updated (DEV MODE):', updatedIdentity.externalIds.circle);
        
        onIdentityChange?.(updatedIdentity);

        setMessage('✅ Circle authentication successful! (DEV MODE)');
        setStep('complete');
        setOtp('');
        setLoading(false);
        return;
      }

      // PRODUCTION: Send OTP to backend for verification
      const response = await fetch(`${API_BASE}/api/circle/verifyEmailOtp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          userId: userId,
          userToken: userToken,
          otpCode: otp.trim(),
          challengeId: challengeId,
          encryptionKey: encryptionKey
        })
      });

      const data = await response.json();
      console.log('[Circle] Backend verification response:', data);

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Verification failed');
      }

      // Update identity with Circle data
      const updatedIdentity = {
        ...identity,
        externalIds: {
          ...identity.externalIds,
          circle: {
            email: email.trim(),
            userId: userId,
            userToken: userToken,
            verifiedAt: Date.now()
          }
        }
      };

      // Save to localStorage
      localStorage.setItem('web3_identity', JSON.stringify(updatedIdentity));
      console.log('[Circle] Identity updated:', updatedIdentity.externalIds.circle);
      
      // Notify parent
      onIdentityChange?.(updatedIdentity);

      setMessage('✅ Circle authentication successful!');
      setStep('complete');
      setOtp('');
      setLoading(false);

    } catch (err) {
      console.error('[Circle] Verify OTP error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    // Remove Circle data from identity
    const updatedIdentity = {
      ...identity,
      externalIds: {
        ...identity.externalIds,
        circle: null
      }
    };

    localStorage.setItem('web3_identity', JSON.stringify(updatedIdentity));
    onIdentityChange?.(updatedIdentity);

    // Reset component state
    setEmail('');
    setOtp('');
    setStep('email');
    setUserToken(null);
    setUserId(null);
    setEncryptionKey(null);
    setChallengeId(null);
    setError(null);
    setMessage(null);
  };

  // If already connected, show status
  if (circleConnected) {
    return (
      <div style={{
        padding: '20px',
        border: '2px solid #4CAF50',
        borderRadius: '8px',
        backgroundColor: '#f1f8f4',
        marginBottom: '20px'
      }}>
        <h3 style={{ marginTop: 0, color: '#2e7d32' }}>✅ Circle Connected</h3>
        <p style={{ margin: '10px 0' }}>
          <strong>Email:</strong> {identity.externalIds.circle.email}
        </p>
        <p style={{ margin: '10px 0', fontSize: '0.9em', color: '#666' }}>
          User ID: {identity.externalIds.circle.userId}
        </p>
        <button
          onClick={handleDisconnect}
          style={{
            padding: '8px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Disconnect Circle
        </button>
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      border: '2px solid #2196F3',
      borderRadius: '8px',
      backgroundColor: '#f5f5f5',
      marginBottom: '20px'
    }}>
      <h3 style={{ marginTop: 0, color: '#1976d2' }}>🔐 Circle Email Authentication</h3>
      <p style={{ fontSize: '0.9em', color: '#666', marginBottom: '15px' }}>
        Sign in with email OTP (no wallet required for authentication)
      </p>

      {error && (
        <div style={{
          padding: '10px',
          backgroundColor: '#ffebee',
          border: '1px solid #f44336',
          borderRadius: '4px',
          color: '#c62828',
          marginBottom: '15px'
        }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div style={{
          padding: '10px',
          backgroundColor: '#e8f5e9',
          border: '1px solid #4CAF50',
          borderRadius: '4px',
          color: '#2e7d32',
          marginBottom: '15px'
        }}>
          {message}
        </div>
      )}

      {step === 'email' && (
        <form onSubmit={handleRequestOtp}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !deviceId}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: loading ? '#ccc' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {loading ? 'Sending...' : 'Send OTP Code'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp}>
          <p style={{ marginBottom: '15px', color: '#666' }}>
            Email sent to: <strong>{email}</strong>
          </p>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Enter OTP Code
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setStep('email')}
              disabled={loading}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px'
              }}
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: '12px',
                backgroundColor: loading ? '#ccc' : '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>
        </form>
      )}

      {step === 'complete' && (
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.2em', color: '#2e7d32', marginBottom: '10px' }}>
            ✅ Authentication Complete!
          </p>
          <button
            onClick={() => setStep('email')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
