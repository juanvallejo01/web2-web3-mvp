/**
 * Mock SoundCloud Adapter
 * For development without real SoundCloud OAuth
 * 
 * WHY: Avoid OAuth setup during development
 * Simulates SoundCloud login with fake data
 */

let mockConnected = false;
let mockProfile = null;

/**
 * Simulate SoundCloud login
 * @returns {Promise<object>} - Mock user profile
 */
export const mockSoundCloudLogin = async () => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Generate mock profile
  mockProfile = {
    id: `sc_user_${Date.now()}`,
    username: 'demo_soundcloud_user',
    avatar_url: 'https://via.placeholder.com/150',
    country: 'US',
    full_name: 'Demo SoundCloud User'
  };
  
  mockConnected = true;
  
  console.log('[Mock SoundCloud] Login successful:', mockProfile);
  
  return mockProfile;
};

/**
 * Simulate SoundCloud logout
 */
export const mockSoundCloudLogout = () => {
  mockConnected = false;
  mockProfile = null;
  console.log('[Mock SoundCloud] Logout successful');
};

/**
 * Get mock profile
 * @returns {object|null}
 */
export const getMockProfile = () => {
  return mockProfile;
};

/**
 * Check if mock adapter is connected
 * @returns {boolean}
 */
export const isMockAdapter = () => {
  return mockConnected;
};

/**
 * Mock API: Like a track
 * @param {string} trackId - Track ID to like
 * @returns {Promise<object>} - Mock response
 */
export const mockLikeTrack = async (trackId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log(`[Mock SoundCloud] Liked track: ${trackId}`);
  
  return {
    success: true,
    action: 'like',
    trackId,
    timestamp: Date.now()
  };
};

/**
 * Mock API: Follow an artist/user
 * @param {string} userId - User ID to follow
 * @returns {Promise<object>} - Mock response
 */
export const mockFollowUser = async (userId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log(`[Mock SoundCloud] Followed user: ${userId}`);
  
  return {
    success: true,
    action: 'follow',
    userId,
    timestamp: Date.now()
  };
};
