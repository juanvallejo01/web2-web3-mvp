/**
 * Spotify Adapter Facade
 * Selects between mock and real Spotify adapters based on environment
 * 
 * VITE_SPOTIFY_MODE=mock → Uses mockSpotifyAdapter (default)
 * VITE_SPOTIFY_MODE=real → Uses realSpotifyAdapter (requires Spotify app setup)
 */

import * as mockAdapter from './mockSpotifyAdapter.js';
import * as realAdapter from './realSpotifyAdapter.js';

const SPOTIFY_MODE = import.meta.env.VITE_SPOTIFY_MODE || 'mock';

// Select adapter based on environment
const adapter = SPOTIFY_MODE === 'real' ? realAdapter : mockAdapter;

console.log(`[Spotify] Mode: ${SPOTIFY_MODE}`);

/**
 * Check if running in mock mode
 */
export function isMockMode() {
  return SPOTIFY_MODE === 'mock';
}

/**
 * Initiate Spotify authentication (real OAuth or mock)
 */
export function initiateSpotifyAuth() {
  return adapter.initiateSpotifyAuth();
}

/**
 * Handle OAuth callback (real or mock)
 */
export function handleSpotifyCallback() {
  return adapter.handleSpotifyCallback();
}

/**
 * Fetch Spotify profile (real API or mock data)
 */
export async function fetchSpotifyProfile() {
  return adapter.fetchSpotifyProfile();
}

/**
 * Mock login - direct Spotify connection without OAuth redirect
 * Only available in mock mode
 */
export async function mockSpotifyLogin() {
  if (SPOTIFY_MODE !== 'mock') {
    throw new Error('mockSpotifyLogin only available in mock mode');
  }
  return mockAdapter.mockSpotifyLogin();
}
