/**
 * Identity Management Utility
 * Manages normalized identity object that bridges wallet and Web2 identities
 * 
 * WHY: This enables linking Spotify/Farcaster/etc to a wallet session.
 * The identity becomes the "user" that can act on both Web2 and Web3 platforms.
 * 
 * FUTURE USE CASES:
 * - Link Spotify account to wallet (externalIds.spotify = "spotify_user_123")
 * - Link Farcaster to wallet (externalIds.farcaster = "fid_456")
 * - Prove "I am the same person" across Web2 and Web3
 */

const IDENTITY_STORAGE_KEY = 'web3_identity';

/**
 * Create identity object from session
 * @param {object} session - Wallet session
 * @returns {object} - Identity object
 */
export const createIdentity = (session) => {
  const identity = {
    walletAddress: session.walletAddress,
    sessionId: session.sessionId,
    connectedAt: session.connectedAt,
    // External identity mappings (future: OAuth linking)
    externalIds: {
      circle: null,       // Circle email OTP authentication (new)
      soundcloud: null,   // Will be set after SoundCloud OAuth/mock login
      spotify: null,      // Legacy - keeping for backward compatibility
      farcaster: null,    // Will be set after Farcaster linking
      twitter: null,      // Will be set after Twitter OAuth
      discord: null       // Will be set after Discord OAuth
    },
    // Metadata for future use
    metadata: {
      lastActive: Date.now()
    }
  };
  
  saveIdentity(identity);
  return identity;
};

/**
 * Save identity to localStorage
 * @param {object} identity - Identity object
 */
export const saveIdentity = (identity) => {
  try {
    localStorage.setItem(IDENTITY_STORAGE_KEY, JSON.stringify(identity));
  } catch (error) {
    console.error('Failed to save identity:', error);
  }
};

/**
 * Load identity from localStorage
 * @returns {object|null} - Identity object or null
 */
export const loadIdentity = () => {
  try {
    const stored = localStorage.getItem(IDENTITY_STORAGE_KEY);
    if (!stored) return null;
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to load identity:', error);
    return null;
  }
};

/**
 * Clear identity from localStorage
 */
export const clearIdentity = () => {
  try {
    localStorage.removeItem(IDENTITY_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear identity:', error);
  }
};

/**
 * Update identity with external ID
 * WHY: After OAuth flow completes, we link the Web2 identity to wallet
 * 
 * @param {string} platform - Platform name (spotify, farcaster, etc)
 * @param {string} externalId - External user ID from that platform
 * @returns {object|null} - Updated identity or null
 */
export const linkExternalIdentity = (platform, externalId) => {
  const identity = loadIdentity();
  if (!identity) return null;
  
  identity.externalIds[platform] = externalId;
  identity.metadata.lastActive = Date.now();
  
  saveIdentity(identity);
  return identity;
};

/**
 * Get or create identity for session
 * @param {object} session - Wallet session
 * @returns {object} - Identity object
 */
export const getOrCreateIdentity = (session) => {
  const existingIdentity = loadIdentity();
  
  // If identity exists and matches session, return it
  if (existingIdentity && 
      existingIdentity.sessionId === session.sessionId &&
      existingIdentity.walletAddress.toLowerCase() === session.walletAddress.toLowerCase()) {
    // Update last active
    existingIdentity.metadata.lastActive = Date.now();
    saveIdentity(existingIdentity);
    return existingIdentity;
  }
  
  // Create new identity (wallet changed or first time)
  return createIdentity(session);
};

/**
 * Create actor object for signing
 * WHY: The "actor" represents who is performing the Web2 action.
 * Now includes linked Web2 identities (Spotify, etc.)
 * 
 * @param {object} identity - Identity object
 * @returns {object} - Actor object for signing
 */
export const createActor = (identity) => {
  // Get all linked accounts (non-null externalIds)
  const linkedAccounts = Object.entries(identity.externalIds)
    .filter(([_, id]) => id !== null)
    .reduce((acc, [platform, id]) => ({ ...acc, [platform]: id }), {});

  return {
    type: 'wallet',
    address: identity.walletAddress,
    sessionId: identity.sessionId,
    // Include linked Web2 accounts if any
    ...(Object.keys(linkedAccounts).length > 0 && { linkedAccounts })
  };
};

/**
 * Link Circle authentication to identity
 * @param {object} identity - Current identity
 * @param {object} circleData - Circle user data { email, userId, userToken }
 * @returns {object} - Updated identity
 */
export const linkCircle = (identity, circleData) => {
  const updatedIdentity = {
    ...identity,
    externalIds: {
      ...identity.externalIds,
      circle: circleData
    },
    metadata: {
      ...identity.metadata,
      lastActive: Date.now()
    }
  };
  
  saveIdentity(updatedIdentity);
  return updatedIdentity;
};
