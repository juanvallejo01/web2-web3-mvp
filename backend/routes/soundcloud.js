/**
 * SoundCloud Routes
 * Handles SoundCloud actions (like, follow) and creates "observed" events
 * 
 * PURPOSE: Create events from real/mock SoundCloud actions
 * STATUS: "observed" (not yet cryptographically verified)
 * 
 * FLOW:
 * 1. User performs action on SoundCloud (like/follow)
 * 2. Backend creates event with status="observed"
 * 3. Frontend displays event with "Confirm & Sign" button
 * 4. User signs → event becomes status="verified"
 */

import express from 'express';
import { addEvent } from '../storage.js';
import { isValidAddress } from '../utils/verify.js';

const router = express.Router();

/**
 * POST /api/soundcloud/like
 * Record a "like" action from SoundCloud
 * 
 * Body:
 * {
 *   targetId: string,        // Track ID that was liked
 *   walletAddress: string,   // User's wallet
 *   soundcloudUserId: string // Optional: SoundCloud user ID from identity
 * }
 */
router.post('/like', async (req, res) => {
  try {
    const { targetId, walletAddress, soundcloudUserId } = req.body;

    // Validate required fields
    if (!targetId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['targetId', 'walletAddress']
      });
    }

    // Validate wallet address
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // Create actor string
    const actorParts = ['wallet', walletAddress];
    if (soundcloudUserId) {
      actorParts.push(`soundcloud:${soundcloudUserId}`);
    }
    const actor = actorParts.join(':');

    // Create observed event
    const event = {
      platform: 'soundcloud',
      action: 'LIKE',
      actor: actor,
      target: `track:${targetId}`,
      timestamp: Date.now(),
      walletAddress,
      status: 'observed',  // NOT YET VERIFIED
      verified: false,
      providerReceipt: `sc_like_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`, // Unique ID
      metadata: {
        soundcloudUserId: soundcloudUserId || null
      }
    };

    const savedEvent = addEvent(event);

    res.status(201).json({
      success: true,
      message: 'SoundCloud LIKE action recorded (observed status)',
      event: savedEvent
    });

  } catch (error) {
    console.error('[SoundCloud /like] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/soundcloud/follow
 * Record a "follow" action from SoundCloud
 * 
 * Body:
 * {
 *   targetId: string,        // User/Artist ID that was followed
 *   walletAddress: string,   // User's wallet
 *   soundcloudUserId: string // Optional: SoundCloud user ID from identity
 * }
 */
router.post('/follow', async (req, res) => {
  try {
    const { targetId, walletAddress, soundcloudUserId } = req.body;

    // Validate required fields
    if (!targetId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['targetId', 'walletAddress']
      });
    }

    // Validate wallet address
    if (!isValidAddress(walletAddress)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // Create actor string
    const actorParts = ['wallet', walletAddress];
    if (soundcloudUserId) {
      actorParts.push(`soundcloud:${soundcloudUserId}`);
    }
    const actor = actorParts.join(':');

    // Create observed event
    const event = {
      platform: 'soundcloud',
      action: 'FOLLOW',
      actor: actor,
      target: `user:${targetId}`,
      timestamp: Date.now(),
      walletAddress,
      status: 'observed',  // NOT YET VERIFIED
      verified: false,
      providerReceipt: `sc_follow_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      metadata: {
        soundcloudUserId: soundcloudUserId || null
      }
    };

    const savedEvent = addEvent(event);

    res.status(201).json({
      success: true,
      message: 'SoundCloud FOLLOW action recorded (observed status)',
      event: savedEvent
    });

  } catch (error) {
    console.error('[SoundCloud /follow] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
