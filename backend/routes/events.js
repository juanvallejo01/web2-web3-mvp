/**
 * Event routes handler
 * Receives Web2 events with Web3 signatures and stores them
 */

import express from 'express';
import { addEvent, getAllEvents, getEventCount } from '../storage.js';
import { verifySignature, isValidAddress, constructMessage } from '../utils/verify.js';

const router = express.Router();

/**
 * POST /events
 * Submit a new event with signature verification
 * 
 * Expected body:
 * {
 *   platform: string,      // e.g., "spotify", "youtube", "twitter"
 *   action: string,        // e.g., "play", "like", "comment", "follow"
 *   actor: string,         // user identifier (can be username, id, etc.)
 *   target: string,        // what was acted upon (song name, post id, etc.)
 *   timestamp: number,     // Unix timestamp
 *   walletAddress: string, // Ethereum address
 *   signature: string      // Signature from MetaMask
 * }
 * 
 * NOTE: Backend reconstructs the message - does NOT accept message from client
 */
router.post('/', async (req, res) => {
  try {
    const { platform, action, actor, target, timestamp, walletAddress, signature } = req.body;

    // Validate required fields
    if (!platform || !action || !actor || !target || !timestamp || !walletAddress || !signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['platform', 'action', 'actor', 'target', 'timestamp', 'walletAddress', 'signature']
      });
    }

    // Validate data types
    if (typeof timestamp !== 'number' || timestamp <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid timestamp - must be a positive number'
      });
    }

    if (typeof platform !== 'string' || typeof action !== 'string' || 
        typeof actor !== 'string' || typeof target !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid data types - platform, action, actor, and target must be strings'
      });
    }

    // Validate wallet address format
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // SECURITY: Reconstruct message on backend (never trust client message)
    const reconstructedMessage = constructMessage({
      platform,
      action,
      actor,
      target,
      timestamp,
      walletAddress
    });

    // Verify signature against reconstructed message
    const isValidSignature = verifySignature(reconstructedMessage, signature, walletAddress);
    
    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        error: 'Invalid signature - signature verification failed'
      });
    }

    // Store event (signature is valid)
    const event = {
      platform,
      action,
      actor,
      target,
      timestamp,
      walletAddress,
      verified: true
    };

    const savedEvent = addEvent(event);

    res.status(201).json({
      success: true,
      event: savedEvent,
      message: 'Event recorded successfully'
    });

  } catch (error) {
    console.error('Error processing event:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /events
 * Retrieve all stored events
 */
router.get('/', (req, res) => {
  try {
    const allEvents = getAllEvents();
    
    res.status(200).json({
      success: true,
      count: getEventCount(),
      events: allEvents
    });
  } catch (error) {
    console.error('Error retrieving events:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /events/stats
 * Get basic statistics
 */
router.get('/stats', (req, res) => {
  try {
    const allEvents = getAllEvents();
    const count = getEventCount();
    
    // Group by platform
    const byPlatform = allEvents.reduce((acc, event) => {
      acc[event.platform] = (acc[event.platform] || 0) + 1;
      return acc;
    }, {});

    // Group by action
    const byAction = allEvents.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      stats: {
        total: count,
        byPlatform,
        byAction
      }
    });
  } catch (error) {
    console.error('Error retrieving stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
