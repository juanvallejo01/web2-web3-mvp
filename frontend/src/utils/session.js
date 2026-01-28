/**
 * Session Management Utility
 * Handles wallet session state with localStorage persistence
 * 
 * WHY: Provides continuity between page reloads and enables linking
 * multiple identities (Spotify, Farcaster) to a single wallet session
 */

const SESSION_STORAGE_KEY = 'web3_wallet_session';

/**
 * Generate a unique session ID
 * Using timestamp + random for simplicity (production: use crypto.randomUUID())
 */
export const generateSessionId = () => {
  // Simple UUID v4-like generator for demo purposes
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Create a new wallet session
 * @param {string} walletAddress - Connected wallet address
 * @returns {object} - Session object
 */
export const createSession = (walletAddress) => {
  const session = {
    walletAddress,
    sessionId: generateSessionId(),
    connectedAt: Date.now()
  };
  
  saveSession(session);
  return session;
};

/**
 * Save session to localStorage
 * @param {object} session - Session object to persist
 */
export const saveSession = (session) => {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

/**
 * Load session from localStorage
 * @returns {object|null} - Session object or null
 */
export const loadSession = () => {
  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    return session;
  } catch (error) {
    console.error('Failed to load session:', error);
    return null;
  }
};

/**
 * Clear session from localStorage
 */
export const clearSession = () => {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};

/**
 * Validate session against current wallet address
 * WHY: If user switches wallets in MetaMask, we need to create a new session
 * 
 * @param {object|null} session - Session to validate
 * @param {string} currentWalletAddress - Current wallet address
 * @returns {boolean} - True if session is valid
 */
export const validateSession = (session, currentWalletAddress) => {
  if (!session || !currentWalletAddress) return false;
  
  // Session is invalid if wallet address doesn't match
  if (session.walletAddress.toLowerCase() !== currentWalletAddress.toLowerCase()) {
    return false;
  }
  
  // Session is invalid if it's missing required fields
  if (!session.sessionId || !session.connectedAt) {
    return false;
  }
  
  return true;
};

/**
 * Get or create session for wallet address
 * @param {string} walletAddress - Wallet address
 * @returns {object} - Valid session
 */
export const getOrCreateSession = (walletAddress) => {
  const existingSession = loadSession();
  
  if (validateSession(existingSession, walletAddress)) {
    return existingSession;
  }
  
  // Invalid or non-existent session - create new one
  return createSession(walletAddress);
};
