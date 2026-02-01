/**
 * TippingSettings Component
 * Noice-style tipping configuration UI
 * 
 * FEATURES:
 * - Global enable/disable toggle
 * - Per-action rules (LIKE, FOLLOW)
 * - Daily budget and cooldown
 * - Token selection (hardcoded for MVP)
 */

import { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3001';

// Hardcoded tokens for MVP (Sepolia testnet)
const AVAILABLE_TOKENS = [
  {
    address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    symbol: 'USDC',
    decimals: 6,
    chainId: 11155111, // Sepolia
    name: 'Mock USDC (Sepolia)'
  }
];

export default function TippingSettings({ walletAddress, identity }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (walletAddress) {
      loadConfig();
    }
  }, [walletAddress]);

  const loadConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/tipping/config?walletAddress=${walletAddress}`);
      if (!response.ok) {
        throw new Error('Failed to load config');
      }

      const data = await response.json();
      setConfig(data.config);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/tipping/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          config
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save config');
      }

      setMessage('✅ Configuration saved successfully');
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path, value) => {
    setConfig(prev => {
      const newConfig = { ...prev };
      const keys = path.split('.');
      let current = newConfig;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newConfig;
    });
  };

  if (!walletAddress || !identity) {
    return (
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px', opacity: 0.6 }}>
        <h3>⚙️ Tipping Settings</h3>
        <p style={{ color: '#999', fontSize: '14px' }}>Connect wallet to configure tipping</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>⚙️ Tipping Settings</h3>
        <p>Loading configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h3>⚙️ Tipping Settings</h3>
        <p style={{ color: 'red' }}>Failed to load configuration</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #4CAF50', borderRadius: '5px' }}>
      <h3>⚙️ Tipping Settings</h3>
      
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '4px', fontSize: '12px' }}>
        <strong>💡 How it works:</strong> Automatically send tips when you verify SoundCloud actions
      </div>

      {/* Global Enable */}
      <div style={{ marginBottom: '20px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig('enabled', e.target.checked)}
            style={{ marginRight: '10px', width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
            Enable Automatic Tipping
          </span>
        </label>
      </div>

      {/* Token Selection */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '5px' }}>
          💰 Tip Token
        </label>
        <select
          value={config.token.address}
          onChange={(e) => {
            const token = AVAILABLE_TOKENS.find(t => t.address === e.target.value);
            updateConfig('token', token);
          }}
          disabled={!config.enabled}
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '14px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: config.enabled ? 'white' : '#f5f5f5'
          }}
        >
          {AVAILABLE_TOKENS.map(token => (
            <option key={token.address} value={token.address}>
              {token.name} ({token.symbol})
            </option>
          ))}
        </select>
      </div>

      {/* Action Rules */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Action Rules</h4>
        
        {/* LIKE */}
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={config.rules.LIKE.enabled}
              onChange={(e) => updateConfig('rules.LIKE.enabled', e.target.checked)}
              disabled={!config.enabled}
              style={{ marginRight: '8px', cursor: 'pointer' }}
            />
            <strong>❤️ LIKE</strong>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
            <label style={{ fontSize: '12px' }}>Amount:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.rules.LIKE.amount}
              onChange={(e) => updateConfig('rules.LIKE.amount', e.target.value)}
              disabled={!config.enabled || !config.rules.LIKE.enabled}
              style={{
                width: '100px',
                padding: '4px 8px',
                fontSize: '13px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>{config.token.symbol}</span>
          </div>
        </div>

        {/* FOLLOW */}
        <div style={{ marginBottom: '10px', padding: '10px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
          <label style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <input
              type="checkbox"
              checked={config.rules.FOLLOW.enabled}
              onChange={(e) => updateConfig('rules.FOLLOW.enabled', e.target.checked)}
              disabled={!config.enabled}
              style={{ marginRight: '8px', cursor: 'pointer' }}
            />
            <strong>👤 FOLLOW</strong>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '24px' }}>
            <label style={{ fontSize: '12px' }}>Amount:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.rules.FOLLOW.amount}
              onChange={(e) => updateConfig('rules.FOLLOW.amount', e.target.value)}
              disabled={!config.enabled || !config.rules.FOLLOW.enabled}
              style={{
                width: '100px',
                padding: '4px 8px',
                fontSize: '13px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            <span style={{ fontSize: '12px', color: '#666' }}>{config.token.symbol}</span>
          </div>
        </div>
      </div>

      {/* Limits */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>Limits & Safety</h4>
        
        <div style={{ marginBottom: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
            Daily Budget ({config.token.symbol})
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={config.limits.dailyBudget}
            onChange={(e) => updateConfig('limits.dailyBudget', e.target.value)}
            disabled={!config.enabled}
            style={{
              width: '150px',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '12px', marginBottom: '4px' }}>
            Cooldown (seconds)
          </label>
          <input
            type="number"
            step="1"
            min="0"
            value={config.limits.cooldownSec}
            onChange={(e) => updateConfig('limits.cooldownSec', parseInt(e.target.value) || 0)}
            disabled={!config.enabled}
            style={{
              width: '150px',
              padding: '6px 8px',
              fontSize: '13px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          />
          <p style={{ fontSize: '11px', color: '#666', margin: '4px 0 0 0' }}>
            Minimum time between tips for the same action
          </p>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveConfig}
        disabled={saving || !config.enabled}
        style={{
          padding: '10px 20px',
          fontSize: '14px',
          fontWeight: 'bold',
          backgroundColor: config.enabled ? '#4CAF50' : '#ccc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: saving || !config.enabled ? 'not-allowed' : 'pointer',
          width: '100%'
        }}
      >
        {saving ? '💾 Saving...' : '💾 Save Configuration'}
      </button>

      {/* Messages */}
      {message && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#e8f5e9', 
          borderRadius: '4px', 
          color: '#2e7d32',
          fontSize: '13px'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#ffebee', 
          borderRadius: '4px', 
          color: '#c62828',
          fontSize: '13px'
        }}>
          ❌ {error}
        </div>
      )}
    </div>
  );
}
