/**
 * Tipping with Viem
 * ERC-20 transfers using MetaMask (user-sign mode)
 * 
 * IMPORTANT: Uses custom(window.ethereum) - NO private keys in frontend
 */

import { createWalletClient, custom, parseUnits, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';

// ERC-20 ABI (transfer function only)
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  }
];

/**
 * Create wallet client from MetaMask
 */
const getWalletClient = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not found. Please install MetaMask.');
  }

  const client = createWalletClient({
    chain: sepolia,
    transport: custom(window.ethereum)
  });

  return client;
};

/**
 * Get user's address from MetaMask
 */
const getAddress = async (client) => {
  const [address] = await client.getAddresses();
  return address;
};

/**
 * Check ERC-20 balance
 * @param {string} tokenAddress - ERC-20 contract address
 * @param {string} userAddress - User's wallet address
 * @param {number} decimals - Token decimals
 * @returns {Promise<string>} - Balance in human-readable format
 */
export const checkBalance = async (tokenAddress, userAddress, decimals) => {
  try {
    const client = await getWalletClient();
    
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    });

    return formatUnits(balance, decimals);
  } catch (error) {
    console.error('[tipViem] Balance check failed:', error);
    throw new Error(`Failed to check balance: ${error.message}`);
  }
};

/**
 * Transfer ERC-20 tokens
 * @param {string} tokenAddress - ERC-20 contract address
 * @param {string} recipient - Recipient address
 * @param {string} amount - Amount in human-readable format (e.g., "0.10")
 * @param {number} decimals - Token decimals (e.g., 6 for USDC)
 * @returns {Promise<string>} - Transaction hash
 */
export const transferERC20 = async (tokenAddress, recipient, amount, decimals) => {
  try {
    console.log('[tipViem] Initiating transfer:', {
      tokenAddress,
      recipient,
      amount,
      decimals
    });

    // Create wallet client
    const client = await getWalletClient();
    const userAddress = await getAddress(client);

    // Convert amount to wei
    const amountWei = parseUnits(amount, decimals);

    console.log('[tipViem] Amount in wei:', amountWei.toString());

    // Check balance first
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress]
    });

    if (balance < amountWei) {
      throw new Error(`Insufficient balance. You have ${formatUnits(balance, decimals)} but need ${amount}`);
    }

    // Execute transfer
    console.log('[tipViem] Requesting user signature...');
    
    const txHash = await client.writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipient, amountWei],
      account: userAddress
    });

    console.log('[tipViem] Transaction sent:', txHash);
    
    return txHash;

  } catch (error) {
    console.error('[tipViem] Transfer failed:', error);
    
    // Handle specific errors
    if (error.message.includes('User rejected')) {
      throw new Error('Transaction cancelled by user');
    } else if (error.message.includes('insufficient funds')) {
      throw new Error('Insufficient ETH for gas fees');
    } else if (error.message.includes('Insufficient balance')) {
      throw error; // Already formatted
    } else {
      throw new Error(`Transfer failed: ${error.message}`);
    }
  }
};

/**
 * Wait for transaction confirmation
 * @param {string} txHash - Transaction hash
 * @returns {Promise<object>} - Transaction receipt
 */
export const waitForTransaction = async (txHash) => {
  try {
    const client = await getWalletClient();
    
    console.log('[tipViem] Waiting for transaction confirmation...');
    
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash
    });

    console.log('[tipViem] Transaction confirmed:', receipt);
    
    return receipt;
  } catch (error) {
    console.error('[tipViem] Wait for transaction failed:', error);
    throw new Error(`Failed to confirm transaction: ${error.message}`);
  }
};

/**
 * Full tip flow: transfer + wait for confirmation
 * @param {object} tipData - { tokenAddress, recipient, amount, decimals }
 * @returns {Promise<object>} - { txHash, receipt }
 */
export const executeTip = async ({ tokenAddress, recipient, amount, decimals }) => {
  const txHash = await transferERC20(tokenAddress, recipient, amount, decimals);
  const receipt = await waitForTransaction(txHash);
  
  return { txHash, receipt };
};
