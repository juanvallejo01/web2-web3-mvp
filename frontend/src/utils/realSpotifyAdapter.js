/**
 * Real Spotify OAuth Adapter
 * INACTIVE: Spotify has paused new OAuth integrations
 * 
 * This file preserves the original OAuth implementation for future use.
 * When Spotify reactivates OAuth, set VITE_SPOTIFY_MODE=real to enable.
 */

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
const REDIRECT_URI = `${window.location.origin}/callback`;
const SCOPES = 'user-read-email user-read-private';

let accessToken = null;
let csrfState = null;

/**
 * Generate random state for CSRF protection
 */
function generateState() {
  return Math.random().toString(36).substring(2, 15);
}

/**
 * Initiate Spotify OAuth implicit grant flow
 */
export function initiateSpotifyAuth() {
  if (!SPOTIFY_CLIENT_ID) {
    throw new Error('Spotify Client ID not configured in environment');
  }

  csrfState = generateState();
  sessionStorage.setItem('spotify_auth_state', csrfState);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'token');
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('state', csrfState);

  window.location.href = authUrl.toString();
}

/**
 * Handle OAuth callback and extract access token
 */
export function handleSpotifyCallback() {
  const hash = window.location.hash.substring(1);
  const params = new URLSearchParams(hash);
  
  const token = params.get('access_token');
  const state = params.get('state');
  const error = params.get('error');

  if (error) {
    console.error('[Spotify OAuth] Error:', error);
    return null;
  }

  if (!token) {
    return null;
  }

  const savedState = sessionStorage.getItem('spotify_auth_state');
  if (state !== savedState) {
    console.error('[Spotify OAuth] CSRF state mismatch');
    return null;
  }

  sessionStorage.removeItem('spotify_auth_state');
  accessToken = token;

  window.history.replaceState({}, document.title, window.location.pathname);

  return token;
}

/**
 * Fetch Spotify user profile
 */
export async function fetchSpotifyProfile() {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  const response = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status}`);
  }

  return response.json();
}
