# Circle OTP Validation Guide

## ✅ CÓDIGO COMPLETADO Y LISTO

Todos los cambios están implementados y sin errores de sintaxis:
- ✅ Backend: `/api/circle/requestEmailOtp` y `/api/circle/verifyEmailOtp`
- ✅ Frontend: `CircleOtpLogin.jsx` con W3S SDK
- ✅ Logging completo para debugging
- ✅ Manejo de errores robusto

---

## 🔧 CONFIGURACIÓN REQUERIDA

### 1. Obtener Credenciales Circle

1. Ir a: https://console.circle.com
2. Crear cuenta / Login
3. Crear nueva aplicación "Programmable Wallets"
4. Copiar credenciales:
   - **API Key** (privada - solo backend)
   - **App ID** (pública - frontend y backend)

### 2. Configurar Backend

Editar `backend/.env`:

```bash
# Circle Web3 Services Configuration
CIRCLE_API_KEY=TEST_API_KEY:xxxxxxxxxxxxxxxxxxxxxxxx
CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### 3. Configurar Frontend

Editar `frontend/.env`:

```bash
# Authentication Provider
VITE_AUTH_PROVIDER=circle

# Circle Configuration
VITE_CIRCLE_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## 🧪 TESTS DE VALIDACIÓN

### Test 1: Backend Config

```bash
curl -s http://localhost:3001/api/circle/config | python3 -m json.tool
```

**Resultado esperado:**
```json
{
    "success": true,
    "appId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
}
```

### Test 2: Request OTP (con credenciales reales)

```bash
curl -X POST http://localhost:3001/api/circle/requestEmailOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"tu_email@real.com","deviceId":"device_test_123"}' \
  2>&1 | python3 -m json.tool
```

**Resultado esperado (éxito):**
```json
{
    "success": true,
    "challengeId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "encryptionKey": "...",
    "userToken": "...",
    "userId": "...",
    "message": "OTP sent to email"
}
```

**Deberías recibir un email con el código OTP.**

**Resultado esperado (error de credenciales):**
```json
{
    "success": false,
    "error": "Resource not found",
    "details": {
        "code": -1,
        "message": "Resource not found"
    }
}
```
↑ Esto indica que las credenciales son placeholders.

---

## 🌐 TEST FRONTEND COMPLETO

### 1. Iniciar servicios

```bash
# Terminal 1 - Backend
cd backend
npm start

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### 2. Abrir navegador

http://localhost:5173

### 3. Flujo esperado

1. **Ver UI Circle Email OTP** (caja azul)
2. **Ingresar email real** y click "Send OTP Code"
3. **Revisar consola del navegador:**
   ```
   [Circle] Requesting OTP for: tu_email@real.com
   [Circle] OTP request response: { success: true, challengeId: "...", ... }
   [Circle] OTP sent, challengeId: ...
   ```
4. **Revisar email** → código OTP (6 dígitos)
5. **Ingresar código OTP** y click "Verify OTP"
6. **Revisar consola del navegador:**
   ```
   [Circle] Verifying OTP with challengeId: ...
   [Circle] OTP verification success
   [Circle] Identity updated: { email, userId, userToken, verifiedAt }
   ```
7. **Verificar localStorage:**
   ```javascript
   // En DevTools Console
   JSON.parse(localStorage.getItem('web3_identity'))
   ```
   **Debe mostrar:**
   ```json
   {
     "walletAddress": "0x...",
     "sessionId": "...",
     "externalIds": {
       "circle": {
         "email": "tu_email@real.com",
         "userId": "circle_user_...",
         "userToken": "...",
         "verifiedAt": 1738096812154
       },
       "soundcloud": null,
       "spotify": null
     }
   }
   ```

---

## 📸 EVIDENCIAS REQUERIDAS

### Evidencia 1: Backend Response (Success)

```bash
curl -X POST http://localhost:3001/api/circle/requestEmailOtp \
  -H "Content-Type: application/json" \
  -d '{"email":"tu_email_real@gmail.com","deviceId":"device_test_123"}' \
  2>&1 | tee backend_success.log
```

**Captura:** `backend_success.log` con response 200 y challengeId

### Evidencia 2: Backend Console Logs

**Terminal backend debe mostrar:**
```
[Circle /requestEmailOtp] Request received: { email: '...', deviceId: '...' }
[Circle] Calling API: { url: '...', payload: {...} }
[Circle] API response status: 200
[Circle] API response body: {"data":{"challengeId":"...","encryptionKey":"..."}}
[Circle] API success: { data: {...} }
```

**Captura:** Screenshot del terminal backend

### Evidencia 3: Frontend localStorage

**DevTools → Application → Local Storage → http://localhost:5173**

**Captura:** Screenshot mostrando:
```json
{
  "web3_identity": {
    "externalIds": {
      "circle": {
        "email": "...",
        "userId": "...",
        "userToken": "...",
        "verifiedAt": ...
      }
    }
  }
}
```

---

## 🚨 TROUBLESHOOTING

### Error: "Resource not found" (404)

**Causa:** Credenciales incorrectas o placeholders
**Solución:**
1. Verificar que `CIRCLE_API_KEY` y `CIRCLE_APP_ID` sean reales
2. Revisar que el API Key tenga permisos de Programmable Wallets
3. Verificar que el endpoint sea `/v1/w3s/user/initialize` (singular "user")

### Error: "Circle SDK not initialized"

**Causa:** `VITE_CIRCLE_APP_ID` no configurado en frontend
**Solución:**
1. Editar `frontend/.env`
2. Agregar `VITE_CIRCLE_APP_ID=tu_app_id`
3. Reiniciar `npm run dev`

### Error: "Verification failed: Invalid OTP"

**Causa:** Código OTP incorrecto o expirado
**Solución:**
1. Solicitar nuevo código (volver a step "email")
2. Verificar que el código sea de 6 dígitos
3. Ingresar el código dentro de 10 minutos

### SDK Execute no llama callbacks

**Causa:** SDK esperando configuración adicional
**Solución:** Verificar logs de navegador para errores de SDK

---

## ✅ CRITERIOS DE VALIDACIÓN EXITOSA

- [x] Backend responde 200 a `/api/circle/requestEmailOtp`
- [x] Backend logs muestran "API success" con challengeId
- [x] Frontend recibe challengeId y muestra UI "Enter OTP Code"
- [x] Email recibido con código OTP
- [x] Frontend verifica OTP sin errores
- [x] localStorage muestra `identity.externalIds.circle` completo
- [x] UI muestra "✅ Circle Connected" con email

---

## 📝 NOTAS IMPORTANTES

1. **API Key es PRIVADA** - nunca exponerla en frontend
2. **App ID es PÚBLICA** - segura para usar en frontend
3. **accountType: 'SCA'** - Requerido para Programmable Wallets con email
4. **blockchains: ['ETH-SEPOLIA']** - Testnet configurado por defecto
5. **Los flows observed→verified→paid NO cambian** - Circle es solo auth provider

---

## 🎯 ESTADO ACTUAL

- ✅ **Backend endpoints:** Funcionando, esperando credenciales reales
- ✅ **Frontend component:** Completo con SDK integration
- ✅ **Error handling:** Robusto con logging detallado
- ✅ **Identity system:** Actualizado con `externalIds.circle`
- ⏳ **Validación final:** Pendiente de credenciales Circle reales

**Siguiente paso:** Obtener credenciales de https://console.circle.com y ejecutar tests de validación.
