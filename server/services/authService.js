const bcrypt = require("bcrypt");
const crypto = require("crypto");
const authRepository = require("../repositories/authRepository");
const { generateToken } = require("../utils/token");
const {
  sendLoginVerificationCode,
  sendRegisterVerificationCode,
  sendResetPasswordMail,
} = require("../mail/authMail");

const createServiceError = (status, message, error) => ({ status, message, error });

const isCodeValid = (record, code) => {
  return !!record && String(record.code) === String(code) && new Date() <= new Date(record.expires_at);
};

const buildExpiresAtSgtPlusTen = () => {
  const now = new Date();
  return new Date(now.getTime() + (8 * 60 + 10) * 60 * 1000);
};

const createSixDigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();

const toSha1 = (value) => crypto.createHash("sha1").update(value).digest("hex");

const requestLoginCode = async ({ emailOrUsername, password }) => {
  const staff = await authRepository.findStaffByUsername(emailOrUsername);
  if (!staff) {
    throw createServiceError(404, "Account not found");
  }
  if (staff.staff_status !== "Active") {
    throw createServiceError(403, "Account is not active.");
  }
  if (!password) {
    throw createServiceError(400, "Password required to request login code.");
  }

  const sha1Password = toSha1(password);
  if (staff.user_password !== sha1Password) {
    throw createServiceError(401, "Invalid password");
  }

  const code = createSixDigitCode();
  const expiresAt = buildExpiresAtSgtPlusTen();

  await authRepository.upsertPendingLoginCode(staff.email, code, expiresAt);

  try {
    await sendLoginVerificationCode(staff.email, code);
  } catch (error) {
    console.error("Nodemailer error (login code):", error);
    throw createServiceError(500, "Failed to send login verification code", error.message);
  }

  return { success: true, message: "Verification code sent to your email." };
};

const requestRegisterCode = async ({ email }) => {
  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw createServiceError(400, "This account already exists");
  }

  const code = createSixDigitCode();
  const expiresAt = buildExpiresAtSgtPlusTen();

  await authRepository.upsertPendingRegisterCode(email, code, expiresAt);

  try {
    await sendRegisterVerificationCode(email, code);
  } catch (error) {
    console.error("Nodemailer error (register code):", error);
    throw createServiceError(500, "Failed to send registration verification code", error.message);
  }

  return { success: true, message: "Verification code sent to your email." };
};

const verifyRegisterCode = async ({ email, code }) => {
  const record = await authRepository.getPendingRegisterCodeByEmail(email);
  if (!isCodeValid(record, code)) {
    throw createServiceError(400, "Invalid or expired code.");
  }

  return { success: true };
};

const register = async ({ email, password, first_name, last_name, nationality, code }) => {
  const record = await authRepository.getPendingRegisterCodeByEmail(email);
  if (!isCodeValid(record, code)) {
    throw createServiceError(400, "Invalid or expired verification code.");
  }

  await authRepository.deletePendingRegisterCodeByEmail(email);

  const existingUser = await authRepository.findUserByEmail(email);
  if (existingUser) {
    throw createServiceError(400, "This account already exists");
  }

  const hashed = await bcrypt.hash(password, 10);
  await authRepository.createUser({ email, password: hashed, first_name, last_name, nationality });

  return { success: true, message: "Registration successful", status: 201 };
};

const resolveStaffRole = async (staff) => {
  if (staff.dept_code === "DEP-10") return "HR";
  if (staff.dept_code === "DEP-09") return "Manager";

  const isSupervisor = await authRepository.findSupervisorByEmpNo(staff.emp_no);
  if (isSupervisor) return "Manager";

  throw createServiceError(403, "You are not assigned as HR or Manager.");
};

const login = async ({ emailOrUsername, password, code }) => {
  if (emailOrUsername.includes("@")) {
    const user = await authRepository.findUserByEmail(emailOrUsername);
    if (!user) {
      throw createServiceError(401, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw createServiceError(401, "Invalid password");
    }

    const token = generateToken({
      user_id: user.user_id,
      email: user.email,
      role: "Applicant",
      iat: Math.floor(Date.now() / 1000),
      jti: crypto.randomUUID(),
    });

    return { success: true, message: "Login successful", token, role: "Applicant" };
  }

  const staff = await authRepository.findStaffByUsername(emailOrUsername);
  if (!staff) {
    throw createServiceError(401, "User not found");
  }
  if (staff.staff_status !== "Active") {
    throw createServiceError(403, "Account is not active.");
  }

  const role = await resolveStaffRole(staff);

  const sha1Password = toSha1(password);
  if (staff.user_password !== sha1Password) {
    throw createServiceError(401, "Invalid password");
  }

  if (!code) {
    throw createServiceError(400, "Verification code required");
  }

  const codeRecord = await authRepository.getPendingLoginCodeByEmail(staff.email);
  if (!isCodeValid(codeRecord, code)) {
    throw createServiceError(400, "Invalid or expired verification code.");
  }

  const token = generateToken({
    user_id: staff.emp_no,
    email: staff.user_name,
    role,
    name: staff.staff_name,
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
  });

  return { success: true, message: "Login successful", token, role };
};

const changePassword = async ({ user_id, currentPassword, newPassword }) => {
  const user = await authRepository.getUserPasswordById(user_id);
  if (!user) {
    throw createServiceError(404, "User not found");
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw createServiceError(401, "Current password is incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await authRepository.updateUserPasswordById(user_id, hashed);

  return { success: true, message: "Password changed successfully" };
};

const forgotPassword = async ({ email }) => {
  const user = await authRepository.findUserByEmail(email);
  if (!user) {
    return { success: true, message: "If this email exists, a reset link has been sent." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000);

  await authRepository.saveResetTokenByEmail(email, token, expires);

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  await sendResetPasswordMail(email, resetUrl);

  return { success: true, message: "If this email exists, a reset link has been sent." };
};

const resetPassword = async ({ token, newPassword }) => {
  const user = await authRepository.findUserByValidResetToken(token);
  if (!user) {
    throw createServiceError(400, "Invalid or expired token.");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await authRepository.resetPasswordByToken(token, hashed);

  return { success: true, message: "Password has been reset successfully." };
};

module.exports = {
  requestLoginCode,
  requestRegisterCode,
  verifyRegisterCode,
  register,
  login,
  changePassword,
  forgotPassword,
  resetPassword,
};
