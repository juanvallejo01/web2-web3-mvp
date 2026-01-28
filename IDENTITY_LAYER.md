# Wallet & Identity Layer Implementation

## 🎯 OVERVIEW

Added session-based identity management to frontend that enables future Web2 ↔ Web3 linking.

**Key Principle:** The wallet becomes the "root identity" that can link multiple Web2 accounts (Spotify, Farcaster, Twitter) into a unified cross-platform identity.

---

## 📁 NEW FILES

1. **`frontend/src/utils/session.js`** - Session management with localStorage
2. **`frontend/src/utils/identity.js`** - Identity object and actor creation

---

## 🔄 UPDATED FILES

1. **`frontend/src/components/WalletConnect.jsx`** - Session creation and restoration
2. **`frontend/src/utils/web3.js`** - Actor-based message construction
3. **`frontend/src/components/EventTrigger.jsx`** - Actor object in signing flow
4. **`frontend/src/App.jsx`** - Identity state management

---

## 🏗️ ARCHITECTURE

### **1. Session Object**

```javascript
{
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  sessionId: "a3f2c8d1-4b9e-4a7c-9d2f-3e8b1a6c5d4f",
  connectedAt: 1738096812154
}
```

**Stored in:** `localStorage` key `web3_wallet_session`

**Lifecycle:**
- Created when wallet connects
- Persisted across page reloads
- Invalidated if wallet address changes
- Cleared when wallet disconnects

---

### **2. Identity Object**

```javascript
{
  walletAddress: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  sessionId: "a3f2c8d1-4b9e-4a7c-9d2f-3e8b1a6c5d4f",
  connectedAt: 1738096812154,
  
  // Future: Link Web2 accounts here
  externalIds: {
    spotify: null,      // Will be: "spotify_user_abc123"
    farcaster: null,    // Will be: "fid_12345"
    twitter: null,      // Will be: "twitter_user_xyz"
    discord: null       // Will be: "discord_user_789"
  },
  
  metadata: {
    lastActive: 1738096812154
  }
}
```

**Stored in:** `localStorage` key `web3_identity`

**Purpose:** Normalized identity that can reference multiple platforms

---

### **3. Actor Object**

```javascript
{
  type: "wallet",
  address: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
  sessionId: "a3f2c8d1-4b9e-4a7c-9d2f-3e8b1a6c5d4f"
}
```

**Serialized as:** `"wallet:0x742d35...:a3f2c8d1-..."`

**Purpose:** Represents who is performing the action (currently wallet, future: unified identity)

---

## 🔐 SIGNING FLOW (WITH ACTOR)

### **Before (Old Flow):**
```javascript
// Actor was just wallet address string
actor: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
```

### **After (New Flow):**
```javascript
// 1. Create actor from identity
const actor = createActor(identity);
// → { type: 'wallet', address: '0x742d35...', sessionId: 'a3f2c8d1-...' }

// 2. Include in event data
const eventData = {
  platform: 'spotify',
  action: 'play',
  actor: actor,  // Object
  target: 'Song Name',
  timestamp: 1738096812154,
  walletAddress: '0x742d35...'
};

// 3. Serialize actor for message signing
const actorString = `${actor.type}:${actor.address}:${actor.sessionId}`;
// → "wallet:0x742d35...:a3f2c8d1-..."

// 4. Construct message (actor serialized)
const message = constructMessage(eventData);
// Message includes: "Actor: wallet:0x742d35...:a3f2c8d1-..."

// 5. Sign message
const signature = await signMessage(message, walletAddress);

// 6. Send to backend (actor as string for compatibility)
const payload = {
  ...eventData,
  actor: actorString,  // Serialized string
  signature
};
```

---

## 💾 LOCALSTORAGE PERSISTENCE

### **Keys Used:**

| Key | Value | Purpose |
|-----|-------|---------|
| `web3_wallet_session` | Session object | Persist session across reloads |
| `web3_identity` | Identity object | Persist identity and linked accounts |

### **Validation on Reload:**

1. Load session from localStorage
2. Check if current wallet matches session wallet
3. If mismatch → Create new session (wallet switched)
4. If match → Restore session and identity
5. Update `lastActive` timestamp

---

## 🔄 SESSION LIFECYCLE

```
┌─────────────────────────────────────────────────┐
│ User connects MetaMask                          │
└──────────────────┬──────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────┐
│ Check localStorage for existing session         │
└──────────────────┬──────────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │                   │
    MATCH?                 NO MATCH
         │                   │
         ▼                   ▼
   ┌──────────┐      ┌──────────────┐
   │ Restore  │      │ Create new   │
   │ session  │      │ session      │
   └──────────┘      └──────────────┘
         │                   │
         └─────────┬─────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ Create/restore   │
         │ identity         │
         └─────────┬────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ Save to          │
         │ localStorage     │
         └─────────┬────────┘
                   │
                   ▼
         ┌──────────────────┐
         │ UI shows session │
         │ info             │
         └──────────────────┘
```

---

## 🌐 FUTURE: WEB2 LINKING FLOW

**Conceptual flow (NOT YET IMPLEMENTED):**

```javascript
// 1. User connects wallet (current)
// → Session created, identity created

// 2. User clicks "Link Spotify" (future)
// → OAuth flow starts

// 3. User authorizes Spotify (future)
// → Spotify returns: { userId: "spotify_user_abc123" }

// 4. Backend links Spotify to wallet (future)
// → linkExternalIdentity('spotify', 'spotify_user_abc123')

// 5. Identity updated (future)
identity = {
  walletAddress: "0x742d35...",
  sessionId: "a3f2c8d1-...",
  externalIds: {
    spotify: "spotify_user_abc123",  // ✅ Now linked
    farcaster: null
  }
}

// 6. Future actions can include Spotify identity (future)
actor = {
  type: "wallet",
  address: "0x742d35...",
  sessionId: "a3f2c8d1-...",
  linkedAccounts: {
    spotify: "spotify_user_abc123"  // ✅ Proves "I am this Spotify user"
  }
}

// 7. Sign message proves: (future)
// "I own this wallet AND I am this Spotify user"
```

---

## 🎨 UI CHANGES

### **WalletConnect Component:**

**Added session info display:**
```
✅ Connected: 0x742d...f44e
Full address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e

Session ID: a3f2c8d1...
Connected: 4:02:15 PM
```

### **EventTrigger Component:**

**Added actor info:**
```
🔐 Acting as: wallet (a3f2c8d1...)
Future: Link Spotify/Farcaster to act as unified identity
```

---

## 🔧 TECHNICAL DETAILS

### **Session Management (`session.js`):**

**Key Functions:**
- `generateSessionId()` - Creates UUID-like session ID
- `createSession(walletAddress)` - Creates new session
- `saveSession(session)` - Persists to localStorage
- `loadSession()` - Loads from localStorage
- `clearSession()` - Removes from localStorage
- `validateSession(session, walletAddress)` - Checks if session is valid
- `getOrCreateSession(walletAddress)` - Gets existing or creates new

**Validation Logic:**
```javascript
// Session is valid if:
1. Session exists
2. Wallet address matches
3. Has sessionId and connectedAt fields

// Session is invalid if:
1. Wallet address changed
2. Missing required fields
3. Session doesn't exist
```

---

### **Identity Management (`identity.js`):**

**Key Functions:**
- `createIdentity(session)` - Creates identity from session
- `saveIdentity(identity)` - Persists to localStorage
- `loadIdentity()` - Loads from localStorage
- `clearIdentity()` - Removes from localStorage
- `linkExternalIdentity(platform, externalId)` - Links Web2 account
- `getOrCreateIdentity(session)` - Gets existing or creates new
- `createActor(identity)` - Creates actor object for signing

**Identity vs Session:**
- **Session** = Wallet connection state (technical)
- **Identity** = User's unified identity (conceptual)
- Identity references session but adds Web2 linking capability

---

## 🚀 WHY THIS MATTERS

### **Problem Without Identity Layer:**
```
Web2 Action: "User played Bohemian Rhapsody on Spotify"
Web3 Proof: Signature proves "I own wallet 0x123..."

❌ Missing link: How do we know wallet 0x123 is the same person who played the song?
```

### **Solution With Identity Layer:**
```
1. User connects wallet → Session created
2. User links Spotify → externalIds.spotify = "user_abc"
3. User plays song on Spotify
4. Frontend creates actor:
   {
     type: "wallet",
     address: "0x123...",
     sessionId: "session_xyz",
     linkedAccounts: {
       spotify: "user_abc"  ← Proves connection
     }
   }
5. Sign message with actor
6. Signature proves:
   ✅ I own wallet 0x123
   ✅ I am Spotify user user_abc
   ✅ I performed this action
```

---

## 📋 CURRENT STATE vs FUTURE STATE

### **Current Implementation (MVP):**
✅ Session management with localStorage  
✅ Identity object structure defined  
✅ Actor object in signing flow  
✅ Session restoration on reload  
✅ Session invalidation on wallet change  
✅ externalIds structure ready  

❌ No OAuth integration yet  
❌ No actual Web2 linking yet  
❌ externalIds all null  
❌ No backend support for linked accounts  

### **Future Implementation:**
🔜 Spotify OAuth flow  
🔜 Link Spotify account to wallet  
🔜 Farcaster verification  
🔜 Backend validates linked accounts  
🔜 Display linked accounts in UI  
🔜 Sign with composite identity  

---

## 🧪 TESTING THE IDENTITY LAYER

### **Test 1: New Wallet Connection**
1. Open http://localhost:5173
2. Connect MetaMask
3. **Verify:**
   - Session ID displayed
   - Connected timestamp shown
   - localStorage has `web3_wallet_session`
   - localStorage has `web3_identity`

### **Test 2: Page Reload**
1. Reload page (F5)
2. **Verify:**
   - Wallet still connected
   - Same session ID
   - Same connected timestamp
   - No MetaMask popup (session restored)

### **Test 3: Wallet Switch**
1. Switch wallet in MetaMask
2. **Verify:**
   - New session ID generated
   - New connected timestamp
   - Old session cleared
   - New identity created

### **Test 4: Event Signing**
1. Click any action button
2. Check MetaMask signature popup
3. **Verify message includes:**
   ```
   Actor: wallet:0x742d35...:a3f2c8d1-...
   ```
4. Sign and submit
5. **Verify:**
   - Backend accepts it
   - Event stored with actor string

### **Test 5: localStorage Inspection**
```javascript
// Open browser console
localStorage.getItem('web3_wallet_session')
// Should show: {"walletAddress":"0x...","sessionId":"...","connectedAt":...}

localStorage.getItem('web3_identity')
// Should show: {"walletAddress":"0x...","externalIds":{"spotify":null,...},...}
```

---

## 🎓 KEY CONCEPTS

### **1. Session = Technical State**
- Wallet connection status
- Temporary (can be cleared)
- Tracks when and which wallet connected

### **2. Identity = User Representation**
- Who the user is across platforms
- Persistent (until user clears)
- Links wallet to Web2 accounts

### **3. Actor = Action Performer**
- Who is performing this specific action
- Included in signed messages
- Currently just wallet, future: wallet + linked Web2

### **4. Why Serialize Actor?**
```javascript
// Actor object (frontend)
{ type: 'wallet', address: '0x123', sessionId: 'abc' }

// Serialized string (backend compatibility)
"wallet:0x123:abc"

// Why? Backend expects actor as string (for now)
// Future: Backend can accept object and parse it
```

---

## 🔒 SECURITY CONSIDERATIONS

### **What's Proven:**
✅ User owns the wallet (signature verification)  
✅ User authorized this specific action (message includes action data)  
✅ Action tied to a session (sessionId in actor)  

### **What's NOT Proven (yet):**
❌ User owns the Spotify account (no OAuth yet)  
❌ Spotify action actually happened (no Spotify API integration yet)  

### **Future Security Model:**
```
1. User links Spotify via OAuth → Backend stores: wallet ↔ spotifyId
2. User plays song on Spotify → Spotify webhook notifies backend
3. Backend finds wallet for spotifyId
4. Backend requests signature from wallet
5. User signs message proving they authorized it
6. Event stored with proof: signature + OAuth link + Spotify webhook
```

---

## 📊 DATA FLOW DIAGRAM

```
┌──────────────┐
│   MetaMask   │
│   Wallet     │
└──────┬───────┘
       │ Connect
       ▼
┌──────────────────────────┐
│  Session Management      │
│  - Create sessionId      │
│  - Save to localStorage  │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Identity Management     │
│  - Link to session       │
│  - Initialize externalIds│
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Actor Creation          │
│  - type: "wallet"        │
│  - address + sessionId   │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Message Construction    │
│  - Serialize actor       │
│  - Include in message    │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  MetaMask Signing        │
│  - User approves         │
└──────┬───────────────────┘
       │
       ▼
┌──────────────────────────┐
│  Backend Submission      │
│  - Send actor string     │
│  - Backend verifies sig  │
└──────────────────────────┘
```

---

## ✅ IMPLEMENTATION COMPLETE

**What was added:**
1. ✅ Session management with UUID generation
2. ✅ localStorage persistence
3. ✅ Session validation and restoration
4. ✅ Identity object with externalIds structure
5. ✅ Actor object creation
6. ✅ Actor-based message signing
7. ✅ UI displays session info
8. ✅ Wallet switch detection
9. ✅ Session cleanup on disconnect

**What was NOT changed:**
1. ✅ Backend code untouched
2. ✅ No OAuth integration
3. ✅ No Spotify API calls
4. ✅ No payments

**Ready for next step:**
- Spotify OAuth integration
- Link Spotify account to wallet
- Prove "I am this Spotify user AND I own this wallet"
