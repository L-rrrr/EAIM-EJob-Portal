const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../dbConn");
const nodemailer = require("nodemailer");

const secretKey = crypto.randomBytes(32).toString("hex");
const pendingCodes = {};
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const requestRegisterCode = async (req, res) => {
  const { email } = req.body;
  // Check if email already exists
  const checkSql = `SELECT * FROM tbl_users WHERE email = ?`;
  const existingUsers = await db.executeQuery(checkSql, [email]);
  if (existingUsers.length > 0) {
    return res.status(400).json({ success: false, message: "This account already exists" });
  }
  // Generate code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  pendingCodes[email] = { code, expires: Date.now() + 10 * 60 * 1000 }; // 10 min expiry

  // Send code
  await transporter.sendMail({
    from: `"EAIM Job Portal" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your EAIM Registration Verification Code",
    html: `<p>Your verification code is: <b>${code}</b></p><p>This code will expire in 10 minutes.</p>`,
  });

  return res.json({ success: true, message: "Verification code sent to your email." });
};

const verifyRegisterCode = (req, res) => {
  const { email, code } = req.body;
  const entry = pendingCodes[email];
  if (!entry || entry.code !== code || Date.now() > entry.expires) {
    return res.status(400).json({ success: false, message: "Invalid or expired code." });
  }
  return res.json({ success: true });
};

// Generate token function - returns only the token
const generateToken = (payload) => {
  const token = jwt.sign(payload, secretKey, { algorithm: 'HS256' });
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

  const entry = pendingCodes[email];
  if (!entry || entry.code !== code || Date.now() > entry.expires) {
    return res.status(400).json({ success: false, message: "Invalid or expired verification code." });
  }
  // Remove code after use
  delete pendingCodes[email];

  try {
    const checkSql = `SELECT * FROM tbl_users WHERE email = ?`;
    const existingUsers = await db.executeQuery(checkSql, [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: "This account already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insertSql = `INSERT INTO tbl_users (email, password, first_name, last_name, nationality, role) VALUES (?, ?, ?, ?, ?, "Applicant")`;
    await db.executeQuery(insertSql, [email, hashed, first_name, last_name, nationality]);

    return res.status(201).json({ success: true, message: "Registration successful" });
  } catch (e) {
    console.error("Registration error:", e);
    return res.status(500).json({ success: false, message: "Registration failed", error: e.message });
  }
};




const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const rows = await db.executeQuery(`SELECT * FROM tbl_users WHERE email = ?`, [email]);

    if (!rows.length) {
      console.log("User not found");
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    const isMatch = await bcrypt.compare(password, rows[0].password);
    const userRole = rows[0].role;
    
    if (email !== "admin") {
      if (role && role !== userRole) {
        return res.status(403).json({ success: false, message: "Access denied: Incorrect role" });
      };

      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      };
    } else {
      if (!isMatch) {
        return res.status(401).json({ success: false, message: "Invalid password" });
      }
    }

  
    const payload = {
      user_id: rows[0].user_id,
      email: rows[0].email,
      role: rows[0].role,
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID()
    };

    // Generate token using the function
    const token = generateToken(payload);

    return res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      token
    });
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
  changePassword,
  authenticateToken,
  requestRegisterCode,
  verifyRegisterCode,
  forgotPassword,
  resetPassword,
};