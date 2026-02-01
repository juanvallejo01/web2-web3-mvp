#!/bin/bash
# Circle OTP End-to-End Validation Test
# Run this after backend and frontend are running

set -e

BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:5173"
EMAIL="juanc.vallejo01@gmail.com"
DEVICE_ID="device_e2e_$(date +%s)"

echo "======================================"
echo "Circle OTP E2E Validation Test"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

test_step() {
  echo -e "${YELLOW}[TEST]${NC} $1"
}

test_pass() {
  echo -e "${GREEN}✅ PASS${NC} - $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

test_fail() {
  echo -e "${RED}❌ FAIL${NC} - $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

# ==========================================
# FASE A - Backend Health Checks
# ==========================================

echo "======================================"
echo "FASE A - Backend Health Checks"
echo "======================================"
echo ""

test_step "1. Backend health endpoint"
HEALTH_RESPONSE=$(curl -s $BACKEND_URL/health)
if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
  test_pass "Backend is healthy"
  echo "$HEALTH_RESPONSE" | python3 -m json.tool
else
  test_fail "Backend health check failed"
  echo "$HEALTH_RESPONSE"
  exit 1
fi
echo ""

test_step "2. Circle config endpoint"
CONFIG_RESPONSE=$(curl -s $BACKEND_URL/api/circle/config)
if echo "$CONFIG_RESPONSE" | grep -q '"success":true'; then
  test_pass "Circle config endpoint works"
  echo "$CONFIG_RESPONSE" | python3 -m json.tool
else
  test_fail "Circle config endpoint failed"
  echo "$CONFIG_RESPONSE"
  exit 1
fi
echo ""

# ==========================================
# FASE B - Request OTP
# ==========================================

echo "======================================"
echo "FASE B - Request OTP"
echo "======================================"
echo ""

test_step "3. Request Email OTP"
echo "Email: $EMAIL"
echo "Device ID: $DEVICE_ID"
echo ""

OTP_REQUEST_RESPONSE=$(curl -s -X POST $BACKEND_URL/api/circle/requestEmailOtp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"deviceId\":\"$DEVICE_ID\"}")

echo "$OTP_REQUEST_RESPONSE" | python3 -m json.tool

if echo "$OTP_REQUEST_RESPONSE" | grep -q '"success":true'; then
  test_pass "OTP request successful"
  
  # Extract data for verification step
  CHALLENGE_ID=$(echo "$OTP_REQUEST_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['challengeId'])")
  USER_TOKEN=$(echo "$OTP_REQUEST_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['userToken'])")
  ENCRYPTION_KEY=$(echo "$OTP_REQUEST_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['encryptionKey'])")
  USER_ID=$(echo "$OTP_REQUEST_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['userId'])")
  
  echo ""
  echo "Extracted data:"
  echo "- Challenge ID: $CHALLENGE_ID"
  echo "- User ID: $USER_ID"
  echo "- User Token: ${USER_TOKEN:0:50}..."
  echo "- Encryption Key: $ENCRYPTION_KEY"
else
  test_fail "OTP request failed"
  exit 1
fi
echo ""

# ==========================================
# FASE C - Manual Verification Step
# ==========================================

echo "======================================"
echo "FASE C - OTP Verification (MANUAL)"
echo "======================================"
echo ""

echo -e "${YELLOW}⚠️  MANUAL STEP REQUIRED${NC}"
echo ""
echo "1. Check your email ($EMAIL) for the OTP code"
echo "2. Open frontend at $FRONTEND_URL"
echo "3. Enter email and request OTP in the UI"
echo "4. Enter the OTP code from your email"
echo "5. Verify the OTP"
echo ""
echo "Then verify localStorage in DevTools Console:"
echo ""
echo "  const identity = JSON.parse(localStorage.getItem('web3_identity'));"
echo "  console.log('Circle Data:', identity.externalIds.circle);"
echo ""
echo "Expected output:"
echo "  {"
echo "    email: '$EMAIL',"
echo "    userId: '$USER_ID',"
echo "    userToken: '...',"
echo "    verifiedAt: <timestamp>"
echo "  }"
echo ""

read -p "Press ENTER after you've verified the OTP in the UI and checked localStorage..."

# ==========================================
# FASE D - System Integrity Check
# ==========================================

echo ""
echo "======================================"
echo "FASE D - System Integrity Check"
echo "======================================"
echo ""

test_step "4. Verify observed → verified → paid flow still works"
echo ""
echo -e "${YELLOW}⚠️  MANUAL VERIFICATION REQUIRED${NC}"
echo ""
echo "Please complete the following steps in the UI:"
echo ""
echo "1. Connect MetaMask wallet"
echo "   - Click 'Connect Wallet' button"
echo "   - Approve in MetaMask"
echo "   - Verify wallet address is displayed"
echo ""
echo "2. Create a SoundCloud event (observed)"
echo "   - Use SoundCloudActions component"
echo "   - Like or Follow action"
echo "   - Event should appear in EventList with 'observed' status"
echo ""
echo "3. Sign the event (verified)"
echo "   - Click 'Sign Event' button"
echo "   - Sign message in MetaMask"
echo "   - Event status should change to 'verified'"
echo ""
echo "4. Request quote"
echo "   - Click 'Request Quote' button"
echo "   - Quote should be generated and displayed"
echo ""
echo "5. Send tip (paid)"
echo "   - Click 'Send Tip' button"
echo "   - Confirm transaction in MetaMask"
echo "   - Event status should change to 'paid'"
echo ""

read -p "Press ENTER after you've completed the full flow test..."

# ==========================================
# Summary
# ==========================================

echo ""
echo "======================================"
echo "Test Summary"
echo "======================================"
echo ""
echo -e "Tests Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Tests Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ All automated tests passed!${NC}"
  echo ""
  echo "Manual verification checklist:"
  echo "  [ ] Circle OTP received by email"
  echo "  [ ] OTP verification successful in UI"
  echo "  [ ] localStorage contains identity.externalIds.circle"
  echo "  [ ] MetaMask connection works"
  echo "  [ ] SoundCloud event creation works (observed)"
  echo "  [ ] Event signing works (verified)"
  echo "  [ ] Quote generation works"
  echo "  [ ] Tip sending works (paid)"
  echo ""
  echo "If all manual steps passed, Circle OTP integration is ✅ VALIDATED!"
else
  echo -e "${RED}❌ Some automated tests failed. Please review the errors above.${NC}"
  exit 1
fi
