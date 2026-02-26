const db = require("../db");

const findStaffByUsername = async (username) => {
  const rows = await db.executeQuery(
    "SELECT * FROM vw_staff WHERE user_name = ? LIMIT 1",
    [username]
  );
  return rows[0] || null;
};

const findSupervisorByEmpNo = async (empNo) => {
  const rows = await db.executeQuery(
    "SELECT 1 FROM vw_staff WHERE supervisor = ? LIMIT 1",
    [empNo]
  );
  return rows.length > 0;
};

const upsertPendingLoginCode = async (email, code, expiresAt) => {
  await db.executeQuery(
    `INSERT INTO tbl_pending_login_code (email, code, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
    [email, code, expiresAt]
  );
};

const getPendingLoginCodeByEmail = async (email) => {
  const rows = await db.executeQuery(
    "SELECT code, expires_at FROM tbl_pending_login_code WHERE email = ?",
    [email]
  );
  return rows[0] || null;
};

const findUserByEmail = async (email) => {
  const rows = await db.executeQuery("SELECT * FROM tbl_users WHERE email = ?", [email]);
  return rows[0] || null;
};

const upsertPendingRegisterCode = async (email, code, expiresAt) => {
  await db.executeQuery(
    `INSERT INTO tbl_pending_register_code (email, code, expires_at)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = VALUES(expires_at)`,
    [email, code, expiresAt]
  );
};

const getPendingRegisterCodeByEmail = async (email) => {
  const rows = await db.executeQuery(
    "SELECT code, expires_at FROM tbl_pending_register_code WHERE email = ?",
    [email]
  );
  return rows[0] || null;
};

const deletePendingRegisterCodeByEmail = async (email) => {
  await db.executeQuery("DELETE FROM tbl_pending_register_code WHERE email = ?", [email]);
};

const createUser = async ({ email, password, first_name, last_name, nationality }) => {
  await db.executeQuery(
    "INSERT INTO tbl_users (email, password, first_name, last_name, nationality) VALUES (?, ?, ?, ?, ?)",
    [email, password, first_name, last_name, nationality]
  );
};

const getUserPasswordById = async (userId) => {
  const rows = await db.executeQuery("SELECT password FROM tbl_users WHERE user_id = ?", [userId]);
  return rows[0] || null;
};

const updateUserPasswordById = async (userId, hashedPassword) => {
  await db.executeQuery("UPDATE tbl_users SET password = ? WHERE user_id = ?", [hashedPassword, userId]);
};

const saveResetTokenByEmail = async (email, token, expires) => {
  await db.executeQuery(
    "UPDATE tbl_users SET reset_password_token = ?, reset_password_expires = ? WHERE email = ?",
    [token, expires, email]
  );
};

const findUserByValidResetToken = async (token) => {
  const rows = await db.executeQuery(
    "SELECT * FROM tbl_users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
    [token]
  );
  return rows[0] || null;
};

const resetPasswordByToken = async (token, hashedPassword) => {
  await db.executeQuery(
    "UPDATE tbl_users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ?",
    [hashedPassword, token]
  );
};

module.exports = {
  findStaffByUsername,
  findSupervisorByEmpNo,
  upsertPendingLoginCode,
  getPendingLoginCodeByEmail,
  findUserByEmail,
  upsertPendingRegisterCode,
  getPendingRegisterCodeByEmail,
  deletePendingRegisterCodeByEmail,
  createUser,
  getUserPasswordById,
  updateUserPasswordById,
  saveResetTokenByEmail,
  findUserByValidResetToken,
  resetPasswordByToken,
};
