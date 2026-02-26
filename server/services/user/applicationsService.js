const fs = require("fs");
const userRepository = require("../../repositories/userRepository");
const { sendPortalEmail } = require("../../mail/userMail");

const createServiceError = (status, message, error) => ({ status, message, error });

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
};

const toNullableNumber = (value) => {
  const numberValue = parseFloat(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};

const sendEmailToUser = async ({ user_id, subject, message }) => {
  if (!user_id || !subject || !message) {
    throw createServiceError(400, "Missing required fields.");
  }

  const users = await userRepository.executeQuery("SELECT email FROM tbl_users WHERE user_id = ?", [user_id]);
  if (!users.length) {
    throw createServiceError(404, "User not found.");
  }

  await sendPortalEmail({
    from: `"EAIM" <${process.env.SMTP_USER}>`,
    to: users[0].email,
    subject,
    html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
  });

  return { success: true, message: "Email sent successfully." };
};

const submitApplication = async ({ user_id, body, file }) => {
  const {
    job_id,
    documentType,
    documentName,
    currentSalary,
    expectedSalary,
    earliestStartingDate,
    sourceObtainedFrom,
    totalWorkExperience,
    relevantWorkExperience,
  } = body;

  const appliedDate = new Date(Date.now() + 8 * 60 * 60 * 1000);

  let fileData = {
    file_name: null,
    file_path: null,
    file_size: null,
  };

  if (file) {
    fileData = {
      file_name: file.originalname,
      file_path: file.path,
      file_size: file.size,
    };
  }

  try {
    const result = await userRepository.executeQuery(
      `
      INSERT INTO tbl_application (
        user_id,
        job_id,
        applied_date,
        application_status,
        document_type,
        document_name,
        file_name,
        file_path,
        file_size,
        current_salary,
        expected_salary,
        earliest_start_date,
        source_obtained_from,
        total_work_experience,
        relevant_work_experience
      ) VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        user_id,
        job_id || null,
        appliedDate,
        documentType || null,
        documentName || null,
        fileData.file_name,
        fileData.file_path,
        fileData.file_size,
        toNullableNumber(currentSalary),
        toNullableNumber(expectedSalary),
        earliestStartingDate || null,
        sourceObtainedFrom || null,
        toNullableNumber(totalWorkExperience),
        toNullableNumber(relevantWorkExperience),
      ]
    );

    const userRows = await userRepository.executeQuery("SELECT email, first_name, last_name FROM tbl_users WHERE user_id = ?", [user_id]);
    const userEmail = userRows.length ? userRows[0].email : null;
    const userName = userRows.length ? `${userRows[0].first_name} ${userRows[0].last_name}` : "Applicant";

    const jobRows = await userRepository.executeQuery("SELECT title FROM tbl_jobs WHERE job_id = ?", [job_id]);
    const jobTitle = jobRows.length ? jobRows[0].title : "Unknown Position";

    if (userEmail) {
      await sendPortalEmail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "Job Application Submitted",
        html: `<p>Dear ${userName},</p>
               <p>Your application for <strong>${jobTitle}</strong> has been submitted successfully.</p>
               <p>Thank you for applying!</p>`,
      });
    }

    return {
      success: true,
      message: "Application submitted successfully",
      data: { application_id: result.insertId },
    };
  } catch (error) {
    if (file && file.path) {
      try {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch {
      }
    }
    throw createServiceError(500, "Server error", error.message);
  }
};

const getAppliedJobs = async (user_id) => {
  return userRepository.executeQuery(
    `
      SELECT
        a.application_id,
        a.user_id,
        a.job_id,
        a.applied_date,
        a.application_status,
        a.interview_date,
        a.document_type,
        a.document_name,
        a.file_name,
        a.file_path,
        a.file_size,
        a.current_salary,
        a.expected_salary,
        a.earliest_start_date,
        a.source_obtained_from,
        a.total_work_experience,
        a.relevant_work_experience,
        j.title,
        j.job_category,
        j.job_type,
        j.hiring_status,
        j.job_requirements,
        j.job_responsibilities,
        j.seekers_required,
        j.posting_date
      FROM tbl_application a
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.user_id = ?
      ORDER BY a.applied_date DESC
    `,
    [user_id]
  );
};

const getApplicants = async () => {
  const applicants = await userRepository.executeQuery(
    `
      SELECT
        a.application_id,
        a.user_id,
        a.job_id,
        a.applied_date,
        a.application_status,
        a.interview_date,
        pp.full_name as applicant_name,
        pp.email,
        j.title as job_title,
        j.job_category,
        a.assessment_done,
        a.assigned_manager_id,
        s.display_name as assigned_manager_name
      FROM tbl_application a
      LEFT JOIN tbl_personal_particulars pp ON a.user_id = pp.user_id
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      LEFT JOIN vw_staff s ON a.assigned_manager_id = s.emp_no
      WHERE a.application_status IS NOT NULL
      ORDER BY a.applied_date DESC
    `
  );

  return applicants.map((applicant) => ({
    application_id: applicant.application_id,
    user_id: applicant.user_id,
    job_id: applicant.job_id,
    name: applicant.applicant_name || "Unknown Applicant",
    email: applicant.email,
    job: applicant.job_title || "Unknown Position",
    job_category: applicant.job_category,
    applied: formatDate(applicant.applied_date),
    interview: formatDate(applicant.interview_date),
    status: applicant.application_status || "Pending review",
    assessment_done: applicant.assessment_done === "Yes",
    assigned_manager_id: applicant.assigned_manager_id,
    assigned_manager_name: applicant.assigned_manager_name,
  }));
};

const getApplicantPersonalParticulars = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID is required");
  }

  const [personalData, sgAddressData, overseasData, militaryData] = await Promise.all([
    userRepository.executeQuery("SELECT * FROM tbl_personal_particulars WHERE user_id = ?", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_sg_address WHERE user_id = ?", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_overseas_address WHERE user_id = ?", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_military_service WHERE user_id = ?", [userId]),
  ]);

  return {
    personalParticulars: personalData.length > 0 ? personalData[0] : null,
    sgAddress: sgAddressData.length > 0 ? sgAddressData[0] : null,
    overseasAddress: overseasData.length > 0 ? overseasData[0] : null,
    militaryService: militaryData.length > 0 ? militaryData[0] : null,
  };
};

const getApplicantEducation = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID is required");
  }

  const [educationData, scholarshipData, qualificationsData] = await Promise.all([
    userRepository.executeQuery("SELECT * FROM tbl_education_background WHERE user_id = ? ORDER BY education_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_scholarship_awards WHERE user_id = ? ORDER BY scholarship_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_other_qualifications WHERE user_id = ? ORDER BY qualification_id ASC", [userId]),
  ]);

  return {
    education: educationData,
    scholarships: scholarshipData,
    qualifications: qualificationsData,
  };
};

const getApplicantWork = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID is required");
  }

  const [workData, teachingData, skillsData, languagesData] = await Promise.all([
    userRepository.executeQuery("SELECT * FROM tbl_work_experience WHERE user_id = ? ORDER BY work_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_teaching_experience WHERE user_id = ? ORDER BY teaching_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_skills WHERE user_id = ? ORDER BY skill_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_languages WHERE user_id = ? ORDER BY language_id ASC", [userId]),
  ]);

  return {
    workExperience: workData,
    teachingExperience: teachingData,
    skills: skillsData,
    languages: languagesData,
  };
};

const getApplicantFamily = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID is required");
  }

  const [familyData, emergencyData] = await Promise.all([
    userRepository.executeQuery("SELECT * FROM tbl_family_background WHERE user_id = ? ORDER BY record_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_emergency_contact WHERE user_id = ? ORDER BY contact_id ASC", [userId]),
  ]);

  return {
    family: familyData,
    emergency: emergencyData,
  };
};

const getApplicantSupport = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID is required");
  }

  const [referencesData, attachmentsData] = await Promise.all([
    userRepository.executeQuery("SELECT * FROM tbl_references WHERE user_id = ? ORDER BY reference_id ASC", [userId]),
    userRepository.executeQuery("SELECT * FROM tbl_attachments WHERE user_id = ? ORDER BY attachment_id ASC", [userId]),
  ]);

  return {
    references: referencesData,
    attachments: attachmentsData,
  };
};

const getFullApplicantProfile = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID required");
  }

  const [personal, education, work, family, support] = await Promise.all([
    getApplicantPersonalParticulars(userId),
    getApplicantEducation(userId),
    getApplicantWork(userId),
    getApplicantFamily(userId),
    getApplicantSupport(userId),
  ]);

  return {
    personal,
    education,
    work,
    family,
    support,
  };
};

const saveApplicationFullDetails = async (payload) => {
  const {
    application_id,
    user_id,
    job_id,
    personal_particulars,
    singapore_address,
    overseas_address,
    military_service,
    education_background,
    scholarship_awards,
    other_qualifications,
    work_experience,
    teaching_experience,
    skills,
    languages,
    family_background,
    emergency_contact,
    references,
    attachments,
    apply_info,
  } = payload;

  const sgTime = new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  await userRepository.executeQuery(
    `
      INSERT INTO tbl_application_full_details (
        application_id, user_id, job_id,
        personal_particulars, singapore_address, overseas_address, military_service,
        education_background, scholarship_awards, other_qualifications,
        work_experience, teaching_experience, skills, languages,
        family_background, emergency_contact, \`references\`, attachments, apply_info, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        personal_particulars = VALUES(personal_particulars),
        singapore_address = VALUES(singapore_address),
        overseas_address = VALUES(overseas_address),
        military_service = VALUES(military_service),
        education_background = VALUES(education_background),
        scholarship_awards = VALUES(scholarship_awards),
        other_qualifications = VALUES(other_qualifications),
        work_experience = VALUES(work_experience),
        teaching_experience = VALUES(teaching_experience),
        skills = VALUES(skills),
        languages = VALUES(languages),
        family_background = VALUES(family_background),
        emergency_contact = VALUES(emergency_contact),
        \`references\` = VALUES(\`references\`),
        attachments = VALUES(attachments),
        apply_info = VALUES(apply_info),
        created_at = VALUES(created_at)
    `,
    [
      application_id,
      user_id,
      job_id,
      personal_particulars,
      singapore_address,
      overseas_address,
      military_service,
      education_background,
      scholarship_awards,
      other_qualifications,
      work_experience,
      teaching_experience,
      skills,
      languages,
      family_background,
      emergency_contact,
      references,
      attachments,
      apply_info,
      sgTime,
    ]
  );

  return { success: true, message: "Full application details saved." };
};

const getApplicationFullDetails = async ({ applicationId, userId }) => {
  let sql;
  let params;

  if (applicationId) {
    sql = "SELECT * FROM tbl_application_full_details WHERE application_id = ? LIMIT 1";
    params = [applicationId];
  } else {
    sql = "SELECT * FROM tbl_application_full_details WHERE user_id = ? ORDER BY created_at DESC LIMIT 1";
    params = [userId];
  }

  const rows = await userRepository.executeQuery(sql, params);
  if (!rows.length) {
    throw createServiceError(404, "No application details found.");
  }

  return rows[0];
};

const getApplicationById = async (applicationId) => {
  const rows = await userRepository.executeQuery(
    `
      SELECT
        a.*,
        j.title,
        j.job_type
      FROM tbl_application a
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.application_id = ?
      LIMIT 1
    `,
    [applicationId]
  );

  if (!rows.length) {
    throw createServiceError(404, "Application not found.");
  }

  return rows[0];
};

const getAllFullApplicantProfiles = async () => {
  const rows = await userRepository.executeQuery(
    `
      SELECT
        afd.user_id,
        pp.full_name,
        pp.email,
        afd.education_background,
        afd.scholarship_awards,
        afd.other_qualifications,
        afd.work_experience,
        afd.teaching_experience,
        afd.skills,
        afd.languages
      FROM tbl_application_full_details afd
      LEFT JOIN tbl_personal_particulars pp ON afd.user_id = pp.user_id
      WHERE pp.full_name IS NOT NULL AND pp.full_name != ''
      GROUP BY afd.user_id
    `
  );

  return rows.map((app) => ({
    name: app.full_name,
    email: app.email,
    education: app.education_background || "",
    scholarships: app.scholarship_awards || "",
    qualifications: app.other_qualifications || "",
    work: app.work_experience || "",
    teaching: app.teaching_experience || "",
    skills: app.skills || "",
    languages: app.languages || "",
  }));
};

const getUserEmailById = async (userId) => {
  const rows = await userRepository.executeQuery("SELECT email FROM tbl_users WHERE user_id = ? LIMIT 1", [userId]);
  if (!rows.length) {
    throw createServiceError(404, "User not found");
  }
  return rows[0].email;
};

const getApplicantSupportFullDetails = async (userId) => {
  if (!userId) {
    throw createServiceError(400, "User ID is required");
  }

  const rows = await userRepository.executeQuery(
    "SELECT `references`, attachments FROM tbl_application_full_details WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
    [userId]
  );

  if (!rows.length) {
    throw createServiceError(404, "No application details found.");
  }

  let references = [];
  let attachments = [];
  try {
    references = JSON.parse(rows[0].references || "[]");
  } catch {
  }
  try {
    attachments = JSON.parse(rows[0].attachments || "[]");
  } catch {
  }

  return { references, attachments };
};

module.exports = {
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
};
