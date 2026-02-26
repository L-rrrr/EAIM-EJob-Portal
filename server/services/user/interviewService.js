const userRepository = require("../../repositories/userRepository");
const { sendPortalEmail } = require("../../mail/userMail");

const createServiceError = (status, message, error) => ({ status, message, error });

const scheduleInterview = async (payload) => {
  const {
    application_id,
    user_id,
    job_id,
    applicant,
    job,
    interview_date,
    meeting_format,
    start_time,
    end_time,
    venue,
    additional_notes,
  } = payload;

  const sql = `
      INSERT INTO tbl_interview (
        interview_id, user_id, job_id, applicant, job, interview_date, meeting_format,
        start_time, end_time, venue, additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id),
        job_id = VALUES(job_id),
        applicant = VALUES(applicant),
        job = VALUES(job),
        interview_date = VALUES(interview_date),
        meeting_format = VALUES(meeting_format),
        start_time = VALUES(start_time),
        end_time = VALUES(end_time),
        venue = VALUES(venue),
        additional_notes = VALUES(additional_notes)
    `;

  await userRepository.executeQuery(sql, [
    application_id,
    user_id || null,
    job_id || null,
    applicant || null,
    job || null,
    interview_date || null,
    meeting_format || null,
    start_time || null,
    end_time || null,
    venue || null,
    additional_notes || null,
  ]);

  await userRepository.executeQuery(
    `
      UPDATE tbl_application
      SET application_status = 'Interview Scheduled',
          interview_date = ?
      WHERE application_id = ?
    `,
    [interview_date || null, application_id]
  );

  const userRows = await userRepository.executeQuery("SELECT email, first_name, last_name FROM tbl_users WHERE user_id = ?", [user_id]);
  const userEmail = userRows.length ? userRows[0].email : null;
  const userName = userRows.length ? `${userRows[0].first_name} ${userRows[0].last_name}` : "Applicant";

  const jobRows = await userRepository.executeQuery("SELECT title FROM tbl_jobs WHERE job_id = ?", [job_id]);
  const jobTitle = jobRows.length ? jobRows[0].title : "Unknown Position";

  if (userEmail) {
    const interviewDetails = `
      <p>Dear ${userName},</p>
      <p>Your interview for <strong>${jobTitle}</strong> has been scheduled.</p>
      <ul>
        <li><strong>Date:</strong> ${interview_date}</li>
        <li><strong>Time:</strong> ${start_time} - ${end_time}</li>
        <li><strong>Format:</strong> ${meeting_format}</li>
        ${venue ? `<li><strong>Venue:</strong> ${venue}</li>` : ""}
        ${additional_notes ? `<li><strong>Notes:</strong> ${additional_notes}</li>` : ""}
      </ul>
      <p>Please be prepared and contact us if you have any questions.</p>
    `;

    await sendPortalEmail({
      from: `"EAIM" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Interview Scheduled",
      html: interviewDetails,
    });
  }

  return { success: true, message: "Interview scheduled successfully" };
};

const getPendingApplicants = async () => {
  const rows = await userRepository.executeQuery(`
      SELECT 
        a.application_id,
        a.user_id,
        a.job_id,
        a.applied_date,
        pp.full_name AS applicant_name,
        j.title AS job_title
      FROM tbl_application a
      LEFT JOIN tbl_personal_particulars pp ON a.user_id = pp.user_id
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.application_status = 'Pending'
      ORDER BY a.applied_date DESC
    `);

  return rows.map((row) => ({
    id: row.application_id,
    user_id: row.user_id,
    job_id: row.job_id,
    name: row.applicant_name || "Unknown",
    job: row.job_title || "Unknown",
    date: row.applied_date,
  }));
};

const getAllApplicants = async () => {
  return userRepository.executeQuery(`
      SELECT DISTINCT pp.user_id, pp.full_name
      FROM tbl_personal_particulars pp
      INNER JOIN tbl_application a ON a.user_id = pp.user_id
      WHERE pp.full_name IS NOT NULL AND pp.full_name != ''
    `);
};

const getAllJobs = async () => {
  return userRepository.executeQuery("SELECT job_id, title FROM tbl_jobs WHERE hiring_status = 'Hiring' ORDER BY posting_date DESC");
};

const updateInterview = async ({ id, ...payload }) => {
  const {
    user_id,
    job_id,
    applicant,
    job,
    interview_date,
    meeting_format,
    start_time,
    end_time,
    venue,
    add_to_my_calendar,
    additional_notes,
  } = payload;

  await userRepository.executeQuery(
    `
      UPDATE tbl_interview SET
        user_id = ?,
        job_id = ?,
        applicant = ?,
        job = ?,
        interview_date = ?,
        meeting_format = ?,
        start_time = ?,
        end_time = ?,
        venue = ?,
        add_to_my_calendar = ?,
        additional_notes = ?
      WHERE interview_id = ?
    `,
    [
      user_id || null,
      job_id || null,
      applicant || null,
      job || null,
      interview_date || null,
      meeting_format || null,
      start_time || null,
      end_time || null,
      venue || null,
      add_to_my_calendar ? 1 : 0,
      additional_notes || null,
      id,
    ]
  );

  const userRows = await userRepository.executeQuery("SELECT email, first_name, last_name FROM tbl_users WHERE user_id = ?", [user_id]);
  const userEmail = userRows.length ? userRows[0].email : null;
  const userName = userRows.length ? `${userRows[0].first_name} ${userRows[0].last_name}` : "Applicant";

  const jobRows = await userRepository.executeQuery("SELECT title FROM tbl_jobs WHERE job_id = ?", [job_id]);
  const jobTitle = jobRows.length ? jobRows[0].title : "Unknown Position";

  if (userEmail) {
    const interviewDetails = `
      <p>Dear ${userName},</p>
      <p>Your interview for <strong>${jobTitle}</strong> has been updated. Please find the updated details below:</p>
      <ul>
        <li><strong>Date:</strong> ${interview_date}</li>
        <li><strong>Time:</strong> ${start_time} - ${end_time}</li>
        <li><strong>Format:</strong> ${meeting_format}</li>
        ${venue ? `<li><strong>Venue:</strong> ${venue}</li>` : ""}
        ${additional_notes ? `<li><strong>Notes:</strong> ${additional_notes}</li>` : ""}
      </ul>
      <p>Please be prepared and contact us if you have any questions.</p>
    `;

    await sendPortalEmail({
      from: `"EAIM" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject: "Interview Scheduled",
      html: interviewDetails,
    });
  }

  return { success: true, message: "Interview updated successfully" };
};

const getAllInterviews = async () => {
  return userRepository.executeQuery("SELECT * FROM tbl_interview ORDER BY interview_date DESC, start_time DESC");
};

const deleteInterview = async (id) => {
  const rows = await userRepository.executeQuery("SELECT user_id, job_id FROM tbl_interview WHERE interview_id = ?", [id]);
  if (!rows.length) {
    throw createServiceError(404, "Interview not found");
  }
  const { user_id, job_id } = rows[0];

  await userRepository.executeQuery("DELETE FROM tbl_interview WHERE interview_id = ?", [id]);
  await userRepository.executeQuery(
    `
      UPDATE tbl_application
      SET application_status = 'Pending',
          interview_date = NULL
      WHERE user_id = ? AND job_id = ?
    `,
    [user_id, job_id]
  );

  return { success: true, message: "Interview deleted and application status reverted to Pending" };
};

const updateApplicationStatus = async ({ id, status }) => {
  const allowed = [
    "Pending",
    "Reviewing",
    "Assessed",
    "Interview Scheduled",
    "Offer Made",
    "Not Selected",
    "Offer Accepted",
    "Offer Declined",
  ];
  if (!allowed.includes(status)) {
    throw createServiceError(400, "Invalid status");
  }

  await userRepository.executeQuery(
    `
      UPDATE tbl_application
      SET application_status = ?
      WHERE application_id = ?
    `,
    [status, id]
  );

  const userRows = await userRepository.executeQuery(
    `
      SELECT a.user_id, u.email, u.first_name, u.last_name
      FROM tbl_application a
      LEFT JOIN tbl_users u ON a.user_id = u.user_id
      WHERE a.application_id = ?
      LIMIT 1
    `,
    [id]
  );

  if (userRows.length) {
    const { email, first_name, last_name } = userRows[0];
    const userName = `${first_name || ""} ${last_name || ""}`.trim() || "Applicant";

    if (status === "Offer Made") {
      const frontendUrl = process.env.FRONTEND_URL || "https://ejob.eaim.edu.sg";
      const jobsAppliedLink = `${frontendUrl}/jobs-applied`;
      const html = `
          <p>Dear ${userName},</p>
          <p>
            Congratulations! We are pleased to inform you that you have received an offer for your application with EAIM.
            Your qualifications and experiences have impressed our team, and we believe you would be a valuable addition to our organization.
          </p>
          <p>
            To review the details of your offer and respond, please <a href="${jobsAppliedLink}">click here</a> to visit your Jobs Applied page.
            There, you can accept or decline the offer at your convenience.
          </p>
          <p>
            If the above link does not work, you may copy and paste this URL into your browser:<br>
            ${jobsAppliedLink}
          </p>
          <p>
            Should you have any questions or require further information, please do not hesitate to reach out to us.
            We look forward to the possibility of welcoming you to the EAIM family.
          </p>
          <p>
            Best regards,<br/>
            EAIM Recruitment Team
          </p>
        `;
      await sendPortalEmail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Job Offer Notification",
        html,
      });
    } else if (status === "Not Selected") {
      const html = `
          <p>Dear ${userName},</p>

          <p>Thank you very much for taking the time to apply for the position with EAIM and for your interest in joining our team.
          We truly appreciate the effort you put into your application and the opportunity to learn more about your background, skills, and experiences.</p>

          <p>After careful consideration of all applications, we have decided to move forward with other candidates whose qualifications more closely match the requirements of this role at this time.
          This was by no means an easy decision, as we received a number of strong applications, including yours.</p>

          <p>We want to emphasize that your application was reviewed thoroughly, and we genuinely value the time and thought you dedicated to it.
          We encourage you to stay connected with EAIM and apply for future openings that match your expertise and career aspirations, as we would be pleased to consider your profile again.</p>

          <p>Thank you once again for your interest in EAIM.
          We wish you every success in your professional journey and hope our paths may cross again in the future.</p>

          <p>Best regards,<br/>
          EAIM Recruitment Team</p>
        `;

      await sendPortalEmail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: email,
        subject: "Application Status Update",
        html,
      });
    }
  }

  return { success: true, message: "Status updated" };
};

const getAllManagers = async () => {
  return userRepository.executeQuery(`
      SELECT DISTINCT s.emp_no, s.display_name
      FROM vw_staff s
      WHERE s.staff_status = 'Active'
        AND (
          s.dept_code = 'DEP-09'
          OR s.emp_no IN (SELECT supervisor FROM vw_staff WHERE supervisor IS NOT NULL)
        )
      ORDER BY s.display_name
    `);
};

const assignManagerToApplication = async ({ application_id, manager_id, assigned_user_id }) => {
  if (!application_id || !manager_id) {
    throw createServiceError(400, "Missing application_id or manager_id");
  }

  const hrRows = await userRepository.executeQuery("SELECT emp_no FROM vw_staff WHERE emp_no = ? LIMIT 1", [assigned_user_id]);
  const assignedBy = hrRows.length ? hrRows[0].emp_no : null;

  const managers = await userRepository.executeQuery(
    `
      SELECT * FROM vw_staff 
      WHERE emp_no = ? 
        AND staff_status = 'Active'
        AND (
          dept_code = 'DEP-09'
          OR emp_no IN (SELECT supervisor FROM vw_staff WHERE supervisor IS NOT NULL)
        )
    `,
    [manager_id]
  );
  if (!managers.length) {
    throw createServiceError(400, "Invalid manager ID");
  }

  await userRepository.executeQuery(
    `
      UPDATE tbl_application
      SET assigned_manager_id = ?, assigned_by = ?
      WHERE application_id = ?
    `,
    [manager_id, assignedBy, application_id]
  );

  const managerEmail = managers[0].email || null;
  const managerName = managers[0].display_name || "Manager";

  const appRows = await userRepository.executeQuery(
    `
      SELECT a.application_id, pp.full_name AS applicant_name, j.title AS job_title
      FROM tbl_application a
      LEFT JOIN tbl_personal_particulars pp ON a.user_id = pp.user_id
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.application_id = ?
    `,
    [application_id]
  );
  const applicantName = appRows.length ? appRows[0].applicant_name : "Applicant";
  const jobTitle = appRows.length ? appRows[0].job_title : "Unknown Position";

  const frontendUrl = process.env.FRONTEND_URL || "https://ejob.eaim.edu.sg";
  const assessmentLink = `${frontendUrl}/manager/assessment?applicationId=${application_id}`;

  if (managerEmail) {
    await sendPortalEmail({
      from: `"EAIM" <${process.env.SMTP_USER}>`,
      to: managerEmail,
      subject: "New Candidate Assessment Assigned",
      html: `
      <p>Dear ${managerName},</p>
      <p>You have been assigned to assess the application for <strong>${applicantName}</strong> (Position: <strong>${jobTitle}</strong>).</p>
      <p>Please <a href="${assessmentLink}">click here</a> to log in and complete the assessment.</p>
      <p>Or copy and paste this link into your browser: <br>${assessmentLink}</p>
    `,
    });
  }

  return { success: true, message: "Manager assigned to application." };
};

const getManagerReviewApplications = async (manager_id) => {
  const rows = await userRepository.executeQuery(
    `
      SELECT 
        a.application_id,
        pp.full_name AS candidate_name,
        pp.date_of_birth,
        j.title AS job_title,
        a.current_salary,
        a.expected_salary,
        a.interview_date,
        i.start_time AS interview_time,
        (SELECT ass.assessment_date FROM tbl_assessment ass WHERE ass.application_id = a.application_id LIMIT 1) AS assessment_date,
        (SELECT COUNT(*) FROM tbl_assessment ass WHERE ass.application_id = a.application_id) AS is_assessed
      FROM tbl_application a
      LEFT JOIN tbl_personal_particulars pp ON a.user_id = pp.user_id
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      LEFT JOIN tbl_interview i ON a.application_id = i.interview_id
      WHERE a.assigned_manager_id = ?
      ORDER BY a.interview_date DESC, a.application_id DESC
    `,
    [manager_id]
  );

  const pending = [];
  const completed = [];
  rows.forEach((row) => {
    const app = {
      application_id: row.application_id,
      candidate_name: row.candidate_name || "Unknown",
      date_of_birth: row.date_of_birth,
      job_title: row.job_title || "Unknown",
      current_salary: row.current_salary,
      expected_salary: row.expected_salary,
      interview_date: row.interview_date,
      interview_time: row.interview_time,
    };
    if (row.is_assessed > 0) {
      completed.push({
        ...app,
        assessment_date: row.assessment_date,
      });
    } else {
      pending.push(app);
    }
  });

  return {
    success: true,
    pending,
    completed,
  };
};

const saveAssessment = async (payload) => {
  const {
    application_id,
    candidate_name,
    age,
    department,
    position,
    current_salary,
    expected_salary,
    interviewer,
    notice_period,
    interview_date,
    interview_time,
    q1,
    q1_remark,
    q2,
    q2_remark,
    q3,
    q3_remark,
    q4,
    q4_remark,
    q5,
    q5_remark,
    q6,
    q6_remark,
    q7,
    q7_remark,
    q8,
    q8_remark,
    q9,
    q9_remark,
    q10,
    q10_remark,
    q11,
    q11_remark,
    q12,
    q12_remark,
    q13,
    q13_remark,
    q14,
    comments,
  } = payload;

  if (!application_id) {
    throw createServiceError(400, "Missing application_id");
  }

  const sgDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await userRepository.executeQuery(
    `
      INSERT INTO tbl_assessment (
        application_id, candidate_name, age, department, position,
        current_salary, expected_salary, interviewer, notice_period,
        interview_date, interview_time,
        q1, q1_remark, q2, q2_remark, q3, q3_remark, q4, q4_remark,
        q5, q5_remark, q6, q6_remark, q7, q7_remark, q8, q8_remark,
        q9, q9_remark, q10, q10_remark, q11, q11_remark, q12, q12_remark,
        q13, q13_remark, q14, comments, assessment_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        candidate_name = VALUES(candidate_name),
        age = VALUES(age),
        department = VALUES(department),
        position = VALUES(position),
        current_salary = VALUES(current_salary),
        expected_salary = VALUES(expected_salary),
        interviewer = VALUES(interviewer),
        notice_period = VALUES(notice_period),
        interview_date = VALUES(interview_date),
        interview_time = VALUES(interview_time),
        q1 = VALUES(q1), q1_remark = VALUES(q1_remark),
        q2 = VALUES(q2), q2_remark = VALUES(q2_remark),
        q3 = VALUES(q3), q3_remark = VALUES(q3_remark),
        q4 = VALUES(q4), q4_remark = VALUES(q4_remark),
        q5 = VALUES(q5), q5_remark = VALUES(q5_remark),
        q6 = VALUES(q6), q6_remark = VALUES(q6_remark),
        q7 = VALUES(q7), q7_remark = VALUES(q7_remark),
        q8 = VALUES(q8), q8_remark = VALUES(q8_remark),
        q9 = VALUES(q9), q9_remark = VALUES(q9_remark),
        q10 = VALUES(q10), q10_remark = VALUES(q10_remark),
        q11 = VALUES(q11), q11_remark = VALUES(q11_remark),
        q12 = VALUES(q12), q12_remark = VALUES(q12_remark),
        q13 = VALUES(q13), q13_remark = VALUES(q13_remark),
        q14 = VALUES(q14), comments = VALUES(comments),
        assessment_date = VALUES(assessment_date)
    `,
    [
      application_id,
      candidate_name,
      age,
      department,
      position,
      current_salary,
      expected_salary,
      interviewer,
      notice_period,
      interview_date,
      interview_time,
      q1,
      q1_remark,
      q2,
      q2_remark,
      q3,
      q3_remark,
      q4,
      q4_remark,
      q5,
      q5_remark,
      q6,
      q6_remark,
      q7,
      q7_remark,
      q8,
      q8_remark,
      q9,
      q9_remark,
      q10,
      q10_remark,
      q11,
      q11_remark,
      q12,
      q12_remark,
      q13,
      q13_remark,
      q14,
      comments,
      sgDate,
    ]
  );

  await userRepository.executeQuery(
    `
      UPDATE tbl_application
      SET assessment_done = 'Yes',
          application_status = 'Assessed'
      WHERE application_id = ?
    `,
    [application_id]
  );

  return { success: true, message: "Assessment saved." };
};

const getAssessmentDetails = async (application_id) => {
  const rows = await userRepository.executeQuery("SELECT * FROM tbl_assessment WHERE application_id = ? LIMIT 1", [application_id]);
  if (!rows.length) {
    throw createServiceError(404, "Assessment not found");
  }
  return rows[0];
};

module.exports = {
  scheduleInterview,
  updateInterview,
  deleteInterview,
  getAllInterviews,
  getPendingApplicants,
  getAllApplicants,
  getAllJobs,
  updateApplicationStatus,
  getAllManagers,
  assignManagerToApplication,
  getManagerReviewApplications,
  saveAssessment,
  getAssessmentDetails,
};
