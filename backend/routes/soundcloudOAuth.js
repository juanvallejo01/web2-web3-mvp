/**
 * SoundCloud OAuth Routes (STUBS)
 * Real OAuth implementation pending - returns 501 Not Implemented
 * 
 * FUTURE: Will handle:
 * - POST /api/soundcloud/oauth/start - Redirect to SoundCloud authorization
 * - GET /api/soundcloud/oauth/callback - Handle OAuth callback and exchange code
 */

import express from 'express';

const router = express.Router();

/**
 * POST /api/soundcloud/oauth/start
 * Stub: Initiate SoundCloud OAuth flow
 * 
 * FUTURE: Redirect user to SoundCloud authorization URL
 * with client_id, redirect_uri, scope, and state params
 */
router.post('/start', (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Real SoundCloud OAuth not implemented',
    message: 'Use mock mode (VITE_SOUNDCLOUD_MODE=mock) for MVP testing'
  });
});

/**
 * GET /api/soundcloud/oauth/callback
 * Stub: Handle OAuth callback from SoundCloud
 * 
 * FUTURE: Exchange authorization code for access token,
 * store token, return session info to frontend
 */
router.get('/callback', (req, res) => {
  return res.status(501).json({
    success: false,
    error: 'Real SoundCloud OAuth not implemented',
    message: 'Use mock mode (VITE_SOUNDCLOUD_MODE=mock) for MVP testing'
  });
});

export default router;
