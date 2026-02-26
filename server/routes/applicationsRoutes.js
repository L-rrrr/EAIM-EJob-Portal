const express = require("express");
const accountApi = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/submit-application", authenticateToken, accountApi.uploadMiddleware, accountApi.submitApplication);

router.get("/applied-jobs", authenticateToken, accountApi.getAppliedJobs);
router.get("/applicants", authenticateToken, accountApi.getApplicants);

router.get("/get-applicant-data/:userId", authenticateToken, accountApi.getApplicantPersonalParticulars);
router.get("/get-applicant-education/:userId", authenticateToken, accountApi.getApplicantEducation);
router.get("/get-applicant-work/:userId", authenticateToken, accountApi.getApplicantWork);
router.get("/get-applicant-family/:userId", authenticateToken, accountApi.getApplicantFamily);
router.get("/get-applicant-support/:userId", authenticateToken, accountApi.getApplicantSupport);
router.get("/get-applicant-support-full/:userId", authenticateToken, accountApi.getApplicantSupportFullDetails);

router.post("/schedule-interview", authenticateToken, accountApi.scheduleInterview);
router.get("/pending-applicants", authenticateToken, accountApi.getPendingApplicants);
router.get("/all-applicants", authenticateToken, accountApi.getAllApplicants);
router.put("/interview/:id", authenticateToken, accountApi.updateInterview);
router.get("/interviews", authenticateToken, accountApi.getAllInterviews);
router.delete("/interview/:id", authenticateToken, accountApi.deleteInterview);

router.put("/application-status/:id", authenticateToken, accountApi.updateApplicationStatus);

router.get("/personal-particulars-completeness", authenticateToken, accountApi.checkPersonalParticularsCompleteness);
router.get("/education-completeness", authenticateToken, accountApi.checkEducationCompleteness);
router.get("/work-completeness", authenticateToken, accountApi.checkWorkCompleteness);
router.get("/family-completeness", authenticateToken, accountApi.checkFamilyCompleteness);
router.get("/support-completeness", authenticateToken, accountApi.checkSupportCompleteness);

router.get("/get-full-applicant-profile/:userId", authenticateToken, accountApi.getFullApplicantProfile);
router.get("/all-full-applicant-profiles", authenticateToken, accountApi.getAllFullApplicantProfiles);

router.get("/applicant-nationality-stats", authenticateToken, accountApi.getApplicantNationalityStats);
router.get("/application-status-stats", authenticateToken, accountApi.getApplicationStatusStats);

router.post("/send-email", authenticateToken, accountApi.sendEmailToUser);

router.post("/save-application-full-details", authenticateToken, accountApi.saveApplicationFullDetails);
router.get("/application-full-details", authenticateToken, accountApi.getApplicationFullDetails);
router.get("/application/:id", authenticateToken, accountApi.getApplicationById);

router.get("/managers", authenticateToken, accountApi.getAllManagers);
router.post("/assign-manager-to-application", authenticateToken, accountApi.assignManagerToApplication);
router.get("/manager-review-applications", authenticateToken, accountApi.getManagerReviewApplications);

router.get("/get-assessment-details/:application_id", authenticateToken, accountApi.getAssessmentDetails);
router.post("/save-assessment", authenticateToken, accountApi.saveAssessment);

router.get("/user-email/:userId", authenticateToken, accountApi.getUserEmailById);

module.exports = router;
