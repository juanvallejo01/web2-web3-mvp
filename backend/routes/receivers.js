/**
 * Receiver Claims Routes (Modelo B)
 * Allow creators to claim receiver addresses for their SoundCloud content
 */
import express from 'express';

const router = express.Router();

// In-memory storage for MVP (replace with DB in production)
const receiverClaims = new Map(); // soundcloudUserId -> receiverAddress

/**
 * POST /api/receivers/claim
 * Save or update a receiver claim for a SoundCloud user
 */
router.post('/claim', (req, res) => {
  try {
    const { soundcloudUserId, receiverAddress } = req.body;

    // Validate inputs
    if (!soundcloudUserId || !receiverAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['soundcloudUserId', 'receiverAddress']
      });
    }

    // Validate Ethereum address format
    if (!receiverAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Ethereum address format'
      });
    }

    // Save claim
    receiverClaims.set(soundcloudUserId, receiverAddress);

    console.log('[Receivers] Claim saved:', { soundcloudUserId, receiverAddress });

    res.status(200).json({
      success: true,
      message: 'Receiver claim saved successfully',
      claim: {
        soundcloudUserId,
        receiverAddress
      }
    });

  } catch (error) {
    console.error('[Receivers /claim] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/receivers/resolve?soundcloudUserId=...
 * Resolve receiver address for a SoundCloud user
 * Returns claimed address or null (caller should fallback to default)
 */
router.get('/resolve', (req, res) => {
  try {
    const { soundcloudUserId } = req.query;

    if (!soundcloudUserId) {
      return res.status(400).json({
        success: false,
        error: 'soundcloudUserId parameter required'
      });
    }

    const receiverAddress = receiverClaims.get(soundcloudUserId);

    if (receiverAddress) {
      console.log('[Receivers] Resolved claim:', { soundcloudUserId, receiverAddress });
      return res.status(200).json({
        success: true,
        receiverAddress,
        source: 'claim'
      });
    } else {
      console.log('[Receivers] No claim found for:', soundcloudUserId);
      return res.status(404).json({
        success: false,
        message: 'No claim found',
        receiverAddress: null,
        source: 'default'
      });
    }

  } catch (error) {
    console.error('[Receivers /resolve] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/receivers/list
 * List all claims (admin/debugging)
 */
router.get('/list', (req, res) => {
  try {
    const claims = Array.from(receiverClaims.entries()).map(([soundcloudUserId, receiverAddress]) => ({
      soundcloudUserId,
      receiverAddress
    }));

    res.status(200).json({
      success: true,
      claims,
      total: claims.length
    });

  } catch (error) {
    console.error('[Receivers /list] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
