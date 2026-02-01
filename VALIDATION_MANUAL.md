# Circle OTP Validation Manual - Quick Guide

**Status:** ✅ Backend running (3001) | ✅ Frontend running (5173)  
**Config:** ✅ VITE_AUTH_PROVIDER=circle  
**URLs:** 
- Frontend: http://localhost:5173
- Backend: http://localhost:3001

---

## FASE C - Circle OTP UI Test

### 1. Open Application
```
http://localhost:5173
```

### 2. Locate "Circle Email OTP Login" Component
Should be visible in the main UI.

### 3. Request OTP
- Enter your email
- Click "Request OTP" / "Send Code"
- **Expected:** Message "✅ OTP sent! Check your email."
- **Check:** Email inbox for 6-digit code from Circle

### 4. Verify OTP
- Enter 6-digit code
- Click "Verify"
- **Expected:** Message "✅ Circle authentication successful!"

### 5. Validate localStorage (DevTools Console)
```javascript
const identity = JSON.parse(localStorage.getItem('web3_identity'));
console.log('Circle Data:', identity?.externalIds?.circle);
```

**Expected Output:**
```javascript
{
  email: "your@email.com",
  userId: "user_your_email_com_device_xxx",
  userToken: "eyJhbGci...",
  verifiedAt: 1738435200000
}
```

**Result:** PASS / FAIL ___________

---

## FASE D - System Integrity Test (observed→verified→paid)

### 1. Connect MetaMask
- Click "Connect Wallet"
- Approve in MetaMask
- **Expected:** Wallet address displayed
- **Result:** PASS / FAIL ___________

### 2. Create SoundCloud Event (observed)
- Use SoundCloudActions component
- Click "Like" or "Follow"
- **Expected:** Event appears in EventList with status "observed"
- **Result:** PASS / FAIL ___________

### 3. Sign Event (verified)
- In EventList, click "Sign Event"
- Sign message in MetaMask
- **Expected:** Event status changes to "verified"
- **Result:** PASS / FAIL ___________

### 4. Request Quote
- Click "Request Quote"
- **Expected:** Quote displayed (amount, serviceFee, totalAmount)
- **Result:** PASS / FAIL ___________

### 5. Send Tip (paid)
- Click "Send Tip"
- Approve transaction in MetaMask
- **Expected:** Event status changes to "paid"
- **Result:** PASS / FAIL ___________

---

## Quick Backend Test (Optional)

```bash
# Test OTP request
curl -X POST http://localhost:3001/api/circle/requestEmailOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","deviceId":"test_manual"}' \
  -s | python3 -m json.tool

# Expected: success: true, challengeId, userToken, encryptionKey
```

---

## Troubleshooting

### Circle OTP not appearing in email
- Check spam/junk folder
- Verify CIRCLE_API_KEY in backend/.env is valid
- Check backend logs: `tail -f /tmp/backend.log`

### "Circle SDK not initialized"
- Check browser console for errors
- Verify VITE_CIRCLE_APP_ID matches backend APP_ID
- Hard refresh: Cmd+Shift+R

### MetaMask not connecting
- Ensure MetaMask is installed
- Check network: Should be Sepolia (Chain ID 11155111)
- Try disconnecting and reconnecting

### Events not appearing
- Check browser console for errors
- Verify backend is running: `curl http://localhost:3001/health`
- Check backend logs: `tail -f /tmp/backend.log`

---

## Final Checklist

- [ ] Circle OTP request successful
- [ ] Email received with code
- [ ] OTP verification successful
- [ ] localStorage contains circle data
- [ ] MetaMask connects successfully
- [ ] SoundCloud event creates (observed)
- [ ] Event signs successfully (verified)
- [ ] Quote generates successfully
- [ ] Tip sends successfully (paid)

**Overall Result:** PASS / FAIL ___________

**Notes:**
