/**
 * Fan View - Actions and Tipping UI
 * For fans to create events, sign them, and send tips
 */
import { useState } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import SoundCloudActions from '../components/SoundCloudActions';
import EventList from '../components/EventList';
import TippingSettings from '../components/TippingSettings';

export default function Fan({ 
  identity,
  onIdentityChange,
  walletAddress,
  events,
  refreshTrigger
}) {
  const [activeTab, setActiveTab] = useState('actions'); // 'actions' | 'events' | 'settings'

  return (
    <div className="fan-view">
      <div className="view-header">
        <h2>⭐ Fan Dashboard</h2>
        <p>Create actions, sign events, and send tips to creators</p>
      </div>

      {/* Sub-navigation */}
      <div className="sub-nav">
        <button
          className={`sub-nav-btn ${activeTab === 'actions' ? 'sub-nav-btn-active' : ''}`}
          onClick={() => setActiveTab('actions')}
        >
          🎵 Actions
        </button>
        <button
          className={`sub-nav-btn ${activeTab === 'events' ? 'sub-nav-btn-active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📋 My Events
        </button>
        <button
          className={`sub-nav-btn ${activeTab === 'settings' ? 'sub-nav-btn-active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Actions Tab */}
      {activeTab === 'actions' && (
        <div className="tab-content">
          <Card>
            <h3>SoundCloud Actions</h3>
            <p className="card-description">
              Like or follow artists on SoundCloud. Each action creates an event that you can sign and tip.
            </p>
            <SoundCloudActions
              identity={identity}
              onIdentityChange={onIdentityChange}
              walletAddress={walletAddress}
            />
          </Card>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <div className="tab-content">
          <Card>
            <h3>My Events</h3>
            <p className="card-description">
              Sign your events and send tips. Events progress: observed → verified → paid
            </p>
            <EventList
              refreshTrigger={refreshTrigger}
              walletAddress={walletAddress}
            />
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="tab-content">
          <Card>
            <h3>Tipping Settings</h3>
            <p className="card-description">
              Configure your default tip amounts and preferences
            </p>
            <TippingSettings
              walletAddress={walletAddress}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
