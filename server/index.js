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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());
app.use(express.static("./"));
app.use(compression());

// Auth endpoints
app.post("/api/register", authApi.register);
app.post("/api/login", authApi.login);

//Jobs endpoints
app.post("/api/post-jobs", accountApi.postJobs);
app.get("/api/jobs", accountApi.getJobs);

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


// OpenAI endpoints
app.post("/api/ai/candidate-analysis", authenticateToken, openaiApi.analyzeCandidateProfile);

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


// // Sample/test
// app.get("/api/test", accountapi.testFunc);
// app.get("/api/test2", accountapi.testSelect);


