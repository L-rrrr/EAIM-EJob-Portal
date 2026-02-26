const userRepository = require("../../repositories/userRepository");

const createServiceError = (status, message) => ({ status, message });

const getSingaporeDateOnly = () => {
  return new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace("T", " ");
};

const getSingaporeDateTime = () => {
  return new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
};

const createJobRequisition = async ({ user_id, jobTitle, jobCategory, jobType, jobRequirements, jobResponsibilities, seekersRequired }) => {
  await userRepository.executeQuery(
    `
      INSERT INTO tbl_job_requisition (
        user_id,
        job_title,
        job_category,
        job_type,
        job_requirements,
        job_responsibilities,
        seekers_required,
        posting_date,
        requisition_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      user_id,
      jobTitle,
      jobCategory,
      jobType,
      jobRequirements,
      jobResponsibilities,
      seekersRequired,
      getSingaporeDateOnly(),
      "Pending",
    ]
  );

  return { success: true, message: "Job requisition submitted successfully" };
};

const updateOwnedJobRequisition = async ({ user_id, id, jobTitle, jobCategory, jobType, jobRequirements, jobResponsibilities, seekersRequired, requisition_status }) => {
  if (!id) {
    throw createServiceError(400, "Job requisition ID is required");
  }

  const result = await userRepository.executeQuery(
    `
      UPDATE tbl_job_requisition
      SET
        job_title = ?,
        job_category = ?,
        job_type = ?,
        job_requirements = ?,
        job_responsibilities = ?,
        seekers_required = ?,
        requisition_status = ?
      WHERE job_requisition_id = ? AND user_id = ?
    `,
    [jobTitle, jobCategory, jobType, jobRequirements, jobResponsibilities, seekersRequired, requisition_status, id, user_id]
  );

  if (result.affectedRows === 0) {
    throw createServiceError(404, "Job requisition not found or not owned by user");
  }

  return { success: true, message: "Job requisition updated successfully" };
};

const listMyJobRequisitions = async (user_id) => {
  return userRepository.executeQuery(
    `
      SELECT *
      FROM tbl_job_requisition
      WHERE user_id = ?
      ORDER BY posting_date DESC
    `,
    [user_id]
  );
};

const listAllJobRequisitionsWithRequestor = async () => {
  const rows = await userRepository.executeQuery(
    `
      SELECT
        r.job_requisition_id,
        r.job_title,
        r.posting_date,
        r.requisition_status,
        r.user_id,
        s.display_name AS requestor_name
      FROM tbl_job_requisition r
      LEFT JOIN vw_staff s ON r.user_id = s.emp_no
      ORDER BY r.posting_date DESC
    `
  );

  return rows.map((row) => ({
    job_requisition_id: row.job_requisition_id,
    job_title: row.job_title,
    posting_date: row.posting_date,
    requisition_status: row.requisition_status,
    user_id: row.user_id,
    requestor_name: row.requestor_name || row.user_id || "—",
  }));
};

const reviewJobRequisitionById = async ({ id, jobTitle, jobCategory, jobType, jobRequirements, jobResponsibilities, seekersRequired, requisition_status, remarks, hiringStatus }) => {
  if (!id || !requisition_status) {
    throw createServiceError(400, "Missing required fields");
  }

  const rows = await userRepository.executeQuery("SELECT * FROM tbl_job_requisition WHERE job_requisition_id = ?", [id]);
  if (rows.length === 0) {
    throw createServiceError(404, "Job requisition not found");
  }
  const current = rows[0];

  const result = await userRepository.executeQuery(
    `
      UPDATE tbl_job_requisition
      SET
        job_title = ?,
        job_category = ?,
        job_type = ?,
        hiring_status = ?,
        job_requirements = ?,
        job_responsibilities = ?,
        seekers_required = ?,
        requisition_status = ?,
        remarks = ?
      WHERE job_requisition_id = ?
    `,
    [
      jobTitle !== undefined ? jobTitle : current.job_title,
      jobCategory !== undefined ? jobCategory : current.job_category,
      jobType !== undefined ? jobType : current.job_type,
      hiringStatus !== undefined ? hiringStatus : current.hiring_status,
      jobRequirements !== undefined ? jobRequirements : current.job_requirements,
      jobResponsibilities !== undefined ? jobResponsibilities : current.job_responsibilities,
      seekersRequired !== undefined ? seekersRequired : current.seekers_required,
      requisition_status,
      remarks !== undefined ? remarks : current.remarks,
      id,
    ]
  );

  if (result.affectedRows === 0) {
    throw createServiceError(404, "Job requisition not found");
  }

  return { success: true, message: "Job requisition updated" };
};

const getJobRequisitionDetailsById = async (id) => {
  const rows = await userRepository.executeQuery(
    `
      SELECT
        r.*,
        u.first_name,
        u.last_name
      FROM tbl_job_requisition r
      LEFT JOIN tbl_users u ON r.user_id = u.user_id
      WHERE r.job_requisition_id = ?
    `,
    [id]
  );

  if (rows.length === 0) {
    throw createServiceError(404, "Job requisition not found");
  }

  const row = rows[0];
  row.requestor_name = row.first_name && row.last_name ? `${row.first_name} ${row.last_name}` : row.first_name || row.last_name || "—";
  return row;
};

const postVerifiedRequisitionAsJobById = async (id) => {
  const rows = await userRepository.executeQuery(
    "SELECT * FROM tbl_job_requisition WHERE job_requisition_id = ? AND requisition_status = 'Verified'",
    [id]
  );

  if (rows.length === 0) {
    throw createServiceError(404, "Verified requisition not found");
  }

  const reqData = rows[0];

  await userRepository.executeQuery(
    `
      INSERT INTO tbl_jobs (
        title,
        job_category,
        job_type,
        hiring_status,
        job_requirements,
        job_responsibilities,
        seekers_required,
        posting_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      reqData.job_title,
      reqData.job_category,
      reqData.job_type,
      "Hiring",
      reqData.job_requirements,
      reqData.job_responsibilities,
      reqData.seekers_required,
      getSingaporeDateTime(),
    ]
  );

  await userRepository.executeQuery("DELETE FROM tbl_job_requisition WHERE job_requisition_id = ?", [id]);

  return { success: true, message: "Job posted and requisition removed." };
};

module.exports = {
  createJobRequisition,
  updateOwnedJobRequisition,
  listMyJobRequisitions,
  listAllJobRequisitionsWithRequestor,
  reviewJobRequisitionById,
  getJobRequisitionDetailsById,
  postVerifiedRequisitionAsJobById,
};
