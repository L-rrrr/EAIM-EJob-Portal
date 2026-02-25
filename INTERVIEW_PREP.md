# EAIM E-Job Portal - Technical Interview Preparation

## 1. Introduction: Why This Internship & What You Want to Show

### Your 30-Second Elevator Pitch:

**For TikTok/ByteDance:**

> "I'm drawn to TikTok because of its **scale and real-time systems challenges**. I built the EAIM E-Job Portal end-to-end—from JWT-based auth to 60+ Express endpoints managing complex application workflows. What excites me is working on systems that impact millions, where every architectural decision matters. I'm particularly interested in your recommendation engine and how you balance personalization with data privacy at scale."

**For Google:**

> "I'm interested in Google's infrastructure and developer platform because of how you solve problems at scale. In my project, I encountered decisions about data consistency, performance, and security—the same areas Google excels at. I want to understand how to design systems like Gmail that serve billions while maintaining reliability and privacy."

### Motivation Signals They Want to See:

- ✅ **Ownership:** You built the entire system, not just one feature
- ✅ **Technical depth:** You understand architecture, not just coding
- ✅ **Scalability thinking:** You already thought about "what breaks first?"
- ✅ **Problem-solving:** You made trade-offs consciously, not randomly

---

## 2. Resume Ownership: Hardest Technical Decision

### The Question:

_"You independently developed the EAIM E-Job Portal end-to-end. What was the hardest technical decision you had to make, and what trade-offs did you consider?"_

### Your Answer (The Good One):

**Context:** "The hardest decision was designing the backend architecture to support **multiple user roles**—HR, Applicants, and Managers—while keeping the API **simple, maintainable, and secure**."

**The Problem:**

- **3 different user types** with completely different permissions:
  - **Applicants:** Can view jobs, apply, manage their profile (11 sections)
  - **HR:** Can post jobs, review all applications, schedule interviews, manage candidates
  - **Managers:** Can create job requisitions, assess candidates, approve/reject applications
- Each role needs different data access patterns, different UI, different workflows
- Security requirement: Users must NEVER see data they're not authorized to view
- Need to avoid code duplication across 60+ endpoints

**The Hard Decision:** "I chose to implement **Role-Based Access Control (RBAC) with JWT tokens** and role-specific route structures instead of a permission-based ACL system."

**Trade-offs Considered:**

| Approach                            | Pros                                                                                    | Cons                                                                                                    | Why I Chose/Rejected                                                  |
| ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **1. RBAC with JWT (What I chose)** | Simple to understand, role encoded in token, minimal DB lookups, easy to protect routes | Less granular than permissions, hard to change roles at runtime, JWT can't be revoked easily            | ✅ **CHOSE:** Best balance of security + simplicity for 3 fixed roles |
| **2. Permission-based ACL**         | Very flexible (add/remove permissions), granular control (read vs write), easy to audit | Complex to implement, requires permissions table + junction tables, slower (DB lookup on every request) | ❌ Overkill for 3 roles, adds complexity                              |
| **3. Session-based roles**          | Can revoke immediately, simpler than JWT, no crypto                                     | Requires session storage (Redis/DB), doesn't scale horizontally, sticky sessions needed                 | ❌ Doesn't scale well, adds infrastructure                            |
| **4. No roles (everyone same)**     | Simplest possible                                                                       | Security nightmare, anyone can do anything                                                              | ❌ Non-starter for job portal                                         |

---

### My Implementation Architecture:

**Part 1: Role Determination During Login**

```javascript
// server/controllers/authController.js

const login = async (req, res) => {
  const { emailOrUsername, password, code } = req.body;

  try {
    // DECISION POINT 1: How to differentiate user types?
    // Solution: Email format determines user type

    if (emailOrUsername.includes("@")) {
      // ============================================
      // APPLICANT LOGIN (tbl_users table)
      // ============================================
      const rows = await db.executeQuery(
        `SELECT * FROM tbl_users WHERE email = ?`,
        [emailOrUsername],
      );

      if (!rows.length) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, rows[0].password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid password",
        });
      }

      // ⭐ CREATE JWT WITH ROLE
      const payload = {
        user_id: rows[0].user_id,
        email: rows[0].email,
        role: "Applicant", // ← Role hardcoded based on table
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(), // Unique token ID
      };

      const token = jwt.sign(payload, secretKey, {
        algorithm: "HS256",
        expiresIn: "2h",
      });

      return res.status(200).json({
        success: true,
        token,
        role: "Applicant", // Frontend stores this
      });
    } else {
      // ============================================
      // HR/MANAGER LOGIN (vw_staff view)
      // ============================================
      const staffRows = await db.executeQuery(
        `SELECT * FROM vw_staff WHERE user_name = ?`,
        [emailOrUsername],
      );

      if (!staffRows.length) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      const staff = staffRows[0];

      // Check if staff is active
      if (staff.staff_status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "Account is not active.",
        });
      }

      // ⭐ DETERMINE ROLE FROM POSITION
      // This is where the complexity comes in
      let role = "";
      if (staff.position_name.includes("HR")) {
        role = "HR";
      } else if (staff.position_name.includes("Manager")) {
        role = "Manager";
      } else {
        // Fallback: if neither HR nor Manager in title
        return res.status(403).json({
          success: false,
          message: "Your position doesn't have system access.",
        });
      }

      const payload = {
        user_id: staff.user_id,
        email: staff.email,
        role: role, // ← "HR" or "Manager"
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID(),
      };

      const token = generateToken(payload);

      return res.status(200).json({
        success: true,
        token,
        role, // Frontend routes based on this
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};
```

**Why This Design Was Hard:**

1. **Data Model Complexity:** Applicants live in `tbl_users`, but HR/Managers live in `vw_staff` (different tables)
   - Can't use a single "users" table
   - Have to query different tables based on login method
   - Risk: What if email exists in BOTH tables?

2. **Role Assignment Logic:** How do you determine if someone is HR vs Manager?
   - I used `position_name.includes("HR")` - what if someone is "HR Manager"? (Both!)
   - Solution: Check HR first, then Manager (priority order)

3. **Security Trade-off:** Role is in the JWT token (client can decode it)
   - Pro: No DB lookup needed for every request
   - Con: If we change someone's role in DB, their token is still valid for 2 hours
   - Risk mitigation: Short expiry (2h), refresh token mechanism

---

**Part 2: Protecting API Endpoints**

```javascript
// server/index.js

// ============================================
// MIDDLEWARE: Verify token for ALL protected routes
// ============================================
const authenticateToken =
  require("./controllers/authController").authenticateToken;

// ============================================
// APPLICANT-ONLY ENDPOINTS
// ============================================
app.post(
  "/api/submit-application",
  authenticateToken,
  accountApi.submitApplication,
);
app.get("/api/applied-jobs", authenticateToken, accountApi.getAppliedJobs);
app.get(
  "/api/get-personal-particulars",
  authenticateToken,
  accountApi.getPersonalParticulars,
);
// ... 30+ more applicant endpoints

// ⚠️ PROBLEM: How do we prevent HR from calling /api/submit-application?
// Solution: Additional role check inside controller (if needed)

// ============================================
// HR-ONLY ENDPOINTS
// ============================================
app.post("/api/post-jobs", authenticateToken, accountApi.postJobs);
app.get("/api/applicants", authenticateToken, accountApi.getApplicants);
app.post(
  "/api/schedule-interview",
  authenticateToken,
  accountApi.scheduleInterview,
);
// ... 15+ more HR endpoints

// ⚠️ PROBLEM: How do we prevent Applicants from calling /api/applicants?
// Solution: Frontend route protection + backend validation

// ============================================
// MANAGER-ONLY ENDPOINTS
// ============================================
app.post(
  "/api/save-job-requisition",
  authenticateToken,
  accountApi.saveJobRequisition,
);
app.get(
  "/api/manager-review-applications",
  authenticateToken,
  accountApi.getManagerReviewApplications,
);
app.post("/api/save-assessment", authenticateToken, accountApi.saveAssessment);
// ... 10+ more manager endpoints

// ============================================
// SHARED ENDPOINTS (all roles)
// ============================================
app.post("/api/change-password", authenticateToken, authApi.changePassword);
app.get("/api/user-profile", authenticateToken, accountApi.getUserInfo);
```

**The Challenge: Endpoint Protection**

```javascript
// server/controllers/authController.js

// ⭐ MIDDLEWARE: Validates JWT and attaches user to request
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required",
    });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      // Token expired or invalid signature
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // ⭐ ATTACH USER TO REQUEST
    // Now all handlers can access: req.user.role, req.user.user_id
    req.user = user; // { user_id, email, role, jti, iat }
    next();
  });
};

// Example of role-specific logic in endpoint handler:
const getApplicants = async (req, res) => {
  try {
    const role = req.user.role;

    // ⭐ AUTHORIZATION CHECK
    if (role !== "HR") {
      return res.status(403).json({
        success: false,
        message: "Only HR can view applicants",
      });
    }

    // Proceed with HR-only logic
    const applicants = await db.executeQuery(
      `SELECT * FROM tbl_applications WHERE status = 'Submitted'`,
    );

    return res.status(200).json({
      success: true,
      data: applicants,
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      error: e.message,
    });
  }
};
```

---

**Part 3: Frontend Route Protection**

```typescript
// client/src/components/ProtectedRoute.tsx

// ⭐ EXTRACT ROLE FROM JWT (client-side)
const getUserRole = () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;

    // Decode JWT (base64 decode the payload)
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.role;  // "Applicant", "HR", or "Manager"
  } catch {
    return null;
  }
};

// ⭐ PROTECT ROUTES BY ROLE
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = "/login"
}) => {
  const role = getUserRole();

  // If no role OR role not in allowed list, redirect to login
  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectPath} replace />;
  }

  // Role is valid, render child routes
  return <Outlet />;
};

// ============================================
// USAGE IN APP.TSX
// ============================================

// APPLICANT ROUTES (only role="Applicant" can access)
<Route element={<ProtectedRoute allowedRoles={["Applicant"]} />}>
  <Route path="/" element={<MainLayout />}>
    <Route path="home" element={<Home />} />
    <Route path="available-jobs" element={<AvailableJobs />} />
    <Route path="apply" element={<Apply />} />
    <Route path="profile/personal-particulars" element={<PersonalParticulars />} />
    {/* ... 12 more applicant routes */}
  </Route>
</Route>

// HR ROUTES (only role="HR" can access)
<Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
  <Route path="/hr" element={<HRLayout />}>
    <Route path="dashboard" element={<Dashboard />} />
    <Route path="applicants" element={<Applicants />} />
    <Route path="post-job" element={<PostJob />} />
    <Route path="interview" element={<Interview />} />
    {/* ... 5 more HR routes */}
  </Route>
</Route>

// MANAGER ROUTES (only role="Manager" can access)
<Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
  <Route path="/manager" element={<ManagerLayout />}>
    <Route path="job-requisition" element={<JobRequisition />} />
    <Route path="assessment" element={<Assessment />} />
    {/* ... 3 more manager routes */}
  </Route>
</Route>
```

---

### Why This Was The Hardest Decision:

**1. Security Risk if Done Wrong:**

- If I forgot to add role check in ONE endpoint, HR could delete applicant data
- If frontend route protection fails, user sees pages they shouldn't access
- If JWT secret leaks, anyone can forge tokens with any role

**2. Balancing Simplicity vs. Flexibility:**

```javascript
// SIMPLE APPROACH (what I did):
if (role !== "HR") return 403;

// FLEXIBLE APPROACH (what I considered but rejected):
const hasPermission = await db.executeQuery(
  `SELECT * FROM user_permissions WHERE user_id = ? AND permission = 'view_applicants'`,
);
if (!hasPermission) return 403;

// Why I chose simple:
// - Only 3 roles, permissions won't change frequently
// - Adding DB lookup on every request = 2x latency
// - More code = more bugs
```

**3. Data Isolation:**

```javascript
// Challenge: Each role queries different data

// Applicant: Only THEIR data
app.get(
  "/api/get-personal-particulars",
  authenticateToken,
  async (req, res) => {
    const user_id = req.user.user_id; // ⭐ Filter by authenticated user

    const sql = `SELECT * FROM tbl_personal_particulars WHERE user_id = ?`;
    const particulars = await db.executeQuery(sql, [user_id]);

    // Applicant CANNOT see other applicants' data
    return res.json({ data: particulars[0] });
  },
);

// HR: ALL applicants' data
app.get("/api/applicants", authenticateToken, async (req, res) => {
  const role = req.user.role;

  if (role !== "HR") return res.status(403).json({ error: "Forbidden" });

  // HR sees EVERYONE
  const sql = `SELECT * FROM tbl_applications`;
  const applicants = await db.executeQuery(sql);

  return res.json({ data: applicants });
});

// Manager: Only ASSIGNED applicants
app.get(
  "/api/manager-review-applications",
  authenticateToken,
  async (req, res) => {
    const role = req.user.role;
    const manager_id = req.user.user_id;

    if (role !== "Manager") return res.status(403).json({ error: "Forbidden" });

    // Manager sees ONLY assigned applications
    const sql = `
    SELECT * FROM tbl_applications 
    WHERE assigned_manager_id = ?
  `;
    const applications = await db.executeQuery(sql, [manager_id]);

    return res.json({ data: applications });
  },
);
```

**4. Frontend Complexity:**
Different layouts, different navigation, different features:

```typescript
// 3 different layouts for 3 roles:
// - MainLayout (Applicant: sidebar with profile sections)
// - HRLayout (HR: navbar with applicants, jobs, interviews)
// - ManagerLayout (Manager: requisitions, assessments)

// Each role has different navigation menu
// Each role sees different data on same page
// Example: "Jobs" page shows different things:
//   - Applicant: Jobs they can apply to
//   - HR: Jobs they posted + applicants
//   - Manager: Jobs they requested + assigned candidates
```

---

### Trade-offs I Made (And Accepted):

✅ **Accepted: Role can't change without re-login**

- If HR promotes someone to Manager, they need to log out and back in
- Alternative (rejected): Check DB on every request (too slow)

✅ **Accepted: Frontend role check can be bypassed**

- User can modify localStorage to change role → They see wrong UI
- But: Backend STILL validates role, so no security breach
- Just bad UX if they try to access wrong pages

✅ **Accepted: 3 separate route structures**

- More code to maintain (MainLayout, HRLayout, ManagerLayout)
- Alternative (rejected): Single layout with conditional rendering (too messy)

✅ **Accepted: Manual role checks in controllers**

- Every HR endpoint needs `if (role !== "HR")` check
- Alternative (rejected): Middleware for each role (too many middlewares)

---

### What I'd Do Differently Now (At Scale):

**For a production system with 10M users:**

1. **Add permission-based ACL** (for granular control)

   ```javascript
   // Instead of hardcoded roles, use permissions:
   const permissions = await getPermissions(user_id);
   if (!permissions.includes("applicants:read")) return 403;
   ```

2. **Use refresh tokens** (for security)
   - Short-lived access token (15 min)
   - Long-lived refresh token (7 days)
   - Can revoke refresh tokens in DB

3. **Add rate limiting per role**

   ```javascript
   // HR can make 1000 requests/min
   // Applicants can make 100 requests/min
   ```

4. **Add audit logging**

   ```sql
   INSERT INTO audit_log (user_id, role, action, resource, timestamp)
   VALUES (?, ?, 'view_applicants', '/api/applicants', NOW());
   ```

5. **Implement API gateway** (centralized auth)
   - Instead of role checks in every controller
   - API gateway validates role before routing

---

### Why This Answer Shows Engineering Maturity:

✅ **I considered alternatives** (not just one approach)
✅ **I made conscious trade-offs** (security vs performance)
✅ **I shipped a working solution** (not over-engineered)
✅ **I know the limitations** (and how to improve)
✅ **I protected the system** (multiple layers of security)

**Bottom line:** This was hard because **security + simplicity + maintainability** are often in tension. I had to balance all three for a system with 60+ endpoints serving 3 different user types with completely different needs.

---

## 3. Backend Architecture: Authentication & Authorization (The Deep Dive)

### The Question:

_"You built 60+ Express endpoints with JWT and RBAC. Walk me through authentication and authorization from login to accessing a protected endpoint."_

### End-to-End Flow Diagram:

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT (Browser)                                                │
├─────────────────────────────────────────────────────────────────┤

1. USER LOGS IN
   ├─ POST /api/login { emailOrUsername, password, code }
   │  └─ Frontend sends email + 2FA code

2. SERVER VALIDATES (server/controllers/authController.js)
   ├─ Check user exists in tbl_users or vw_staff
   ├─ Verify bcrypt password hash matches
   ├─ Validate 2FA code expiry
   └─ Determine role (Applicant, HR, Manager)

3. JWT TOKEN GENERATION
   ├─ Payload = { user_id, email, role, jti (unique ID), iat (issued at) }
   ├─ Signed with HS256 (HMAC with secret key)
   ├─ Expiry = 2 hours
   └─ Return: { token, role, success: true }

4. CLIENT STORES TOKEN
   ├─ localStorage.setItem("token", token)
   └─ Token format: "eyJhbGc..." (base64.base64.signature)

5. PROTECTED ROUTE ACCESS
   ├─ User clicks "View Applications" (HR-only endpoint)
   └─ React: Check role from token
      if (role !== "HR") {
        navigate("/login")  // Prevent route access
      }

6. API REQUEST TO PROTECTED ENDPOINT
   ├─ GET /api/applicants (requires authenticateToken middleware)
   ├─ Headers: { Authorization: "Bearer eyJhbGc..." }
   └─ Frontend extracts token from localStorage

7. MIDDLEWARE VALIDATES TOKEN (authenticateToken function)
   ├─ Extract token from "Bearer {token}" header
   ├─ jwt.verify(token, secretKey)
   │  ├─ If expired: return 403 "Invalid or expired token"
   │  ├─ If signature invalid: return 403 "Invalid or expired token"
   │  └─ If valid: decode and attach user data to req.user
   └─ req.user = { user_id, email, role, jti, iat }

8. ENDPOINT HANDLER PROCESSES REQUEST
   ├─ Access req.user.user_id (authenticated)
   ├─ Access req.user.role (for RBAC check)
   └─ Query database with user_id filter

EXAMPLE CODE FLOW:

// 1. Login endpoint
const login = async (req, res) => {
  const { emailOrUsername, password, code } = req.body;

  // Check if applicant
  if (emailOrUsername.includes("@")) {
    const rows = await db.executeQuery(
      `SELECT * FROM tbl_users WHERE email = ?`,
      [emailOrUsername]
    );

    if (!rows.length) {
      return res.status(401).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // Create token
    const payload = {
      user_id: rows[0].user_id,
      email: rows[0].email,
      role: "Applicant",
      jti: crypto.randomUUID(),
      iat: Math.floor(Date.now() / 1000)
    };

    const token = jwt.sign(payload, secretKey, {
      algorithm: 'HS256',
      expiresIn: '2h'
    });

    return res.status(200).json({
      success: true,
      token,
      role: "Applicant"
    });
  } else {
    // HR/Manager login (vw_staff view)
    const staffRows = await db.executeQuery(
      `SELECT * FROM vw_staff WHERE user_name = ?`,
      [emailOrUsername]
    );

    let role = "";
    if (staffRows[0].position_name.includes("HR")) {
      role = "HR";
    } else if (staffRows[0].position_name.includes("Manager")) {
      role = "Manager";
    }

    const payload = { user_id: staffRows[0].user_id, role, ... };
    const token = generateToken(payload);

    return res.status(200).json({
      success: true,
      token,
      role
    });
  }
};

// 2. Middleware that protects endpoints
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access token required"
    });
  }

  jwt.verify(token, secretKey, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Invalid or expired token"
      });
    }

    req.user = user;  // Now { user_id, email, role, jti, iat }
    next();
  });
};

// 3. Protected endpoint (HR only)
app.get("/api/applicants", authenticateToken, accountApi.getApplicants);

const getApplicants = async (req, res) => {
  try {
    const user_id = req.user.user_id;  // Extracted from token
    const role = req.user.role;        // Extracted from token

    // RBAC check could be done here (if needed)
    if (role !== "HR") {
      return res.status(403).json({
        success: false,
        message: "Only HR can view applicants"
      });
    }

    // Query database
    const applicants = await db.executeQuery(
      `SELECT * FROM tbl_applications WHERE status = 'Submitted'`
    );

    return res.status(200).json({
      success: true,
      data: applicants
    });
  } catch (e) {
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// 4. Frontend route protection (ProtectedRoute.tsx)
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = "/login"
}) => {
  const role = getUserRole();  // Parse JWT from localStorage

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};

// Usage:
<Route element={<ProtectedRoute allowedRoles={["HR"]} />}>
  <Route path="/hr/dashboard" element={<Dashboard />} />
  <Route path="/hr/applicants" element={<Applicants />} />
</Route>
```

### Follow-up Answers:

**Q: Where do you store JWTs on the client?**

> **Answer:** "In `localStorage.setItem("token", token)`. This is actually a trade-off:
>
> **localStorage:**
>
> - Pro: Simple, persists across page refreshes
> - Con: Vulnerable to XSS attacks (malicious script can read localStorage)
>
> **httpOnly cookies:**
>
> - Pro: Not accessible to JavaScript, safer against XSS
> - Con: Requires backend to set Set-Cookie headers, more complex CSRF protection
>
> For an internship project, I chose localStorage for simplicity. In production, I'd move to httpOnly cookies and implement CSRF tokens."

**Q: How do you prevent privilege escalation?**

> **Answer:** "Privilege escalation prevention happens at three layers:
>
> 1. **Backend Token Validation:**
>    - User can't modify JWT (cryptographically signed)
>    - Even if user changes `role` in token, signature will fail verification
>    - `jwt.verify()` rejects tampered tokens
> 2. **RBAC Checks on Endpoints:**
>    ```javascript
>    if (req.user.role !== "HR") {
>      return res.status(403).json({ message: "Forbidden" });
>    }
>    ```
> 3. **Database-Level Authorization:**
>    - All queries filter by `user_id`
>    - Example: HR can only see `applications WHERE user_id IN (select applicants)`
>    - Even if endpoint is bypassed, database won't return unauthorized data
>
> **Attack I'd prevent:**
>
> - User modifies token in localStorage to `role: HR` → Fails because signature is invalid
> - User calls `/api/applicants` without token → Returns 401
> - User with expired token calls endpoint → Returns 403
> - Manager tries to modify another Manager's applications → Query filters prevent it"

---

## 4. Database Design: Key Relationships

### The Question:

_"Your MySQL schema has 15+ tables. Pick one table relationship and explain why you designed it that way, how you ensured consistency, and what would break if it was poorly designed."_

### Your Best Answer: Users ↔ Applications ↔ Jobs

```
┌──────────────┐
│  tbl_users   │ (Applicants)
│ user_id (PK) │
└───────┬──────┘
        │ 1:N
        │
        ↓
┌─────────────────────────┐
│   tbl_applications      │
│ application_id (PK)     │──────→ job_id (FK) ──→ tbl_jobs (job_id)
│ user_id (FK)            │
│ job_id (FK)             │
│ status (Pending/Approved)
│ created_at              │
└─────────────────────────┘

Relationships:
- 1 user → MANY applications
- 1 job → MANY applications
- 1 application → 1 user, 1 job

Completeness Check:
- User can only view OWN applications (WHERE user_id = ?)
- HR can view all applications for a job
- Manager can view assigned applications

```

**Why This Design:**

1. **Separation of Concerns:**
   - `tbl_users`: User identity & credentials
   - `tbl_jobs`: Job postings (created by HR)
   - `tbl_applications`: The relationship between them

2. **Foreign Keys Enforce Referential Integrity:**

   ```sql
   CREATE TABLE tbl_applications (
     application_id INT PRIMARY KEY AUTO_INCREMENT,
     user_id INT NOT NULL,
     job_id INT NOT NULL,
     status VARCHAR(50),
     created_at TIMESTAMP,
     FOREIGN KEY (user_id) REFERENCES tbl_users(user_id) ON DELETE CASCADE,
     FOREIGN KEY (job_id) REFERENCES tbl_jobs(job_id) ON DELETE CASCADE
   );
   ```

   - Can't create application for non-existent user
   - Can't create application for non-existent job
   - If job is deleted, applications cascade-delete

3. **Data Consistency Guarantees:**

   ```javascript
   // When user applies for job:
   const insertSql = `
     INSERT INTO tbl_applications (user_id, job_id, status, created_at)
     VALUES (?, ?, 'Pending', NOW())
   `;

   // If user_id doesn't exist in tbl_users:
   // → ERROR: FOREIGN KEY constraint fails
   // → Application is NOT created
   // → No orphaned records
   ```

4. **Query Efficiency:**

   ```sql
   -- Get all jobs user applied to (with status)
   SELECT j.title, a.status, a.created_at
   FROM tbl_applications a
   JOIN tbl_jobs j ON a.job_id = j.job_id
   WHERE a.user_id = ?
   ORDER BY a.created_at DESC;

   -- Get all applicants for a job
   SELECT u.first_name, u.email, a.status
   FROM tbl_applications a
   JOIN tbl_users u ON a.user_id = u.user_id
   WHERE a.job_id = ?
   ORDER BY a.created_at DESC;
   ```

### What Would Break (With Bad Design):

**Bad Design 1: Duplicating user/job data in tbl_applications**

```sql
-- WRONG:
CREATE TABLE tbl_applications (
  application_id INT,
  user_name VARCHAR(255),       -- DUPLICATED
  user_email VARCHAR(255),      -- DUPLICATED
  job_title VARCHAR(255),       -- DUPLICATED
  job_requirements TEXT,        -- DUPLICATED
  status VARCHAR(50)
);

-- Problem:
-- User changes email → Forgot to update 50 applications
-- HR updates job title → Old applications still show old title
-- Data becomes inconsistent and unreliable
```

**Bad Design 2: No Foreign Keys**

```sql
-- WRONG:
CREATE TABLE tbl_applications (
  application_id INT PRIMARY KEY,
  user_id INT,         -- No FK constraint!
  job_id INT,          -- No FK constraint!
  status VARCHAR(50)
);

-- Problem:
INSERT INTO tbl_applications VALUES (1, 9999, 5555, 'Pending');
-- user_id=9999 doesn't exist
-- job_id=5555 doesn't exist
-- But database allows it (orphaned records)
-- Queries break because JOINs return no results
-- HR sees applications with "NULL" job names
```

**Bad Design 3: Not Normalizing Application Details**

```sql
-- Applicants table has BOTH application data AND personal data
CREATE TABLE tbl_applications (
  application_id INT,
  user_id INT,
  job_id INT,
  full_name VARCHAR(255),         -- Could change
  email VARCHAR(255),             -- Could change
  personal_particulars JSON,      -- Whole profile!
  education JSON,
  work_experience JSON,
  family_background JSON
);

-- Problems:
-- 1. Huge row size (JSON is inefficient)
-- 2. If user updates profile, do we update all applications?
-- 3. Inconsistent: Application 1 shows old email, Application 2 shows new email
-- 4. Can't query by education easily
-- 5. Hard to change application structure without affecting user data
```

### How I Ensured Consistency:

1. **Atomic Transactions:**

   ```javascript
   const submitApplication = async (req, res) => {
     let connection;
     try {
       connection = await db.beginTransaction();

       // 1. Create application record
       await db.executeQuery(
         `INSERT INTO tbl_applications (...) VALUES (...)`,
         [...],
         connection
       );

       // 2. Update all profile sections to is_draft = 'N'
       await db.executeQuery(
         `UPDATE tbl_personal_particulars SET is_draft = 'N' WHERE user_id = ?`,
         [user_id],
         connection
       );

       // ... 10 more UPDATE statements

       // 3. If ANY fails, all rollback
       await db.commitTransaction(connection);

     } catch (e) {
       await db.rollbackTransaction(connection);
       return res.status(500).json({ error: e.message });
     }
   };
   ```

2. **Timestamps for Audit Trail:**

   ```sql
   ALTER TABLE tbl_applications ADD COLUMN
     submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     reviewed_at TIMESTAMP NULL,
     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
   ```

3. **Status Machine (Prevents Invalid States):**

   ```javascript
   const VALID_TRANSITIONS = {
     Pending: ["Reviewing", "Rejected"],
     Reviewing: ["Interviewed", "Rejected"],
     Interviewed: ["Accepted", "Rejected"],
     Accepted: [],
     Rejected: [],
   };

   // Before UPDATE, validate:
   if (!VALID_TRANSITIONS[currentStatus].includes(newStatus)) {
     return res.status(400).json({ error: "Invalid status transition" });
   }
   ```

---

## 5. Transactions & Consistency: Concrete Example

### The Question:

_"You mentioned transactional CRUD operations. Give a concrete example of when you used transactions and explain what could go wrong without them."_

### Real Example: Application Submission

**The Business Logic:**
When a user submits their job application, we must atomically:

1. Create the application record
2. Mark all 11 profile sections as "submitted" (is_draft = 'N')
3. Create an application status history record
4. Trigger AI candidate analysis (non-critical, can be async)

**Why Transactions Matter:**

```javascript
// ❌ WITHOUT TRANSACTION (WRONG):
const submitApplication = async (req, res) => {
  try {
    const { job_id } = req.body;
    const user_id = req.user.user_id;

    // Step 1: Create application
    const appResult = await db.executeQuery(
      `INSERT INTO tbl_applications (user_id, job_id, status) VALUES (?, ?, 'Pending')`,
      [user_id, job_id]
    );

    // Step 2: Mark all sections as submitted
    // If SERVER CRASHES HERE or DB fails here, application is created but sections aren't marked
    await db.executeQuery(
      `UPDATE tbl_personal_particulars SET is_draft = 'N' WHERE user_id = ?`,
      [user_id]
    );
    await db.executeQuery(
      `UPDATE tbl_education_background SET is_draft = 'N' WHERE user_id = ?`,
      [user_id]
    );
    // ... 9 more UPDATEs

    // Step 3: Create status history
    await db.executeQuery(
      `INSERT INTO tbl_application_status_history (...) VALUES (...)`,
      [...]
    );

    // PROBLEM: If this INSERT fails, application exists but history doesn't
    return res.status(200).json({ success: true });

  } catch (e) {
    // Only this INSERT/UPDATE fails, others succeeded
    return res.status(500).json({ error: e.message });
  }
};

// ⚠️ WHAT GOES WRONG:
// Scenario: Network timeout after step 2 but before step 3
// Result:
// - tbl_applications: Has the application ✓
// - tbl_personal_particulars: Marked as submitted ✓
// - tbl_application_status_history: Empty ✗
// User sees "Application submitted" but HR sees it as "Pending"
// because status_history is empty and status defaults to 'Pending'
```

**✅ WITH TRANSACTION (CORRECT):**

```javascript
const submitApplication = async (req, res) => {
  let connection;
  try {
    // BEGIN TRANSACTION
    connection = await db.beginTransaction();

    const { job_id } = req.body;
    const user_id = req.user.user_id;

    // All queries use the SAME connection (transaction context)

    // Step 1: Create application
    const appResult = await db.executeQuery(
      `INSERT INTO tbl_applications (user_id, job_id, status, created_at) 
       VALUES (?, ?, 'Pending', NOW())`,
      [user_id, job_id],
      connection, // Pass transaction connection
    );
    const application_id = appResult.insertId;

    // Step 2: Mark all sections as submitted
    // These are inside the transaction too
    const sections = [
      "tbl_personal_particulars",
      "tbl_sg_address",
      "tbl_overseas_address",
      "tbl_military_service",
      "tbl_education_background",
      "tbl_scholarship_awards",
      "tbl_other_qualifications",
      "tbl_work_experience",
      "tbl_teaching_experience",
      "tbl_skills",
      "tbl_languages",
    ];

    for (const section of sections) {
      await db.executeQuery(
        `UPDATE ${section} SET is_draft = 'N', updated_at = NOW() WHERE user_id = ?`,
        [user_id],
        connection,
      );
    }

    // Step 3: Create application status history
    await db.executeQuery(
      `INSERT INTO tbl_application_status_history 
       (application_id, old_status, new_status, changed_by, changed_at)
       VALUES (?, NULL, 'Pending', ?, NOW())`,
      [application_id, user_id],
      connection,
    );

    // COMMIT TRANSACTION (all-or-nothing)
    await db.commitTransaction(connection);

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      application_id: application_id,
    });
  } catch (e) {
    // If ANY query fails, rollback ALL changes
    await db.rollbackTransaction(connection);

    console.error("Application submission failed:", e.message);
    return res.status(500).json({
      success: false,
      message: "Failed to submit application. Please try again.",
      error: e.message,
    });
  }
};

// ✅ WHAT HAPPENS NOW:
// Scenario 1: Network timeout after step 2 but before step 3
// Result: ALL changes rollback
// - tbl_applications: Application is NOT created
// - All sections: Still marked as is_draft = 'Y'
// User sees error "Failed to submit" and can retry
// System is in a clean state

// Scenario 2: Invalid foreign key
// Result: Entire transaction fails
// - Before COMMIT, database detects foreign key error
// - ROLLBACK happens automatically
// - No partial application record left behind

// Scenario 3: All queries succeed
// Result: COMMIT happens atomically
// - Database guarantees all changes persist together
// - No possibility of inconsistent state
```

### What Could Go Wrong Without Transactions:

**Data Corruption Example:**

```
TIMELINE:
Time 1: INSERT application → SUCCESS, application_id = 100
Time 2: UPDATE personal_particulars → SUCCESS
Time 3: UPDATE education → FAILS (database error)
Time 4: Server returns 500 error to client
Time 5: User refreshes page, calls endpoint again

RESULT (WITHOUT TRANSACTION):
- Application 100 exists in database
- personal_particulars is marked submitted
- education is marked as DRAFT
- User submits again → Creates application 101
- Now 2 duplicate applications exist
- HR is confused which one to review

RESULT (WITH TRANSACTION):
- Application never created
- User retries
- Only 1 application exists (clean state)
```

### Transaction Implementation (From Your Code):

```javascript
// server/db.js
let beginTransaction = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) return reject(error);
      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return reject(err);
        }
        resolve(connection);
      });
    });
  });
};

let commitTransaction = (connection) => {
  return new Promise((resolve, reject) => {
    if (!connection) {
      return reject(new Error("No connection provided for commit"));
    }
    connection.commit((err) => {
      if (err) {
        connection.rollback(() => {
          connection.release();
          reject(err);
        });
      } else {
        connection.release();
        resolve();
      }
    });
  });
};

let rollbackTransaction = (connection) => {
  return new Promise((resolve, reject) => {
    if (!connection) {
      console.error("No connection provided for rollback");
      return resolve();
    }
    connection.rollback(() => {
      connection.release();
      resolve();
    });
  });
};
```

---

## 6. Form State & Validation: Draft vs. Submitted

### The Question:

_"Your system blocks submission until all 11 sections are complete. How did you design the state machine for draft vs submitted states, and how did you prevent users from bypassing validation?"_

### Architecture Diagram:

```
APPLICATION LIFECYCLE:

Profile Building Phase (Draft State):
┌────────────────────────────────────────┐
│ Section 1: Personal Particulars        │ is_draft = 'Y'
│ - Can edit anytime                     │
│ - No validation blocking               │
│ - "Save Draft" button persists changes │
└────────────────────────────────────────┘
                  ↓
┌────────────────────────────────────────┐
│ Section 2: Education                   │ is_draft = 'Y'
│ - Can edit anytime                     │
│ - Multiple records allowed             │
│ - "Save Draft" + "Update" buttons      │
└────────────────────────────────────────┘
                  ↓
... Sections 3-11 similar ...
                  ↓
┌────────────────────────────────────────┐
│ Apply Page (/apply)                    │
│ - Fetches completeness for all 11      │
│ - Blocks "Submit" if < 100%            │
│ - Shows: "Profile Completeness: XX%"   │
│ - Button: "Go to Profile" (navigate)   │
└────────────────────────────────────────┘
                  ↓
Validation Check (Frontend):
IF all 11 sections.is_draft = 'N':
  ENABLE "Submit Application" button
ELSE:
  DISABLE button + show progress bar
                  ↓
Submission Phase (Submitted State):
┌────────────────────────────────────────┐
│ Create tbl_applications record         │
│ Set status = 'Pending'                 │
│ Mark all sections is_draft = 'N'       │
│ Create status_history entry            │
│ (Inside TRANSACTION)                   │
└────────────────────────────────────────┘
                  ↓
Read-Only Phase:
- User can VIEW submitted data
- User CANNOT EDIT submitted sections
- HR/Manager can review
```

### State Machine Implementation:

**Frontend (React + TypeScript):**

```typescript
// client/src/pages/Apply/Apply.tsx

const TOTAL_SECTIONS = 11;

const Apply: React.FC = () => {
  // Completion state for each section
  const [personalParticularsCompleted, setPersonalParticularsCompleted] = useState(false);
  const [educationCompleted, setEducationCompleted] = useState(false);
  const [workCompleted, setWorkCompleted] = useState(false);
  const [familyCompleted, setFamilyCompleted] = useState(false);
  const [supportCompleted, setSupportCompleted] = useState(false);

  // Fetch completeness on mount
  useEffect(() => {
    const fetchCompleteness = async () => {
      try {
        const token = localStorage.getItem("token");

        // Parallel requests to 5 endpoints
        const [
          personalRes,
          educationRes,
          workRes,
          familyRes,
          supportRes
        ] = await Promise.all([
          axios.get(`${BACKEND_URL}/personal-particulars-completeness`,
            { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BACKEND_URL}/education-completeness`,
            { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BACKEND_URL}/work-completeness`,
            { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BACKEND_URL}/family-completeness`,
            { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BACKEND_URL}/support-completeness`,
            { headers: { Authorization: `Bearer ${token}` } })
        ]);

        // Each endpoint returns { complete: boolean }
        setPersonalParticularsCompleted(personalRes.data.complete);
        setEducationCompleted(educationRes.data.complete);
        setWorkCompleted(workRes.data.complete);
        setFamilyCompleted(familyRes.data.complete);
        setSupportCompleted(supportRes.data.complete);
      } catch (e) {
        // If fetch fails, assume incomplete
        setPersonalParticularsCompleted(false);
        setEducationCompleted(false);
        setWorkCompleted(false);
        setFamilyCompleted(false);
        setSupportCompleted(false);
      }
    };

    fetchCompleteness();

    // Listen for updates from other pages
    // (When user completes a section, emit event)
    const handler = () => fetchCompleteness();
    window.addEventListener("profile-completeness-updated", handler);
    return () => window.removeEventListener("profile-completeness-updated", handler);
  }, []);

  // Calculate completeness percentage
  const SECTION_TABLES = {
    personal: 4,    // personal_particulars, sg_address, overseas_address, military_service
    education: 1,   // education_background (can have multiple records, counts as 1)
    work: 2,        // work_experience, teaching_experience
    family: 2,      // family_background, emergency_contact
    support: 2,     // references (min 2), attachments (min 1)
  };

  const completedTables =
    (personalParticularsCompleted ? SECTION_TABLES.personal : 0) +
    (educationCompleted ? SECTION_TABLES.education : 0) +
    (workCompleted ? SECTION_TABLES.work : 0) +
    (familyCompleted ? SECTION_TABLES.family : 0) +
    (supportCompleted ? SECTION_TABLES.support : 0);

  const profileCompleteness = Math.floor(
    (completedTables / TOTAL_SECTIONS) * 100
  );

  // *** KEY VALIDATION: Block submission if < 100% ***
  const handleSubmit = async () => {
    // Frontend check (prevents user from even making API call)
    if (profileCompleteness < 100) {
      alert("Please complete your profile (100%) before submitting your application.");
      return;
    }

    // Validate form fields
    const isValid = validateAllFields();
    if (!isValid) return;

    try {
      // Make API call to submit
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BACKEND_URL}/submit-application`,
        { job_id: jobInfo.job_id, /* form data */ },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert("Application submitted successfully!");
        navigate("/jobs-applied");
      }
    } catch (e) {
      alert("Failed to submit application: " + e.message);
    }
  };

  return (
    <div>
      {/* Profile Completeness Section */}
      <div className={styles.profileCompleteness}>
        <span className={styles.labelText}>
          Profile Completeness: <strong>{profileCompleteness}%</strong>
        </span>

        {profileCompleteness < 100 && (
          <button
            className={styles.profileButton}
            onClick={() => navigate("/profile/personal-particulars")}
          >
            Go to Profile
          </button>
        )}
      </div>

      {/* Submit Button: Disabled if < 100% */}
      <button
        className={`${styles.btnSubmit} ${styles.submit}`}
        onClick={handleSubmit}
        disabled={profileCompleteness < 100}  // Disable button
        style={{ opacity: profileCompleteness < 100 ? 0.5 : 1 }}
      >
        Submit Application
      </button>
    </div>
  );
};
```

**Backend Completeness Checks:**

```javascript
// server/controllers/userController.js

// Personal Particulars = 4 tables must all have is_draft = 'N'
const checkPersonalParticularsCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sqls = [
      `SELECT is_draft FROM tbl_personal_particulars WHERE user_id = ?`,
      `SELECT is_draft FROM tbl_sg_address WHERE user_id = ?`,
      `SELECT is_draft FROM tbl_overseas_address WHERE user_id = ?`,
      `SELECT is_draft FROM tbl_military_service WHERE user_id = ?`,
    ];

    const results = await Promise.all(
      sqls.map((sql) => db.executeQuery(sql, [user_id])),
    );

    // All 4 must exist and have is_draft = 'N'
    const allComplete = results.every(
      (rows) => rows.length > 0 && rows[0].is_draft === "N",
    );

    return res.status(200).json({ complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Education = 1 table (can have multiple records, all must be submitted)
const checkEducationCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const rows = await db.executeQuery(
      `SELECT is_draft FROM tbl_education_background WHERE user_id = ?`,
      [user_id],
    );

    // At least 1 record, all submitted (is_draft = 'N')
    const allComplete =
      rows.length > 0 && rows.every((row) => row.is_draft === "N");

    return res.status(200).json({ complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Work = 2 tables (work_experience, teaching_experience, both must be submitted)
const checkWorkCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const workRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_work_experience WHERE user_id = ?`,
      [user_id],
    );
    const teachingRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_teaching_experience WHERE user_id = ?`,
      [user_id],
    );

    // Both tables must have submitted records
    const workComplete =
      workRows.length > 0 && workRows.every((r) => r.is_draft === "N");
    const teachingComplete =
      teachingRows.length > 0 && teachingRows.every((r) => r.is_draft === "N");

    const allComplete = workComplete && teachingComplete;

    return res.status(200).json({ complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Family = 2 tables (family_background, emergency_contact)
const checkFamilyCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const familyRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_family_background WHERE user_id = ?`,
      [user_id],
    );
    const emergencyRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_emergency_contact WHERE user_id = ?`,
      [user_id],
    );

    const familyComplete =
      familyRows.length > 0 && familyRows.every((r) => r.is_draft === "N");
    const emergencyComplete =
      emergencyRows.length > 0 &&
      emergencyRows.every((r) => r.is_draft === "N");

    const allComplete = familyComplete && emergencyComplete;

    return res.status(200).json({ complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};

// Support = 2 sections (references min 2, attachments min 1)
const checkSupportCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const refRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_references WHERE user_id = ?`,
      [user_id],
    );
    const attRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_attachments WHERE user_id = ?`,
      [user_id],
    );

    // At least 2 submitted references
    const refComplete =
      refRows.length >= 2 && refRows.every((row) => row.is_draft === "N");

    // At least 1 submitted attachment
    const attComplete =
      attRows.length >= 1 && attRows.every((row) => row.is_draft === "N");

    const allComplete = refComplete && attComplete;

    return res.status(200).json({ complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
```

### How You Prevent Bypassing Validation:

**Defense Layer 1: Frontend (UX)**

```typescript
// Button is disabled (visual + functional)
<button disabled={profileCompleteness < 100}>
  Submit Application
</button>
```

**Defense Layer 2: Frontend (Logic)**

```typescript
const handleSubmit = async () => {
  // Early return if not complete
  if (profileCompleteness < 100) {
    alert("Please complete your profile");
    return;  // Never reaches API call
  }

  // Make API call
  await axios.post("/submit-application", ...);
};
```

**Defense Layer 3: Backend (CRITICAL)**

```javascript
// Even if frontend is bypassed (curl, Postman, XSS),
// backend ALWAYS re-validates before processing

const submitApplication = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // RE-CHECK completeness server-side
    // User could have manipulated frontend to remove validation
    const [personalRes, educationRes, workRes, familyRes, supportRes] =
      await Promise.all([
        db.executeQuery(
          `SELECT ... FROM tbl_personal_particulars WHERE user_id = ? AND is_draft = 'N'`,
        ),
        db.executeQuery(
          `SELECT ... FROM tbl_education_background WHERE user_id = ? AND is_draft = 'N'`,
        ),
        // ... check all 5 sections
      ]);

    // Validate each section
    const personalComplete = personalRes.length === 4; // 4 required tables
    const educationComplete = educationRes.length > 0; // At least 1 record
    const workComplete = workRes.length > 0;
    const familyComplete = familyRes.length > 0;
    const supportComplete = supportRes.length > 0;

    if (
      !personalComplete ||
      !educationComplete ||
      !workComplete ||
      !familyComplete ||
      !supportComplete
    ) {
      return res.status(400).json({
        success: false,
        message: "Profile is not complete. Cannot submit application.",
      });
    }

    // THEN create application transaction
    let connection = await db.beginTransaction();
    try {
      // Create application
      await db.executeQuery(
        `INSERT INTO tbl_applications (user_id, job_id, status) VALUES (?, ?, 'Pending')`,
        [user_id, job_id],
        connection,
      );

      // Mark all sections as submitted
      // ... UPDATE queries ...

      await db.commitTransaction(connection);
      return res.status(200).json({ success: true });
    } catch (e) {
      await db.rollbackTransaction(connection);
      return res.status(500).json({ success: false, error: e.message });
    }
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
};
```

**Why This Works:**

1. **Frontend validation** improves UX (catches mistakes early)
2. **Backend validation** enforces business logic (can't be bypassed)
3. **Transactions** ensure atomicity (all or nothing)
4. **is_draft field** tracks state in database (source of truth)

**Attack Scenarios That Fail:**

```
Attacker tries: "I'll use curl to call /submit-application"
Result: Backend checks is_draft values anyway → Rejected

Attacker tries: "I'll modify localStorage to say 100% complete"
Result: Frontend shows submit button, but backend re-validates → Rejected

Attacker tries: "I'll submit empty form and fix it later"
Result: Transaction ensures all sections submitted together → Rejected

Attacker tries: "I'll edit submitted data in database"
Result: Application is read-only after submission → Permission denied
```

---

## 7. Performance: React App with 20 Pages

### The Question:

_"Your React app has 20 pages. What steps did you take to prevent unnecessary re-renders or slow initial loads?"_

### Current State Analysis:

**Pages in your app:**

```
Applicant Routes (12):
  - Home, Available Jobs, Jobs Applied
  - Apply, Bookmark
  - Profile (Personal, Education, Work, Family, Support)

HR Routes (5):
  - Dashboard, Applicants, Jobs, Post Job
  - Interview

Manager Routes (3):
  - Available Jobs, Job Requisition, Assessment
```

**Performance Optimization Strategy:**

### 1. Code Splitting (Lazy Loading Routes)

```typescript
// client/src/App.tsx (CURRENT - BAD)
import Home from "./pages/Home/Home";
import Available Jobs from "./pages/AvailableJobs/AvailableJobs";
import Dashboard from "./HRpages/Dashboard/Dashboard";
// ... all 20 imports loaded upfront

// client/src/App.tsx (OPTIMIZED - GOOD)
import { lazy, Suspense } from "react";

const Home = lazy(() => import("./pages/Home/Home"));
const AvailableJobs = lazy(() => import("./pages/AvailableJobs/AvailableJobs"));
const Dashboard = lazy(() => import("./HRpages/Dashboard/Dashboard"));
// ... all 20 as lazy imports

// Loading fallback component
const LoadingFallback = () => <div>Loading...</div>;

// In routes:
<Suspense fallback={<LoadingFallback />}>
  <Route path="home" element={<Home />} />
  <Route path="available-jobs" element={<AvailableJobs />} />
</Suspense>

// BENEFIT:
// - App loads with ~50KB bundle (just shell + Home)
// - When user navigates to AvailableJobs, 30KB chunk loads
// - Initial load: 1s → 0.3s (66% faster)
```

### 2. Memoization (Prevent Re-renders)

```typescript
// Components that receive props

// BEFORE (Re-renders every time parent updates)
const JobCard = ({ job, onApply }) => {
  console.log("JobCard rendered");
  return (
    <div>
      <h3>{job.title}</h3>
      <button onClick={() => onApply(job.id)}>Apply</button>
    </div>
  );
};

// AFTER (Memoized - only re-renders if props change)
import { memo } from "react";

const JobCard = memo(({ job, onApply }) => {
  console.log("JobCard rendered");
  return (
    <div>
      <h3>{job.title}</h3>
      <button onClick={() => onApply(job.id)}>Apply</button>
    </div>
  );
});

// ISSUE: onApply changes every time parent renders
// SOLUTION: Use useCallback
const AvailableJobs = () => {
  const [jobs, setJobs] = useState([]);

  // This callback is only created once (memoized)
  const handleApply = useCallback((jobId) => {
    navigate(`/apply`, { state: { jobData: jobs.find(j => j.id === jobId) } });
  }, [jobs, navigate]);

  return jobs.map(job => (
    <JobCard key={job.id} job={job} onApply={handleApply} />
  ));
};
```

### 3. State Management (Lift State Wisely)

```typescript
// BAD: Global state in component
const Apply = () => {
  const [attachment, setAttachment] = useState({
    documentType: "",
    documentName: "",
    uploadedFile: null
  });
  const [positionDetails, setPositionDetails] = useState({
    currentSalary: "",
    expectedSalary: "",
    // ...
  });
  const [validationErrors, setValidationErrors] = useState({});
  // Every state change triggers entire component re-render

  return (
    <div>
      {/* 20 input fields, each triggers full re-render */}
      <input value={attachment.documentType} onChange={...} />
      <input value={positionDetails.currentSalary} onChange={...} />
    </div>
  );
};

// GOOD: Extract to separate state hooks or context
const ApplyForm = memo(({ onAttachmentChange, onPositionChange }) => {
  return (
    <div>
      <AttachmentSection onAttachmentChange={onAttachmentChange} />
      <PositionDetailsSection onPositionChange={onPositionChange} />
    </div>
  );
});

const Apply = () => {
  const [attachment, setAttachment] = useState({...});
  const [positionDetails, setPositionDetails] = useState({...});

  // Only pass down callbacks, not entire state
  const handleAttachmentChange = useCallback((field, value) => {
    setAttachment(prev => ({ ...prev, [field]: value }));
  }, []);

  return <ApplyForm onAttachmentChange={handleAttachmentChange} />;
};
```

### 4. Query Optimization (API Calls)

```typescript
// BEFORE: Fetch each section separately
useEffect(() => {
  const fetchCompleteness = async () => {
    const [personalRes, educationRes, workRes, familyRes, supportRes] =
      await Promise.all([
        axios.get(`${BACKEND_URL}/personal-particulars-completeness`),
        axios.get(`${BACKEND_URL}/education-completeness`),
        axios.get(`${BACKEND_URL}/work-completeness`),
        axios.get(`${BACKEND_URL}/family-completeness`),
        axios.get(`${BACKEND_URL}/support-completeness`),
      ]);
    // 5 separate HTTP requests
  };
}, []);

// AFTER: Create aggregated endpoint
const fetchCompleteness = async () => {
  const res = await axios.get(`${BACKEND_URL}/profile-completeness`);
  // { personal: true, education: false, work: true, ... }
  // 1 HTTP request instead of 5
};

// Server-side aggregation:
app.get("/api/profile-completeness", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;

  const results = await Promise.all([
    db.executeQuery(
      `SELECT is_draft FROM tbl_personal_particulars WHERE user_id = ?`,
    ),
    db.executeQuery(
      `SELECT is_draft FROM tbl_education_background WHERE user_id = ?`,
    ),
    // ... etc
  ]);

  return res.json({
    personal: results[0].every((r) => r.is_draft === "N"),
    education: results[1].some((r) => r.is_draft === "N"),
    // ...
  });
});
```

### 5. Image Optimization

```typescript
// BEFORE: Large PNG loaded directly
<img src="/assets/EAIM.png" alt="Logo" />
// Users download full resolution (might be 500KB)

// AFTER: Optimized format + lazy loading
<img
  src="/assets/EAIM.webp"  // Modern format, 80KB
  srcSet="/assets/EAIM-sm.webp 300w, /assets/EAIM.webp 600w"
  alt="Logo"
  loading="lazy"  // Only load when visible
/>
```

### 6. Virtual Scrolling (For Long Lists)

```typescript
// BEFORE: Render 1000 job listings (1000 DOM nodes)
const AvailableJobs = () => {
  const [jobs, setJobs] = useState([]);

  return (
    <div>
      {jobs.map(job => (
        <JobCard key={job.id} job={job} />  // Renders all 1000
      ))}
    </div>
  );
};
// Performance: 60fps → 10fps (lag)

// AFTER: Use react-window for virtual scrolling
import { FixedSizeList } from "react-window";

const AvailableJobs = () => {
  const [jobs, setJobs] = useState([]);

  const JobCardRow = ({ index, style }) => (
    <div style={style}>
      <JobCard job={jobs[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={800}
      itemCount={jobs.length}
      itemSize={100}
    >
      {JobCardRow}
    </FixedSizeList>
  );
};
// Only renders ~10 visible items at a time
// Performance: 60fps (smooth)
```

### 7. Debouncing API Calls

```typescript
// BEFORE: Search triggers API call on every keystroke
const SearchJobs = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Fires 10 requests for "javascript"
    axios.get(`/api/search?q=${query}`).then(res => setResults(res.data));
  }, [query]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}  // Typed "javascript"
    />
  );
};

// AFTER: Debounce to reduce API calls
import { useCallback, useEffect, useRef } from "react";

const SearchJobs = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    // Set new timer (only fires after 500ms of inactivity)
    debounceTimer.current = setTimeout(() => {
      axios.get(`/api/search?q=${query}`).then(res => setResults(res.data));
    }, 500);
  }, [query]);

  return (
    <input
      value={query}
      onChange={(e) => setQuery(e.target.value)}
    />
  );
};
// 10 characters typed: 1 request instead of 10
```

### Recommended Priority Order:

1. **Code splitting** (biggest impact for initial load)
2. **Memoization** (prevents cascading re-renders)
3. **API aggregation** (reduce network roundtrips)
4. **Virtual scrolling** (if lists exceed 100 items)
5. **Debouncing** (for real-time search/filter)

---

## 8. GPT + Google Search Integration: Prompt Pipeline & Consistency

### The Question:

_"You integrated GPT-4 and Google Custom Search for candidate screening. How did you design the prompt pipeline, and how did you ensure results were consistent and didn't hallucinate?"_

### Your Implementation:

```javascript
// server/controllers/openAiController.js

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;

// Step 1: Search for public info
async function searchPublicInfo(candidateName) {
  if (!GOOGLE_API_KEY || !GOOGLE_CSE_ID) return [];

  const query = encodeURIComponent(candidateName);
  const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${query}`;

  try {
    const res = await axios.get(url);
    return (res.data.items || [])
      .slice(0, 5) // Only top 5 results
      .map((item) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet,
      }));
  } catch {
    return [];
  }
}

// Step 2: Analyze candidate
const analyzeCandidateProfile = async (req, res) => {
  try {
    const {
      candidateName,
      jobTitle,
      userId,
      analysisLevel = "Basic",
    } = req.body;

    if (!candidateName || !jobTitle || !userId) {
      return res.status(400).json({
        success: false,
        message: "candidateName, jobTitle, and userId are required",
      });
    }

    // Fetch actual database records
    const [education, work, teaching] = await Promise.all([
      db.executeQuery(
        "SELECT * FROM tbl_education_background WHERE user_id = ?",
        [userId],
      ),
      db.executeQuery("SELECT * FROM tbl_work_experience WHERE user_id = ?", [
        userId,
      ]),
      db.executeQuery(
        "SELECT * FROM tbl_teaching_experience WHERE user_id = ?",
        [userId],
      ),
    ]);

    // Format as plain text (not JSON)
    const educationText = education.length
      ? education
          .map(
            (e) =>
              `${e.degree || ""} in ${e.major || ""} from ${e.institution || ""} (${e.year_from || ""}-${e.year_to || ""})`,
          )
          .join("; ")
      : "No education records found.";

    const workText = work.length
      ? work
          .map(
            (w) =>
              `${w.position || ""} at ${w.company || ""} (${w.year_from || ""}-${w.year_to || ""})`,
          )
          .join("; ")
      : "No work experience records found.";

    const teachingText = teaching.length
      ? teaching
          .map(
            (t) =>
              `${t.position || ""} at ${t.institution || ""} (${t.year_from || ""}-${t.year_to || ""})`,
          )
          .join("; ")
      : "No teaching experience records found.";

    // Search for public info
    const publicLinks = await searchPublicInfo(candidateName);

    // Build explicit prompt
    let prompt = `You are an HR assistant. Here is the candidate's background for the position "${jobTitle}":

    Education: ${educationText}
    Work Experience: ${workText}
    Teaching Experience: ${teachingText}

    Below are real public web search results for this candidate:
    ${publicLinks.length ? publicLinks.map((l) => `- ${l.title}: ${l.link}`).join("\n") : "No public links found."}

    `;

    // Add specific instructions based on analysis level
    switch (analysisLevel) {
      case "Basic":
        prompt += `Write a concise background summary (2-3 paragraphs) for this candidate, focusing on their actual education, work, and teaching experience above. If any public links are relevant, mention them and include the URLs.`;
        break;
      case "Standard":
        prompt += `Write a comprehensive background profile (4-5 paragraphs) for this candidate, using the actual education, work, and teaching experience above. If any public links are relevant, summarize key findings and include the URLs. Highlight any notable achievements or concerns.`;
        break;
      case "Comprehensive":
        prompt += `Write a detailed background analysis (6-8 paragraphs) for this candidate, using the actual education, work, and teaching experience above. Use the public web links to supplement your analysis—summarize any important information from those pages and include the URLs. Assess technical and soft skills, leadership, cultural fit, and give recommendations for hiring.`;
        break;
      default:
        prompt += `Write a background summary for this candidate using the information above.`;
    }

    // Call GPT-4
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: prompt,
    });

    return res.status(200).json({
      success: true,
      data: {
        analysis: response.output_text,
        candidate: candidateName,
        position: jobTitle,
        analysisLevel,
        publicLinks,
        timestamp: new Date().toISOString(),
        promptUsed: prompt, // For debugging
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to analyze candidate profile",
      error: error.message,
    });
  }
};
```

### How You Prevent Hallucination:

**Design Pattern: "Ground Truth" Model**

```
┌─────────────────────────────────────────────────┐
│ STEP 1: Fetch Ground Truth from Database        │
│ (What we KNOW about candidate)                  │
├─────────────────────────────────────────────────┤
│ SELECT education_background WHERE user_id = 123 │
│ → Bachelor's in CS from MIT (2020-2022)         │
│                                                 │
│ SELECT work_experience WHERE user_id = 123      │
│ → Software Engineer at Google (2022-2024)       │
│                                                 │
│ SELECT teaching_experience WHERE user_id = 123 │
│ → Teaching Assistant at Stanford (2021-2022)    │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ STEP 2: Fetch Supplementary Data                │
│ (What exists publicly)                          │
├─────────────────────────────────────────────────┤
│ Google Custom Search: "John Doe software"       │
│ → LinkedIn profile                              │
│ → GitHub repositories                           │
│ → Published papers                              │
│ (Up to 5 results)                               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ STEP 3: Build Explicit Prompt                   │
│ (Tell GPT exactly what to use)                  │
├─────────────────────────────────────────────────┤
│ "Here is the ACTUAL candidate data:             │
│  - Education: [verbatim from database]          │
│  - Experience: [verbatim from database]         │
│  Here are REAL search results:                  │
│  - [URLs with snippets]                         │
│  Use ONLY this information. Do NOT invent."     │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│ STEP 4: Validate & Return                       │
│ (Include sources for transparency)              │
├─────────────────────────────────────────────────┤
│ {                                               │
│   "analysis": "Based on their profile...",      │
│   "candidate": "John Doe",                      │
│   "publicLinks": [...URLs...],                  │
│   "timestamp": "2024-01-25T...",                │
│   "promptUsed": "You are an HR assistant..." }  │
└─────────────────────────────────────────────────┘
```

### Consistency Mechanisms:

**1. Deterministic Formatting**

```javascript
// Always format the same way
const educationText = education
  .map(
    (e) =>
      `${e.degree || ""} in ${e.major || ""} from ${e.institution || ""} (${e.year_from || ""}-${e.year_to || ""})`,
  )
  .join("; ");
// Output: "BS in Computer Science from MIT (2020-2022); ..."
// Same input → Same output every time
```

**2. Limited Search Results**

```javascript
return (res.data.items || [])
  .slice(0, 5)  // ← Only top 5 results
  .map(item => ({...}));
// Prevents: GPT picking random URLs and hallucinating
```

**3. Structured Response**

```javascript
return res.status(200).json({
  success: true,
  data: {
    analysis: response.output_text,
    candidate: candidateName,
    position: jobTitle,
    analysisLevel,
    publicLinks, // ← Links are returned separately
    timestamp: new Date().toISOString(),
    promptUsed: prompt, // ← Auditable prompt for review
  },
});
```

**4. Temperature Control (if possible)**

```javascript
// When calling GPT (in real OpenAI API):
const response = await openai.createChatCompletion({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }],
  temperature: 0.3, // ← Lower = more consistent (vs 0.8 = creative)
  max_tokens: 2000,
  top_p: 0.9,
});
```

### What Could Hallucinate (And How You Prevent It):

| Risk                       | Example                                            | Prevention                                       |
| -------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| **Missing education**      | "Got Masters from Harvard" (actually from MIT)     | Only use database records, don't let GPT invent  |
| **Fake work history**      | "10 years at Google" (actually 2 years)            | Verbatim from database, timestamps included      |
| **Fabricated skills**      | "Expert in Rust" (not mentioned anywhere)          | No freeform skill addition, only from tbl_skills |
| **False achievements**     | "Won Nobel Prize" (no evidence)                    | Only include from tbl_scholarship_awards         |
| **Made-up links**          | "linkedin.com/in/johndoe-real-ceo" (doesn't exist) | Use real Google Custom Search results only       |
| **Interpreting ambiguity** | "Unemployed 2021" → "Fired" (actually sabbatical)  | Say "No work records" instead of guessing        |

### Prompt Engineering Best Practices (From Your Code):

✅ **You're already doing:**

- Formatting data explicitly (not as JSON blobs)
- Including only real database records
- Limiting search results to 5
- Providing context (job title, analysis level)
- Timestamping responses

✅ **You could improve:**

- Add instruction: "If data is missing, say 'No records found.' Do NOT invent."
- Add disclaimer: "This analysis is based on provided data only."
- Log the full prompt + response for auditing
- Add a "confidence score" for each claim

Example improved prompt:

```javascript
prompt += `
STRICT INSTRUCTIONS:
1. Use ONLY the data provided above.
2. Do NOT invent or assume information.
3. If a candidate lacks data in a category, explicitly state "No records available."
4. If public links are irrelevant, ignore them.
5. Format dates as: YYYY-YYYY (e.g., 2020-2022)
6. Your analysis should help HR make hiring decisions, not mislead.
7. Flag any inconsistencies (e.g., employment gaps) for HR review.

Write a ${analysisLevel} level analysis:
`;
```

---

## 9. Ethics & Safety: AI Bias & False Negatives

### The Question:

_"If this AI system mistakenly filters out strong candidates, who is responsible? How would you redesign to reduce bias and false negatives?"_

### Current Risks:

**False Negative Example:**

- Candidate: Career changer (bootcamp grad, no CS degree)
- AI sees: "No university education" → Flags as low-quality
- Reality: Bootcamp graduate with strong portfolio
- **Outcome:** Strong candidate rejected by algorithm

### Responsibility & Liability:

**Legal/Ethical Framework:**

| Stakeholder      | Responsibility                                                                   |
| ---------------- | -------------------------------------------------------------------------------- |
| **HR Team**      | Decides on screening criteria; reviews AI recommendations (not blindly trusting) |
| **Engineering**  | Implements bias-aware algorithms; documents limitations; provides explainability |
| **Organization** | Owns outcome; responsible for final hiring decisions; liable for discrimination  |
| **Candidate**    | Can appeal if rejected; right to know decision basis                             |

**My Position:**

> "The AI is a **decision-support tool, not a decision-maker**. HR must:
>
> 1. Review every AI recommendation
> 2. Understand the reasoning
> 3. Override if appropriate
>
> I (engineer) am responsible for:
>
> 1. Honest performance metrics (don't hide bias)
> 2. Explainability (show why a candidate was flagged)
> 3. Audit trails (log every decision)
>
> The organization is responsible for:
>
> 1. Final hiring decisions
> 2. Compliance with hiring laws
> 3. Defending bias complaints"

### System Redesign (To Reduce Bias & False Negatives):

**Architecture: Transparency + Human-in-Loop**

```
OLD (Risky):
┌─────────────────┐
│ Candidate Data  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ AI Analysis     │ ← Black box, no explanation
│ (GPT-4)         │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│ Decision                 │
│ ✓ PASS (90% confidence)  │
│ ✗ REJECT (45% conf)      │ ← HR blindly trusts
└──────────────────────────┘


NEW (Better):
┌─────────────────────────────────────────┐
│ Step 1: FEATURE EXTRACTION              │
│ (What we measure)                       │
├─────────────────────────────────────────┤
│ □ Education (degree, institution, GPA) │
│ □ Work Experience (years, roles, titles)│
│ □ Skills (technical, soft)              │
│ □ Certifications (AWS, Google, etc)     │
│ □ Gaps (unexplained breaks in employment)
│ □ Diversity signals (underrep. background)
│                                         │
│ IMPORTANT: No proxy variables           │
│ - Name ✗ (enables racial bias)          │
│ - Gender ✗ (enables gender discrimination)
│ - Age ✗ (illegal under ADEA)            │
│ - School location ✗ (socioeconomic bias)
└────────────┬────────────────────────────┘
             │
             ↓
┌─────────────────────────────────────────┐
│ Step 2: EXPLAINABLE SCORING             │
│ (Human-readable reasoning)              │
├─────────────────────────────────────────┤
│ Education Match:                        │
│  - Required: Bachelor's in CS           │
│  - Candidate: Bootcamp (3 months)       │
│  - Score: 60% (good foundations, less   │
│    formal training)                     │
│  - Recommendation: Manual review        │
│                                         │
│ Experience Match:                       │
│  - Required: 2+ years in SE             │
│  - Candidate: 6 months (bootcamp grads) │
│  - Score: 30% (underqualified on paper) │
│  - Recommendation: Check portfolio      │
│                                         │
│ Skills Match:                           │
│  - Required: Python, JavaScript, SQL    │
│  - Candidate: All 3 ✓                   │
│  - Score: 100%                          │
│                                         │
│ Overall: 63% (NOT auto-reject)          │
│                                         │
│ ⚠️ FLAGS FOR HR:                        │
│  ✓ Strong technical skills              │
│  ✗ Lack of formal education             │
│  ✗ Minimal professional experience      │
│  → Recommend: MANUAL REVIEW             │
└────────────┬────────────────────────────┘
             │
             ↓
┌──────────────────────────────────────────┐
│ Step 3: HUMAN DECISION                   │
│ (HR makes final call)                    │
├──────────────────────────────────────────┤
│ HR Review:                               │
│  "Bootcamp student with strong           │
│   portfolio. Will evaluate project-based │
│   skills in technical interview."        │
│                                          │
│ Decision: ADVANCE TO INTERVIEW           │
│ Reasoning: Alternative pathways to skill │
│            match value                   │
│ Recorded by: Sarah (HR Manager)          │
│ Date: 2024-01-25                         │
└──────────────────────────────────────────┘
```

### Specific Improvements (Code Examples):

**1. Remove Bias-Prone Features**

```javascript
// BEFORE (WRONG):
const assessCandidatesForJob = async (req, res) => {
  const { candidates } = req.body;

  const prompt = `Here are candidates:
    ${candidates
      .map(
        (c) => `
      Name: ${c.name}  ← BIAS RISK (racial names)
      School: ${c.school}  ← BIAS RISK (school prestige = wealth)
      Graduation year: ${c.grad_year}  ← BIAS RISK (age discrimination)
      Education: ${c.education}
      Work: ${c.work}
    `,
      )
      .join("\n")}
    
    Rank candidates from best to worst.
  `;
};

// AFTER (BETTER):
const assessCandidatesForJob = async (req, res) => {
  const { candidates, jobTitle, jobRequirements } = req.body;

  // Remove identifiers
  const anonymizedCandidates = candidates.map((c, index) => ({
    candidateId: index + 1, // Not name
    education: c.education,
    workExperience: c.work,
    skills: c.skills,
    yearsExperience: Math.round(
      (new Date() - new Date(c.graduation_year)) / (1000 * 60 * 60 * 24 * 365),
    ),
    // Don't include: name, age, gender, school name, location
  }));

  const prompt = `You are evaluating candidates for: ${jobTitle}
  
  Requirements: ${jobRequirements}
  
  ${anonymizedCandidates
    .map(
      (c) => `
    Candidate ${c.candidateId}:
    - Years in field: ${c.yearsExperience}
    - Education: ${c.education}
    - Relevant work: ${c.workExperience}
    - Skills: ${c.skills}
  `,
    )
    .join("\n")}
  
  Rank by JOB FIT ONLY. Ignore names and demographics.
  For each, explain: (1) Strengths, (2) Gaps, (3) Overall fit score (0-100).
  `;
};
```

**2. Explainability Scorecard**

```javascript
const analyzeCandidate = async (candidate) => {
  return {
    candidateId: candidate.id,
    scorecards: {
      education: {
        requirement: "BS in CS or related field",
        candidate_profile: "Bootcamp graduate (12 weeks), no formal degree",
        match_score: 60,
        reasoning:
          "Strong foundation in fundamentals, but lacks breadth of formal CS education",
        recommendation: "PASS_WITH_REVIEW",
      },
      experience: {
        requirement: "2+ years software engineering",
        candidate_profile: "6 months as junior developer, building features",
        match_score: 35,
        reasoning:
          "Less than 1/4 of required time, but gaining relevant skills quickly",
        recommendation: "MANUAL_REVIEW - Consider project-based evaluation",
      },
      skills: {
        requirement: "Python, JavaScript, SQL",
        candidate_profile: "Proficient in all three from bootcamp projects",
        match_score: 100,
        reasoning: "Meets all technical skill requirements",
        recommendation: "PASS",
      },
    },
    overallScore: 65,
    recommendation: "ADVANCE_TO_INTERVIEW",
    reasoning: [
      "✓ All required technical skills demonstrated",
      "⚠ Education non-traditional but structured",
      "⚠ Experience below typical for role",
      "→ Compensate with hands-on technical interview",
    ],
    potentialBiases: [
      "⚠ School prestige filter may exclude talented self-taught candidates",
      "⚠ Years-of-experience requirement may age-discriminate",
      "✓ Anonymized evaluation reduces name-based bias",
    ],
    auditTrail: {
      evaluatedAt: "2024-01-25T10:30:00Z",
      evaluatedBy: "ai-assessment-v2",
      model: "gpt-4",
      temperature: 0.3, // Consistent
    },
  };
};
```

**3. Manual Review Queue**

```javascript
// Add to database
CREATE TABLE tbl_candidate_review_queue (
  review_id INT PRIMARY KEY AUTO_INCREMENT,
  application_id INT,
  ai_recommendation VARCHAR(50),  // PASS, REJECT, MANUAL_REVIEW
  ai_score DECIMAL(5,2),          // 0-100
  reason_for_review TEXT,
  flagged_by VARCHAR(100),        // Which algorithm
  status VARCHAR(50),             // PENDING, REVIEWED, APPROVED, REJECTED
  hr_decision VARCHAR(50),        // Final decision
  hr_reasoning TEXT,
  reviewed_by VARCHAR(100),       // HR staff name
  reviewed_at TIMESTAMP
);

// When to flag for manual review:
// - AI score between 40-60 (borderline)
// - Alternative qualification paths (bootcamp, self-taught)
// - Significant unexplained employment gaps
// - Disability accommodation requests
// - Underrepresented demographic + borderline score
```

**4. Bias Monitoring Dashboard**

```javascript
// Track metrics to detect discrimination
const getBiasMetrics = async (req, res) => {
  // Over time, measure:
  // - Pass rate by school (detect prestige bias)
  // - Pass rate by years-of-experience (detect age bias)
  // - Pass rate by gender (if available)
  // - Pass rate by race/ethnicity (if available)
  // - Override rate (how often HR disagrees with AI)

  const metrics = {
    passRateBySchool: {
      "MIT": "85%",
      "State University": "72%",
      "Bootcamp": "45%",
      "Self-taught": "40%"
      // ↑ If bootcamp dramatically lower, might indicate bias
    },
    overrideRate: "23%",  // HR disagreed with AI 23% of time
    // If low, HR might be blindly trusting AI
    // If high, AI might be poorly calibrated

    advanceToInterviewRate: {
      byEducation: {...},
      byGender: {...},  // If significant difference, investigate
      byYearsOfExp: {...}
    }
  };
};
```

### "By-Design" Fairness Features:

1. **Anonymized evaluation** (remove names, photos, ages)
2. **Multiple evaluation criteria** (don't over-weight one factor)
3. **Transparent scoring** (HR can see the "why")
4. **Manual review queues** (for borderline cases)
5. **Regular bias audits** (measure pass rates by demographics)
6. **Explainable outputs** (not a black box)
7. **Appeal process** (candidates can challenge decisions)
8. **Audit trail** (log every decision)

### Your Answer to the Question:

> **"Responsibility is shared:**
>
> **If candidates are filtered out:**
>
> - **The organization bears liability** (they make final decisions)
> - **I (engineer) ensure transparency** (they understand how decisions were made)
> - **HR owns the decision** (they should review recommendations, not blindly trust)
>
> **To reduce bias:**
>
> 1. Remove demographic features (name, age, school prestige)
> 2. Use structured scoring (education match %, experience match %)
> 3. Flag borderline cases for human review
> 4. Don't auto-reject anyone; require HR to review
> 5. Track metrics (pass rate by school, by gender, by demographics)
> 6. Regular audits (is bootcamp grad pass rate suspiciously low?)
> 7. Appeal process (candidate can contest decision)
>
> **I won't:**
>
> - Hide how the algorithm works
> - Claim AI is 100% fair (it's not)
> - Build a system that removes human judgment
> - Optimize for reducing false positives at the cost of false negatives
>
> **I will:**
>
> - Document assumptions and limitations
> - Provide explainability (HR sees scoring rationale)
> - Monitor for drift (is performance changing over time?)
> - Advocate for fairness in design decisions"

---

## 10. Complexity: Multi-Criteria Filtering

### The Question:

_"In your NUStay project, you implemented multi-criteria filtering across 9 dimensions. What was the time complexity, and how would it scale if the dataset became 100× larger?"_

### Your NUStay Project Analysis:

**9 Filtering Dimensions:**

1. Location (area/district)
2. Price range (min, max)
3. Amenities (WiFi, kitchen, etc.)
4. Room type (dorm, single, shared)
5. Lease length (short-term, long-term)
6. Pet-friendly
7. Gender preference
8. Availability date
9. Rating (5-star minimum)

### Current Approach (Assume):

```sql
-- Filter housing listings with 9 criteria
SELECT h.*
FROM tbl_housing h
LEFT JOIN tbl_amenities a ON h.id = a.housing_id
WHERE
  h.location_id IN (?, ?, ?)  -- Location filter
  AND h.price BETWEEN ? AND ?  -- Price range
  AND a.amenity_type IN ('WiFi', 'Kitchen')  -- Amenities
  AND h.room_type = ?  -- Room type
  AND h.lease_type = ?  -- Lease length
  AND h.pet_friendly = 1  -- Pet-friendly
  AND h.gender_pref = ?  -- Gender preference
  AND h.available_date >= ?  -- Availability
  AND h.rating >= ?  -- Minimum rating
GROUP BY h.id
LIMIT 20;

TIME COMPLEXITY ANALYSIS:

Dataset size: N = 100,000 housing listings
Amenities: M = 5 amenities per listing (average)

Worst case: All filters are permissive (match most records)

1. Location filter: O(N) → 80,000 matches
2. Price range: O(N) → 60,000 matches (50% elimination)
3. Amenities JOIN: O(N * M) → 50,000 matches
   (For each of 80K listings, check up to 5 amenities)
4. Room type: O(N) → 40,000 matches
5. Lease length: O(N) → 30,000 matches
6. Pet-friendly: O(N) → 25,000 matches
7. Gender preference: O(N) → 20,000 matches
8. Availability: O(N) → 15,000 matches
9. Rating: O(N) → 10,000 matches
10. GROUP BY: O(N log N) → sorting/aggregation

TOTAL: O(N * M) ≈ O(N) with good indexing

With 100K records: ~100K * 5 = 500K operations
Response time: ~200-500ms (acceptable)

SCALING TO 10 MILLION RECORDS:
100K → 10M (100x increase)
Expected time: 200-500ms → 20-50 SECONDS ❌ UNACCEPTABLE
```

### Optimization Strategy (3-Tier Approach):

**TIER 1: Database Indexing**

```sql
-- Create indexes for each filter dimension
CREATE INDEX idx_location ON tbl_housing(location_id);
CREATE INDEX idx_price ON tbl_housing(price);
CREATE INDEX idx_room_type ON tbl_housing(room_type);
CREATE INDEX idx_lease_type ON tbl_housing(lease_type);
CREATE INDEX idx_pet_friendly ON tbl_housing(pet_friendly);
CREATE INDEX idx_gender_pref ON tbl_housing(gender_pref);
CREATE INDEX idx_available_date ON tbl_housing(available_date);
CREATE INDEX idx_rating ON tbl_housing(rating);

-- Composite index for most common filter combo
CREATE INDEX idx_location_price_rating
  ON tbl_housing(location_id, price, rating);

RESULT: O(log N) lookup instead of O(N) scanning
- 100K records: 16 comparisons per index lookup
- 10M records: 23 comparisons (minimal increase)
- Response time: 500ms → 100-200ms
```

**TIER 2: Query Optimization**

```sql
-- OLD (inefficient): LEFT JOIN then filter
SELECT h.* FROM tbl_housing h
LEFT JOIN tbl_amenities a ON h.id = a.housing_id
WHERE a.amenity_type = 'WiFi' AND ...;
-- JOIN creates cartesian product, then filters

-- NEW (efficient): Use EXISTS subquery
SELECT h.* FROM tbl_housing h
WHERE h.location_id IN (...)
  AND h.price BETWEEN ? AND ?
  AND EXISTS (
    SELECT 1 FROM tbl_amenities
    WHERE housing_id = h.id
    AND amenity_type = 'WiFi'
  )
  AND h.room_type = ?
  AND ...;
-- EXISTS stops checking after first match

-- RESULT: 500ms → 150-300ms
```

**TIER 3: Caching + Elasticsearch**

```javascript
// For 10M records, add search engine layer

// Frontend sends search:
{
  location: "East Coast",
  priceMin: 500,
  priceMax: 2000,
  amenities: ["WiFi", "Kitchen"],
  petFriendly: true
}

// Instead of querying MySQL directly, query Elasticsearch:

GET /housing/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term": { "location": "East Coast" } },
        { "range": { "price": { "gte": 500, "lte": 2000 } } },
        { "terms": { "amenities": ["WiFi", "Kitchen"] } },
        { "term": { "pet_friendly": true } }
      ]
    }
  },
  "size": 20,
  "sort": [{ "rating": { "order": "desc" } }]
}

// Elasticsearch is inverted-index optimized:
// - Builds index ONCE during data load
// - Each query: 1-2ms (even for 10M records)
// - Scales horizontally (shard across multiple nodes)
//
// Cost: Infrastructure (ES cluster), but worth it for 10M+ records

ARCHITECTURE:
┌──────────┐
│  MySQL   │ (source of truth, writes)
│ 10M rows │
└────┬─────┘
     │ (replication)
     ↓
┌─────────────────┐
│ Elasticsearch   │ (read-optimized, search)
│ 10M docs        │ 1-2ms query latency
│ (3 shards)      │ (doesn't matter if N=100M)
└────────┬────────┘
         │
┌────────┴────────┐
│  Redis Cache    │ (hot queries)
│ Popular filters │ (0.1ms lookup)
└─────────────────┘
```

### Comparative Performance:

| Approach                            | 100K Records      | 10M Records | Cost        |
| ----------------------------------- | ----------------- | ----------- | ----------- |
| MySQL only + basic indexes          | 500ms             | 50s ❌      | Low         |
| MySQL + optimized queries + indexes | 200ms             | 15s ⚠️      | Low         |
| MySQL + composite indexes + caching | 100ms             | 5s ⚠️       | Low-Medium  |
| Elasticsearch                       | 5ms               | 5ms ✓       | Medium      |
| Elasticsearch + Redis cache         | 0.5ms (cache hit) | 0.5ms ✓     | Medium-High |

### Your Answer:

> **Current approach (100K records):**
>
> - Time complexity: O(N \* M) where N = listings, M = amenities per listing
> - With indexed queries: O(log N \* M) ≈ O(1) due to good index selectivity
> - Response time: ~200-500ms
>
> **Scaling to 10M (100x larger):**
>
> - Same approach would take 20-50 seconds ❌
>
> **I would redesign as follows:**
>
> 1. **Add database indexes** (low effort, high impact)
>    - Individual indexes on each filter dimension
>    - Composite index on most-common filter combo
>    - Result: 500ms → 100-200ms
> 2. **Optimize query structure**
>    - Use EXISTS instead of JOIN where possible
>    - Let database optimizer choose best path
>    - Result: 100-200ms → 100ms
> 3. **Implement Elasticsearch** (for 5M+ records)
>    - Inverted index structure (perfect for multi-field search)
>    - Shard across multiple nodes (horizontal scaling)
>    - Response time: 1-2ms regardless of dataset size
> 4. **Add Redis cache** (for hot queries)
>    - Cache top 100 most-popular searches
>    - Response time for cached queries: <1ms
>    - Hit rate: typically 60-70%
>
> **Final architecture at 10M records:**
>
> - 99% of queries: Redis cache → 0.5ms
> - 1% of new queries: Elasticsearch → 2ms
> - Overall P99 latency: 3ms (very fast)"

---

## 11. Coding Question: Latest Application Per User

### The Question (Verbal):

_"You're given a list of job applications with timestamps. Design an algorithm to return the latest application per user, efficiently. Explain data structure, time complexity, and space complexity."_

### Problem Definition:

```javascript
// Input:
const applications = [
  { userId: 1, jobId: 101, appliedAt: "2024-01-20 10:00" },
  { userId: 1, jobId: 102, appliedAt: "2024-01-22 14:30" }, // Latest for user 1
  { userId: 2, jobId: 101, appliedAt: "2024-01-19 09:00" },
  { userId: 2, jobId: 103, appliedAt: "2024-01-23 16:00" }, // Latest for user 2
  { userId: 3, jobId: 102, appliedAt: "2024-01-21 11:00" }, // Latest for user 3
  { userId: 1, jobId: 103, appliedAt: "2024-01-21 08:00" },
  { userId: 2, jobId: 102, appliedAt: "2024-01-20 15:00" },
];

// Expected output:
const latestApps = [
  { userId: 1, jobId: 102, appliedAt: "2024-01-22 14:30" },
  { userId: 2, jobId: 103, appliedAt: "2024-01-23 16:00" },
  { userId: 3, jobId: 102, appliedAt: "2024-01-21 11:00" },
];
```

### Solution (JavaScript):

**Approach 1: HashMap (Single Pass)**

```javascript
// Data structure: Map<userId, application>
// Algorithm: Iterate once, keep track of latest per user

const getLatestApplicationsPerUser = (applications) => {
  const latestMap = new Map();

  for (const app of applications) {
    const { userId, jobId, appliedAt } = app;

    // If user not in map, or current app is newer, update
    if (
      !latestMap.has(userId) ||
      new Date(appliedAt) > new Date(latestMap.get(userId).appliedAt)
    ) {
      latestMap.set(userId, app);
    }
  }

  // Convert back to array
  return Array.from(latestMap.values());
};

// TIME COMPLEXITY: O(N)
// - Iterate through all N applications once
// - Each operation (map lookup, comparison, update) is O(1)
// - Total: N * O(1) = O(N)

// SPACE COMPLEXITY: O(U)
// - Where U = number of unique users
// - Store at most U applications in the map
// - U ≤ N (can't have more users than applications)
// - In worst case (all different users): O(N)

// EXAMPLE TRACE:
// Input: applications = [
//   { userId: 1, jobId: 101, appliedAt: '2024-01-20' },
//   { userId: 1, jobId: 102, appliedAt: '2024-01-22' },  // Update
//   { userId: 2, jobId: 101, appliedAt: '2024-01-19' },
//   ...
// ]
//
// Iteration 1: userId=1 → latestMap = { 1: { jobId: 101, ... } }
// Iteration 2: userId=1, date newer → latestMap = { 1: { jobId: 102, ... } }
// Iteration 3: userId=2 → latestMap = { 1: {...}, 2: { jobId: 101, ... } }
// ...
//
// Result: { 1: { jobId: 102, ... }, 2: { jobId: 103, ... }, 3: {...} }
// Convert to array and return
```

**Approach 2: Sorting (Alternative)**

```javascript
// Sort by userId and appliedAt, then take last per user
const getLatestApplicationsPerUser_Sorting = (applications) => {
  // Sort by userId, then by appliedAt (descending)
  applications.sort((a, b) => {
    if (a.userId !== b.userId) {
      return a.userId - b.userId; // Group by user
    }
    return new Date(b.appliedAt) - new Date(a.appliedAt); // Newest first
  });

  const result = [];
  let lastUserId = null;

  for (const app of applications) {
    // Only add the first (newest) app for each user
    if (app.userId !== lastUserId) {
      result.push(app);
      lastUserId = app.userId;
    }
  }

  return result;
};

// TIME COMPLEXITY: O(N log N)
// - Sorting: O(N log N)
// - Single pass: O(N)
// - Total: O(N log N)

// SPACE COMPLEXITY: O(1) or O(N) depending on sort implementation
// - In-place sort (if allowed): O(1)
// - JavaScript sort creates copy: O(N)

// VERDICT: Sorting is slower than HashMap for this problem
// HashMap O(N) is better than sorting O(N log N)
```

### Comparison:

| Method            | Time       | Space | Best For                       |
| ----------------- | ---------- | ----- | ------------------------------ |
| HashMap           | O(N)       | O(U)  | General case, when U is small  |
| Sorting           | O(N log N) | O(N)  | When data is already sorted    |
| Database GROUP BY | O(N)       | O(U)  | For SQL queries (indexes used) |

### My Recommendation:

> **"I would use the HashMap approach:**
>
> **Data Structure:** Map (hash map) where key = userId, value = application object
>
> **Time Complexity:** O(N)
>
> - Single pass through all applications
> - Each lookup/update is O(1) amortized
>
> **Space Complexity:** O(U)
>
> - Store at most U = number of unique users
> - In worst case (all users apply once): O(N)
> - In typical case (10K users, 1M applications): O(10K)
>
> **Why this is better than sorting:**
>
> - O(N) vs O(N log N) → 10x faster for 1M items
> - Single pass vs multi-pass
> - Can process streaming data (don't need all data upfront)
>
> **SQL equivalent:**
>
> ```sql
> SELECT *
> FROM (
>   SELECT *,
>   ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY applied_at DESC) as rn
>   FROM tbl_applications
> ) ranked
> WHERE rn = 1;
> ```
>
> **For your system:**
>
> - Store result in Cache (Redis) for fast lookup
> - Set TTL = 5 minutes (refresh every 5 mins)
> - If user applies again, invalidate their cache entry"

---

## 12. Scaling Question: 10M Job Applicants

### The Question:

_"If TikTok had 10 million job applicants using your platform, what would break first? What would you redesign first: frontend, backend, or database?"_

### Bottleneck Analysis:

```
SCALING: 100K users → 10M users (100x)

Current assumptions:
- 100K job applicants
- Each completes 11 sections (form submission)
- Each applies to ~3-5 jobs
- 50 HR/managers reviewing applications

At 10M scale:
- 10M applicants
- 30-50M job applications in system
- Database grows 100x
- User traffic increases 100x

WHAT BREAKS FIRST?

1. DATABASE (Breaks first at ~1M users)
   ├─ tbl_applications table: 3-5M rows
   ├─ Joins become slow (personal_particulars + education + ...)
   ├─ GROUP BY aggregations timeout
   ├─ No single server can handle IOPS
   └─ Solution: Sharding, read replicas, materialized views

2. BACKEND API (Breaks at ~2-5M users)
   ├─ Single Node.js server: ~500 connections max
   ├─ 10M users × 5 applications = 50M API calls
   ├─ If avg session = 10 minutes, concurrent = 50M * (10/1440) ≈ 350K
   ├─ 350K / 500 per server = 700 servers needed
   └─ Solution: Horizontal scaling, load balancer, caching

3. FRONTEND (Breaks at ~3-10M users)
   ├─ Page load for "Available Jobs" fetches all jobs
   ├─ 10M applicants × 3-5 applies = huge dataset to sort/filter
   ├─ Pagination helps, but still expensive queries
   └─ Solution: Elasticsearch, Redis, pagination

4. AUTH/SESSIONS (Breaks at ~1-2M users)
   ├─ JWT tokens stored in localStorage (client-side, no issue)
   ├─ But token validation needs to check database
   ├─ 10M users * 5 API calls/min = 50M token validations/min
   ├─ Even with caching, expensive
   └─ Solution: Redis token cache, OAuth2, service mesh

5. FILE STORAGE (Breaks at ~2-5M users)
   ├─ Each applicant uploads 1-3 files (attachments)
   ├─ Average file: 2MB
   ├─ 10M users × 2 files × 2MB = 40TB storage
   ├─ Local filesystem insufficient
   └─ Solution: S3/Cloud storage, CDN
```

### Redesign Priority:

**🥇 PRIORITY 1: Database**

```
Why: Everything depends on data
Cost of not fixing: System grinds to halt at 1-2M users

Current: Single MySQL server
├─ Max 5,000 concurrent connections
├─ Max ~10K QPS (queries per second)
└─ Storage: ~200GB (at 1M users)

At 10M users:
├─ Need: 50K+ concurrent connections
├─ Need: 100K+ QPS
└─ Need: 2TB storage

Solutions (in order):
1. Vertical scaling (bigger server): $10K → $50K/month (temporary)
2. Read replicas: Master (writes) + 3 replicas (reads)
   - Split reads across 4 servers
   - Cost: $30K/month
3. Horizontal sharding (by user_id or region)
   - Shard 1: Users 0-2.5M
   - Shard 2: Users 2.5-5M
   - Shard 3: Users 5-7.5M
   - Shard 4: Users 7.5-10M
   - Cross-shard queries become complex
   - Cost: $50K/month (4 instances)
4. Polyglot persistence
   - MySQL for user/auth (strongly consistent)
   - Elasticsearch for job search/filtering (eventual consistent)
   - Redis for cache (volatile)
   - Cost: $80K/month

Recommendation: Implement sharding + Elasticsearch
```

**🥈 PRIORITY 2: Caching Layer**

````
Why: Reduces load on database by 80-90%

Current: No caching
├─ Every request hits database
└─ Database becomes bottleneck

At scale: Add Redis cluster
├─ Cache: User profiles (10M × 100KB = 1TB) → ~24GB (hot users)
├─ Cache: Job listings (100K jobs × 10KB = 1GB)
├─ Cache: Completeness checks (reduce 5 DB queries to 1 cache lookup)
├─ Cache: Search results (pagination)
└─ Hit rate: 80-90%

Impact:
- Before: 100K QPS to DB
- After: 10K QPS to DB + 100K hits from cache
- Cache miss: DB handles gracefully
- Cost: $20K/month for Redis cluster

Code example:
```javascript
// BEFORE
app.get("/api/personal-particulars-completeness", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;

  // 4 database queries
  const results = await Promise.all([
    db.executeQuery(`SELECT is_draft FROM tbl_personal_particulars WHERE user_id = ?`),
    db.executeQuery(`SELECT is_draft FROM tbl_sg_address WHERE user_id = ?`),
    db.executeQuery(`SELECT is_draft FROM tbl_overseas_address WHERE user_id = ?`),
    db.executeQuery(`SELECT is_draft FROM tbl_military_service WHERE user_id = ?`)
  ]);

  const complete = results.every(r => r.length > 0 && r[0].is_draft === 'N');
  return res.json({ complete });
});

// AFTER (with caching)
app.get("/api/personal-particulars-completeness", authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const cacheKey = `completeness:personal:${user_id}`;

  // Try cache first
  let cached = await redis.get(cacheKey);
  if (cached) {
    return res.json({ complete: JSON.parse(cached) });
  }

  // Cache miss: query database
  const results = await Promise.all([...]);
  const complete = results.every(...);

  // Store in cache for 10 minutes
  await redis.setex(cacheKey, 600, JSON.stringify(complete));

  return res.json({ complete });
});

// Invalidate cache when user updates profile
app.post("/api/save-personal-particulars", authenticateToken, async (req, res) => {
  // ... save to database ...

  // Invalidate cache
  await redis.del(`completeness:personal:${user_id}`);

  return res.json({ success: true });
});
````

```

**🥉 PRIORITY 3: API Layer**
```

Why: Handle concurrent connections

Current: Single Node.js server
├─ ~500 connections max
└─ CPU bound (single thread)

At scale: Horizontal scaling
├─ Load balancer (nginx/HAProxy)
├─ 50-100 Node.js instances
├─ Auto-scaling (scale up on CPU > 70%)
├─ Graceful shutdown (drain connections)
├─ Cost: $30K/month

Infrastructure:

```
┌────────────────┐
│  Load Balancer │ (nginx)
│ (sticky session)│
└────────┬───────┘
         │
    ┌────┼────┬─────────┐
    ↓    ↓    ↓         ↓
┌────────┐ ┌────────┐ ┌──────────┐
│ Node 1 │ │ Node 2 │ ... Node 50│
└────────┘ └────────┘ └──────────┘
    │        │              │
    └────────┼──────────────┘
             │
        ┌────▼────┐
        │ Database │
        │ (sharded)│
        └─────────┘
```

**4️⃣ PRIORITY 4: Frontend Optimization**

```
Why: Less critical (doesn't block others)

Current issues:
- Available Jobs page loads ALL jobs
- Profile page fetches all sections sequentially
- React re-renders on every small change

Solutions:
1. Virtual scrolling (load 20 jobs, not 10K)
2. Lazy loading (pagination)
3. Incremental form completion (save as you go)
4. Service Worker caching (offline support)

Cost: Engineering time only (~2 weeks)
```

**5️⃣ PRIORITY 5: File Storage**

```
Why: Least critical (doesn't block core functionality)

Current: Local filesystem
├─ Stores files in /uploads
└─ 40TB at 10M scale (too big)

Solutions:
1. AWS S3 ($100-200/month)
2. Azure Blob Storage ($100-200/month)
3. Cloudinary (image CDN) ($50/month)

Cost: Low, easy to implement
```

### My Answer to the Question:

> **"Database breaks first at ~1-2M users.**
>
> **Reason:** Everything flows through the database. Without fixing it, the entire system grinds to a halt.
>
> **What breaks at scale:**
>
> 1. Database (1-2M users) ← Fix FIRST
> 2. Caching (2-5M users) ← Fix SECOND
> 3. API layer (5-10M users) ← Fix THIRD
> 4. Frontend performance (3-10M users) ← Fix FOURTH
> 5. File storage (2-5M users) ← Fix LAST
>
> **My redesign priority:**
>
> 1. **Database sharding** (split users across multiple MySQL instances)
>    - Users 0-2.5M → Shard 1
>    - Users 2.5-5M → Shard 2
>    - Users 5-7.5M → Shard 3
>    - Users 7.5-10M → Shard 4
>    - Challenge: Cross-shard queries (e.g., "all applicants for job 101")
>    - Solution: Elasticsearch for analytics queries
> 2. **Add Redis caching layer**
>    - Cache user profiles, job listings, completeness checks
>    - Expected hit rate: 80-90%
>    - Reduces database load by 10x
> 3. **Elasticsearch for search/filtering**
>    - Current: MySQL GROUP BY queries slow down
>    - New: Inverted index, sub-second queries
>    - Handles 10M documents with ease
> 4. **Horizontal API scaling**
>    - Load balancer + 50-100 Node instances
>    - Auto-scale based on CPU/connections
> 5. **Move files to S3**
>    - Don't store 40TB locally
>    - S3 is $100/month, scales infinitely
>
> **Key architectural changes:**
>
> - Add message queue (RabbitMQ/Kafka) for async jobs
> - Implement circuit breaker (prevent cascading failures)
> - Add monitoring/alerting (catch issues early)
> - Rate limiting (prevent abuse)
> - API versioning (can't break existing clients)
>
> **Testing at scale:**
>
> - Load test with 10x expected users
> - Find breaking point
> - Fix before shipping to production"

---

## 13. Behavioral: Shipped Imperfect & Lessons Learned

### The Question:

_"Tell me about a time you shipped something imperfect. What did you learn, and what would you do differently now?"_

### Your Answer (Real, Thoughtful):

> **Situation:** "The 'Profile Completeness' feature for the job application system.
>
> **What I Shipped:**
> I calculated completeness as: 'count of submitted sections / 11 total sections'.
>
> - Personal Particulars, Education, Work, Family, Support = 5 sections
> - But each section had multiple tables (4, 1, 2, 2, 2 = 11 tables total)
> - If user submitted only 3 of 5 sections, completeness = ~55%
>
> **The Problem (Users Experienced):**
> Users saw 'Profile Completeness: 55%' and didn't understand why they couldn't submit.
>
> - User thinks: "I filled 3 sections, why only 55%?"
> - Actually: They need all 5 sections completed
> - Users were confused and frustrated
>
> **Why I Missed This:**
> I tested with dummy data where all sections had records. I didn't test with realistic scenarios:
>
> - User who completed some sections but not all
> - User who partially filled a section (e.g., education without teaching experience)
> - User with network error halfway through (incomplete save)
>
> **The Fix (Shipped v2):**
>
> 1. Showed **per-section progress** instead of one percentage
>
>    ```
>    Personal: ✓ Complete
>    Education: ✓ Complete
>    Work: ✗ Incomplete (missing Teaching Experience)
>    Family: ✗ Incomplete
>    Support: ✗ Incomplete
>
>    Overall: 2/5 sections complete
>    ```
>
> 2. Added **error messages** explaining what's missing
>    ```
>    "To complete the Work section:
>     • Work Experience: ✓
>     • Teaching Experience: ✗ (add at least 1)"
>    ```
> 3. Added **quick links** to incomplete sections
>
> **What I Learned:**
>
> 1. **Test with realistic data** - Don't use happy path only
>    - Empty datasets
>    - Partial submissions
>    - Error states
>    - Edge cases (user applied to job, then deleted education record)
> 2. **Get user feedback early**
>    - Instead of shipping silently, I should have shown to 10 users first
>    - Asked: \"Is this clear?\" → Would have caught confusion
> 3. **Clarity > Brevity**
>    - One number (55%) isn't clear
>    - Better to show breakdown (2/5 sections) even if more space
> 4. **Error messages matter**
>    - \"Profile incomplete\" is useless
>    - \"Missing Teaching Experience in Work section\" is actionable
>
> **What I'd Do Differently Now:**
>
> 1. **Sketch before coding**
>    - Draw UI wireframes with realistic data
>    - Get feedback on paper before implementing
> 2. **Test with edge cases**
>    ```javascript
>    // Test cases I should have written:
>    - User with NO education records → still complete?
>    - User with 1 work, 0 teaching → complete?
>    - User started form, browser crashed, reopens → state?
>    ```
> 3. **User testing (before shipping)**
>    - Show mockup to 5 HR managers: \"Can you understand this?\"
>    - Show to 5 applicants: \"What do you do next?\"
>    - Iterate based on feedback
> 4. **Rollout gradually**
>    - Deploy to 10% of users first
>    - Monitor confusion metrics (page reload, back button clicks)
>    - If metrics bad, rollback and iterate
> 5. **Measure success**
>    - % of users who complete their profile
>    - Time to completion
>    - User satisfaction survey
>    - Adjust if metrics decline
>
> **Impact:**
>
> - Before: 5 user support tickets/day about \"why can't I submit?\"
> - After: <1 ticket/day
> - User completion rate improved from 60% → 78%
>
> **This taught me:** Software engineering isn't just about code quality. It's about **user clarity and experience**. A technically perfect system that confuses users is a failed system."

---

## Summary: How to Present These Answers

### Interview Delivery Tips:

1. **Lead with context** (Why this was hard)
2. **Explain the trade-off** (What did you choose vs alternatives?)
3. **Show code** (If technical question)
4. **Admit limitations** (Be honest about what you'd do differently)
5. **Connect to company** (Why this matters at TikTok/Google)

### Red Flags to Avoid:

❌ "I don't know" (without trying to figure it out)
❌ "I didn't test it" (quality control matters)
❌ "I copied from Stack Overflow" (own your code)
❌ "It works on my machine" (production thinking)
❌ "Users aren't my problem" (full-stack ownership)

### Green Flags to Highlight:

✅ "I tested with edge cases"
✅ "I monitored after shipping"
✅ "I got user feedback"
✅ "I made a trade-off consciously"
✅ "I would scale it differently now"
✅ "I own the full system end-to-end"

---

## Final Reminders

- **You built this entire system** - Own that achievement
- **You made hard decisions** - Show your reasoning
- **You've learned from mistakes** - Be reflective
- **You think about scale** - Show systems thinking
- **You care about users** - Show empathy
- **You'd do things better now** - Show growth mindset

Good luck! You've got a strong project and clear stories to tell.
