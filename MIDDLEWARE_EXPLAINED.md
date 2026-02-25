# Middleware Implementation Explained: EAIM E-Job Portal

## Overview

Your project uses **Express middleware** to protect API endpoints. The primary middleware is `authenticateToken`, which validates JWT tokens before allowing access to protected routes.

---

## 1. The Middleware Function

### Location
[server/controllers/authController.js](server/controllers/authController.js#L123-L130)

### The Code
```javascript
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ success: false, message: "Access token required" });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });

    req.user = user; // user = { user_id, email, role, jti, iat }
    next();
  });
};
```

### Middleware Parameters

| Parameter | Purpose |
|-----------|---------|
| `req` | Request object (contains headers, body, etc.) |
| `res` | Response object (for sending responses) |
| `next` | Callback function to pass control to next middleware/handler |

---

## 2. How It Works (Step-by-Step)

### Step 1: Extract Token from Authorization Header
```javascript
const authHeader = req.headers["authorization"];
const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>
```

**What's happening:**
- The client sends a request with header: `Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...`
- The middleware extracts the part after `"Bearer "` (the actual token)

**Example:**
```
Authorization Header: "Bearer eyJhbGciOiJIUzI1NiIsInR..."
                             ↓
After split:           token = "eyJhbGciOiJIUzI1NiIsInR..."
```

### Step 2: Check if Token Exists
```javascript
if (!token) return res.status(401).json({ success: false, message: "Access token required" });
```

**What happens:**
- If NO token is provided → Return **401 Unauthorized**
- Example error: "Access token required"

**HTTP Status 401 Meaning:** Authentication required but not provided

### Step 3: Verify Token Signature & Expiry
```javascript
jwt.verify(token, secretKey, (err, user) => {
  if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });
  
  req.user = user;
  next();
});
```

**What's happening:**
- `jwt.verify()` checks if the token is valid by:
  1. **Verifying signature** - Is this token signed with our `secretKey`?
  2. **Checking expiry** - Is the token still valid (not older than 2 hours)?

**Two possible outcomes:**

| Outcome | Action |
|---------|--------|
| ✅ Token is valid | Decode the payload and attach to `req.user`, then call `next()` |
| ❌ Token is invalid/expired | Return **403 Forbidden** with error message |

**The decoded `user` object contains:**
```javascript
{
  user_id: 123,           // User's database ID
  email: "john@eaim.com",
  role: "Applicant",      // or "HR" or "Manager"
  iat: 1704700000,        // Issued at time
  jti: "abc123xyz"        // Unique token ID
}
```

### Step 4: Attach User to Request & Continue
```javascript
req.user = user;
next();
```

**What happens:**
- The decoded user object is attached to the request
- Now all handlers can access the user via `req.user`
- `next()` passes control to the next middleware/handler

---

## 3. How Middleware Is Used in Routes

### Location: [server/index.js](server/index.js#L28-L50)

### Examples

**Without Middleware (Public Endpoint):**
```javascript
app.post("/api/register", authApi.register);
app.post("/api/login", authApi.login);
```
- Anyone can call these endpoints
- No token required

**With Middleware (Protected Endpoint):**
```javascript
app.post("/api/change-password", authenticateToken, authApi.changePassword);
```

**Flow:**
```
Client Request
    ↓
authenticateToken middleware ← Validates token here
    ↓ (if valid)
authApi.changePassword handler ← Processes request
    ↓
Response sent to client
```

---

## 4. Real-World Example: How It Works

### Scenario: Applicant tries to change their password

**Client Code (Frontend):**
```typescript
// React/TypeScript
const token = localStorage.getItem("token");

const response = await fetch("/api/change-password", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`  // ← Send token here
  },
  body: JSON.stringify({
    oldPassword: "current123",
    newPassword: "newpassword123"
  })
});
```

**Server-Side Request Flow:**

**1. Request arrives with Authorization header:**
```
POST /api/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...
Content-Type: application/json

{
  "oldPassword": "current123",
  "newPassword": "newpassword123"
}
```

**2. authenticateToken middleware runs:**
```javascript
const authenticateToken = (req, res, next) => {
  // Step 1: Extract token
  const authHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR...";
  const token = "eyJhbGciOiJIUzI1NiIsInR...";  // ← Extracted
  
  // Step 2: Check if token exists
  if (!token) return res.status(401).json(...);  // Not executed (token exists)
  
  // Step 3: Verify token
  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json(...);  // Not executed (valid token)
    
    // Step 4: Attach to request and continue
    req.user = {
      user_id: 5,
      email: "applicant@eaim.com",
      role: "Applicant",
      iat: 1704700000,
      jti: "abc123xyz"
    };
    next();  // ← Proceed to changePassword handler
  });
};
```

**3. changePassword handler executes:**
```javascript
const changePassword = async (req, res) => {
  // req.user is now available!
  const user_id = req.user.user_id;  // 5
  const email = req.user.email;      // "applicant@eaim.com"
  
  // Get old and new passwords from request body
  const { oldPassword, newPassword } = req.body;
  
  // Verify old password matches
  const rows = await db.executeQuery(
    `SELECT password FROM tbl_users WHERE user_id = ?`,
    [user_id]
  );
  
  const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
  
  if (!isMatch) {
    return res.status(401).json({ 
      success: false, 
      message: "Current password is incorrect" 
    });
  }
  
  // Hash and update new password
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.executeQuery(
    `UPDATE tbl_users SET password = ? WHERE user_id = ?`,
    [hashed, user_id]
  );
  
  return res.json({ 
    success: true, 
    message: "Password changed successfully" 
  });
};
```

**4. Response sent back to client:**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

---

## 5. Security Flow: Attack Prevention

### Scenario 1: User Without Token (Attacker)

**Request:**
```
POST /api/change-password
Content-Type: application/json

{
  "oldPassword": "current123",
  "newPassword": "newpassword123"
}
```

**Middleware Decision:**
```javascript
const authHeader = undefined;  // No Authorization header
const token = undefined && undefined.split(" ")[1];  // undefined

if (!token) {
  // ✅ This condition is true!
  return res.status(401).json({ 
    success: false, 
    message: "Access token required" 
  });
}
// Handler NEVER runs
```

**Response (401):**
```json
{
  "success": false,
  "message": "Access token required"
}
```

---

### Scenario 2: User With Invalid/Expired Token

**Request:**
```
POST /api/change-password
Authorization: Bearer invalid_token_xyz123
```

**Middleware Decision:**
```javascript
const token = "invalid_token_xyz123";

jwt.verify("invalid_token_xyz123", secretKey, (err, user) => {
  if (err) {  // ✅ Token is invalid/expired
    return res.status(403).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
  // Never reaches here
});
```

**Response (403):**
```json
{
  "success": false,
  "message": "Invalid or expired token"
}
```

---

### Scenario 3: Valid Token - Access Granted

**Request:**
```
POST /api/change-password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR...  (valid token)
```

**Middleware Decision:**
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR...";

jwt.verify(token, secretKey, (err, user) => {
  if (err) {  // ✅ No error (token is valid)
    // Skip this
  } else {
    req.user = {
      user_id: 5,
      email: "applicant@eaim.com",
      role: "Applicant",
      iat: 1704700000,
      jti: "abc123xyz"
    };
    next();  // ✅ Proceed to handler
  }
});
```

**Handler runs and processes the request.**

---

## 6. All Protected Endpoints Using This Middleware

From [server/index.js](server/index.js):

```javascript
// Password Management
app.post("/api/change-password", authenticateToken, authApi.changePassword);

// Job Management
app.post("/api/post-jobs", authenticateToken, accountApi.postJobs);
app.put("/api/jobs/:id", authenticateToken, accountApi.updateJob);
app.get("/api/jobs", authenticateToken, accountApi.getJobs);
app.get("/api/jobs/:id", authenticateToken, accountApi.getJobById);
app.delete("/api/jobs/:id", authenticateToken, accountApi.deleteJob);

// Bookmarks
app.post("/api/post-bookmarks", authenticateToken, accountApi.bookmarkJob);
app.get("/api/bookmarks", authenticateToken, accountApi.getBookmarks);
app.delete("/api/bookmarks", authenticateToken, accountApi.deleteBookmark);

// Personal Profile (Multiple sections)
app.post("/api/save-sg-address", authenticateToken, accountApi.saveSgAddress);
app.get("/api/get-sg-address", authenticateToken, accountApi.getSgAddress);
app.post("/api/save-personal-particulars", authenticateToken, accountApi.savePersonalParticulars);
app.get("/api/get-personal-particulars", authenticateToken, accountApi.getPersonalParticulars);
app.post("/api/save-overseas-address", authenticateToken, accountApi.saveOverseasAddress);
app.get("/api/get-overseas-address", authenticateToken, accountApi.getOverseasAddress);

// Education, Work, Family, Support sections...
// All follow the same pattern: authenticateToken middleware
```

**Pattern:** `app.METHOD("/api/route", authenticateToken, handler)`

---

## 7. JWT Token Structure

When a user logs in, a token is generated:

```javascript
const payload = {
  user_id: 5,
  email: "applicant@eaim.com",
  role: "Applicant",
  iat: 1704700000,
  jti: "abc123xyz"
};

const token = jwt.sign(payload, secretKey, { 
  algorithm: 'HS256',
  expiresIn: '2h' 
});
```

**The token structure (JWT format):**
```
eyJhbGciOiJIUzI1NiIsInR...  .  eyJ1c2VyX2lkIjo1LCJlbWFpbC...  .  N5ZtO5jZe8...
    [HEADER]                      [PAYLOAD]                        [SIGNATURE]
```

**Token decoded:**
```json
// HEADER
{
  "alg": "HS256",
  "typ": "JWT"
}

// PAYLOAD
{
  "user_id": 5,
  "email": "applicant@eaim.com",
  "role": "Applicant",
  "iat": 1704700000,
  "jti": "abc123xyz",
  "exp": 1704707200  // (iat + 2 hours)
}

// SIGNATURE
HMACSHA256(base64(header) + "." + base64(payload), secretKey)
```

**Expiry:** The token is valid for **2 hours** from `iat` (issued at time).

---

## 8. Key Middleware Characteristics

| Aspect | Detail |
|--------|--------|
| **Type** | Authentication middleware |
| **Signature** | `(req, res, next) => {}` |
| **Secret Key** | `crypto.randomBytes(32).toString("hex")` (32 bytes) |
| **Algorithm** | HS256 (HMAC SHA-256) |
| **Expiry** | 2 hours |
| **Token Location** | Authorization header (Bearer token) |
| **Failure Response** | 401 (if no token) or 403 (if invalid) |
| **Success Action** | Attach user to `req.user` and call `next()` |

---

## 9. Security Considerations

### ✅ What's Good About Your Implementation

1. **JWT Verification:** Ensures token wasn't tampered with
2. **Expiry Check:** Tokens automatically become invalid after 2 hours
3. **Bearer Token Pattern:** Standard practice for REST APIs
4. **Error Differentiation:** 401 vs 403 status codes (correct)
5. **Token in Header:** Safer than URL parameters or cookies

### ⚠️ Potential Improvements (Production)

1. **Token Refresh:**
   ```javascript
   // Current: Single 2-hour token
   // Better: Short-lived access token (15 min) + Refresh token (7 days)
   ```

2. **Token Blacklist/Revocation:**
   ```javascript
   // Current: Can't revoke token until it expires
   // Better: Keep blacklist in Redis, check it in middleware
   const isBlacklisted = await redis.get(`blacklist:${jti}`);
   if (isBlacklisted) return res.status(403).json(...);
   ```

3. **HTTPS Only:**
   ```javascript
   // Current: Works over HTTP too (development)
   // Better: Force HTTPS in production
   ```

4. **Rate Limiting:**
   ```javascript
   // Add rate limiting per IP/user to prevent brute force
   ```

---

## 10. How Role-Based Access Works (Advanced)

The middleware extracts the `role` from the token, but doesn't enforce it. Role checks happen in handlers:

```javascript
const getApplicants = async (req, res) => {
  const role = req.user.role;  // "Applicant", "HR", or "Manager"
  
  // ⭐ ROLE CHECK (in handler, not middleware)
  if (role !== "HR") {
    return res.status(403).json({ 
      success: false, 
      message: "Only HR can view applicants" 
    });
  }
  
  // Fetch and return applicants
  const applicants = await db.executeQuery(
    `SELECT * FROM tbl_applications`
  );
  return res.json({ data: applicants });
};
```

**Why not in middleware?**
- Middleware is generic (protects routes from unauthenticated users)
- Role checks are specific to each handler (what's allowed for each role)

---

## Summary

Your `authenticateToken` middleware:
1. ✅ **Extracts** the JWT token from the Authorization header
2. ✅ **Validates** the token signature and expiry using `jwt.verify()`
3. ✅ **Attaches** the decoded user object to `req.user`
4. ✅ **Allows** the handler to proceed by calling `next()`
5. ✅ **Rejects** unauthorized requests with 401 or 403 status codes

This is a clean, standard Express middleware pattern that protects 50+ endpoints across your API.
