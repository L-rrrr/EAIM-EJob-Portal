const express = require("express");
const authApi = require("../controllers/authController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authApi.register);
router.post("/login", authApi.login);
router.post("/change-password", authenticateToken, authApi.changePassword);
router.post("/forgot-password", authApi.forgotPassword);
router.post("/reset-password", authApi.resetPassword);

router.post("/request-register-code", authApi.requestRegisterCode);
router.post("/verify-register-code", authApi.verifyRegisterCode);
router.post("/request-login-code", authApi.requestLoginCode);

module.exports = router;
