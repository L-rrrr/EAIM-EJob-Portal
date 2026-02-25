const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../db");
const nodemailer = require("nodemailer");

const secretKey = crypto.randomBytes(32).toString("hex");
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465, // true for SMTPS (port 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify transporter at startup to surface connection/auth issues early
transporter.verify().then(() => {
  console.log('SMTP transporter verified');
}).catch((err) => {
  console.error('SMTP transporter verify failed:', err && err.message ? err.message : err);
});

const requestLoginCode = async (req, res) => {
  const { emailOrUsername, password } = req.body;

  try {
    // Find HR/Manager in vw_staff by username or email
    const staffRows = await db.executeQuery(
      `SELECT * FROM vw_staff WHERE user_name = ? LIMIT 1`,
      [emailOrUsername]
    );
    if (!staffRows.length) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }
    const staff = staffRows[0];
    if (staff.staff_status !== "Active") {
      return res.status(403).json({ success: false, message: "Account is not active." });
    }

    // Require password verification before issuing a login code
    if (!password) {
      return res.status(400).json({ success: false, message: "Password required to request login code." });
    }
    const sha1Password = crypto.createHash("sha1").update(password).digest("hex");
    if (staff.user_password !== sha1Password) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    // Calculate Singapore time + 10 minutes for expires_at
    const now = new Date();
    // Add 10 minutes to current UTC time, then convert to Singapore time
    const expiresAt = new Date(now.getTime() + (8 * 60 + 10) * 60 * 1000);

    // Upsert code for this email
    await db.executeQuery(
      `INSERT INTO tbl_pending_login_code (email, code, expires_at)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
      [staff.email, code, expiresAt]
    );

    // Send code to staff email
    try {
      const info = await transporter.sendMail({
        from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
        to: staff.email,
        subject: "Your EAIM Login Verification Code",
        html: `<p>Your login verification code is: <b>${code}</b></p><p>This code will expire in 10 minutes.</p>`,
      });
      console.log('Nodemailer sent (login code):', info && info.messageId ? info.messageId : info);
    } catch (e) {
      console.error('Nodemailer error (login code):', e);
      return res.status(500).json({ success: false, message: 'Failed to send login verification code', error: e.message });
    }

    return res.json({ success: true, message: "Verification code sent to your email." });
  } catch (e) {
    console.error("Error sending login code:", e);
    return res.status(500).json({ success: false, message: "Failed to send verification code." });
  }
};

const requestRegisterCode = async (req, res) => {
  const { email } = req.body;

  // Check if email already exists in users table
  const checkSql = `SELECT * FROM tbl_users WHERE email = ?`;
  const existingUsers = await db.executeQuery(checkSql, [email]);
  if (existingUsers.length > 0) {
    return res.status(400).json({ success: false, message: "This account already exists" });
  }

  // Generate code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Calculate Singapore time + 10 minutes for expires_at
  const now = new Date();
  // Add 10 minutes to current UTC time, then convert to Singapore time
  const expiresAt = new Date(now.getTime() + (8 * 60 + 10) * 60 * 1000);

  // Upsert code for this email
  const upsertSql = `
    INSERT INTO tbl_pending_register_code (email, code, expires_at)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)
  `;
  await db.executeQuery(upsertSql, [email, code, expiresAt]);

  // Send code
  try {
    const info = await transporter.sendMail({
      from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your EAIM Registration Verification Code",
      html: `<p>Your verification code is: <b>${code}</b></p><p>This code will expire in 10 minutes.</p>`,
    });
    console.log('Nodemailer sent (register code):', info && info.messageId ? info.messageId : info);
  } catch (e) {
    console.error('Nodemailer error (register code):', e);
    return res.status(500).json({ success: false, message: 'Failed to send registration verification code', error: e.message });
  }

  return res.json({ success: true, message: "Verification code sent to your email." });
};

const verifyRegisterCode = async (req, res) => {
  const { email, code } = req.body;
  const sql = `SELECT code, expires_at FROM tbl_pending_register_code WHERE email = ?`;
  const rows = await db.executeQuery(sql, [email]);
  if (
    !rows.length ||
    rows[0].code != code ||
    new Date() > new Date(rows[0].expires_at)
  ) {
    return res.status(400).json({ success: false, message: "Invalid or expired code." });
  }
  return res.json({ success: true });
};

// Generate token function - returns only the token
const generateToken = (payload) => {
  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: '2h' }); // need to change the expiresIn to 1 hour (10 hours is for testing)
  return token;
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) return res.status(401).json({ success: false, message: "Access token required" });

  jwt.verify(token, secretKey, (err, user) => {
    if (err) return res.status(403).json({ success: false, message: "Invalid or expired token" });

    req.user = user; // user = { id, email }
    next();
  });
};

const register = async (req, res) => {
  const { email, password, first_name, last_name, nationality, code } = req.body;

  // Check code in DB
  const sql = `SELECT code, expires_at FROM tbl_pending_register_code WHERE email = ?`;
  const rows = await db.executeQuery(sql, [email]);
  if (
    !rows.length ||
    rows[0].code != code ||
    new Date() > new Date(rows[0].expires_at)
  ) {
    return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
  }

  // Remove code after use
  await db.executeQuery(`DELETE FROM tbl_pending_register_code WHERE email = ?`, [email]);

  try {
    const checkSql = `SELECT * FROM tbl_users WHERE email = ?`;
    const existingUsers = await db.executeQuery(checkSql, [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: "This account already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const insertSql = `INSERT INTO tbl_users (email, password, first_name, last_name, nationality) VALUES (?, ?, ?, ?, ?)`;
    await db.executeQuery(insertSql, [email, hashed, first_name, last_name, nationality]);

    return res.status(201).json({ success: true, message: "Registration successful" });
  } catch (e) {
    console.error("Registration error:", e);
    return res.status(500).json({ success: false, message: "Registration failed", error: e.message });
  }
};

const login = async (req, res) => {
  const { emailOrUsername, password, code } = req.body;
  try {
    // If input contains '@', treat as applicant (tbl_users)
    if (emailOrUsername.includes("@")) {
      const rows = await db.executeQuery(`SELECT * FROM tbl_users WHERE email = ?`, [emailOrUsername]);
      if (!rows.length) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
      const isMatch = await bcrypt.compare(password, rows[0].password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
      const payload = {
        user_id: rows[0].user_id,
        email: rows[0].email,
        role: "Applicant",
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID()
      };
      const token = generateToken(payload);
      return res.status(200).json({ success: true, message: "Login successful", token, role: "Applicant" });
    } else {
      // HR/Manager logic (vw_staff, SHA1)
      const staffRows = await db.executeQuery(
        `SELECT * FROM vw_staff WHERE user_name = ?`, [emailOrUsername]
      );
      if (!staffRows.length) {
        return res.status(401).json({ success: false, message: "User not found" });
      }
      const staff = staffRows[0];
      if (staff.staff_status !== "Active") {
        return res.status(403).json({ success: false, message: "Account is not active." });
      }
      // Determine role
      let role = "";
      if (staff.dept_code === "DEP-10") {
        role = "HR";
      } else if (staff.dept_code === "DEP-09") {
        role = "Manager";
      } else {
        // Check if user is a manager (supervisor logic)
        const supervisorRows = await db.executeQuery(
          `SELECT 1 FROM vw_staff WHERE supervisor = ? LIMIT 1`, [staff.emp_no]
        );
        if (supervisorRows.length) {
          role = "Manager";
        } else {
          return res.status(403).json({ success: false, message: "You are not assigned as HR or Manager." });
        }
      }
      // Check password (SHA1)
      const sha1Password = crypto.createHash("sha1").update(password).digest("hex");
      if (staff.user_password !== sha1Password) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }

      // Require and check verification code
      if (!code) {
        return res.status(400).json({ success: false, message: "Verification code required" });
      }
      const codeRows = await db.executeQuery(
        `SELECT code, expires_at FROM tbl_pending_login_code WHERE email = ?`,
        [staff.email]
      );

      if (
        !codeRows.length ||
        String(codeRows[0].code) !== code ||
        new Date() > new Date(codeRows[0].expires_at)
      ) {
        return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
      }

      const payload = {
        user_id: staff.emp_no,
        email: staff.user_name,
        role,
        name: staff.staff_name,
        iat: Math.floor(Date.now() / 1000),
        jti: crypto.randomUUID()
      };
      const token = generateToken(payload);
      return res.status(200).json({ success: true, message: "Login successful", token, role });
    }
  } catch (e) {
    console.error("Login error:", e);
    return res.status(500).json({ success: false, message: "Login failed", error: e.message });
  }
};


// Change password for logged-in user
const changePassword = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { currentPassword, newPassword } = req.body;

    // Get current hashed password from DB
    const sql = `SELECT password FROM tbl_users WHERE user_id = ?`;
    const rows = await db.executeQuery(sql, [user_id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.executeQuery(`UPDATE tbl_users SET password = ? WHERE user_id = ?`, [hashed, user_id]);

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Failed to change password", error: e.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const sql = `SELECT * FROM tbl_users WHERE email = ?`;
  const users = await db.executeQuery(sql, [email]);
  if (!users.length) {
    // Always respond with success to prevent email enumeration
    return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
  }
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  await db.executeQuery(
    `UPDATE tbl_users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?`,
    [token, expires, email]
  );
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Reset your EAIM password",
    html: `<p>Click the link below to reset your password:</p>
           <p><a href="${resetUrl}">${resetUrl}</a></p>
           <p>This link will expire in 1 hour.</p>`
  });
  return res.json({ success: true, message: "If this email exists, a reset link has been sent." });
};

// Reset password using token when the user forgets their password
const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const sql = `SELECT * FROM tbl_users WHERE reset_password_token = ? AND reset_password_expires > NOW()`;
  const users = await db.executeQuery(sql, [token]);
  if (!users.length) {
    return res.status(400).json({ success: false, message: "Invalid or expired token." });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  await db.executeQuery(
    `UPDATE tbl_users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ?`,
    [hashed, token]
  );
  return res.json({ success: true, message: "Password has been reset successfully." });
};

module.exports = {
  register,
  login,
  requestLoginCode,
  changePassword,
  authenticateToken,
  requestRegisterCode,
  verifyRegisterCode,
  forgotPassword,
  resetPassword,
};