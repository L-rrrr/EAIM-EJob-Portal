const express = require("express");
const accountApi = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save-sg-address", authenticateToken, accountApi.saveSgAddress);
router.get("/get-sg-address", authenticateToken, accountApi.getSgAddress);

router.post("/save-personal-particulars", authenticateToken, accountApi.savePersonalParticulars);
router.get("/get-personal-particulars", authenticateToken, accountApi.getPersonalParticulars);

router.post("/save-overseas-address", authenticateToken, accountApi.saveOverseasAddress);
router.get("/get-overseas-address", authenticateToken, accountApi.getOverseasAddress);

router.post("/save-military-service", authenticateToken, accountApi.saveMilitaryService);
router.get("/get-military-service", authenticateToken, accountApi.getMilitaryService);

router.post("/save-education", authenticateToken, accountApi.saveEducationBackground);
router.get("/get-education", authenticateToken, accountApi.getEducationBackground);
router.delete("/delete-education", authenticateToken, accountApi.deleteEducationBackground);

router.post("/save-scholarship-awards", authenticateToken, accountApi.saveScholarshipAwards);
router.get("/get-scholarship-awards", authenticateToken, accountApi.getScholarshipAwards);
router.delete("/delete-scholarship-awards", authenticateToken, accountApi.deleteScholarshipAwards);

router.post("/save-other-qualifications", authenticateToken, accountApi.saveOtherQualifications);
router.get("/get-other-qualifications", authenticateToken, accountApi.getOtherQualifications);
router.delete("/delete-other-qualifications", authenticateToken, accountApi.deleteOtherQualifications);

router.post("/save-work-experience", authenticateToken, accountApi.saveWorkExperience);
router.get("/get-work-experience", authenticateToken, accountApi.getWorkExperience);
router.delete("/delete-work-experience", authenticateToken, accountApi.deleteWorkExperience);

router.post("/save-teaching-experience", authenticateToken, accountApi.saveTeachingExperience);
router.get("/get-teaching-experience", authenticateToken, accountApi.getTeachingExperience);
router.delete("/delete-teaching-experience", authenticateToken, accountApi.deleteTeachingExperience);

router.post("/save-skills", authenticateToken, accountApi.saveSkills);
router.get("/get-skills", authenticateToken, accountApi.getSkills);
router.delete("/delete-skills", authenticateToken, accountApi.deleteSkills);

router.post("/save-languages", authenticateToken, accountApi.saveLanguages);
router.get("/get-languages", authenticateToken, accountApi.getLanguages);
router.delete("/delete-languages", authenticateToken, accountApi.deleteLanguages);

router.post("/save-family-background", authenticateToken, accountApi.saveFamilyBackground);
router.get("/get-family-background", authenticateToken, accountApi.getFamilyBackground);
router.delete("/delete-family-background", authenticateToken, accountApi.deleteFamilyBackground);

router.post("/save-emergency-contact", authenticateToken, accountApi.saveEmergencyContact);
router.get("/get-emergency-contact", authenticateToken, accountApi.getEmergencyContact);
router.delete("/delete-emergency-contact", authenticateToken, accountApi.deleteEmergencyContact);

router.post("/save-references", authenticateToken, accountApi.saveReferences);
router.get("/get-references", authenticateToken, accountApi.getReferences);
router.delete("/delete-references", authenticateToken, accountApi.deleteReferences);

router.post("/upload-file", authenticateToken, accountApi.uploadMiddleware, accountApi.uploadFile);
router.post("/save-attachments", authenticateToken, accountApi.saveAttachments);
router.get("/get-attachments", authenticateToken, accountApi.getAttachments);
router.delete("/delete-attachments", authenticateToken, accountApi.deleteAttachments);
router.delete("/replace-attachment-file", authenticateToken, accountApi.replaceAttachmentFile);

router.get("/user-profile", authenticateToken, accountApi.getUserInfo);
router.put("/update-profile", authenticateToken, accountApi.updateUserInfo);
router.get("/countries", authenticateToken, accountApi.getCountryList);

module.exports = router;
