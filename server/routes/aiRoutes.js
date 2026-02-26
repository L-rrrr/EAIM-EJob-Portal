const express = require("express");
const openaiApi = require("../controllers/openAiController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/ai/candidate-analysis", authenticateToken, openaiApi.analyzeCandidateProfile);
router.post("/ai/assess-candidates", authenticateToken, openaiApi.assessCandidatesForJob);

module.exports = router;
