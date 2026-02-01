# Circle Email OTP - Checklist de Validación End-to-End

**Fecha:** 2026-02-01  
**Estado:** ✅ Backend validado | 🔄 Frontend en prueba

---

## 1. Pre-requisitos

### Credenciales configuradas

- [x] `backend/.env` - CIRCLE_API_KEY configurado
- [x] `backend/.env` - CIRCLE_APP_ID configurado  
- [x] `frontend/.env` - VITE_AUTH_PROVIDER=circle
- [x] `frontend/.env` - VITE_CIRCLE_APP_ID configurado

### Servicios corriendo

```bash
# Backend en puerto 3001
cd /Users/juanv/web2-web3-mvp/backend
PORT=3001 node server.js &

# Frontend en puerto 5173
cd /Users/juanv/web2-web3-mvp/frontend
npm run dev &
```

**Verificación:**
```bash
# Health check backend
curl http://localhost:3001/health
# Esperado: {"status":"ok","timestamp":"...","service":"Event Hub Backend","version":"1.0.0"}

# Health check frontend
curl http://localhost:5173
# Esperado: HTML response
```

---

## 2. Validación Backend - Request OTP

### Test de solicitud de OTP

**Comando:**
```bash
curl -X POST http://localhost:3001/api/circle/requestEmailOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"juanvaldes1901@gmail.com","deviceId":"device_test_final"}' \
  -s | python3 -m json.tool
```

**Respuesta esperada:**
```json
{
    "success": true,
    "challengeId": "2575e97b-8a80-536d-9f42-65dc1024aff9",
    "encryptionKey": "tJlXmdNDwaTxZspaW6tKE9izSaCLRkH+pyxIz0VHdx8=",
    "userToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "user_juanvaldes1901_gmail_com_device_test_final",
    "message": "OTP sent to email"
}
```

**Validación:**
- [x] HTTP 200 OK
- [x] `success: true`
- [x] `challengeId` presente (formato UUID)
- [x] `encryptionKey` presente (base64)
- [x] `userToken` presente (JWT)
- [x] `userId` generado correctamente
- [ ] Email recibido con código OTP de 6 dígitos

---

## 3. Validación Backend - Verify OTP

**Comando:**
```bash
curl -X POST http://localhost:3001/api/circle/verifyEmailOtp \
  -H "Content-Type: application/json" \
  -d '{
    "email":"juanvaldes1901@gmail.com",
    "deviceId":"device_test_final",
    "otpCode":"123456",
    "challengeId":"<CHALLENGE_ID_DEL_PASO_ANTERIOR>",
    "userToken":"<USER_TOKEN_DEL_PASO_ANTERIOR>",
    "encryptionKey":"<ENCRYPTION_KEY_DEL_PASO_ANTERIOR>"
  }' \
  -s | python3 -m json.tool
```

**Respuesta esperada (éxito):**
```json
{
    "success": true,
    "verified": true,
    "userToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "encryptionKey": "tJlXmdNDwaTxZspaW6tKE9izSaCLRkH+pyxIz0VHdx8=",
    "refreshToken": "...",
    "message": "Email verified successfully"
}
```

**Validación:**
- [ ] HTTP 200 OK
- [ ] `success: true`
- [ ] `verified: true`
- [ ] `userToken` actualizado
- [ ] `refreshToken` presente

---

## 4. Validación Frontend - UI Flow

### Paso 1: Abrir aplicación
```bash
open http://localhost:5173
```

### Paso 2: Login con Circle OTP

**Acciones:**
1. Localizar componente `CircleOtpLogin`
2. Ingresar email: `juanvaldes1901@gmail.com`
3. Click en "Request OTP" / "Enviar código"
4. **Verificar:** Mensaje de confirmación "OTP sent to email"
5. **Verificar:** Input de código OTP visible

### Paso 3: Verificar OTP

**Acciones:**
1. Revisar email de Circle
2. Copiar código de 6 dígitos
3. Ingresar código en la UI
4. Click en "Verify" / "Verificar"
5. **Verificar:** Mensaje de éxito
6. **Verificar:** UI cambia a estado autenticado

### Paso 4: Validar localStorage

**DevTools Console:**
```javascript
// Verificar identity en localStorage
const identity = JSON.parse(localStorage.getItem('identity'));
console.log('Identity:', identity);

// Debe contener:
// {
//   "externalIds": {
//     "circle": "user_juanvaldes1901_gmail_com_device_xxx"
//   },
//   "userToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
//   "encryptionKey": "...",
//   "email": "juanvaldes1901@gmail.com"
// }
```

**Checklist localStorage:**
- [ ] `identity` existe en localStorage
- [ ] `identity.externalIds.circle` contiene userId
- [ ] `identity.userToken` presente
- [ ] `identity.encryptionKey` presente
- [ ] `identity.email` correcto

---

## 5. Test de Integración - Flujo Completo

### Objetivo: Validar que Circle OTP NO rompe observed → verified → paid

**Precondiciones:**
- [ ] MetaMask instalado y conectado
- [ ] Wallet con ETH en Sepolia testnet
- [ ] Circle OTP autenticado (paso 4 completado)

### Test Sequence

**1. Connect Wallet**
```javascript
// UI: Click en "Connect Wallet"
// Verificar: MetaMask popup → Approve
// Verificar: Wallet address displayed
```

**2. Crear evento SoundCloud (observed)**
```bash
# Backend debe recibir evento
curl -X POST http://localhost:3001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "platform": "soundcloud",
    "action": "like",
    "actor": "juanvaldes1901@gmail.com",
    "target": "track:123456789",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "walletAddress": "0xYourWalletAddress"
  }' | python3 -m json.tool
```

**Validación:**
- [ ] Evento creado con `status: "observed"`
- [ ] Evento visible en `EventList` component
- [ ] Botón "Sign Event" habilitado

**3. Firmar evento (verified)**
```javascript
// UI: Click en "Sign Event" en EventList
// MetaMask: Sign message
// Verificar: Event status → "verified"
```

**Validación:**
- [ ] MetaMask sign popup abierto
- [ ] Firma exitosa
- [ ] Backend actualiza evento a `verified`
- [ ] UI muestra "Verified" badge
- [ ] Botón "Request Quote" habilitado

**4. Request Quote**
```javascript
// UI: Click en "Request Quote"
// Verificar: Quote generado y mostrado
```

**Validación:**
- [ ] Quote generado con `amount`, `serviceFee`, `totalAmount`
- [ ] Quote visible en UI
- [ ] Botón "Send Tip" habilitado

**5. Send Tip (paid)**
```javascript
// UI: Click en "Send Tip"
// MetaMask: Approve transaction
// Verificar: Event status → "paid"
```

**Validación:**
- [ ] Transaction hash recibido
- [ ] Backend actualiza evento a `paid`
- [ ] UI muestra "Paid" badge
- [ ] EventList actualizado

---

## 6. Endpoints Summary

### GET /api/circle/config
**Descripción:** Retorna Circle APP_ID para frontend  
**Autenticación:** No requerida  
**Response:**
```json
{
  "success": true,
  "appId": "c0645a2b-c19e-4191-bc9f-5b9a9eb89ba3"
}
```

### POST /api/circle/requestEmailOtp
**Descripción:** Solicita código OTP por email  
**Autenticación:** No requerida  
**Body:**
```json
{
  "email": "user@example.com",
  "deviceId": "device_unique_id"
}
```
**Response (éxito):**
```json
{
  "success": true,
  "challengeId": "uuid-v4",
  "encryptionKey": "base64-encoded-key",
  "userToken": "jwt-token",
  "userId": "user_sanitized_email_deviceId",
  "message": "OTP sent to email"
}
```
**Response (error):**
```json
{
  "success": false,
  "error": "Error message from Circle API"
}
```

### POST /api/circle/verifyEmailOtp
**Descripción:** Verifica código OTP  
**Autenticación:** Requiere userToken del request anterior  
**Body:**
```json
{
  "email": "user@example.com",
  "deviceId": "device_unique_id",
  "otpCode": "123456",
  "challengeId": "uuid-from-request",
  "userToken": "jwt-from-request",
  "encryptionKey": "key-from-request"
}
```
**Response (éxito):**
```json
{
  "success": true,
  "verified": true,
  "userToken": "updated-jwt-token",
  "encryptionKey": "encryption-key",
  "refreshToken": "refresh-token",
  "message": "Email verified successfully"
}
```

---

## 7. Errores Comunes y Troubleshooting

### Error: 403 Forbidden - "userToken is invalid"
**Causa:** Intentando usar endpoint `/user/initialize` sin crear usuario primero  
**Solución:** Flow correcto es:
1. POST `/v1/w3s/users` - Crear usuario
2. Si 409 conflict: POST `/v1/w3s/users/token` - Obtener token
3. POST `/v1/w3s/user/pin` - Inicializar desafío OTP

### Error: 400 Bad Request - "userId field may not be empty"
**Causa:** Endpoint requiere userId en body  
**Solución:** Generar userId: `user_${email_sanitized}_${deviceId}`
```javascript
const userId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${deviceId}`;
```

### Error: 400 Bad Request - "idempotencyKey not in correct UUID format"
**Causa:** Circle API requiere UUIDs v4 para idempotencyKey  
**Solución:** Usar `randomUUID()` de crypto module:
```javascript
import { randomUUID } from 'crypto';
const idempotencyKey = randomUUID();
```

### Error: Backend no inicia (exit code 1)
**Diagnóstico:**
```bash
cd /Users/juanv/web2-web3-mvp/backend
node server.js 2>&1 | head -30
```
**Posibles causas:**
- Duplicate const declarations
- Missing imports
- Port 3001 already in use

### Error: Frontend - "await can only be used inside async function"
**Causa:** Función no marcada como `async`  
**Solución:** Verificar que todas las funciones con `await` tengan `async`:
```javascript
// ❌ Incorrecto
const handleClick = (event) => {
  const result = await someAsyncFunction();
}

// ✅ Correcto
const handleClick = async (event) => {
  const result = await someAsyncFunction();
}
```

### Error: OTP no llega por email
**Diagnóstico:**
1. Verificar email en spam/junk
2. Verificar CIRCLE_API_KEY válido
3. Verificar CIRCLE_APP_ID correcto
4. Check backend logs para errores de Circle API

**Circle API Response Codes:**
- `155105` - Invalid userToken
- `2` - Invalid API parameter
- `409` - User already exists (no es error, continuar con token fetch)

---

## 8. Cambios Realizados (Diff Summary)

### backend/.env
```diff
+ CIRCLE_API_KEY=TEST_API_KEY:0c446e29be9245e5b84531bb6518f8df:dd75a17a8cc6e3bff17b7aad98d96a80
+ CIRCLE_APP_ID=c0645a2b-c19e-4191-bc9f-5b9a9eb89ba3
```

### frontend/.env
```diff
+ VITE_AUTH_PROVIDER=circle
+ VITE_CIRCLE_APP_ID=c0645a2b-c19e-4191-bc9f-5b9a9eb89ba3
```

### backend/routes/circle.js
```diff
+ import { randomUUID } from 'crypto';

// User creation flow
+ const generatedUserId = `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}_${deviceId}`;
+ const createUserIdempotencyKey = randomUUID();
+ const createUserResponse = await fetch('https://api.circle.com/v1/w3s/users', {
+   method: 'POST',
+   headers: { 'Authorization': `Bearer ${CIRCLE_API_KEY}`, 'Content-Type': 'application/json' },
+   body: JSON.stringify({
+     userId: generatedUserId,
+     blockchains: ['ETH-SEPOLIA'],
+     idempotencyKey: createUserIdempotencyKey
+   })
+ });

// Handle existing user (409 conflict)
+ if (createUserResponse.status === 409) {
+   const tokenIdempotencyKey = randomUUID();
+   const tokenResponse = await fetch('https://api.circle.com/v1/w3s/users/token', {
+     method: 'POST',
+     headers: { 'Authorization': `Bearer ${CIRCLE_API_KEY}`, 'Content-Type': 'application/json' },
+     body: JSON.stringify({ userId: generatedUserId, idempotencyKey: tokenIdempotencyKey })
+   });
+   const tokenData = await tokenResponse.json();
+   userToken = tokenData.data.userToken;
+ }

// Initialize challenge with X-User-Token
+ const challengeIdempotencyKey = randomUUID();
+ const challengeResponse = await fetch('https://api.circle.com/v1/w3s/user/pin', {
+   method: 'POST',
+   headers: {
+     'Authorization': `Bearer ${CIRCLE_API_KEY}`,
+     'X-User-Token': userToken,
+     'Content-Type': 'application/json'
+   },
+   body: JSON.stringify({
+     email: email,
+     idempotencyKey: challengeIdempotencyKey
+   })
+ });
```

### frontend/src/components/EventList.jsx
```diff
// Fixed syntax error
- ifsetConfirmError('Please connect wallet first');
-   return;
- }
+ if (!walletAddress) {
+   setConfirmError('Please connect wallet first');
+   return;
+ }
```

---

## 9. Estado Final

### ✅ Completado
- Backend configurado con credenciales reales
- Frontend configurado para Circle mode
- Endpoint `/api/circle/requestEmailOtp` funcionando
- Circle API flow implementado (user creation → token → challenge)
- UUID idempotencyKey compliance
- Backend corriendo en puerto 3001
- Frontend corriendo en puerto 5173

### 🔄 Pendiente de Validación Manual
- Recepción de email OTP
- Verificación de código OTP vía UI
- localStorage validation (identity.externalIds.circle)
- Test de integración completo (observed → verified → paid)

### 📋 Próximos Pasos
1. Abrir http://localhost:5173
2. Usar Circle OTP Login con email real
3. Verificar código del email
4. Confirmar localStorage
5. Probar flujo completo con SoundCloud event

---

## 10. Comandos Rápidos

```bash
# Start backend
cd /Users/juanv/web2-web3-mvp/backend && PORT=3001 node server.js &

# Start frontend
cd /Users/juanv/web2-web3-mvp/frontend && npm run dev &

# Test OTP request
curl -X POST http://localhost:3001/api/circle/requestEmailOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"juanvaldes1901@gmail.com","deviceId":"test_'$(date +%s)'"}' \
  -s | python3 -m json.tool

# Kill all processes
pkill -f "node.*server.js"
pkill -f "vite.*frontend"

# Check running processes
lsof -i :3001  # Backend
lsof -i :5173  # Frontend

# View logs
tail -f /tmp/backend.log
```

---

**Última actualización:** 2026-02-01 17:23 PST  
**Validado por:** GitHub Copilot (Claude Sonnet 4.5)
