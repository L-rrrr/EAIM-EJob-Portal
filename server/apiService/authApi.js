const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../dbConn");

const register = async (req, res) => {
  const { username, password, firstName, lastName, nationality } = req.body;
  try {
    const checkSql = `SELECT * FROM tbl_users WHERE username = ?`;
    const existingUsers = await db.executeQuery(checkSql, [username]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ success: false, message: "This account already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const insertSql = `INSERT INTO tbl_users (username, password, firstName, lastName, nationality, role) VALUES (?, ?, ?, ?, ?, "Applicant")`;
    await db.executeQuery(insertSql, [username, hashed, firstName, lastName, nationality]);

    return res.status(201).json({ success: true, message: "Registration successful" });
  } catch (e) {
    console.error("Registration error:", e);
    return res.status(500).json({ success: false, message: "Registration failed", error: e.message });
  }
};

const login = async (req, res) => {
  const { username, password, role } = req.body;
  try {

    const rows = await db.executeQuery(`SELECT * FROM tbl_users WHERE username = ?`, [username]);

    if (!rows.length) {
      console.log("User not found");
      return res.status(401).json({ success: false, message: "User not found" });
    }
    
    const isMatch = await bcrypt.compare(password, rows[0].password);
    const userRole = rows[0].role;
    
    if (username !== "admin") {
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

    const token = jwt.sign(
      { user_id: rows[0].user_id, username: rows[0].username },
      process.env.JWT_SECRET,
      { expiresIn: "10h" } //this is just for testing, need to reduce the duration
    );

    return res.status(200).json({ success: true, message: "Login successful", token });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Login failed", error: e.message });
  }
};

module.exports = {
  register,
  login,
};