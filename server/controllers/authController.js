const authService = require("../services/authService");

const sendError = (res, error, fallbackMessage) => {
  const status = error && error.status ? error.status : 500;
  const message = error && error.message ? error.message : fallbackMessage;
  const payload = { success: false, message };

  if (status === 500 && error && error.error) {
    payload.error = error.error;
  }

  return res.status(status).json(payload);
};

const requestLoginCode = async (req, res) => {
  try {
    const result = await authService.requestLoginCode(req.body);
    return res.json(result);
  } catch (error) {
    console.error("Error sending login code:", error);
    return sendError(res, error, "Failed to send verification code.");
  }
};

const requestRegisterCode = async (req, res) => {
  try {
    const result = await authService.requestRegisterCode(req.body);
    return res.json(result);
  } catch (error) {
    console.error("Error sending register code:", error);
    return sendError(res, error, "Failed to send registration verification code");
  }
};

const verifyRegisterCode = async (req, res) => {
  try {
    const result = await authService.verifyRegisterCode(req.body);
    return res.json(result);
  } catch (error) {
    return sendError(res, error, "Invalid or expired code.");
  }
};

const register = async (req, res) => {
  try {
    const result = await authService.register(req.body);
    const status = result.status || 201;
    return res.status(status).json({ success: result.success, message: result.message });
  } catch (error) {
    console.error("Registration error:", error);
    return sendError(res, error, "Registration failed");
  }
};

const login = async (req, res) => {
  try {
    const result = await authService.login(req.body);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Login error:", error);
    return sendError(res, error, "Login failed");
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await authService.changePassword({
      user_id: req.user.user_id,
      ...req.body,
    });
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, "Failed to change password");
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await authService.forgotPassword(req.body);
    return res.json(result);
  } catch (error) {
    return sendError(res, error, "Failed to process forgot password request");
  }
};

const resetPassword = async (req, res) => {
  try {
    const result = await authService.resetPassword(req.body);
    return res.json(result);
  } catch (error) {
    return sendError(res, error, "Failed to reset password");
  }
};

module.exports = {
  register,
  login,
  requestLoginCode,
  changePassword,
  requestRegisterCode,
  verifyRegisterCode,
  forgotPassword,
  resetPassword,
};