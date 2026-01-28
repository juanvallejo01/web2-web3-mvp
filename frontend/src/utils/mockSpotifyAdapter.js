/**
 * Mock Spotify Adapter
 * Simulates Spotify OAuth for demo purposes (no network calls)
 * 
 * CONTEXT: Spotify has globally paused new OAuth integrations.
 * This adapter maintains the identity-linking contract without real OAuth.
 */

/**
 * Simulates Spotify login with deterministic mock data
 * @returns {Promise<Object>} Mock Spotify profile
 */
export async function mockSpotifyLogin() {
  // Simulate network delay for realism
  await new Promise(resolve => setTimeout(resolve, 500));

  // Return deterministic Spotify-like profile
  return {
    id: "spotify_mock_123",
    display_name: "Mock Spotify User",
    email: "mock@spotify.test",
    product: "premium",
    images: [{ url: "" }]
  };
}

/**
 * No-op for mock mode - no real OAuth to initiate
 */
export function initiateSpotifyAuth() {
  console.warn('[Mock Spotify] initiateSpotifyAuth called but not needed in mock mode');
}

/**
 * No-op for mock mode - no real callback to handle
 */
export function handleSpotifyCallback() {
  console.warn('[Mock Spotify] handleSpotifyCallback called but not needed in mock mode');
  return null;
}

/**
 * Returns the mock profile directly (no token needed)
 * @returns {Promise<Object>} Mock Spotify profile
 */
export async function fetchSpotifyProfile() {
  return mockSpotifyLogin();
}
