#!/bin/bash

# Circle OTP Validation Test Script
# Usage: ./test_circle.sh your_email@example.com

set -e

EMAIL="${1:-test@example.com}"
DEVICE_ID="device_test_$(date +%s)"
BACKEND_URL="http://localhost:3001"

echo "=================================================="
echo "Circle OTP Validation Test"
echo "=================================================="
echo "Email: $EMAIL"
echo "Device ID: $DEVICE_ID"
echo ""

# Check if backend is running
echo "🔍 Checking backend..."
if ! curl -s "$BACKEND_URL/health" > /dev/null; then
    echo "❌ Backend not running on $BACKEND_URL"
    echo "Start it with: cd backend && npm start"
    exit 1
fi
echo "✅ Backend is running"
echo ""

# Test 1: Get Circle config
echo "📋 Test 1: GET /api/circle/config"
echo "--------------------------------"
CONFIG_RESPONSE=$(curl -s "$BACKEND_URL/api/circle/config")
echo "$CONFIG_RESPONSE" | python3 -m json.tool
APP_ID=$(echo "$CONFIG_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('appId', ''))")

if [ "$APP_ID" == "your_circle_app_id_here" ]; then
    echo ""
    echo "⚠️  WARNING: Using placeholder App ID"
    echo "Configure real credentials in backend/.env:"
    echo "  CIRCLE_API_KEY=TEST_API_KEY:xxxxx"
    echo "  CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    echo ""
fi
echo ""

# Test 2: Request OTP
echo "📧 Test 2: POST /api/circle/requestEmailOtp"
echo "--------------------------------"
echo "Request payload:"
echo "{\"email\":\"$EMAIL\",\"deviceId\":\"$DEVICE_ID\"}"
echo ""
echo "Response:"

OTP_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/circle/requestEmailOtp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"deviceId\":\"$DEVICE_ID\"}")

echo "$OTP_RESPONSE" | python3 -m json.tool || echo "$OTP_RESPONSE"
echo ""

# Check if request was successful
SUCCESS=$(echo "$OTP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null || echo "false")

if [ "$SUCCESS" == "True" ]; then
    echo "✅ OTP request successful!"
    echo ""
    echo "CHALLENGE_ID=$(echo "$OTP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('challengeId', ''))")"
    echo "USER_ID=$(echo "$OTP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('userId', ''))")"
    echo ""
    echo "📬 Check your email for the OTP code"
    echo ""
    echo "Next steps:"
    echo "1. Open frontend: http://localhost:5173"
    echo "2. Enter email: $EMAIL"
    echo "3. Click 'Send OTP Code'"
    echo "4. Enter OTP from email"
    echo "5. Verify localStorage contains identity.externalIds.circle"
else
    echo "❌ OTP request failed"
    ERROR=$(echo "$OTP_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin).get('error', 'Unknown error'))" 2>/dev/null || echo "Unknown error")
    echo "Error: $ERROR"
    echo ""
    echo "Common issues:"
    echo "- Resource not found (404): Invalid API credentials"
    echo "- Unauthorized (401): Invalid API Key"
    echo "- Invalid email format: Use real email address"
fi

echo ""
echo "=================================================="
echo "Backend logs:"
echo "Check terminal running 'npm start' for detailed logs"
echo "=================================================="
