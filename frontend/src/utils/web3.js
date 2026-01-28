/**
 * Web3 utilities for MetaMask integration
 * Uses ethers.js v6
 */

import { BrowserProvider } from 'ethers';

const BACKEND_URL = 'http://localhost:3001';

/**
 * Check if MetaMask is installed
 */
export const isMetaMaskInstalled = () => {
  return typeof window.ethereum !== 'undefined';
};

/**
 * Connect to MetaMask wallet
 * @returns {Promise<string>} - Connected wallet address
 */
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    return accounts[0];
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw new Error('Failed to connect wallet: ' + error.message);
  }
};

/**
 * Get current connected wallet address (if any)
 * @returns {Promise<string|null>} - Wallet address or null
 */
export const getCurrentWallet = async () => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_accounts', []);
    return accounts[0] || null;
  } catch (error) {
    console.error('Error getting current wallet:', error);
    return null;
  }
};

/**
 * Construct deterministic message for signing with actor object
 * CRITICAL: Backend still expects old format, so we serialize actor as string
 * 
 * WHY ACTOR: The actor represents the identity performing the action.
 * Currently it's just wallet + session, but future: linked Web2 accounts.
 * 
 * @param {object} eventData - Event data
 * @param {string} eventData.platform - Platform name
 * @param {string} eventData.action - Action type
 * @param {object} eventData.actor - Actor object { type, address, sessionId }
 * @param {string} eventData.target - Target identifier
 * @param {number} eventData.timestamp - Unix timestamp
 * @param {string} eventData.walletAddress - Ethereum address
 * @returns {string} - Deterministic message string
 */
export const constructMessage = ({ platform, action, actor, target, timestamp, walletAddress }) => {
  // Serialize actor object to string for message
  // Format: "wallet:0x123...:session-abc..."
  const actorString = typeof actor === 'object' 
    ? `${actor.type}:${actor.address}:${actor.sessionId}`
    : actor; // Fallback for backward compatibility

  return `Web2-Web3 Event Signature

Platform: ${platform}
Action: ${action}
Actor: ${actorString}
Target: ${target}
Timestamp: ${timestamp}
Wallet: ${walletAddress}`;
};

/**
 * Sign a message with MetaMask
 * @param {string} message - Message to sign
 * @param {string} walletAddress - Wallet address
 * @returns {Promise<string>} - Signature
 */
export const signMessage = async (message, walletAddress) => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    const provider = new BrowserProvider(window.ethereum);
    const signer = await provider.getSigner(walletAddress);
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Signing error:', error);
    throw new Error('Failed to sign message: ' + error.message);
  }
};

/**
 * Submit signed event to backend
 * @param {object} eventData - Complete event data with signature
 * @returns {Promise<object>} - Backend response
 */
export const submitEvent = async (eventData) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit event');
    }

    return data;
  } catch (error) {
    console.error('Submit event error:', error);
    throw error;
  }
};

/**
 * Fetch all events from backend
 * @returns {Promise<array>} - Array of events
 */
export const fetchEvents = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/events`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch events');
    }

    return data.events || [];
  } catch (error) {
    console.error('Fetch events error:', error);
    throw error;
  }
};
