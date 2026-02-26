const userService = require("../services/userService");

const sendServiceError = (res, error, fallbackMessage) => {
	const status = error && error.status ? error.status : 500;
	const message = error && error.message ? error.message : fallbackMessage;
	return res.status(status).json({ success: false, message, error: error && error.error ? error.error : error?.message });
};

const postJobs = async (req, res) => {
	try {
		const result = await userService.createJob(req.body);
		return res.status(201).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Job posting failed");
	}
};

const updateJob = async (req, res) => {
	try {
		const result = await userService.updateJob(req.body);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Job update failed");
	}
};

const getJobs = async (_req, res) => {
	try {
		const jobs = await userService.listJobs();
		return res.status(200).json({ success: true, data: jobs });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getJobById = async (req, res) => {
	try {
		const job = await userService.getJobById(req.params.id);
		return res.status(200).json({ success: true, data: job });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const deleteJob = async (req, res) => {
	try {
		const result = await userService.deleteJobById(req.params.id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Job deletion failed");
	}
};

const bookmarkJob = async (req, res) => {
	try {
		const result = await userService.addBookmark({
			user_id: req.user.user_id,
			job_id: req.body.job_id,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getBookmarks = async (req, res) => {
	try {
		const bookmarks = await userService.listBookmarks(req.user.user_id);
		return res.status(200).json({ success: true, data: bookmarks });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const deleteBookmark = async (req, res) => {
	try {
		const result = await userService.removeBookmark({
			user_id: req.user.user_id,
			job_id: req.body.job_id,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveJobRequisition = async (req, res) => {
	try {
		const result = await userService.createJobRequisition({
			user_id: req.user.user_id,
			...req.body,
		});
		return res.status(201).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Failed to save job requisition");
	}
};

const updateJobRequisition = async (req, res) => {
	try {
		const result = await userService.updateOwnedJobRequisition({
			user_id: req.user.user_id,
			id: req.params.id,
			...req.body,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Failed to update job requisition");
	}
};

const getMyJobRequisitions = async (req, res) => {
	try {
		const rows = await userService.listMyJobRequisitions(req.user.user_id);
		return res.status(200).json({ success: true, data: rows });
	} catch (error) {
		return sendServiceError(res, error, "Failed to fetch job requisitions");
	}
};

const getAllJobRequisitionsWithRequestor = async (_req, res) => {
	try {
		const rows = await userService.listAllJobRequisitionsWithRequestor();
		return res.status(200).json({ success: true, data: rows });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const reviewJobRequisition = async (req, res) => {
	try {
		const result = await userService.reviewJobRequisitionById({
			id: req.params.id,
			...req.body,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getJobRequisitionDetails = async (req, res) => {
	try {
		const row = await userService.getJobRequisitionDetailsById(req.params.id);
		return res.status(200).json({ success: true, data: row });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const postVerifiedRequisitionAsJob = async (req, res) => {
	try {
		const result = await userService.postVerifiedRequisitionAsJobById(req.params.id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const sendEmailToUser = async (req, res) => {
	try {
		const result = await userService.sendEmailToUser(req.body);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Failed to send email.");
	}
};

const submitApplication = async (req, res) => {
	try {
		const result = await userService.submitApplication({
			user_id: req.user.user_id,
			body: req.body,
			file: req.file,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAppliedJobs = async (req, res) => {
	try {
		const data = await userService.getAppliedJobs(req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicants = async (_req, res) => {
	try {
		const data = await userService.getApplicants();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantPersonalParticulars = async (req, res) => {
	try {
		const data = await userService.getApplicantPersonalParticulars(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantEducation = async (req, res) => {
	try {
		const data = await userService.getApplicantEducation(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantWork = async (req, res) => {
	try {
		const data = await userService.getApplicantWork(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantFamily = async (req, res) => {
	try {
		const data = await userService.getApplicantFamily(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantSupport = async (req, res) => {
	try {
		const data = await userService.getApplicantSupport(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getFullApplicantProfile = async (req, res) => {
	try {
		const data = await userService.getFullApplicantProfile(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveApplicationFullDetails = async (req, res) => {
	try {
		const result = await userService.saveApplicationFullDetails(req.body);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicationFullDetails = async (req, res) => {
	try {
		const data = await userService.getApplicationFullDetails({
			applicationId: req.query.applicationId,
			userId: req.query.userId || req.user.user_id,
		});
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicationById = async (req, res) => {
	try {
		const data = await userService.getApplicationById(req.params.id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAllFullApplicantProfiles = async (_req, res) => {
	try {
		const data = await userService.getAllFullApplicantProfiles();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getUserEmailById = async (req, res) => {
	try {
		const email = await userService.getUserEmailById(req.params.userId);
		return res.status(200).json({ success: true, email });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantSupportFullDetails = async (req, res) => {
	try {
		const data = await userService.getApplicantSupportFullDetails(req.params.userId);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const scheduleInterview = async (req, res) => {
	try {
		const result = await userService.scheduleInterview(req.body);
		return res.status(201).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getPendingApplicants = async (_req, res) => {
	try {
		const data = await userService.getPendingApplicants();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAllApplicants = async (_req, res) => {
	try {
		const data = await userService.getAllApplicants();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAllJobs = async (_req, res) => {
	try {
		const data = await userService.getAllJobs();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const updateInterview = async (req, res) => {
	try {
		const result = await userService.updateInterview({ id: req.params.id, ...req.body });
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAllInterviews = async (_req, res) => {
	try {
		const data = await userService.getAllInterviews();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const deleteInterview = async (req, res) => {
	try {
		const result = await userService.deleteInterview(req.params.id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const updateApplicationStatus = async (req, res) => {
	try {
		const result = await userService.updateApplicationStatus({
			id: req.params.id,
			status: req.body.status,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAllManagers = async (_req, res) => {
	try {
		const data = await userService.getAllManagers();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const assignManagerToApplication = async (req, res) => {
	try {
		const result = await userService.assignManagerToApplication({
			application_id: req.body.application_id,
			manager_id: req.body.manager_id,
			assigned_user_id: req.user.user_id,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getManagerReviewApplications = async (req, res) => {
	try {
		const result = await userService.getManagerReviewApplications(req.user.user_id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveAssessment = async (req, res) => {
	try {
		const result = await userService.saveAssessment(req.body);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAssessmentDetails = async (req, res) => {
	try {
		const assessment = await userService.getAssessmentDetails(req.params.application_id);
		return res.status(200).json({ success: true, assessment });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const checkPersonalParticularsCompleteness = async (req, res) => {
	try {
		const result = await userService.checkPersonalParticularsCompleteness(req.user.user_id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const checkEducationCompleteness = async (req, res) => {
	try {
		const result = await userService.checkEducationCompleteness(req.user.user_id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const checkWorkCompleteness = async (req, res) => {
	try {
		const result = await userService.checkWorkCompleteness(req.user.user_id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const checkFamilyCompleteness = async (req, res) => {
	try {
		const result = await userService.checkFamilyCompleteness(req.user.user_id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const checkSupportCompleteness = async (req, res) => {
	try {
		const result = await userService.checkSupportCompleteness(req.user.user_id);
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getUserInfo = async (req, res) => {
	try {
		const user = await userService.getUserInfo(req.user.user_id);
		return res.status(200).json({ success: true, user });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const updateUserInfo = async (req, res) => {
	try {
		const result = await userService.updateUserInfo({ user_id: req.user.user_id, ...req.body });
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getCountryList = async (_req, res) => {
	try {
		const data = await userService.getCountryList();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicantNationalityStats = async (_req, res) => {
	try {
		const data = await userService.getApplicantNationalityStats();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getApplicationStatusStats = async (_req, res) => {
	try {
		const data = await userService.getApplicationStatusStats();
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveSgAddress = async (req, res) => {
	try {
		const result = await userService.saveSgAddress({ user_id: req.user.user_id, ...req.body });
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getSgAddress = async (req, res) => {
	try {
		const data = await userService.getSgAddress(req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const savePersonalParticulars = async (req, res) => {
	try {
		const result = await userService.savePersonalParticulars({ user_id: req.user.user_id, ...req.body });
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getPersonalParticulars = async (req, res) => {
	try {
		const data = await userService.getPersonalParticulars(req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveOverseasAddress = async (req, res) => {
	try {
		const result = await userService.saveOverseasAddress({ user_id: req.user.user_id, ...req.body });
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getOverseasAddress = async (req, res) => {
	try {
		const data = await userService.getOverseasAddress(req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveMilitaryService = async (req, res) => {
	try {
		const result = await userService.saveMilitaryService({ user_id: req.user.user_id, ...req.body });
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getMilitaryService = async (req, res) => {
	try {
		const data = await userService.getMilitaryService(req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const createSaveListHandler = (serviceMethod, recordsField) => async (req, res) => {
	try {
		const result = await userService[serviceMethod]({
			user_id: req.user.user_id,
			[recordsField]: req.body[recordsField],
			is_draft: req.body.is_draft,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const createGetListHandler = (serviceMethod) => async (req, res) => {
	try {
		const data = await userService[serviceMethod](req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const createDeleteListHandler = (serviceMethod, idField) => async (req, res) => {
	try {
		const result = await userService[serviceMethod]({
			user_id: req.user.user_id,
			[idField]: req.body[idField],
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const saveEducationBackground = createSaveListHandler("saveEducationBackground", "educationRecords");
const getEducationBackground = createGetListHandler("getEducationBackground");
const deleteEducationBackground = createDeleteListHandler("deleteEducationBackground", "education_id");

const saveScholarshipAwards = createSaveListHandler("saveScholarshipAwards", "scholarshipRecords");
const getScholarshipAwards = createGetListHandler("getScholarshipAwards");
const deleteScholarshipAwards = createDeleteListHandler("deleteScholarshipAwards", "scholarship_id");

const saveOtherQualifications = createSaveListHandler("saveOtherQualifications", "qualificationRecords");
const getOtherQualifications = createGetListHandler("getOtherQualifications");
const deleteOtherQualifications = createDeleteListHandler("deleteOtherQualifications", "qualification_id");

const saveWorkExperience = createSaveListHandler("saveWorkExperience", "workRecords");
const getWorkExperience = createGetListHandler("getWorkExperience");
const deleteWorkExperience = createDeleteListHandler("deleteWorkExperience", "work_id");

const saveTeachingExperience = createSaveListHandler("saveTeachingExperience", "teachingRecords");
const getTeachingExperience = createGetListHandler("getTeachingExperience");
const deleteTeachingExperience = createDeleteListHandler("deleteTeachingExperience", "teaching_id");

const saveSkills = createSaveListHandler("saveSkills", "skillRecords");
const getSkills = createGetListHandler("getSkills");
const deleteSkills = createDeleteListHandler("deleteSkills", "skill_id");

const saveLanguages = createSaveListHandler("saveLanguages", "languageRecords");
const getLanguages = createGetListHandler("getLanguages");
const deleteLanguages = createDeleteListHandler("deleteLanguages", "language_id");

const saveFamilyBackground = createSaveListHandler("saveFamilyBackground", "familyRecords");
const getFamilyBackground = createGetListHandler("getFamilyBackground");
const deleteFamilyBackground = createDeleteListHandler("deleteFamilyBackground", "record_id");

const saveEmergencyContact = createSaveListHandler("saveEmergencyContact", "emergencyRecords");
const getEmergencyContact = createGetListHandler("getEmergencyContact");
const deleteEmergencyContact = createDeleteListHandler("deleteEmergencyContact", "contact_id");

const saveReferences = createSaveListHandler("saveReferences", "referenceRecords");
const getReferences = createGetListHandler("getReferences");
const deleteReferences = createDeleteListHandler("deleteReferences", "reference_id");

const uploadMiddleware = userService.uploadMiddleware;

const uploadFile = async (req, res) => {
	try {
		const data = await userService.uploadFile(req.file);
		return res.status(200).json({
			success: true,
			message: "File uploaded successfully",
			data,
		});
	} catch (error) {
		let message = error?.message || "Server error";
		if (error?.code === "LIMIT_FILE_SIZE") {
			message = "File too large. Maximum file size is 10MB.";
		}
		if (error?.message && error.message.includes("Only images, PDFs, and documents are allowed")) {
			message = error.message;
		}
		return sendServiceError(res, error, message);
	}
};

const saveAttachments = async (req, res) => {
	try {
		const result = await userService.saveAttachments({
			user_id: req.user.user_id,
			attachmentRecords: req.body.attachmentRecords,
			is_draft: req.body.is_draft,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const getAttachments = async (req, res) => {
	try {
		const data = await userService.getAttachments(req.user.user_id);
		return res.status(200).json({ success: true, data });
	} catch (error) {
		return sendServiceError(res, error, "Server error");
	}
};

const deleteAttachments = async (req, res) => {
	try {
		const result = await userService.deleteAttachments({
			user_id: req.user.user_id,
			attachment_id: req.body.attachment_id,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error during deletion");
	}
};

const replaceAttachmentFile = async (req, res) => {
	try {
		const result = await userService.replaceAttachmentFile({
			user_id: req.user.user_id,
			attachment_id: req.body.attachment_id,
		});
		return res.status(200).json(result);
	} catch (error) {
		return sendServiceError(res, error, "Server error during file replacement");
	}
};

module.exports = {
	postJobs,
	updateJob,
	getJobs,
	getAllJobs,
	getJobById,
	deleteJob,
	bookmarkJob,
	getBookmarks,
	deleteBookmark,
	saveJobRequisition,
	updateJobRequisition,
	getMyJobRequisitions,
	getAllJobRequisitionsWithRequestor,
	reviewJobRequisition,
	getJobRequisitionDetails,
	postVerifiedRequisitionAsJob,
	sendEmailToUser,
	submitApplication,
	getAppliedJobs,
	getApplicants,
	getApplicantPersonalParticulars,
	getApplicantEducation,
	getApplicantWork,
	getApplicantFamily,
	getApplicantSupport,
	getFullApplicantProfile,
	saveApplicationFullDetails,
	getApplicationFullDetails,
	getApplicationById,
	getAllFullApplicantProfiles,
	getUserEmailById,
	getApplicantSupportFullDetails,
	scheduleInterview,
	getPendingApplicants,
	getAllApplicants,
	updateInterview,
	getAllInterviews,
	deleteInterview,
	updateApplicationStatus,
	getAllManagers,
	assignManagerToApplication,
	getManagerReviewApplications,
	saveAssessment,
	getAssessmentDetails,
	checkPersonalParticularsCompleteness,
	checkEducationCompleteness,
	checkWorkCompleteness,
	checkFamilyCompleteness,
	checkSupportCompleteness,
	getUserInfo,
	updateUserInfo,
	getCountryList,
	getApplicantNationalityStats,
	getApplicationStatusStats,
	saveSgAddress,
	getSgAddress,
	savePersonalParticulars,
	getPersonalParticulars,
	saveOverseasAddress,
	getOverseasAddress,
	saveMilitaryService,
	getMilitaryService,
	saveEducationBackground,
	getEducationBackground,
	deleteEducationBackground,
	saveScholarshipAwards,
	getScholarshipAwards,
	deleteScholarshipAwards,
	saveOtherQualifications,
	getOtherQualifications,
	deleteOtherQualifications,
	saveWorkExperience,
	getWorkExperience,
	deleteWorkExperience,
	saveTeachingExperience,
	getTeachingExperience,
	deleteTeachingExperience,
	saveSkills,
	getSkills,
	deleteSkills,
	saveLanguages,
	getLanguages,
	deleteLanguages,
	saveFamilyBackground,
	getFamilyBackground,
	deleteFamilyBackground,
	saveEmergencyContact,
	getEmergencyContact,
	deleteEmergencyContact,
	saveReferences,
	getReferences,
	deleteReferences,
	uploadMiddleware,
	uploadFile,
	saveAttachments,
	getAttachments,
	deleteAttachments,
	replaceAttachmentFile,
};
