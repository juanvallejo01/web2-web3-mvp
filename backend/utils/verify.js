/**
 * Web3 signature verification utilities
 * Uses ethers.js v6 for Ethereum signature recovery
 */

import { ethers } from 'ethers';

/**
 * Verify that a message was signed by a specific wallet address
 * @param {string} message - The original message that was signed
 * @param {string} signature - The signature from MetaMask
 * @param {string} expectedAddress - The wallet address that should have signed
 * @returns {boolean} - True if signature is valid
 */
export const verifySignature = (message, signature, expectedAddress) => {
  try {
    // Recover the address that signed the message
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    // Compare addresses (case-insensitive)
    const isValid = recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error.message);
    return false;
  }
};

/**
 * Validate that a string is a valid Ethereum address
 * @param {string} address - The address to validate
 * @returns {boolean} - True if valid Ethereum address
 */
export const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

/**
 * Construct deterministic message for signing
 * This MUST match the frontend message construction exactly
 * 
 * @param {object} eventData - Event data fields
 * @param {string} eventData.platform - Platform name
 * @param {string} eventData.action - Action type
 * @param {string} eventData.actor - Actor identifier
 * @param {string} eventData.target - Target identifier
 * @param {number} eventData.timestamp - Unix timestamp
 * @param {string} eventData.walletAddress - Ethereum address
 * @returns {string} - Deterministic message string
 */
export const constructMessage = ({ platform, action, actor, target, timestamp, walletAddress }) => {
  return `Web2-Web3 Event Signature

Platform: ${platform}
Action: ${action}
Actor: ${actor}
Target: ${target}
Timestamp: ${timestamp}
Wallet: ${walletAddress}`;
};
