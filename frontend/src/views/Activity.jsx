/**
 * Activity View - All events with filtering
 */
import { useState } from 'react';
import Card from '../components/ui/Card';
import Input from '../components/ui/Input';
import Badge from '../components/ui/Badge';
import EventList from '../components/EventList';

export default function Activity({ walletAddress, events, refreshTrigger }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'my' | 'observed' | 'verified' | 'paid'
  const [searchTerm, setSearchTerm] = useState('');

  const stats = {
    total: events.length,
    observed: events.filter(e => e.status === 'observed').length,
    verified: events.filter(e => e.status === 'verified').length,
    paid: events.filter(e => e.status === 'paid').length,
    myEvents: events.filter(e => e.walletAddress === walletAddress).length
  };

  return (
    <div className="activity-view">
      <div className="view-header">
        <h2>📊 Activity</h2>
        <p>View and manage all events</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <Card className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Events</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.observed}</div>
          <div className="stat-label">Observed</div>
          <Badge variant="warning">Pending</Badge>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.verified}</div>
          <div className="stat-label">Verified</div>
          <Badge variant="info">Signed</Badge>
        </Card>
        <Card className="stat-card">
          <div className="stat-value">{stats.paid}</div>
          <div className="stat-label">Paid</div>
          <Badge variant="success">Complete</Badge>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="filters">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'my' ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter('my')}
            >
              My Events ({stats.myEvents})
            </button>
            <button
              className={`filter-btn ${filter === 'observed' ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter('observed')}
            >
              Observed
            </button>
            <button
              className={`filter-btn ${filter === 'verified' ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter('verified')}
            >
              Verified
            </button>
            <button
              className={`filter-btn ${filter === 'paid' ? 'filter-btn-active' : ''}`}
              onClick={() => setFilter('paid')}
            >
              Paid
            </button>
          </div>

          <Input
            placeholder="Search by event ID, wallet, or action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Events List */}
      <Card>
        <h3>Events</h3>
        <EventList
          refreshTrigger={refreshTrigger}
          walletAddress={walletAddress}
        />
      </Card>
    </div>
  );
}
