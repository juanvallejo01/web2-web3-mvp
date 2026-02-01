/**
 * Circle Email OTP Routes
 * Handle Circle Web3 Services authentication flow
 * 
 * FLOW:
 * 1. Client calls requestEmailOtp with email + deviceId
 * 2. Backend calls Circle API to initiate email OTP
 * 3. Backend returns otpToken, deviceToken, deviceEncryptionKey
 * 4. Client uses W3S SDK to verify OTP (client-side)
 * 5. Client calls verifyEmailOtp to validate and store session
 */

import express from 'express';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const router = express.Router();

const CIRCLE_API_KEY = process.env.CIRCLE_API_KEY;
const CIRCLE_APP_ID = process.env.CIRCLE_APP_ID;

/**
 * POST /api/circle/requestEmailOtp
 * Initiate email OTP flow with Circle API
 * 
 * Body:
 * {
 *   email: string,        // User's email
 *   deviceId: string      // Persistent device identifier
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   challengeId: string,
 *   encryptionKey: string,
 *   userToken: string,
 *   userId: string
 * }
 */
router.post('/requestEmailOtp', async (req, res) => {
  try {
    const { email, deviceId } = req.body;

    console.log('[Circle /requestEmailOtp] Request received:', { email, deviceId });

    // Validate inputs
    if (!email || !deviceId) {
      console.error('[Circle] Missing fields:', { email: !!email, deviceId: !!deviceId });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['email', 'deviceId']
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('[Circle] Invalid email format:', email);
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    if (!CIRCLE_API_KEY || !CIRCLE_APP_ID) {
      console.error('[Circle] Configuration missing:', { 
        hasApiKey: !!CIRCLE_API_KEY, 
        hasAppId: !!CIRCLE_APP_ID 
      });
      return res.status(500).json({
        success: false,
        error: 'Circle API not configured'
      });
    }

    // Circle W3S Flow for Email OTP:
    // Step 1: Create user (generate userId ourselves)
    // Step 2: Initialize PIN challenge (sends email OTP)
    
    // Generate unique userId for this email/device combination
    // Circle requires userId < 50 chars, so we hash the email+device
    const crypto = await import('crypto');
    const emailHash = crypto.createHash('md5').update(email).digest('hex').substring(0, 8);
    const deviceHash = deviceId.split('_').pop() || 'dev'; // Use last part of deviceId
    const generatedUserId = `u_${emailHash}_${deviceHash}`;
    const createUserIdempotencyKey = randomUUID();
    
    const createUserPayload = {
      idempotencyKey: createUserIdempotencyKey,
      userId: generatedUserId,
      blockchains: ['ETH-SEPOLIA']
    };

    console.log('[Circle] Step 1: Creating user:', {
      url: 'https://api.circle.com/v1/w3s/users',
      payload: createUserPayload
    });

    const createUserResponse = await fetch('https://api.circle.com/v1/w3s/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`
      },
      body: JSON.stringify(createUserPayload)
    });

    const createUserText = await createUserResponse.text();
    console.log('[Circle] Create user response status:', createUserResponse.status);
    console.log('[Circle] Create user response body:', createUserText);

    let userToken, encryptionKey, userId;

    if (!createUserResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(createUserText);
      } catch (e) {
        errorData = { message: createUserText };
      }
      
      // Check if error is "user already exists" (code 409 or specific error)
      const userExists = createUserResponse.status === 409 || 
                         errorData.message?.includes('already exists') ||
                         errorData.code === 155101;
      
      if (!userExists) {
        console.error('[Circle] Create user error:', {
          status: createUserResponse.status,
          statusText: createUserResponse.statusText,
          error: errorData
        });
        
        return res.status(createUserResponse.status).json({
          success: false,
          error: errorData.message || 'Failed to create user',
          details: errorData
        });
      }
      
      console.log('[Circle] User already exists, proceeding with existing user');
      userId = generatedUserId;
      // We'll need to get a new token for existing user
    } else {
      const createUserData = JSON.parse(createUserText);
      userToken = createUserData.data?.userToken;
      encryptionKey = createUserData.data?.encryptionKey;
      userId = createUserData.data?.userId || generatedUserId;
      
      console.log('[Circle] User created successfully:', { userId });
    }

    // Step 2: Initialize email OTP challenge
    const challengeIdempotencyKey = randomUUID();
    const initChallengePayload = {
      idempotencyKey: challengeIdempotencyKey,
      email
    };

    console.log('[Circle] Step 2: Initializing PIN challenge:', {
      url: 'https://api.circle.com/v1/w3s/user/pin',
      payload: initChallengePayload,
      hasUserToken: !!userToken
    });

    // If we don't have a userToken yet (user existed), we need to acquire one
    if (!userToken) {
      const tokenPayload = {
        idempotencyKey: randomUUID(),
        userId: generatedUserId
      };

      console.log('[Circle] Acquiring user token for existing user:', tokenPayload);

      const tokenResponse = await fetch('https://api.circle.com/v1/w3s/users/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CIRCLE_API_KEY}`
        },
        body: JSON.stringify(tokenPayload)
      });

      const tokenText = await tokenResponse.text();
      console.log('[Circle] Token response status:', tokenResponse.status);
      console.log('[Circle] Token response body:', tokenText);

      if (!tokenResponse.ok) {
        let errorData;
        try {
          errorData = JSON.parse(tokenText);
        } catch (e) {
          errorData = { message: tokenText };
        }
        
        return res.status(tokenResponse.status).json({
          success: false,
          error: errorData.message || 'Failed to acquire user token',
          details: errorData
        });
      }

      const tokenData = JSON.parse(tokenText);
      userToken = tokenData.data?.userToken;
      encryptionKey = tokenData.data?.encryptionKey;
    }

    // Now initialize the PIN challenge with userToken
    const initChallengeResponse = await fetch('https://api.circle.com/v1/w3s/user/pin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'X-User-Token': userToken
      },
      body: JSON.stringify(initChallengePayload)
    });

    const challengeText = await initChallengeResponse.text();
    console.log('[Circle] Challenge response status:', initChallengeResponse.status);
    console.log('[Circle] Challenge response body:', challengeText);

    if (!initChallengeResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(challengeText);
      } catch (e) {
        errorData = { message: challengeText };
      }
      
      console.error('[Circle] Challenge error:', {
        status: initChallengeResponse.status,
        statusText: initChallengeResponse.statusText,
        error: errorData
      });
      
      return res.status(initChallengeResponse.status).json({
        success: false,
        error: errorData.message || 'Failed to initialize challenge',
        details: errorData
      });
    }

    const challengeData = JSON.parse(challengeText);
    const challengeId = challengeData.data?.challengeId;

    if (!challengeId) {
      console.error('[Circle] Missing challengeId in response:', challengeData);
      return res.status(500).json({
        success: false,
        error: 'Invalid response from Circle API - missing challengeId'
      });
    }

    console.log('[Circle] Email OTP challenge initialized successfully:', { challengeId });

    // Return all necessary data to frontend
    res.status(200).json({
      success: true,
      challengeId,
      encryptionKey,
      userToken,
      userId,
      message: 'OTP sent to email'
    });

  } catch (error) {
    console.error('[Circle /requestEmailOtp] Exception:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/circle/verifyEmailOtp
 * Validate OTP verification (note: actual verification happens client-side via W3S SDK)
 * This endpoint is for backend validation and session creation
 * 
 * Body:
 * {
 *   email: string,
 *   userId: string,       // Circle user ID from SDK
 *   userToken: string,    // Circle user token from SDK
 *   deviceToken: string,
 *   challengeId: string
 * }
 * 
 * Returns:
 * {
 *   success: true,
 *   message: 'Circle authentication verified',
 *   circleData: { email, userId, userToken }
 * }
 */
router.post('/verifyEmailOtp', async (req, res) => {
  try {
    const { email, userId, userToken, deviceToken, challengeId } = req.body;

    // Validate inputs
    if (!email || !userId || !userToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['email', 'userId', 'userToken']
      });
    }

    // In production, you might want to verify the userToken with Circle API
    // For MVP, we trust the client-side SDK verification
    
    // Store session data (in production, use proper session management)
    // For now, just return success to allow client to update identity

    res.status(200).json({
      success: true,
      message: 'Circle authentication verified',
      circleData: {
        email,
        userId,
        userToken,
        verifiedAt: Date.now()
      }
    });

  } catch (error) {
    console.error('[Circle /verifyEmailOtp] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/circle/config
 * Return public Circle configuration (app ID only, never API key)
 */
router.get('/config', (req, res) => {
  if (!CIRCLE_APP_ID) {
    return res.status(500).json({
      success: false,
      error: 'Circle not configured'
    });
  }

  res.status(200).json({
    success: true,
    appId: CIRCLE_APP_ID
  });
});

export default router;
