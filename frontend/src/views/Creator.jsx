/**
 * Creator View - Claim receiver wallet (Modelo B)
 * Allows creators to associate their SoundCloud ID with a receiver wallet
 */
import { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';

const API_BASE = 'http://localhost:3001';

export default function Creator({ walletAddress }) {
  const [soundcloudUserId, setSoundcloudUserId] = useState('');
  const [receiverAddress, setReceiverAddress] = useState(walletAddress || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [existingClaim, setExistingClaim] = useState(null);

  useEffect(() => {
    if (walletAddress && !receiverAddress) {
      setReceiverAddress(walletAddress);
    }
  }, [walletAddress]);

  const handleSaveClaim = async (e) => {
    e.preventDefault();
    
    if (!soundcloudUserId.trim()) {
      setError('Please enter your SoundCloud User ID');
      return;
    }

    if (!receiverAddress.trim()) {
      setError('Please enter a receiver wallet address');
      return;
    }

    if (!receiverAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setError('Invalid Ethereum address format');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE}/api/receivers/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          soundcloudUserId: soundcloudUserId.trim(),
          receiverAddress: receiverAddress.trim()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save claim');
      }

      setMessage('✅ Claim saved successfully!');
      setExistingClaim(data.claim);
      setSoundcloudUserId('');
    } catch (err) {
      console.error('Save claim error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckClaim = async () => {
    if (!soundcloudUserId.trim()) {
      setError('Please enter a SoundCloud User ID to check');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/receivers/resolve?soundcloudUserId=${encodeURIComponent(soundcloudUserId.trim())}`
      );

      const data = await response.json();

      if (response.ok && data.receiverAddress) {
        setExistingClaim({
          soundcloudUserId: soundcloudUserId.trim(),
          receiverAddress: data.receiverAddress
        });
        setMessage(`Found claim: ${data.receiverAddress}`);
      } else {
        setMessage('No claim found for this SoundCloud User ID');
        setExistingClaim(null);
      }
    } catch (err) {
      console.error('Check claim error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="creator-view">
      <div className="view-header">
        <h2>🎵 Creator Dashboard</h2>
        <p>Claim your receiver wallet for SoundCloud tips</p>
      </div>

      {/* Info Card */}
      <Card className="info-card">
        <h3>📌 About Receiver Claims (Modelo B)</h3>
        <p>
          As a creator, you can associate your SoundCloud User ID with a wallet address
          to receive tips. When fans tip your content, the payment will go to your claimed wallet.
        </p>
        <p>
          <strong>Default behavior (Modelo A):</strong> If no claim exists, tips go to the platform's
          default receiver address.
        </p>
        <div className="info-badges">
          <Badge variant="info">Optional</Badge>
          <Badge variant="success">One claim per SoundCloud ID</Badge>
        </div>
      </Card>

      {/* Claim Form */}
      <Card>
        <h3>Claim Receiver Wallet</h3>
        <form onSubmit={handleSaveClaim} className="claim-form">
          <Input
            label="SoundCloud User ID"
            value={soundcloudUserId}
            onChange={(e) => setSoundcloudUserId(e.target.value)}
            placeholder="your-soundcloud-username"
            disabled={loading}
          />

          <Input
            label="Receiver Wallet Address"
            value={receiverAddress}
            onChange={(e) => setReceiverAddress(e.target.value)}
            placeholder="0x..."
            disabled={loading}
          />

          <div className="form-actions">
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Claim'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleCheckClaim}
              disabled={loading}
            >
              Check Existing Claim
            </Button>
          </div>

          {message && (
            <div className="message message-success">{message}</div>
          )}
          {error && (
            <div className="message message-error">{error}</div>
          )}
        </form>
      </Card>

      {/* Existing Claim Display */}
      {existingClaim && (
        <Card className="success-card">
          <h3>✅ Active Claim</h3>
          <div className="claim-details">
            <p><strong>SoundCloud ID:</strong> {existingClaim.soundcloudUserId}</p>
            <p><strong>Receiver:</strong> {existingClaim.receiverAddress}</p>
            <p className="claim-note">
              Tips to this SoundCloud account will be sent to the receiver address above.
            </p>
          </div>
        </Card>
      )}

      {/* How It Works */}
      <Card>
        <h3>How It Works</h3>
        <ol className="how-it-works">
          <li>Enter your SoundCloud User ID (the username in your profile URL)</li>
          <li>Enter the wallet address where you want to receive tips (defaults to your connected wallet)</li>
          <li>Click "Save Claim" to register</li>
          <li>When fans tip your content, payments go to your claimed wallet</li>
          <li>You can update your claim anytime by submitting again</li>
        </ol>
      </Card>
    </div>
  );
}
