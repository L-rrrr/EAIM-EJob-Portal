const openAiService = require("../services/openAiService");

const sendError = (res, error, fallbackMessage) => {
  const status = error && error.status ? error.status : 500;
  const message = error && error.message ? error.message : fallbackMessage;
  const payload = {
    success: false,
    message,
  };

  if (error && error.error) {
    payload.error = error.error;
  }

  return res.status(status).json(payload);
};

const analyzeCandidateProfile = async (req, res) => {
  try {
    const result = await openAiService.analyzeCandidateProfile(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, "Failed to analyze candidate profile");
  }
};

const assessCandidatesForJob = async (req, res) => {
  try {
    const result = await openAiService.assessCandidatesForJob(req.body);
    return res.status(200).json(result);
  } catch (error) {
    return sendError(res, error, "Failed to assess candidates");
  }
};


module.exports = {
  analyzeCandidateProfile,
  assessCandidatesForJob
};