/**
 * SoundCloud OAuth & API Integration
 * Supports both mock mode (development) and real OAuth mode
 * 
 * WHY: Link SoundCloud identity to wallet for unified Web2+Web3 identity
 * 
 * FLOW:
 * 1. Detect mode (mock vs real) from VITE_SOUNDCLOUD_MODE
 * 2. Mock: Direct login without OAuth redirect
 * 3. Real: OAuth implicit grant flow (client-side only)
 */

// Import adapters
import { mockSoundCloudLogin as mockLogin, isMockAdapter } from './mockSoundcloudAdapter.js';
import { 
  initiateSoundCloudOAuth, 
  handleSoundCloudCallback as handleRealCallback,
  fetchSoundCloudProfile as fetchRealProfile,
  isRealAdapter 
} from './realSoundcloudAdapter.js';

/**
 * Check if running in mock mode
 * @returns {boolean}
 */
export const isMockMode = () => {
  const mode = import.meta.env.VITE_SOUNDCLOUD_MODE || 'mock';
  return mode === 'mock';
};

/**
 * Initiate SoundCloud authentication
 * Routes to mock or real OAuth based on mode
 */
export const initiateSoundCloudAuth = () => {
  if (isMockMode()) {
    // Mock mode: handled directly in component
    console.log('[SoundCloud] Mock mode - no redirect needed');
    return;
  } else {
    // Real mode: redirect to SoundCloud OAuth
    initiateSoundCloudOAuth();
  }
};

/**
 * Handle OAuth callback (parse URL hash)
 * @returns {string|null} - Access token or null
 */
export const handleSoundCloudCallback = () => {
  if (isMockMode()) {
    return null; // No callback in mock mode
  }
  return handleRealCallback();
};

/**
 * Fetch SoundCloud user profile
 * @returns {Promise<object>} - User profile {id, username, avatar_url}
 */
export const fetchSoundCloudProfile = async () => {
  if (isMockMode()) {
    // Mock mode: not used (profile returned directly from mockSoundCloudLogin)
    throw new Error('fetchSoundCloudProfile should not be called in mock mode');
  }
  return fetchRealProfile();
};

/**
 * Mock login (development only)
 * @returns {Promise<object>} - Mock user profile
 */
export const mockSoundCloudLogin = async () => {
  if (!isMockMode()) {
    throw new Error('mockSoundCloudLogin can only be called in mock mode');
  }
  return mockLogin();
};

/**
 * Check if SoundCloud is currently connected
 * @returns {boolean}
 */
export const isSoundCloudConnected = () => {
  // Check if we have a token in memory (real mode) or mock state
  if (isMockMode()) {
    return isMockAdapter();
  }
  return isRealAdapter();
};
