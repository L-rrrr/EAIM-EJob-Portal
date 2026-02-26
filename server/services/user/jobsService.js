const userRepository = require("../../repositories/userRepository");

const createServiceError = (status, message) => ({ status, message });

const getSingaporeDateTimeString = () => {
  return new Date(Date.now() + 8 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
};

const createJob = async ({ jobTitle, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities, seekersRequired }) => {
  const existingJobs = await userRepository.executeQuery("SELECT * FROM tbl_jobs WHERE title = ?", [jobTitle]);

  if (existingJobs.length > 0) {
    throw createServiceError(400, "This job already exists");
  }

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
    [jobTitle, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities, seekersRequired, getSingaporeDateTimeString()]
  );

  return { success: true, message: "Job posting successful" };
};

const updateJob = async ({ job_id, jobTitle, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities, seekersRequired }) => {
  if (!job_id) {
    throw createServiceError(400, "Job ID is required");
  }

  const result = await userRepository.executeQuery(
    `
      UPDATE tbl_jobs SET
        title = ?,
        job_category = ?,
        job_type = ?,
        hiring_status = ?,
        job_requirements = ?,
        job_responsibilities = ?,
        seekers_required = ?
      WHERE job_id = ?
    `,
    [jobTitle, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities, seekersRequired, job_id]
  );

  if (result.affectedRows === 0) {
    throw createServiceError(404, "Job not found");
  }

  return { success: true, message: "Job updated successfully" };
};

const listJobs = async () => {
  const jobs = await userRepository.executeQuery(
    `
      SELECT
        j.*,
        COUNT(DISTINCT a.user_id) AS applicants_now
      FROM tbl_jobs j
      LEFT JOIN tbl_application a ON j.job_id = a.job_id
      GROUP BY j.job_id
      ORDER BY j.posting_date DESC
    `
  );

  return jobs;
};

const getJobById = async (jobId) => {
  const jobs = await userRepository.executeQuery("SELECT * FROM tbl_jobs WHERE job_id = ? LIMIT 1", [jobId]);

  if (!jobs.length) {
    throw createServiceError(404, "Job not found");
  }

  return jobs[0];
};

const deleteJobById = async (jobId) => {
  if (!jobId) {
    throw createServiceError(400, "Job ID is required");
  }

  const existingJob = await userRepository.executeQuery("SELECT title FROM tbl_jobs WHERE job_id = ?", [jobId]);

  if (existingJob.length === 0) {
    throw createServiceError(404, "Job not found");
  }

  const result = await userRepository.executeQuery("DELETE FROM tbl_jobs WHERE job_id = ?", [jobId]);

  if (result.affectedRows === 0) {
    throw createServiceError(500, "Failed to delete job");
  }

  return {
    success: true,
    message: `Job "${existingJob[0].title}" deleted successfully`,
  };
};

const addBookmark = async ({ user_id, job_id }) => {
  const existing = await userRepository.executeQuery(
    `
      SELECT * FROM tbl_bookmark
      WHERE user_id = ? AND job_id = ?
    `,
    [user_id, job_id]
  );

  if (existing.length > 0) {
    throw createServiceError(400, "This job is already bookmarked.");
  }

  await userRepository.executeQuery(
    `
      INSERT INTO tbl_bookmark
      (user_id, job_id, created_at)
      VALUES (?, ?, ?)
    `,
    [user_id, job_id, getSingaporeDateTimeString()]
  );

  return { success: true, message: "Job bookmarked successfully." };
};

const listBookmarks = async (userId) => {
  return userRepository.executeQuery(
    `
      SELECT
        b.job_id,
        j.title,
        j.job_category,
        j.job_type,
        j.job_requirements,
        j.job_responsibilities
      FROM tbl_bookmark b
      LEFT JOIN tbl_jobs j ON b.job_id = j.job_id
      WHERE b.user_id = ?
    `,
    [userId]
  );
};

const removeBookmark = async ({ user_id, job_id }) => {
  await userRepository.executeQuery("DELETE FROM tbl_bookmark WHERE user_id = ? AND job_id = ?", [user_id, job_id]);
  return { success: true, message: "Bookmark deleted" };
};

module.exports = {
  createJob,
  updateJob,
  listJobs,
  getJobById,
  deleteJobById,
  addBookmark,
  listBookmarks,
  removeBookmark,
};
