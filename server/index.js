const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const compression = require("compression");
require("dotenv").config();

const PORT = process.env.PORT;
const accountApi = require("./apiService/accountApi");
const authApi = require("./apiService/authApi");
const openaiApi = require("./apiService/openaiApi");
const authenticateToken = require("./apiService/authApi").authenticateToken;


const app = express();
const path = require("path");

// Serving files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(express.static("./"));
app.use(compression());

// Auth endpoints
app.post("/api/register", authApi.register);
app.post("/api/login", authApi.login);
app.post("/api/change-password", authenticateToken, authApi.changePassword);
app.post("/api/forgot-password", authApi.forgotPassword);
app.post("/api/reset-password", authApi.resetPassword);

// Email verification endpoints
app.post("/api/request-register-code", authApi.requestRegisterCode);
app.post("/api/verify-register-code", authApi.verifyRegisterCode);

//Jobs endpoints
app.post("/api/post-jobs", authenticateToken, accountApi.postJobs);
app.put("/api/jobs/:id", authenticateToken, accountApi.updateJob);
app.get("/api/jobs", authenticateToken, accountApi.getJobs);
app.get("/api/jobs/:id", authenticateToken, accountApi.getJobById);
app.delete("/api/jobs/:id", authenticateToken, accountApi.deleteJob);

//Bookmarks endpoints
app.post("/api/post-bookmarks", authenticateToken, accountApi.bookmarkJob);
app.get("/api/bookmarks", authenticateToken, accountApi.getBookmarks);
app.delete("/api/bookmarks", authenticateToken, accountApi.deleteBookmark);

//Sg Address endpoints
app.post("/api/save-sg-address", authenticateToken, accountApi.saveSgAddress);
app.get("/api/get-sg-address", authenticateToken, accountApi.getSgAddress);

//Personal particulars endpoints
app.post("/api/save-personal-particulars", authenticateToken, accountApi.savePersonalParticulars);
app.get("/api/get-personal-particulars", authenticateToken, accountApi.getPersonalParticulars);

//Overseas Address endpoints
app.post("/api/save-overseas-address", authenticateToken, accountApi.saveOverseasAddress);
app.get("/api/get-overseas-address", authenticateToken, accountApi.getOverseasAddress);

//Military Service endpoints
app.post("/api/save-military-service", authenticateToken, accountApi.saveMilitaryService);
app.get("/api/get-military-service", authenticateToken, accountApi.getMilitaryService);

//Education endpoints
app.post("/api/save-education", authenticateToken, accountApi.saveEducationBackground);
app.get("/api/get-education", authenticateToken, accountApi.getEducationBackground);
app.delete("/api/delete-education", authenticateToken, accountApi.deleteEducationBackground);

//Scholarship and Awards endpoints
app.post("/api/save-scholarship-awards", authenticateToken, accountApi.saveScholarshipAwards);
app.get("/api/get-scholarship-awards", authenticateToken, accountApi.getScholarshipAwards);
app.delete("/api/delete-scholarship-awards", authenticateToken, accountApi.deleteScholarshipAwards);

//Other Qualifications endpoints
app.post("/api/save-other-qualifications", authenticateToken, accountApi.saveOtherQualifications);
app.get("/api/get-other-qualifications", authenticateToken, accountApi.getOtherQualifications);
app.delete("/api/delete-other-qualifications", authenticateToken, accountApi.deleteOtherQualifications);

//Work Experience endpoints
app.post("/api/save-work-experience", authenticateToken, accountApi.saveWorkExperience);
app.get("/api/get-work-experience", authenticateToken, accountApi.getWorkExperience);
app.delete("/api/delete-work-experience", authenticateToken, accountApi.deleteWorkExperience);

//Teaching Experience endpoints
app.post("/api/save-teaching-experience", authenticateToken, accountApi.saveTeachingExperience);
app.get("/api/get-teaching-experience", authenticateToken, accountApi.getTeachingExperience);
app.delete("/api/delete-teaching-experience", authenticateToken, accountApi.deleteTeachingExperience);

//Skills endpoints
app.post("/api/save-skills", authenticateToken, accountApi.saveSkills);
app.get("/api/get-skills", authenticateToken, accountApi.getSkills);
app.delete("/api/delete-skills", authenticateToken, accountApi.deleteSkills);

//Languages endpoints
app.post("/api/save-languages", authenticateToken, accountApi.saveLanguages);
app.get("/api/get-languages", authenticateToken, accountApi.getLanguages);
app.delete("/api/delete-languages", authenticateToken, accountApi.deleteLanguages);

//Family background endpoints
app.post("/api/save-family-background", authenticateToken, accountApi.saveFamilyBackground);
app.get("/api/get-family-background", authenticateToken, accountApi.getFamilyBackground);
app.delete("/api/delete-family-background", authenticateToken, accountApi.deleteFamilyBackground);

//Emergency contact endpoints
app.post("/api/save-emergency-contact", authenticateToken, accountApi.saveEmergencyContact);
app.get("/api/get-emergency-contact", authenticateToken, accountApi.getEmergencyContact);
app.delete("/api/delete-emergency-contact", authenticateToken, accountApi.deleteEmergencyContact);

//References endpoints
app.post("/api/save-references", authenticateToken, accountApi.saveReferences);
app.get("/api/get-references", authenticateToken, accountApi.getReferences); 
app.delete("/api/delete-references", authenticateToken, accountApi.deleteReferences);

//Attachments endpoints
app.post("/api/upload-file", authenticateToken, accountApi.uploadMiddleware, accountApi.uploadFile);
app.post("/api/save-attachments", authenticateToken, accountApi.saveAttachments);
app.get("/api/get-attachments", authenticateToken, accountApi.getAttachments);
app.delete("/api/delete-attachments", authenticateToken, accountApi.deleteAttachments);
app.delete("/api/replace-attachment-file", authenticateToken, accountApi.replaceAttachmentFile);

//Application submission endpoint
app.post("/api/submit-application", authenticateToken, accountApi.uploadMiddleware, accountApi.submitApplication);

// OpenAI endpoints
app.post("/api/ai/candidate-analysis", authenticateToken, openaiApi.analyzeCandidateProfile);

// Applied jobs endpoint
app.get("/api/applied-jobs", authenticateToken, accountApi.getAppliedJobs);
app.get("/api/applicants", authenticateToken, accountApi.getApplicants);

// Applicant information endpoint
app.get("/api/get-applicant-data/:userId", authenticateToken, accountApi.getApplicantPersonalParticulars);
app.get("/api/get-applicant-education/:userId", authenticateToken, accountApi.getApplicantEducation);
app.get("/api/get-applicant-work/:userId", authenticateToken, accountApi.getApplicantWork);
app.get("/api/get-applicant-family/:userId", authenticateToken, accountApi.getApplicantFamily);
app.get("/api/get-applicant-support/:userId", authenticateToken, accountApi.getApplicantSupport);

// Schedule interview endpoint
app.post("/api/schedule-interview", authenticateToken, accountApi.scheduleInterview);
app.get("/api/pending-applicants", authenticateToken, accountApi.getPendingApplicants);
app.get("/api/all-applicants", authenticateToken, accountApi.getAllApplicants);
app.get("/api/all-jobs", authenticateToken, accountApi.getAllJobs);
app.put("/api/interview/:id", authenticateToken, accountApi.updateInterview);
app.get("/api/interviews", authenticateToken, accountApi.getAllInterviews);
app.delete("/api/interview/:id", authenticateToken, accountApi.deleteInterview);

// Update application status endpoint
app.put("/api/application-status/:id", authenticateToken, accountApi.updateApplicationStatus);

// Check completeness endpoint
app.get("/api/personal-particulars-completeness", authenticateToken, accountApi.checkPersonalParticularsCompleteness);
app.get("/api/education-completeness", authenticateToken, accountApi.checkEducationCompleteness);
app.get("/api/work-completeness", authenticateToken, accountApi.checkWorkCompleteness);
app.get("/api/family-completeness", authenticateToken, accountApi.checkFamilyCompleteness);
app.get("/api/support-completeness", authenticateToken, accountApi.checkSupportCompleteness);

// Get full applicant profile endpoint
app.get("/api/get-full-applicant-profile/:userId", authenticateToken, accountApi.getFullApplicantProfile);

// User profile endpoints
app.get("/api/user-profile", authenticateToken, accountApi.getUserInfo);
app.put("/api/update-profile", authenticateToken, accountApi.updateUserInfo);

// Get applicants' nationality statistics
app.get("/api/applicant-nationality-stats", authenticateToken, accountApi.getApplicantNationalityStats);

// Get application status statistics
app.get("/api/application-status-stats", authenticateToken, accountApi.getApplicationStatusStats);


// Send email to user endpoint
app.post("/api/send-email", authenticateToken, accountApi.sendEmailToUser);

// Save application full details endpoint
app.post("/api/save-application-full-details", authenticateToken, accountApi.saveApplicationFullDetails);
app.get("/api/application-full-details", authenticateToken, accountApi.getApplicationFullDetails);

// Get application by ID endpoint
app.get("/api/application/:id", authenticateToken, accountApi.getApplicationById);

// Get country list endpoint
app.get("/api/countries", authenticateToken, accountApi.getCountryList);

// Save job requisition endpoint
app.post("/api/save-job-requisition", authenticateToken, accountApi.saveJobRequisition);
app.put("/api/update-job-requisition/:id", authenticateToken, accountApi.updateJobRequisition);
// Get all job requisitions by a manager
app.get("/api/my-job-requisitions", authenticateToken, accountApi.getMyJobRequisitions);
// Get all job requisitions by all managers
app.get("/api/all-job-requisitions", authenticateToken, accountApi.getAllJobRequisitionsWithRequestor);


// Get a specific job requisition's details 
app.get("/api/job-requisition/:id", authenticateToken, accountApi.getJobRequisitionDetails);
app.put("/api/job-requisition/:id/review", authenticateToken, accountApi.reviewJobRequisition);

// Assign manager to review candidate endpoint
app.get("/api/managers", authenticateToken, accountApi.getAllManagers);
app.post("/api/assign-manager-to-application", authenticateToken, accountApi.assignManagerToApplication);
app.get("/api/manager-review-applications", authenticateToken, accountApi.getManagerReviewApplications);

// Save assessment results endpoint
app.get("/api/get-assessment-details/:application_id", authenticateToken, accountApi.getAssessmentDetails);
app.post("/api/save-assessment", authenticateToken, accountApi.saveAssessment);

// Delete job requisition and post job endpoint
app.post("/api/job-requisition/:id/post-job", authenticateToken, accountApi.postVerifiedRequisitionAsJob);

// Find suitable candidates endpoint
app.post("/api/ai/assess-candidates", authenticateToken, openaiApi.assessCandidatesForJob);
app.get("/api/all-full-applicant-profiles", authenticateToken, accountApi.getAllFullApplicantProfiles);

// Get applicant's email by ID endpoint
app.get("/api/user-email/:userId", authenticateToken, accountApi.getUserEmailById);


app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


// // Sample/test
// app.get("/api/test", accountapi.testFunc);
// app.get("/api/test2", accountapi.testSelect);


