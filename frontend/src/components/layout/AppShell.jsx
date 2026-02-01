/**
 * AppShell - Main layout wrapper
 * MetaMask-inspired clean layout with topbar and content area
 */
import { useState } from 'react';
import Badge from '../ui/Badge';

export default function AppShell({ children, identity, walletAddress, currentView, onViewChange }) {
  const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'metamask';
  const network = 'Sepolia';
  
  const shortAddress = walletAddress 
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` 
    : 'Not connected';

  const views = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'fan', label: '⭐ Fan' },
    { id: 'creator', label: '🎵 Creator' },
    { id: 'activity', label: '📊 Activity' },
    { id: 'admin', label: '⚙️ Admin' }
  ];

  return (
    <div className="app-shell">
      {/* Topbar */}
      <header className="topbar">
        <div className="topbar-content">
          <div className="topbar-left">
            <h1 className="app-logo">Web2→Web3 Bridge</h1>
          </div>
          <div className="topbar-right">
            <Badge variant="info">{authProvider === 'circle' ? '🔐 Circle' : '🦊 MetaMask'}</Badge>
            <Badge variant="success">{network}</Badge>
            <Badge variant="default">{shortAddress}</Badge>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        {views.map(view => (
          <button
            key={view.id}
            className={`nav-tab ${currentView === view.id ? 'nav-tab-active' : ''}`}
            onClick={() => onViewChange(view.id)}
          >
            {view.label}
          </button>
        ))}
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="content-container">
          {children}
        </div>
      </main>
    </div>
  );
}
