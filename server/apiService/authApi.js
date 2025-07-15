const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const db = require("../dbConn");


const secretKey = crypto.randomBytes(32).toString("hex");

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
  const { email, password, first_name, last_name, nationality } = req.body;
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

module.exports = {
  register,
  login,
  changePassword,
  authenticateToken,
};