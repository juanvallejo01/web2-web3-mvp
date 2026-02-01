/**
 * Dashboard View - Main stepper and status overview
 * Shows progress through the Web2→Web3 flow
 */
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import CircleOtpLogin from '../components/CircleOtpLogin';
import WalletConnect from '../components/WalletConnect';
import SoundCloudConnect from '../components/SoundCloudConnect';

export default function Dashboard({ 
  identity, 
  onIdentityChange,
  walletAddress,
  onWalletChange,
  events = []
}) {
  const authProvider = import.meta.env.VITE_AUTH_PROVIDER || 'metamask';
  
  // Determine step statuses
  const circleConnected = identity?.externalIds?.circle?.email;
  const walletConnected = !!walletAddress;
  const soundcloudConnected = identity?.externalIds?.soundcloud?.userId;
  const hasObservedEvents = events.some(e => e.status === 'observed');
  const hasVerifiedEvents = events.some(e => e.status === 'verified');
  const hasPaidEvents = events.some(e => e.status === 'paid');

  const steps = [
    {
      id: 1,
      title: 'Email Authentication',
      description: authProvider === 'circle' ? 'Sign in with Circle OTP' : 'MetaMask auth',
      status: circleConnected || authProvider === 'metamask' ? 'complete' : 'pending',
      component: authProvider === 'circle' ? 'circle' : null
    },
    {
      id: 2,
      title: 'Connect Wallet',
      description: 'MetaMask for signing and payments',
      status: walletConnected ? 'complete' : 'pending',
      component: 'wallet'
    },
    {
      id: 3,
      title: 'Connect SoundCloud',
      description: 'Link your SoundCloud account (optional)',
      status: soundcloudConnected ? 'complete' : 'pending',
      component: 'soundcloud'
    },
    {
      id: 4,
      title: 'Create Action',
      description: 'Like or follow on SoundCloud',
      status: hasObservedEvents ? 'complete' : 'pending',
      component: null
    },
    {
      id: 5,
      title: 'Sign Event',
      description: 'Verify event with signature',
      status: hasVerifiedEvents ? 'complete' : 'pending',
      component: null
    },
    {
      id: 6,
      title: 'Send Tip',
      description: 'Complete payment on-chain',
      status: hasPaidEvents ? 'complete' : 'pending',
      component: null
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Dashboard</h2>
        <p>Complete the flow to bridge Web2 actions to Web3 payments</p>
      </div>

      {/* Stepper */}
      <Card className="stepper-card">
        <h3>Progress</h3>
        <div className="stepper">
          {steps.map((step, index) => (
            <div key={step.id} className="stepper-step">
              <div className="stepper-step-header">
                <div className={`stepper-circle ${step.status === 'complete' ? 'stepper-circle-complete' : ''}`}>
                  {step.status === 'complete' ? '✓' : step.id}
                </div>
                <div className="stepper-step-content">
                  <h4>{step.title}</h4>
                  <p>{step.description}</p>
                  <Badge variant={step.status === 'complete' ? 'success' : 'warning'}>
                    {step.status === 'complete' ? 'Complete' : 'Pending'}
                  </Badge>
                </div>
              </div>
              {index < steps.length - 1 && <div className="stepper-line"></div>}
            </div>
          ))}
        </div>
      </Card>

      {/* Action Components */}
      <div className="dashboard-actions">
        {authProvider === 'circle' && !circleConnected && (
          <Card>
            <h3>Step 1: Email Authentication</h3>
            <CircleOtpLogin 
              identity={identity}
              onIdentityChange={onIdentityChange}
            />
          </Card>
        )}

        {!walletConnected && (
          <Card>
            <h3>Step 2: Connect Wallet</h3>
            <WalletConnect
              onWalletChange={onWalletChange}
              walletAddress={walletAddress}
            />
          </Card>
        )}

        {!soundcloudConnected && (
          <Card>
            <h3>Step 3: Connect SoundCloud (Optional)</h3>
            <SoundCloudConnect
              identity={identity}
              onIdentityChange={onIdentityChange}
            />
          </Card>
        )}

        {walletConnected && !hasObservedEvents && (
          <Card>
            <h3>Step 4: Create Your First Action</h3>
            <p>Go to the <strong>Fan</strong> tab to like or follow on SoundCloud</p>
          </Card>
        )}

        {hasObservedEvents && !hasVerifiedEvents && (
          <Card>
            <h3>Step 5: Sign Your Events</h3>
            <p>Go to the <strong>Activity</strong> tab to sign pending events</p>
          </Card>
        )}

        {hasVerifiedEvents && !hasPaidEvents && (
          <Card>
            <h3>Step 6: Send Tips</h3>
            <p>Go to the <strong>Fan</strong> tab to request quotes and send tips</p>
          </Card>
        )}

        {hasPaidEvents && (
          <Card className="success-card">
            <h3>🎉 Flow Complete!</h3>
            <p>You've successfully bridged Web2 actions to Web3 payments</p>
            <p>Check the <strong>Activity</strong> tab to see all your events</p>
          </Card>
        )}
      </div>
    </div>
  );
}
