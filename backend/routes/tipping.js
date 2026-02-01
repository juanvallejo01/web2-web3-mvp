/**
 * Tipping Routes
 * Manage tipping configuration and quote/payment flow
 * 
 * ARCHITECTURE:
 * - Config stored per wallet (enabled, rules, limits)
 * - Quote engine determines if tip should be sent
 * - Payment recording for idempotency
 */

import express from 'express';
import { 
  saveTippingConfig, 
  getTippingConfig, 
  getEventById, 
  getEventsByWallet,
  recordPayment,
  isEventPaid,
  updateEvent 
} from '../storage.js';
import { isValidAddress } from '../utils/verify.js';

const router = express.Router();

// Default recipient for MVP (from env or hardcoded)
const DEFAULT_TIP_RECIPIENT = process.env.TIP_RECIPIENT_ADDRESS || '0x0000000000000000000000000000000000000000';

/**
 * GET /api/tipping/config
 * Get tipping configuration for a wallet
 * 
 * Query: ?walletAddress=0x...
 */
router.get('/config', (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing walletAddress parameter'
      });
    }

    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }

    const config = getTippingConfig(walletAddress);

    res.status(200).json({
      success: true,
      config: config || getDefaultConfig()
    });

  } catch (error) {
    console.error('[Tipping GET /config] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/tipping/config
 * Save tipping configuration
 * 
 * Body:
 * {
 *   walletAddress: string,
 *   config: {
 *     enabled: boolean,
 *     token: { address, symbol, decimals, chainId },
 *     rules: { LIKE: {enabled, amount}, FOLLOW: {enabled, amount} },
 *     limits: { dailyBudget, cooldownSec }
 *   }
 * }
 */
router.post('/config', (req, res) => {
  try {
    const { walletAddress, config } = req.body;

    if (!walletAddress || !config) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['walletAddress', 'config']
      });
    }

    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address'
      });
    }

    // Validate config structure
    if (typeof config.enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'config.enabled must be boolean'
      });
    }

    // Save config
    saveTippingConfig(walletAddress, config);

    res.status(200).json({
      success: true,
      message: 'Tipping configuration saved',
      config
    });

  } catch (error) {
    console.error('[Tipping POST /config] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/tipping/quote
 * Get tip quote for an event (pricing engine)
 * 
 * Body:
 * {
 *   eventId: number
 * }
 * 
 * Response:
 * {
 *   shouldTip: boolean,
 *   reason: string (if shouldTip=false),
 *   token: { address, symbol, decimals },
 *   amount: string,
 *   recipient: address,
 *   idempotencyKey: string
 * }
 */
router.post('/quote', (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'Missing eventId'
      });
    }

    // Get event
    const event = getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Event must be verified
    if (event.status !== 'verified') {
      return res.status(400).json({
        success: false,
        shouldTip: false,
        reason: `Event status is '${event.status}'. Must be 'verified' to tip.`
      });
    }

    // Check if already paid
    if (isEventPaid(eventId)) {
      return res.status(200).json({
        success: true,
        shouldTip: false,
        reason: 'Event already paid (idempotency)'
      });
    }

    // Get tipping config for wallet
    const config = getTippingConfig(event.walletAddress);
    if (!config || !config.enabled) {
      return res.status(200).json({
        success: true,
        shouldTip: false,
        reason: 'Tipping not enabled for this wallet'
      });
    }

    // Check action rule
    const actionRule = config.rules?.[event.action];
    if (!actionRule || !actionRule.enabled) {
      return res.status(200).json({
        success: true,
        shouldTip: false,
        reason: `Tipping not enabled for action: ${event.action}`
      });
    }

    // Check cooldown (simple: check recent events)
    const cooldownSec = config.limits?.cooldownSec || 0;
    if (cooldownSec > 0) {
      const recentEvents = getEventsByWallet(event.walletAddress);
      const recentPaid = recentEvents.filter(e => 
        e.status === 'paid' && 
        e.action === event.action &&
        (Date.now() - e.timestamp) < (cooldownSec * 1000)
      );
      
      if (recentPaid.length > 0) {
        return res.status(200).json({
          success: true,
          shouldTip: false,
          reason: `Cooldown active for ${event.action}. Wait ${cooldownSec}s between tips.`
        });
      }
    }

    // TODO: Check daily budget (requires tracking daily spent)
    // For MVP, we skip this check

    // All checks passed - create quote
    const quote = {
      shouldTip: true,
      token: config.token,
      amount: actionRule.amount.toString(),
      recipient: DEFAULT_TIP_RECIPIENT,
      idempotencyKey: `tip_${eventId}_${Date.now()}`
    };

    res.status(200).json({
      success: true,
      ...quote
    });

  } catch (error) {
    console.error('[Tipping POST /quote] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/tipping/recordPayment
 * Record a successful payment
 * 
 * Body:
 * {
 *   eventId: number,
 *   txHash: string,
 *   amount: string,
 *   token: { address, symbol, decimals }
 * }
 */
router.post('/recordPayment', (req, res) => {
  try {
    const { eventId, txHash, amount, token } = req.body;

    if (!eventId || !txHash || !amount || !token) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['eventId', 'txHash', 'amount', 'token']
      });
    }

    // Get event
    const event = getEventById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Check if already paid (idempotency)
    if (isEventPaid(eventId)) {
      return res.status(200).json({
        success: true,
        message: 'Payment already recorded (idempotent)',
        event
      });
    }

    // Record payment
    recordPayment(eventId, {
      txHash,
      amount,
      token,
      timestamp: Date.now()
    });

    // Update event status: verified → paid
    const updatedEvent = updateEvent(eventId, {
      status: 'paid',
      txHash,
      tipAmount: amount,
      tipToken: token,
      paidAt: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      message: 'Payment recorded successfully',
      event: updatedEvent
    });

  } catch (error) {
    console.error('[Tipping POST /recordPayment] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * Get default tipping config
 */
function getDefaultConfig() {
  return {
    enabled: false,
    token: {
      address: '0x0000000000000000000000000000000000000000', // Placeholder
      symbol: 'USDC',
      decimals: 6,
      chainId: 1
    },
    rules: {
      LIKE: {
        enabled: false,
        amount: '0.10'
      },
      FOLLOW: {
        enabled: false,
        amount: '0.50'
      }
    },
    limits: {
      dailyBudget: '10.00',
      cooldownSec: 60
    }
  };
}

export default router;
