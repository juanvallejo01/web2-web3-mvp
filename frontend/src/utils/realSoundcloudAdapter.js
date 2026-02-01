/**
 * Real SoundCloud OAuth Adapter
 * Implements OAuth 2.0 implicit grant flow
 * 
 * WHY: For production use with real SoundCloud API
 * 
 * SECURITY:
 * - Uses implicit grant (client-side only, no backend secrets)
 * - State parameter for CSRF protection
 * - Token stored in memory only (not localStorage for security)
 * 
 * DOCS: https://developers.soundcloud.com/docs/api/guide#authentication
 */

// In-memory storage (cleared on page refresh - intentional for security)
let accessToken = null;
let tokenExpiry = null;
let userProfile = null;

const SOUNDCLOUD_AUTH_URL = 'https://soundcloud.com/connect';
const SOUNDCLOUD_API_BASE = 'https://api.soundcloud.com';
const STATE_STORAGE_KEY = 'sc_oauth_state';

/**
 * Generate random state for CSRF protection
 * @returns {string}
 */
const generateState = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

/**
 * Initiate SoundCloud OAuth flow
 */
export const initiateSoundCloudOAuth = () => {
  const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_SOUNDCLOUD_REDIRECT_URI;
  
  if (!clientId || !redirectUri) {
    throw new Error('Missing SoundCloud OAuth configuration. Check .env file.');
  }
  
  // Generate and store state
  const state = generateState();
  sessionStorage.setItem(STATE_STORAGE_KEY, state);
  
  // Build authorization URL
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'token',
    scope: 'non-expiring', // SoundCloud scope
    state: state
  });
  
  const authUrl = `${SOUNDCLOUD_AUTH_URL}?${params.toString()}`;
  
  console.log('[SoundCloud OAuth] Redirecting to:', authUrl);
  
  // Redirect to SoundCloud
  window.location.href = authUrl;
};

/**
 * Handle OAuth callback (parse URL hash)
 * Called when SoundCloud redirects back to app
 * 
 * @returns {string|null} - Access token or null
 */
export const handleSoundCloudCallback = () => {
  // Check if we're on the callback URL with hash params
  const hash = window.location.hash;
  
  if (!hash || !hash.includes('access_token')) {
    return null;
  }
  
  // Parse hash parameters
  const params = new URLSearchParams(hash.substring(1));
  const token = params.get('access_token');
  const state = params.get('state');
  const expiresIn = params.get('expires_in');
  
  // Verify state (CSRF protection)
  const storedState = sessionStorage.getItem(STATE_STORAGE_KEY);
  if (!storedState || state !== storedState) {
    console.error('[SoundCloud OAuth] State mismatch - possible CSRF attack');
    return null;
  }
  
  // Clean up state
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  
  // Store token in memory
  accessToken = token;
  if (expiresIn) {
    tokenExpiry = Date.now() + parseInt(expiresIn) * 1000;
  }
  
  console.log('[SoundCloud OAuth] Token received successfully');
  
  // Clean URL (remove hash)
  window.history.replaceState(null, '', window.location.pathname);
  
  return token;
};

/**
 * Fetch SoundCloud user profile
 * @returns {Promise<object>} - User profile
 */
export const fetchSoundCloudProfile = async () => {
  if (!accessToken) {
    throw new Error('No SoundCloud access token. Please authenticate first.');
  }
  
  // Check token expiry
  if (tokenExpiry && Date.now() > tokenExpiry) {
    throw new Error('SoundCloud token expired. Please re-authenticate.');
  }
  
  try {
    const response = await fetch(`${SOUNDCLOUD_API_BASE}/me`, {
      headers: {
        'Authorization': `OAuth ${accessToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`SoundCloud API error: ${response.statusText}`);
    }
    
    const profile = await response.json();
    userProfile = profile;
    
    console.log('[SoundCloud API] Profile fetched:', profile);
    
    return {
      id: profile.id.toString(),
      username: profile.username,
      avatar_url: profile.avatar_url,
      country: profile.country,
      full_name: profile.full_name || profile.username
    };
  } catch (error) {
    console.error('[SoundCloud API] Failed to fetch profile:', error);
    throw error;
  }
};

/**
 * Check if we have a valid token
 * @returns {boolean}
 */
export const isRealAdapter = () => {
  if (!accessToken) return false;
  if (tokenExpiry && Date.now() > tokenExpiry) return false;
  return true;
};

/**
 * Clear SoundCloud authentication
 */
export const clearSoundCloudAuth = () => {
  accessToken = null;
  tokenExpiry = null;
  userProfile = null;
  console.log('[SoundCloud OAuth] Authentication cleared');
};

/**
 * Get current profile (if cached)
 * @returns {object|null}
 */
export const getCachedProfile = () => {
  return userProfile;
};
