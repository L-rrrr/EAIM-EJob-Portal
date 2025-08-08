const db = require("../dbConn");
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { get } = require("http");
const nodemailer = require("nodemailer");


const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmailToUser = async (req, res) => {
  const { user_id, subject, message } = req.body;
  if (!user_id || !subject || !message) {
    return res.status(400).json({ success: false, message: "Missing required fields." });
  }

  // Get user email from tbl_users
  const sql = `SELECT email FROM tbl_users WHERE user_id = ?`;
  const users = await db.executeQuery(sql, [user_id]);
  if (!users.length) {
    return res.status(404).json({ success: false, message: "User not found." });
  }
  const to = users[0].email;

  try {
    await transporter.sendMail({
      from: `"EAIM" <${process.env.SMTP_USER}>`,
      to: to,
      subject,
      html: `<p>${message.replace(/\n/g, "<br/>")}</p>`,
    });
    return res.status(200).json({ success: true, message: "Email sent successfully." });
  } catch (e) {
    console.error("Failed to send email:", e);
    return res.status(500).json({ success: false, message: "Failed to send email.", error: e.message });
  }
};

const postJobs = async (req, res) => {
  const {jobTitle, jobCategory, jobType, hiringStatus,jobRequirements, jobResponsibilities, seekersRequired } = req.body;

  try {
    const postingDate = new Date(Date.now() + 8 * 60 * 60 * 1000) // UTC+8 (Singapore time)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // format: 'YYYY-MM-DD HH:MM:SS'

    const checkSql = `SELECT * FROM tbl_jobs WHERE title = ?`;
    const existingJobs = await db.executeQuery(checkSql, [jobTitle]);

    if (existingJobs.length > 0) {
      return res.status(400).json({ success: false, message: "This job already exists" });
    }

    const insertSql = `
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
    `;
    await db.executeQuery(insertSql, [jobTitle, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities, seekersRequired, postingDate]);

    return res.status(201).json({ success: true, message: "Job posting successful" });
  } catch (e) {
    console.error("Job posting error:", e);
    return res.status(500).json({ success: false, message: "Job posting failed", error: e.message });
  }
}

const updateJob = async (req, res) => {
  const { job_id, jobTitle, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities, seekersRequired } = req.body;

  try {
    if (!job_id) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }

    const updateSql = `
      UPDATE tbl_jobs SET
        title = ?,
        job_category = ?,
        job_type = ?,
        hiring_status = ?,
        job_requirements = ?,
        job_responsibilities = ?,
        seekers_required = ?
      WHERE job_id = ?
    `;
    
    const result = await db.executeQuery(updateSql, [
      jobTitle, 
      jobCategory, 
      jobType, 
      hiringStatus, 
      jobRequirements, 
      jobResponsibilities, 
      seekersRequired, 
      job_id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, message: "Job updated successfully" });
  } catch (e) {
    console.error("Job update error:", e);
    return res.status(500).json({ success: false, message: "Job update failed", error: e.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const sql = `
      SELECT 
        j.*,
        COUNT(DISTINCT a.user_id) AS applicants_now
      FROM tbl_jobs j
      LEFT JOIN tbl_application a ON j.job_id = a.job_id
      GROUP BY j.job_id
      ORDER BY j.posting_date DESC
    `;
    const jobs = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: jobs });
  } catch (e) {
    console.error("Failed to fetch jobs:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getJobById = async (req, res) => {
  try {
    const job_id = req.params.id;
    const sql = `SELECT * FROM tbl_jobs WHERE job_id = ? LIMIT 1`;
    const jobs = await db.executeQuery(sql, [job_id]);
    if (!jobs.length) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    return res.status(200).json({ success: true, data: jobs[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Add this function to accountApi.js
const deleteJob = async (req, res) => {
  try {
    const job_id = req.params.id;

    if (!job_id) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }

    // Check if job exists
    const checkSql = `SELECT title FROM tbl_jobs WHERE job_id = ?`;
    const existingJob = await db.executeQuery(checkSql, [job_id]);

    if (existingJob.length === 0) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    // Delete the job
    const deleteSql = `DELETE FROM tbl_jobs WHERE job_id = ?`;
    const result = await db.executeQuery(deleteSql, [job_id]);

    if (result.affectedRows === 0) {
      return res.status(500).json({ success: false, message: "Failed to delete job" });
    }

    return res.status(200).json({ 
      success: true, 
      message: `Job "${existingJob[0].title}" deleted successfully` 
    });
  } catch (e) {
    console.error("Job deletion error:", e);
    return res.status(500).json({ 
      success: false, 
      message: "Job deletion failed", 
      error: e.message 
    });
  }
};


const bookmarkJob = async (req, res) => {
  try {
    const { job_id } = req.body;
    const user_id = req.user.user_id;

    // Check if this job is already bookmarked by the user
    const checkSql = `
      SELECT * FROM tbl_bookmark
      WHERE user_id = ? AND job_id = ?
    `;
    const existing = await db.executeQuery(checkSql, [user_id, job_id]);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "This job is already bookmarked." });
    }

    // Get current Singapore time (UTC+8)
    const createdAt = new Date(Date.now() + 8 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // Insert user_id, job_id, created_at
    const insertSql = `
      INSERT INTO tbl_bookmark
      (user_id, job_id, created_at)
      VALUES (?, ?, ?)
    `;

    await db.executeQuery(insertSql, [user_id, job_id, createdAt]);

    return res.status(200).json({ success: true, message: "Job bookmarked successfully." });
  } catch (e) {
    console.error("Failed to bookmark job:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    // Join with jobs table to get job details
    const sql = `
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
    `;
    const bookmarks = await db.executeQuery(sql, [user_id]);
    return res.status(200).json({ success: true, data: bookmarks });
  } catch (e) {
    console.error("Failed to fetch bookmarks:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const deleteBookmark = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { job_id } = req.body;

    const sql = `DELETE FROM tbl_bookmark WHERE user_id = ? AND job_id = ?`;
    await db.executeQuery(sql, [user_id, job_id]);

    return res.status(200).json({ success: true, message: "Bookmark deleted" });
  } catch (e) {
    console.error("Failed to delete bookmark:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const saveSgAddress = async (req, res) => {
  try {
    const user_id = req.user.user_id; // assuming authenticated user
    const {
      blk_no,
      street_name,
      unit_no,
      postal_code,
      mobile_no,
      home_no,
      is_draft
    } = req.body;

    // Validate is_draft value
    const isDraft = is_draft === "Y" ? "Y" : "N";

    const sql = `
      INSERT INTO tbl_sg_address (
        user_id,
        blk_no,
        street_name,
        unit_no,
        postal_code,
        mobile_no,
        home_no,
        is_draft
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      
      ON DUPLICATE KEY UPDATE
        blk_no = VALUES(blk_no),
        street_name = VALUES(street_name),
        unit_no = VALUES(unit_no),
        postal_code = VALUES(postal_code),
        mobile_no = VALUES(mobile_no),
        home_no = VALUES(home_no),
        is_draft = VALUES(is_draft)
    `;

    const params = [
      user_id,
      blk_no || null,
      street_name || null,
      unit_no || null,
      postal_code || null,
      mobile_no || null,
      home_no || null,
      isDraft
    ];

    await db.executeQuery(sql, params);

    return res.status(200).json({
      success: true,
      message: `Address ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`
    });
  } catch (e) {
    console.error("Failed to save address:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getSgAddress = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `SELECT * FROM tbl_sg_address WHERE user_id = ?`;
    const address = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: address.length > 0 ? address[0] : null
    });
  } catch (e) {
    console.error("Failed to fetch address:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const savePersonalParticulars = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const {
      salutation,
      full_name,
      nric,
      alias,
      email,
      date_of_birth,
      marital_status,
      gender,
      nationality,
      status_in_sg,
      race,
      dialect,
      religion,
      country_of_birth,
      passport_no,
      passport_expiry,
      is_draft
    } = req.body;

    const isDraft = is_draft === "Y" ? "Y" : "N";

    const sql = `
      INSERT INTO tbl_personal_particulars (
        user_id,
        salutation,
        full_name,
        nric,
        alias,
        email,
        date_of_birth,
        marital_status,
        gender,
        nationality,
        status_in_sg,
        race,
        dialect,
        religion,
        country_of_birth,
        passport_no,
        passport_expiry,
        is_draft
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        salutation = VALUES(salutation),
        full_name = VALUES(full_name),
        nric = VALUES(nric),
        alias = VALUES(alias),
        email = VALUES(email),
        date_of_birth = VALUES(date_of_birth),
        marital_status = VALUES(marital_status),
        gender = VALUES(gender),
        nationality = VALUES(nationality),
        status_in_sg = VALUES(status_in_sg),
        race = VALUES(race),
        dialect = VALUES(dialect),
        religion = VALUES(religion),
        country_of_birth = VALUES(country_of_birth),
        passport_no = VALUES(passport_no),
        passport_expiry = VALUES(passport_expiry),
        is_draft = VALUES(is_draft)
    `;

    const params = [
      user_id,
      salutation,
      full_name,
      nric,
      alias || null,
      email,
      date_of_birth,
      marital_status,
      gender,
      nationality,
      status_in_sg,
      race,
      dialect || null,
      religion,
      country_of_birth,
      passport_no,
      passport_expiry,
      isDraft
    ];

    await db.executeQuery(sql, params);

    return res.status(200).json({
      success: true,
      message: isDraft === "Y" ? "Draft saved." : "Personal particulars submitted."
    });
  } catch (error) {
    console.error("Failed to save personal particulars:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

const getPersonalParticulars = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `SELECT * FROM tbl_personal_particulars WHERE user_id = ?`;
    const particulars = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: particulars.length > 0 ? particulars[0] : null,
    });
  } catch (e) {
    console.error("Failed to fetch personal particulars:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const saveOverseasAddress = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const {
      has_overseas_address,
      blk_or_house_no,
      street_name,
      building_name,
      city,
      state_or_province,
      country,
      postal_code,
      mobile_country_code,
      mobile_number,
      home_country_code,
      home_number,
      is_draft
    } = req.body;

    // Normalize draft value
    const isDraft = is_draft === "Y" ? "Y" : "N";

    const sql = `
      INSERT INTO tbl_overseas_address (
        user_id,
        has_overseas_address,
        blk_or_house_no,
        street_name,
        building_name,
        city,
        state_or_province,
        country,
        postal_code,
        mobile_country_code,
        mobile_number,
        home_country_code,
        home_number,
        is_draft
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
        has_overseas_address = VALUES(has_overseas_address),
        blk_or_house_no = VALUES(blk_or_house_no),
        street_name = VALUES(street_name),
        building_name = VALUES(building_name),
        city = VALUES(city),
        state_or_province = VALUES(state_or_province),
        country = VALUES(country),
        postal_code = VALUES(postal_code),
        mobile_country_code = VALUES(mobile_country_code),
        mobile_number = VALUES(mobile_number),
        home_country_code = VALUES(home_country_code),
        home_number = VALUES(home_number),
        is_draft = VALUES(is_draft)
    `;

    const params = [
      user_id,
      has_overseas_address || null,
      blk_or_house_no || null,
      street_name || null,
      building_name || null,
      city || null,
      state_or_province || null,
      country || null,
      postal_code || null,
      mobile_country_code || null,
      mobile_number || null,
      home_country_code || null,
      home_number || null,
      isDraft
    ];

    console.log("SQL placeholders count:", (sql.match(/\?/g) || []).length);
    console.log("Params count:", params.length);
    console.log("Params:", params);

    await db.executeQuery(sql, params);

    return res.status(200).json({
      success: true,
      message: `Overseas address ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`
    });
  } catch (e) {
    console.error("Failed to save overseas address:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};


const getOverseasAddress = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `SELECT * FROM tbl_overseas_address WHERE user_id = ?`;
    const address = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: address.length > 0 ? address[0] : null
    });
  } catch (e) {
    console.error("Failed to fetch overseas address:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};


//Military service
const saveMilitaryService = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const {
      ns_status,
      service_from_year,
      service_from_month,
      service_to_year,
      service_to_month,
      rank,
      unit,
      vocation,
      next_camp_date,
      is_operationally_ready,
      nsman_unit,
      nsman_vocation,
      ns_exemption_reason,
      is_draft
    } = req.body;

    const isDraft = is_draft === "Y" ? "Y" : "N";

    const sql = `
      INSERT INTO tbl_military_service (
        user_id,
        ns_status,
        service_from_year,
        service_from_month,
        service_to_year,
        service_to_month,
        rank,
        unit,
        vocation,
        next_camp_date,
        is_operationally_ready,
        nsman_unit,
        nsman_vocation,
        ns_exemption_reason,
        is_draft
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        ns_status = VALUES(ns_status),
        service_from_year = VALUES(service_from_year),
        service_from_month = VALUES(service_from_month),
        service_to_year = VALUES(service_to_year),
        service_to_month = VALUES(service_to_month),
        rank = VALUES(rank),
        unit = VALUES(unit),
        vocation = VALUES(vocation),
        next_camp_date = VALUES(next_camp_date),
        is_operationally_ready = VALUES(is_operationally_ready),
        nsman_unit = VALUES(nsman_unit),
        nsman_vocation = VALUES(nsman_vocation),
        ns_exemption_reason = VALUES(ns_exemption_reason),
        is_draft = VALUES(is_draft)
    `;

    const params = [
      user_id,
      ns_status || null,
      service_from_year || null,
      service_from_month || null,
      service_to_year || null,
      service_to_month || null,
      rank || null,
      unit || null,
      vocation || null,
      next_camp_date || null,
      is_operationally_ready || null,
      nsman_unit || null,
      nsman_vocation || null,
      ns_exemption_reason || null,
      isDraft
    ];

    await db.executeQuery(sql, params);

    return res.status(200).json({
      success: true,
      message: `Military service ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
    });
  } catch (e) {
    console.error("Failed to save military service:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const getMilitaryService = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `SELECT * FROM tbl_military_service WHERE user_id = ?`;
    const service = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: service.length > 0 ? service[0] : null
    });
  } catch (e) {
    console.error("Failed to fetch military service:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

const saveEducationBackground = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.educationRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = []; // Array to store saved records with their IDs

    for (const record of records) {
      const {
        education_id,
        is_highest_qualification,
        level_of_qualification,
        institute,
        qualification_attained,
        year_from,
        year_to,
      } = record;

      if (education_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_education_background SET
            is_highest_qualification = ?,
            level_of_qualification = ?,
            institute = ?,
            qualification_attained = ?,
            year_from = ?,
            year_to = ?,
            is_draft = ?
          WHERE education_id = ? AND user_id = ?
        `;
        const updateParams = [
          is_highest_qualification || null,
          level_of_qualification || null,
          institute || null,
          qualification_attained || null,
          year_from || null,
          year_to || null,
          isDraft,
          education_id,
          user_id,
        ];
        await db.executeQuery(updateSql, updateParams);
        
        // Add the updated record to the response
        savedRecords.push({
          education_id: education_id,
          is_highest_qualification,
          level_of_qualification,
          institute,
          qualification_attained,
          year_from,
          year_to,
          is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_education_background (
            user_id,
            is_highest_qualification,
            level_of_qualification,
            institute,
            qualification_attained,
            year_from,
            year_to,
            is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id,
          is_highest_qualification || null,
          level_of_qualification || null,
          institute || null,
          qualification_attained || null,
          year_from || null,
          year_to || null,
          isDraft,
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        // Add the new record with its generated ID to the response
        savedRecords.push({
          education_id: result.insertId, // This is the auto-generated ID
          is_highest_qualification,
          level_of_qualification,
          institute,
          qualification_attained,
          year_from,
          year_to,
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Education records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords // Return the saved records with their IDs
    });
  } catch (e) {
    console.error("Failed to save education background:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getEducationBackground = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `
      SELECT * FROM tbl_education_background
      WHERE user_id = ?
      ORDER BY education_id ASC
    `;

    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch education background records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};


const deleteEducationBackground = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { education_id } = req.body;

    if (!education_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Education ID is required" 
      });
    }

    // Delete the record from database
    const deleteSql = `
      DELETE FROM tbl_education_background 
      WHERE education_id = ? AND user_id = ?
    `;
    
    const result = await db.executeQuery(deleteSql, [education_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Education record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Education record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete education record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Scholarship and Awards functions
const saveScholarshipAwards = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.scholarshipRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = []; // Array to store saved records with their IDs

    for (const record of records) {
      const {
        scholarship_id,
        organization,
        description,
        certificate,
        from_month,
        from_year,
        to_month,
        to_year,
      } = record;

      if (scholarship_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_scholarship_awards SET
            organization = ?,
            description = ?,
            certificate = ?,
            from_month = ?,
            from_year = ?,
            to_month = ?,
            to_year = ?,
            is_draft = ?
          WHERE scholarship_id = ? AND user_id = ?
        `;
        const updateParams = [
          organization || null,
          description || null,
          certificate || null,
          from_month || null,
          from_year || null,
          to_month || null,
          to_year || null,
          isDraft,
          scholarship_id,
          user_id,
        ];
        await db.executeQuery(updateSql, updateParams);
        
        // Add the updated record to the response
        savedRecords.push({
          scholarship_id: scholarship_id,
          organization,
          description,
          certificate,
          from_month,
          from_year,
          to_month,
          to_year,
          is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_scholarship_awards (
            user_id,
            organization,
            description,
            certificate,
            from_month,
            from_year,
            to_month,
            to_year,
            is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id,
          organization || null,
          description || null,
          certificate || null,
          from_month || null,
          from_year || null,
          to_month || null,
          to_year || null,
          isDraft,
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        // Add the new record with its generated ID to the response
        savedRecords.push({
          scholarship_id: result.insertId, // This is the auto-generated ID
          organization,
          description,
          certificate,
          from_month,
          from_year,
          to_month,
          to_year,
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Scholarship/Awards records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords // Return the saved records with their IDs
    });
  } catch (e) {
    console.error("Failed to save scholarship/awards:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getScholarshipAwards = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `
      SELECT * FROM tbl_scholarship_awards
      WHERE user_id = ?
      ORDER BY scholarship_id ASC
    `;

    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch scholarship/awards records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteScholarshipAwards = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { scholarship_id } = req.body;

    if (!scholarship_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Scholarship ID is required" 
      });
    }

    // Delete the record from database
    const deleteSql = `
      DELETE FROM tbl_scholarship_awards 
      WHERE scholarship_id = ? AND user_id = ?
    `;
    
    const result = await db.executeQuery(deleteSql, [scholarship_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Scholarship/Awards record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Scholarship/Awards record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete scholarship/awards record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Other Qualifications functions
const saveOtherQualifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.qualificationRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = []; // Array to store saved records with their IDs

    for (const record of records) {
      const {
        qualification_id,
        organization,
        course,
        certificate,
        from_month,
        from_year,
        to_month,
        to_year,
      } = record;

      if (qualification_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_other_qualifications SET
            organization = ?,
            course = ?,
            certificate = ?,
            from_month = ?,
            from_year = ?,
            to_month = ?,
            to_year = ?,
            is_draft = ?
          WHERE qualification_id = ? AND user_id = ?
        `;
        const updateParams = [
          organization || null,
          course || null,
          certificate || null,
          from_month || null,
          from_year || null,
          to_month || null,
          to_year || null,
          isDraft,
          qualification_id,
          user_id,
        ];
        await db.executeQuery(updateSql, updateParams);
        
        // Add the updated record to the response
        savedRecords.push({
          qualification_id: qualification_id,
          organization,
          course,
          certificate,
          from_month,
          from_year,
          to_month,
          to_year,
          is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_other_qualifications (
            user_id,
            organization,
            course,
            certificate,
            from_month,
            from_year,
            to_month,
            to_year,
            is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id,
          organization || null,
          course || null,
          certificate || null,
          from_month || null,
          from_year || null,
          to_month || null,
          to_year || null,
          isDraft,
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        // Add the new record with its generated ID to the response
        savedRecords.push({
          qualification_id: result.insertId, // This is the auto-generated ID
          organization,
          course,
          certificate,
          from_month,
          from_year,
          to_month,
          to_year,
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Other Qualifications records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords // Return the saved records with their IDs
    });
  } catch (e) {
    console.error("Failed to save other qualifications:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getOtherQualifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `
      SELECT * FROM tbl_other_qualifications
      WHERE user_id = ?
      ORDER BY qualification_id ASC
    `;

    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch other qualifications records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteOtherQualifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { qualification_id } = req.body;

    if (!qualification_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Qualification ID is required" 
      });
    }

    // Delete the record from database
    const deleteSql = `
      DELETE FROM tbl_other_qualifications 
      WHERE qualification_id = ? AND user_id = ?
    `;
    
    const result = await db.executeQuery(deleteSql, [qualification_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Other Qualifications record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Other Qualifications record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete other qualifications record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Work Experience functions
const saveWorkExperience = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.workRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const {
        work_id,
        company,
        role,
        salary,
        description,
        reason,
        from_month,
        from_year,
        to_month,
        to_year,
      } = record;

      if (work_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_work_experience SET
            company = ?, role = ?, salary = ?, description = ?, reason = ?,
            from_month = ?, from_year = ?, to_month = ?, to_year = ?, is_draft = ?
          WHERE work_id = ? AND user_id = ?
        `;
        const updateParams = [
          company || null, role || null, salary || null, description || null, reason || null,
          from_month || null, from_year || null, to_month || null, to_year || null,
          isDraft, work_id, user_id,
        ];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          work_id: work_id, company, role, salary, description, reason,
          from_month, from_year, to_month, to_year, is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_work_experience (
            user_id, company, role, salary, description, reason,
            from_month, from_year, to_month, to_year, is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id, company || null, role || null, salary || null, description || null, reason || null,
          from_month || null, from_year || null, to_month || null, to_year || null, isDraft,
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          work_id: result.insertId, company, role, salary, description, reason,
          from_month, from_year, to_month, to_year, is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Work experience records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save work experience:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getWorkExperience = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_work_experience WHERE user_id = ? ORDER BY work_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch work experience records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteWorkExperience = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { work_id } = req.body;

    if (!work_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Work ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_work_experience WHERE work_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [work_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Work experience record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Work experience record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete work experience record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Teaching Experience functions
const saveTeachingExperience = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.teachingRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const {
        teaching_id,
        institution,
        position,
        salary,
        subject,
        reason,
        from_month,
        from_year,
        to_month,
        to_year,
      } = record;

      if (teaching_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_teaching_experience SET
            institution = ?, position = ?, salary = ?, subject = ?, reason = ?,
            from_month = ?, from_year = ?, to_month = ?, to_year = ?, is_draft = ?
          WHERE teaching_id = ? AND user_id = ?
        `;
        const updateParams = [
          institution || null, position || null, salary || null, subject || null, reason || null,
          from_month || null, from_year || null, to_month || null, to_year || null,
          isDraft, teaching_id, user_id,
        ];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          teaching_id: teaching_id, institution, position, salary, subject, reason,
          from_month, from_year, to_month, to_year, is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_teaching_experience (
            user_id, institution, position, salary, subject, reason,
            from_month, from_year, to_month, to_year, is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id, institution || null, position || null, salary || null, subject || null, reason || null,
          from_month || null, from_year || null, to_month || null, to_year || null, isDraft,
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          teaching_id: result.insertId, institution, position, salary, subject, reason,
          from_month, from_year, to_month, to_year, is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Teaching experience records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save teaching experience:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getTeachingExperience = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_teaching_experience WHERE user_id = ? ORDER BY teaching_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch teaching experience records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteTeachingExperience = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { teaching_id } = req.body;

    if (!teaching_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Teaching ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_teaching_experience WHERE teaching_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [teaching_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Teaching experience record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teaching experience record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete teaching experience record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Skills functions
const saveSkills = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.skillRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const { skill_id, name, level } = record;

      if (skill_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_skills SET name = ?, level = ?, is_draft = ?
          WHERE skill_id = ? AND user_id = ?
        `;
        const updateParams = [name || null, level || null, isDraft, skill_id, user_id];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          skill_id: skill_id, name, level, is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_skills (user_id, name, level, is_draft) VALUES (?, ?, ?, ?)
        `;
        const insertParams = [user_id, name || null, level || null, isDraft];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          skill_id: result.insertId, name, level, is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Skills records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save skills:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getSkills = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_skills WHERE user_id = ? ORDER BY skill_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch skills records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteSkills = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { skill_id } = req.body;

    if (!skill_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Skill ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_skills WHERE skill_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [skill_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Skills record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Skills record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete skills record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Languages functions
const saveLanguages = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.languageRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const { language_id, name, spoken, written, reading } = record;

      if (language_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_languages SET name = ?, spoken = ?, written = ?, reading = ?, is_draft = ?
          WHERE language_id = ? AND user_id = ?
        `;
        const updateParams = [name || null, spoken || null, written || null, reading || null, isDraft, language_id, user_id];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          language_id: language_id, name, spoken, written, reading, is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_languages (user_id, name, spoken, written, reading, is_draft) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [user_id, name || null, spoken || null, written || null, reading || null, isDraft];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          language_id: result.insertId, name, spoken, written, reading, is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Language records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save languages:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getLanguages = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_languages WHERE user_id = ? ORDER BY language_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch language records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteLanguages = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { language_id } = req.body;

    if (!language_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Language ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_languages WHERE language_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [language_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Language record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Language record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete language record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Family Background functions
const saveFamilyBackground = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.familyRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const {
        record_id,
        name,
        relationship,
        age,
        occupation,
        contact_no,
      } = record;

      if (record_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_family_background SET
            name = ?, relationship = ?, age = ?, occupation = ?, contact_no = ?, is_draft = ?
          WHERE record_id = ? AND user_id = ?
        `;
        const updateParams = [
          name || null, 
          relationship || null, 
          age || null, 
          occupation || null, 
          contact_no || null, 
          isDraft, 
          record_id, 
          user_id
        ];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          record_id: record_id, 
          name, 
          relationship, 
          age, 
          occupation, 
          contact_no, 
          is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_family_background (
            user_id, name, relationship, age, occupation, contact_no, is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id, 
          name || null, 
          relationship || null, 
          age || null, 
          occupation || null, 
          contact_no || null, 
          isDraft
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          record_id: result.insertId, 
          name, 
          relationship, 
          age, 
          occupation, 
          contact_no, 
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Family background records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save family background:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getFamilyBackground = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_family_background WHERE user_id = ? ORDER BY record_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch family background records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteFamilyBackground = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { record_id } = req.body;

    if (!record_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Record ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_family_background WHERE record_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [record_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Family background record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Family background record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete family background record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Emergency Contact functions
const saveEmergencyContact = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.emergencyRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const {
        contact_id,
        name,
        contact_no,
        relationship,
      } = record;

      if (contact_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_emergency_contact SET
            name = ?, contact_no = ?, relationship = ?, is_draft = ?
          WHERE contact_id = ? AND user_id = ?
        `;
        const updateParams = [
          name || null, 
          contact_no || null, 
          relationship || null, 
          isDraft, 
          contact_id, 
          user_id
        ];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          contact_id: contact_id, 
          name, 
          contact_no, 
          relationship, 
          is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_emergency_contact (
            user_id, name, contact_no, relationship, is_draft
          ) VALUES (?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id, 
          name || null, 
          contact_no || null, 
          relationship || null, 
          isDraft
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          contact_id: result.insertId, 
          name, 
          contact_no, 
          relationship, 
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Emergency contact records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save emergency contact:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getEmergencyContact = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_emergency_contact WHERE user_id = ? ORDER BY contact_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch emergency contact records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteEmergencyContact = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { contact_id } = req.body;

    if (!contact_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Contact ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_emergency_contact WHERE contact_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [contact_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Emergency contact record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Emergency contact record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete emergency contact record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// References functions
const saveReferences = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.referenceRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const {
        reference_id,
        name,
        occupation,
        contact_no,
        relationship,
      } = record;

      if (reference_id) {
        // Update existing record
        const updateSql = `
          UPDATE tbl_references SET
            name = ?, occupation = ?, contact_no = ?, relationship = ?, is_draft = ?
          WHERE reference_id = ? AND user_id = ?
        `;
        const updateParams = [
          name || null, 
          occupation || null, 
          contact_no || null, 
          relationship || null, 
          isDraft, 
          reference_id, 
          user_id
        ];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          reference_id: reference_id, 
          name, 
          occupation, 
          contact_no, 
          relationship, 
          is_draft: isDraft
        });
      } else {
        // Insert new record
        const insertSql = `
          INSERT INTO tbl_references (
            user_id, name, occupation, contact_no, relationship, is_draft
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id, 
          name || null, 
          occupation || null, 
          contact_no || null, 
          relationship || null, 
          isDraft
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          reference_id: result.insertId, 
          name, 
          occupation, 
          contact_no, 
          relationship, 
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Reference records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save references:", e);
    return res.status(500).json({
      success: false,
      message: "Database constraint violation or server error",
      error: e.message,
    });
  }
};

const getReferences = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_references WHERE user_id = ? ORDER BY reference_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch reference records:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

const deleteReferences = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { reference_id } = req.body;

    if (!reference_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Reference ID is required" 
      });
    }

    const deleteSql = `DELETE FROM tbl_references WHERE reference_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [reference_id, user_id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Reference record not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Reference record deleted successfully"
    });

  } catch (e) {
    console.error("Failed to delete reference record:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// attachment functions
// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: userId_timestamp_originalname
    const uniqueName = `${req.user.user_id}_${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    // Allow common file types
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images, PDFs, and documents are allowed'));
    }
  }
});

// Upload single file function
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const fileInfo = {
      file_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      file_type: req.file.mimetype,
      server_filename: req.file.filename
    };

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully",
      data: fileInfo
    });
  } catch (e) {
    console.error("Failed to upload file:", e);
    
    // Handle specific multer errors
    let errorMessage = "Server error";
    if (e.code === 'LIMIT_FILE_SIZE') {
      errorMessage = "File too large. Maximum file size is 10MB.";
    } else if (e.message.includes('Only images, PDFs, and documents are allowed')) {
      errorMessage = e.message;
    }
    
    return res.status(500).json({
      success: false,
      message: errorMessage,
      error: e.message,
    });
  }
};

// Save attachments function
const saveAttachments = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const records = req.body.attachmentRecords;
    const isDraft = req.body.is_draft === "Y" ? "Y" : "N";

    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, message: "Invalid data format." });
    }

    const savedRecords = [];

    for (const record of records) {
      const {
        attachment_id,
        document_type,
        document_name,
        file_name,
        file_path,
        file_size,
        file_type
      } = record;

      // For drafts, save all records (even if they only have a file)
      // For final submission, require at least document_type and document_name for non-Resume records
      const isResume = document_type === "Resume" || (attachment_id === undefined && savedRecords.length === 0);
      const hasFile = file_name && file_path;
      const hasContent = document_type || document_name;
      
      // Skip completely empty records only for final submission
      if (!hasContent && !hasFile && isDraft === "N" && !isResume) {
        continue;
      }

      if (attachment_id) {
        // Update existing attachment
        const updateSql = `
          UPDATE tbl_attachments SET
            document_type = ?, document_name = ?, file_name = ?, 
            file_path = ?, file_size = ?, file_type = ?, is_draft = ?
          WHERE attachment_id = ? AND user_id = ?
        `;
        const updateParams = [
          document_type || null,
          document_name || null,
          file_name || null,
          file_path || null,
          file_size || null,
          file_type || null,
          isDraft,
          attachment_id,
          user_id
        ];
        await db.executeQuery(updateSql, updateParams);
        
        savedRecords.push({
          attachment_id: attachment_id,
          document_type,
          document_name,
          file_name,
          file_path,
          file_size,
          file_type,
          is_draft: isDraft
        });
      } else {
        // Insert new attachment (including file-only records for drafts)
        const insertSql = `
          INSERT INTO tbl_attachments (
            user_id, document_type, document_name, file_name, 
            file_path, file_size, file_type, is_draft
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [
          user_id,
          document_type || null,
          document_name || null,
          file_name || null,
          file_path || null,
          file_size || null,
          file_type || null,
          isDraft
        ];
        
        const result = await db.executeQuery(insertSql, insertParams);
        
        savedRecords.push({
          attachment_id: result.insertId,
          document_type,
          document_name,
          file_name,
          file_path,
          file_size,
          file_type,
          is_draft: isDraft
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: `Attachments ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
      data: savedRecords
    });
  } catch (e) {
    console.error("Failed to save attachments:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

// Get attachments function
const getAttachments = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT * FROM tbl_attachments WHERE user_id = ? ORDER BY attachment_id ASC`;
    const records = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (e) {
    console.error("Failed to fetch attachments:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

// Replace your existing deleteAttachments function with this enhanced version:
const deleteAttachments = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { attachment_id } = req.body;

    console.log("=== DELETE ATTACHMENT DEBUG ===");
    console.log("User ID:", user_id);
    console.log("Attachment ID:", attachment_id);
    console.log("Request body:", req.body);

    if (!attachment_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Attachment ID is required" 
      });
    }

    // Get file info before deletion
    const getFileSql = `SELECT file_path, file_name FROM tbl_attachments WHERE attachment_id = ? AND user_id = ?`;
    const fileRecords = await db.executeQuery(getFileSql, [attachment_id, user_id]);

    console.log("File records found:", fileRecords);

    if (fileRecords.length === 0) {
      console.log("No attachment found in database");
      return res.status(404).json({
        success: false,
        message: "Attachment not found"
      });
    }

    const fileRecord = fileRecords[0];
    console.log("File to delete:", {
      file_name: fileRecord.file_name,
      file_path: fileRecord.file_path
    });

    // Delete from database first
    const deleteSql = `DELETE FROM tbl_attachments WHERE attachment_id = ? AND user_id = ?`;
    const result = await db.executeQuery(deleteSql, [attachment_id, user_id]);

    console.log("Database deletion result:", result);

    if (result.affectedRows === 0) {
      console.log("No rows affected during database deletion");
      return res.status(500).json({
        success: false,
        message: "Failed to delete database record"
      });
    }

    console.log("Database record deleted successfully");

    // Delete physical file after successful database deletion
    let fileDeleteResult = { success: true, message: "No file to delete" };
    
    if (fileRecord.file_path) {
      try {
        console.log("Attempting to delete file at:", fileRecord.file_path);
        console.log("File exists check:", fs.existsSync(fileRecord.file_path));
        
        // Check if file exists
        if (fs.existsSync(fileRecord.file_path)) {
          console.log("File exists, attempting to delete...");
          fs.unlinkSync(fileRecord.file_path);
          fileDeleteResult = { 
            success: true, 
            message: `Physical file deleted: ${fileRecord.file_name}` 
          };
          console.log("✅ Physical file deleted successfully:", fileRecord.file_path);
        } else {
          fileDeleteResult = { 
            success: true, 
            message: `File not found on disk: ${fileRecord.file_name}` 
          };
          console.log("❌ File not found on disk:", fileRecord.file_path);
        }
      } catch (fileErr) {
        fileDeleteResult = { 
          success: false, 
          message: `Failed to delete file: ${fileErr.message}` 
        };
        console.error("❌ Failed to delete physical file:", fileErr);
        console.error("File error details:", fileErr);
      }
    } else {
      console.log("No file_path found in database record");
    }

    console.log("=== DELETE ATTACHMENT COMPLETE ===");

    return res.status(200).json({
      success: true,
      message: "Attachment deleted successfully",
      details: {
        database: "Record deleted",
        file: fileDeleteResult.message
      }
    });

  } catch (e) {
    console.error("❌ Failed to delete attachment:", e);
    return res.status(500).json({
      success: false,
      message: "Server error during deletion",
      error: e.message
    });
  }
};

// Add this new function for replacing attachment files
const replaceAttachmentFile = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { attachment_id, old_file_path } = req.body;

    console.log("=== REPLACE ATTACHMENT FILE DEBUG ===");
    console.log("User ID:", user_id);
    console.log("Attachment ID:", attachment_id);
    console.log("Old file path:", old_file_path);

    if (!attachment_id) {
      return res.status(400).json({ 
        success: false, 
        message: "Attachment ID is required" 
      });
    }

    // Verify the attachment belongs to the user
    const checkSql = `SELECT file_path FROM tbl_attachments WHERE attachment_id = ? AND user_id = ?`;
    const attachmentRecords = await db.executeQuery(checkSql, [attachment_id, user_id]);

    if (attachmentRecords.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Attachment not found"
      });
    }

    const currentFilePath = attachmentRecords[0].file_path;
    console.log("Current file path from DB:", currentFilePath);

    // Delete the physical file if it exists
    let fileDeleteResult = { success: true, message: "No file to delete" };
    
    if (currentFilePath && fs.existsSync(currentFilePath)) {
      try {
        fs.unlinkSync(currentFilePath);
        fileDeleteResult = { 
          success: true, 
          message: "Old file deleted successfully" 
        };
        console.log("✅ Old file deleted:", currentFilePath);
      } catch (fileErr) {
        fileDeleteResult = { 
          success: false, 
          message: `Failed to delete old file: ${fileErr.message}` 
        };
        console.error("❌ Failed to delete old file:", fileErr);
      }
    } else {
      console.log("Old file not found on disk:", currentFilePath);
      fileDeleteResult = { 
        success: true, 
        message: "Old file not found on disk" 
      };
    }

    console.log("=== REPLACE FILE COMPLETE ===");

    return res.status(200).json({
      success: true,
      message: "File replacement prepared",
      details: fileDeleteResult
    });

  } catch (e) {
    console.error("❌ Failed to replace attachment file:", e);
    return res.status(500).json({
      success: false,
      message: "Server error during file replacement",
      error: e.message
    });
  }
};


// Application functions
const submitApplication = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    const {
      job_id,
      documentType,
      documentName,
      currentSalary,
      expectedSalary,
      earliestStartingDate,
      sourceObtainedFrom,
      totalWorkExperience,
      relevantWorkExperience
    } = req.body;

    // Get current date for applied_date
    const appliedDate = new Date(Date.now() + 8 * 60 * 60 * 1000); // Convert to Singapore time (UTC+8)

    // Handle file upload data
    let fileData = {
      file_name: null,
      file_path: null,
      file_size: null
    };

    if (req.file) {
      fileData = {
        file_name: req.file.originalname,
        file_path: req.file.path,
        file_size: req.file.size
      };
    }

    // Insert application into database
    const insertSql = `
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
    `;

    const params = [
      user_id,
      job_id || null,
      appliedDate,
      documentType || null,
      documentName || null,
      fileData.file_name,
      fileData.file_path,
      fileData.file_size,
      parseFloat(currentSalary) || null,
      parseFloat(expectedSalary) || null,
      earliestStartingDate || null,
      sourceObtainedFrom || null,
      parseFloat(totalWorkExperience) || null,
      parseFloat(relevantWorkExperience) || null
    ];

    const result = await db.executeQuery(insertSql, params);
    
      // After successful application insert
    const userSql = `SELECT email, first_name, last_name FROM tbl_users WHERE user_id = ?`;
    const userRows = await db.executeQuery(userSql, [user_id]);
    const userEmail = userRows.length ? userRows[0].email : null;
    const userName = userRows.length ? `${userRows[0].first_name} ${userRows[0].last_name}` : "Applicant";
    
    // Get job title for the email
    const jobSql = `SELECT title FROM tbl_jobs WHERE job_id = ?`;
    const jobRows = await db.executeQuery(jobSql, [job_id]);
    const jobTitle = jobRows.length ? jobRows[0].title : "Unknown Position";
    
    // Send email notification
    if (userEmail) {
      await transporter.sendMail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "Job Application Submitted",
        html: `<p>Dear ${userName},</p>
               <p>Your application for <strong>${jobTitle}</strong> has been submitted successfully.</p>
               <p>Thank you for applying!</p>`
      });
    }

    return res.status(200).json({
      success: true,
      message: "Application submitted successfully",
      data: {
        application_id: result.insertId
      }
    });

  } catch (e) {
    console.error("Failed to submit application:", e);
    
    // Clean up uploaded file if database insertion fails
    if (req.file && req.file.path) {
      try {
        const fs = require('fs');
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (fileErr) {
        console.error("Failed to clean up file after error:", fileErr);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Get Application information
const getAppliedJobs = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const sql = `
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
    `;

    const applications = await db.executeQuery(sql, [user_id]);

    return res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (e) {
    console.error("Failed to fetch applied jobs:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message,
    });
  }
};

// Get applicants' information
// Add this simplified function to accountApi.js
const getApplicants = async (req, res) => {
  try {
    const sql = `
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
        a.assessment_done
      FROM tbl_application a
      LEFT JOIN tbl_personal_particulars pp ON a.user_id = pp.user_id
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.application_status IS NOT NULL
      ORDER BY a.applied_date DESC
    `;

    const applicants = await db.executeQuery(sql);

    // Format the data to match your frontend expectations
    const formattedApplicants = applicants.map(applicant => ({
      application_id: applicant.application_id,
      user_id: applicant.user_id,
      job_id: applicant.job_id,
      name: applicant.applicant_name || 'Unknown Applicant',
      email: applicant.email,
      job: applicant.job_title || 'Unknown Position',
      job_category: applicant.job_category,
      applied: formatDate(applicant.applied_date),
      interview: formatDate(applicant.interview_date),
      status: applicant.application_status || 'Pending review',
      assessment_done: applicant.assessment_done === "Yes"
    }));

    return res.status(200).json({ 
      success: true, 
      data: formattedApplicants 
    });
  } catch (e) {
    console.error("Failed to fetch applicants:", e);
    return res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: e.message 
    });
  }
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return "";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};


// Get applicant's personal particulars
const getApplicantPersonalParticulars = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Get personal particulars
    const personalSql = `SELECT * FROM tbl_personal_particulars WHERE user_id = ?`;
    const personalData = await db.executeQuery(personalSql, [userId]);

    // Get Singapore address
    const sgAddressSql = `SELECT * FROM tbl_sg_address WHERE user_id = ?`;
    const sgAddressData = await db.executeQuery(sgAddressSql, [userId]);

    // Get overseas address
    const overseasSql = `SELECT * FROM tbl_overseas_address WHERE user_id = ?`;
    const overseasData = await db.executeQuery(overseasSql, [userId]);

    // Get military service
    const militarySql = `SELECT * FROM tbl_military_service WHERE user_id = ?`;
    const militaryData = await db.executeQuery(militarySql, [userId]);

    const responseData = {
      personalParticulars: personalData.length > 0 ? personalData[0] : null,
      sgAddress: sgAddressData.length > 0 ? sgAddressData[0] : null,
      overseasAddress: overseasData.length > 0 ? overseasData[0] : null,
      militaryService: militaryData.length > 0 ? militaryData[0] : null
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (e) {
    console.error("Failed to fetch applicant data:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Get applicant's education background
const getApplicantEducation = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Get education background
    const educationSql = `SELECT * FROM tbl_education_background WHERE user_id = ? ORDER BY education_id ASC`;
    const educationData = await db.executeQuery(educationSql, [userId]);

    // Get scholarship awards
    const scholarshipSql = `SELECT * FROM tbl_scholarship_awards WHERE user_id = ? ORDER BY scholarship_id ASC`;
    const scholarshipData = await db.executeQuery(scholarshipSql, [userId]);

    // Get other qualifications
    const qualificationsSql = `SELECT * FROM tbl_other_qualifications WHERE user_id = ? ORDER BY qualification_id ASC`;
    const qualificationsData = await db.executeQuery(qualificationsSql, [userId]);

    const responseData = {
      education: educationData,
      scholarships: scholarshipData,
      qualifications: qualificationsData
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (e) {
    console.error("Failed to fetch applicant education data:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Get applicant's work experience
const getApplicantWork = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Get work experience
    const workSql = `SELECT * FROM tbl_work_experience WHERE user_id = ? ORDER BY work_id ASC`;
    const workData = await db.executeQuery(workSql, [userId]);

    // Get teaching experience
    const teachingSql = `SELECT * FROM tbl_teaching_experience WHERE user_id = ? ORDER BY teaching_id ASC`;
    const teachingData = await db.executeQuery(teachingSql, [userId]);

    // Get skills
    const skillsSql = `SELECT * FROM tbl_skills WHERE user_id = ? ORDER BY skill_id ASC`;
    const skillsData = await db.executeQuery(skillsSql, [userId]);

    // Get languages
    const languagesSql = `SELECT * FROM tbl_languages WHERE user_id = ? ORDER BY language_id ASC`;
    const languagesData = await db.executeQuery(languagesSql, [userId]);

    const responseData = {
      workExperience: workData,
      teachingExperience: teachingData,
      skills: skillsData,
      languages: languagesData
    };

    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (e) {
    console.error("Failed to fetch applicant work data:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Add to accountApi.js
// filepath: e:\cs internship\EAIM-Internship\server\apiService\accountApi.js

const getApplicantFamily = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Get family background
    const familySql = `SELECT * FROM tbl_family_background WHERE user_id = ? ORDER BY record_id ASC`;
    const familyData = await db.executeQuery(familySql, [userId]);

    // Get emergency contacts
    const emergencySql = `SELECT * FROM tbl_emergency_contact WHERE user_id = ? ORDER BY contact_id ASC`;
    const emergencyData = await db.executeQuery(emergencySql, [userId]);

    return res.status(200).json({
      success: true,
      data: {
        family: familyData,
        emergency: emergencyData
      }
    });
  } catch (e) {
    console.error("Failed to fetch applicant family data:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Applicant support functions
const getApplicantSupport = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }

    // Get references
    const referencesSql = `SELECT * FROM tbl_references WHERE user_id = ? ORDER BY reference_id ASC`;
    const referencesData = await db.executeQuery(referencesSql, [userId]);

    // Get attachments
    const attachmentsSql = `SELECT * FROM tbl_attachments WHERE user_id = ? ORDER BY attachment_id ASC`;
    const attachmentsData = await db.executeQuery(attachmentsSql, [userId]);

    return res.status(200).json({
      success: true,
      data: {
        references: referencesData,
        attachments: attachmentsData
      }
    });
  } catch (e) {
    console.error("Failed to fetch applicant support data:", e);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: e.message
    });
  }
};

// Save interview details
const scheduleInterview = async (req, res) => {
  try {
    const {
      application_id, // <-- must be sent from frontend!
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
      additional_notes
    } = req.body;

    const sql = `
      INSERT INTO tbl_interview (
        interview_id, user_id, job_id, applicant, job, interview_date, meeting_format,
        start_time, end_time, venue, add_to_my_calendar, additional_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        add_to_my_calendar = VALUES(add_to_my_calendar),
        additional_notes = VALUES(additional_notes)
    `;

    await db.executeQuery(sql, [
      application_id, // interview_id
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
      additional_notes || null
    ]);

    const updateAppSql = `
      UPDATE tbl_application
      SET application_status = 'Interview Scheduled',
          interview_date = ?
      WHERE application_id = ?
    `;
    await db.executeQuery(updateAppSql, [
      interview_date || null,
      application_id
    ]);
    
    // Get applicant's email and name
    const userSql = `SELECT email, first_name, last_name FROM tbl_users WHERE user_id = ?`;
    const userRows = await db.executeQuery(userSql, [user_id]);
    const userEmail = userRows.length ? userRows[0].email : null;
    const userName = userRows.length ? `${userRows[0].first_name} ${userRows[0].last_name}` : "Applicant";
    
    // Get job title
    const jobSql = `SELECT title FROM tbl_jobs WHERE job_id = ?`;
    const jobRows = await db.executeQuery(jobSql, [job_id]);
    const jobTitle = jobRows.length ? jobRows[0].title : "Unknown Position";
    
    // Compose interview details
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
    
    if (userEmail) {
      await transporter.sendMail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "Interview Scheduled",
        html: interviewDetails
      });
    }

    return res.status(201).json({ success: true, message: "Interview scheduled successfully" });
  } catch (e) {
    console.error("Failed to schedule interview:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get pending applicants information (status = 'Pending' or similar)
const getPendingApplicants = async (req, res) => {
  try {
    const sql = `
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
    `;
    const rows = await db.executeQuery(sql);
    const data = rows.map(row => ({
      id: row.application_id,
      user_id: row.user_id,
      job_id: row.job_id,
      name: row.applicant_name || "Unknown",
      job: row.job_title || "Unknown",
      date: row.applied_date
    }));
    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error("Failed to fetch pending applicants:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getAllApplicants = async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT pp.user_id, pp.full_name
      FROM tbl_personal_particulars pp
      INNER JOIN tbl_application a ON a.user_id = pp.user_id
      WHERE pp.full_name IS NOT NULL AND pp.full_name != ''
    `;
    const rows = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getAllJobs = async (req, res) => {
  try {
    const sql = `SELECT job_id, title FROM tbl_jobs WHERE hiring_status = 'Hiring' ORDER BY posting_date DESC`;
    const rows = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Update interview details
const updateInterview = async (req, res) => {
  try {
    const { id } = req.params;
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
      additional_notes
    } = req.body;

    const sql = `
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
    `;

    await db.executeQuery(sql, [
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
      id
    ]);
    
    // Get applicant's email and name
    const userSql = `SELECT email, first_name, last_name FROM tbl_users WHERE user_id = ?`;
    const userRows = await db.executeQuery(userSql, [user_id]);
    const userEmail = userRows.length ? userRows[0].email : null;
    const userName = userRows.length ? `${userRows[0].first_name} ${userRows[0].last_name}` : "Applicant";
    
    // Get job title
    const jobSql = `SELECT title FROM tbl_jobs WHERE job_id = ?`;
    const jobRows = await db.executeQuery(jobSql, [job_id]);
    const jobTitle = jobRows.length ? jobRows[0].title : "Unknown Position";
    
    // Compose interview details
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
    
    if (userEmail) {
      await transporter.sendMail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: userEmail,
        subject: "Interview Scheduled",
        html: interviewDetails
      });
    }

    return res.status(200).json({ success: true, message: "Interview updated successfully" });
  } catch (e) {
    console.error("Failed to update interview:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get interview information
const getAllInterviews = async (req, res) => {
  try {
    const sql = `SELECT * FROM tbl_interview ORDER BY interview_date DESC, start_time DESC`;
    const rows = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Delete interview 
const deleteInterview = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user_id and job_id for the interview to update the application
    const getSql = `SELECT user_id, job_id FROM tbl_interview WHERE interview_id = ?`;
    const rows = await db.executeQuery(getSql, [id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Interview not found" });
    }
    const { user_id, job_id } = rows[0];

    // Delete the interview
    const deleteSql = `DELETE FROM tbl_interview WHERE interview_id = ?`;
    await db.executeQuery(deleteSql, [id]);

    // Update the application status back to Pending and clear interview_date
    const updateAppSql = `
      UPDATE tbl_application
      SET application_status = 'Pending',
          interview_date = NULL
      WHERE user_id = ? AND job_id = ?
    `;
    await db.executeQuery(updateAppSql, [user_id, job_id]);

    return res.status(200).json({ success: true, message: "Interview deleted and application status reverted to Pending" });
  } catch (e) {
    console.error("Failed to delete interview:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Update Application Status
const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = [
      "Pending",
      "Reviewing",
      "Assessed",
      "Interview Scheduled",
      "Offer Made",
      "Not Selected",
      "Offer Accepted",
      "Offer Declined"
    ];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }
    const sql = `
      UPDATE tbl_application
      SET application_status = ?
      WHERE application_id = ?
    `;
    await db.executeQuery(sql, [status, id]);
    return res.status(200).json({ success: true, message: "Status updated" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Check if the user has completed their personal particulars
const checkPersonalParticularsCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Check all 4 tables for is_draft = 'N'
    const sqls = [
      `SELECT is_draft FROM tbl_personal_particulars WHERE user_id = ?`,
      `SELECT is_draft FROM tbl_sg_address WHERE user_id = ?`,
      `SELECT is_draft FROM tbl_overseas_address WHERE user_id = ?`,
      `SELECT is_draft FROM tbl_military_service WHERE user_id = ?`
    ];

    const results = await Promise.all(sqls.map(sql => db.executeQuery(sql, [user_id])));

    // Each result is an array, check if each has a record and is_draft === 'N'
    const allComplete = results.every(rows => rows.length > 0 && rows[0].is_draft === 'N');

    return res.status(200).json({ success: true, complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Check if the user has completed their education background
const checkEducationCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    // Check education background (must have at least one record and is_draft = 'N')
    const eduRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_education_background WHERE user_id = ?`,
      [user_id]
    );
    const eduComplete = eduRows.length > 0 && eduRows.every(row => row.is_draft === 'N');

    // Scholarship and other qualifications are optional: complete if empty or all N
    const scholarshipRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_scholarship_awards WHERE user_id = ?`,
      [user_id]
    );
    const scholarshipComplete =
      scholarshipRows.length === 0 || scholarshipRows.every(row => row.is_draft === 'N');

    const qualificationRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_other_qualifications WHERE user_id = ?`,
      [user_id]
    );
    const qualificationComplete =
      qualificationRows.length === 0 || qualificationRows.every(row => row.is_draft === 'N');

    const allComplete = eduComplete && scholarshipComplete && qualificationComplete;

    return res.status(200).json({ success: true, complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Work & Skills completeness
const checkWorkCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    // Work experience (optional)
    const workRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_work_experience WHERE user_id = ?`,
      [user_id]
    );
    const workComplete = workRows.length === 0 || workRows.every(row => row.is_draft === 'N');
    // Teaching experience (optional)
    const teachingRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_teaching_experience WHERE user_id = ?`,
      [user_id]
    );
    const teachingComplete = teachingRows.length === 0 || teachingRows.every(row => row.is_draft === 'N');
    // Skills (required)
    const skillsRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_skills WHERE user_id = ?`,
      [user_id]
    );
    const skillsComplete = skillsRows.length > 0 && skillsRows.every(row => row.is_draft === 'N');
    // Languages (required)
    const langRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_languages WHERE user_id = ?`,
      [user_id]
    );
    const langComplete = langRows.length > 0 && langRows.every(row => row.is_draft === 'N');
    const allComplete = workComplete && teachingComplete && skillsComplete && langComplete;
    return res.status(200).json({ success: true, complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Family completeness
const checkFamilyCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    // Family background (required)
    const familyRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_family_background WHERE user_id = ?`,
      [user_id]
    );
    const familyComplete = familyRows.length > 0 && familyRows.every(row => row.is_draft === 'N');
    // Emergency contact (required)
    const emergencyRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_emergency_contact WHERE user_id = ?`,
      [user_id]
    );
    const emergencyComplete = emergencyRows.length > 0 && emergencyRows.every(row => row.is_draft === 'N');
    const allComplete = familyComplete && emergencyComplete;
    return res.status(200).json({ success: true, complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Support completeness
const checkSupportCompleteness = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    // References (required: at least 2)
    const refRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_references WHERE user_id = ?`,
      [user_id]
    );
    const refComplete = refRows.length >= 2 && refRows.every(row => row.is_draft === 'N');
    // Attachments (required: at least 1)
    const attRows = await db.executeQuery(
      `SELECT is_draft FROM tbl_attachments WHERE user_id = ?`,
      [user_id]
    );
    const attComplete = attRows.length >= 1 && attRows.every(row => row.is_draft === 'N');
    const allComplete = refComplete && attComplete;
    return res.status(200).json({ success: true, complete: allComplete });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get full application details for an applicant

const getFullApplicantProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ success: false, message: "User ID required" });

    // Fetch all sections in parallel
    const [personal, education, work, family, support] = await Promise.all([
      module.exports.getApplicantPersonalParticulars({ params: { userId } }, { json: d => d }),
      module.exports.getApplicantEducation({ params: { userId } }, { json: d => d }),
      module.exports.getApplicantWork({ params: { userId } }, { json: d => d }),
      module.exports.getApplicantFamily({ params: { userId } }, { json: d => d }),
      module.exports.getApplicantSupport({ params: { userId } }, { json: d => d }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        personal: personal.data,
        education: education.data,
        work: work.data,
        family: family.data,
        support: support.data,
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get user info from tbl_users
const getUserInfo = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `SELECT first_name, last_name, email, nationality FROM tbl_users WHERE user_id = ?`;
    const rows = await db.executeQuery(sql, [user_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user: rows[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Update user info in tbl_users
const updateUserInfo = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { first_name, last_name, email, nationality } = req.body;
    const sql = `
      UPDATE tbl_users
      SET first_name = ?, last_name = ?, email = ?, nationality = ?
      WHERE user_id = ?
    `;
    await db.executeQuery(sql, [first_name, last_name, email, nationality, user_id]);
    return res.status(200).json({ success: true, message: "User profile updated" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getApplicantNationalityStats = async (req, res) => {
  try {
    const sql = `
      SELECT u.nationality, COUNT(*) as count
      FROM tbl_users u
      INNER JOIN (
        SELECT DISTINCT user_id FROM tbl_application
      ) a ON u.user_id = a.user_id
      WHERE u.nationality IS NOT NULL AND u.nationality != ''
      GROUP BY u.nationality
      ORDER BY count DESC
    `;
    const rows = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    console.error("Failed to fetch applicant nationality stats:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get application status statistics
const getApplicationStatusStats = async (req, res) => {
  try {
    const sql = `
      SELECT application_status, COUNT(*) as count
      FROM tbl_application
      WHERE application_status IS NOT NULL AND application_status != ''
      GROUP BY application_status
      ORDER BY count DESC
    `;
    const rows = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    console.error("Failed to fetch application status stats:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const saveApplicationFullDetails = async (req, res) => {
  try {
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
      apply_info
    } = req.body;

    const sgTime = new Date(Date.now() + 8 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 19)
      .replace("T", " "); // format: 'YYYY-MM-DD HH:MM:SS'

    const sql = `
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
    `;

    await db.executeQuery(sql, [
      application_id, user_id, job_id,
      personal_particulars, singapore_address, overseas_address, military_service,
      education_background, scholarship_awards, other_qualifications,
      work_experience, teaching_experience, skills, languages,
      family_background, emergency_contact, references, attachments, apply_info, sgTime
    ]);
    return res.status(200).json({ success: true, message: "Full application details saved." });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getApplicationFullDetails = async (req, res) => {
  try {
    // Allow admin/HR to fetch by userId param, otherwise use logged-in user
    const user_id = req.query.userId || req.user.user_id;
    const sql = `SELECT * FROM tbl_application_full_details WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`;
    const rows = await db.executeQuery(sql, [user_id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "No application details found." });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getApplicationById = async (req, res) => {
  try {
    const application_id = req.params.id;
    const sql = `
      SELECT 
        a.*,
        j.title,
        j.job_type
      FROM tbl_application a
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.application_id = ?
      LIMIT 1
    `;
    const rows = await db.executeQuery(sql, [application_id]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "Application not found." });
    }
    return res.status(200).json({ success: true, data: rows[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getCountryList = async (req, res) => {
  try {
    const sql = `SELECT name FROM vw_country ORDER BY name ASC`;
    const countries = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: countries.map(c => c.name) });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const saveJobRequisition = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const {
      jobTitle,
      jobCategory,
      jobType,
      jobRequirements,
      jobResponsibilities,
      seekersRequired
    } = req.body;

    const postingDate = new Date(Date.now() + 8 * 60 * 60 * 1000) // UTC+8
      .toISOString()
      .slice(0, 10)
      .replace("T", " "); // format: 'YYYY-MM-DD'

    const sql = `
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
    `;

    await db.executeQuery(sql, [
      user_id,
      jobTitle,
      jobCategory,
      jobType,
      jobRequirements,
      jobResponsibilities,
      seekersRequired,
      postingDate,
      'Pending'
    ]);

    return res.status(201).json({ success: true, message: "Job requisition submitted successfully" });
  } catch (e) {
    console.error("Failed to save job requisition:", e);
    return res.status(500).json({ success: false, message: "Failed to save job requisition", error: e.message });
  }
};

const updateJobRequisition = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id } = req.params;
    const {
      jobTitle,
      jobCategory,
      jobType,
      jobRequirements,
      jobResponsibilities,
      seekersRequired,
      requisition_status
    } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: "Job requisition ID is required" });
    }

    const updateSql = `
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
    `;

    const result = await db.executeQuery(updateSql, [
      jobTitle,
      jobCategory,
      jobType,
      jobRequirements,
      jobResponsibilities,
      seekersRequired,
      requisition_status,
      id,
      user_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Job requisition not found or not owned by user" });
    }

    return res.status(200).json({ success: true, message: "Job requisition updated successfully" });
  } catch (e) {
    console.error("Failed to update job requisition:", e);
    return res.status(500).json({ success: false, message: "Failed to update job requisition", error: e.message });
  }
};

// Retrieve job requisitions for the current user
const getMyJobRequisitions = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const sql = `
      SELECT *
      FROM tbl_job_requisition
      WHERE user_id = ?
      ORDER BY posting_date DESC
    `;
    const rows = await db.executeQuery(sql, [user_id]);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    console.error("Failed to fetch job requisitions:", e);
    return res.status(500).json({ success: false, message: "Failed to fetch job requisitions", error: e.message });
  }
};

// Get all users with role 'Manager'
const getAllManagers = async (req, res) => {
  try {
    // 1. staff_status must be Active
    // 2. dept_code is DEP-09 OR
    // 3. emp_no exists in any supervisor column (i.e., is a supervisor)
    // 4. show display_name

    const sql = `
      SELECT DISTINCT s.emp_no, s.display_name
      FROM vw_staff s
      WHERE s.staff_status = 'Active'
        AND (
          s.dept_code = 'DEP-09'
          OR s.emp_no IN (SELECT supervisor FROM vw_staff WHERE supervisor IS NOT NULL)
        )
      ORDER BY s.display_name
    `;
    const rows = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: rows });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const assignManagerToApplication = async (req, res) => {
  try {
    const { application_id, manager_id } = req.body;
    if (!application_id || !manager_id) {
      return res.status(400).json({ success: false, message: "Missing application_id or manager_id" });
    }
    // Check if manager exists in vw_staff and meets criteria
    const checkSql = `
      SELECT * FROM vw_staff 
      WHERE emp_no = ? 
        AND staff_status = 'Active'
        AND (
          dept_code = 'DEP-09'
          OR emp_no IN (SELECT supervisor FROM vw_staff WHERE supervisor IS NOT NULL)
        )
    `;
    const managers = await db.executeQuery(checkSql, [manager_id]);
    if (managers.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid manager ID" });
    }
    // Update the application
    const updateSql = `
      UPDATE tbl_application
      SET assigned_manager_id = ?
      WHERE application_id = ?
    `;
    await db.executeQuery(updateSql, [manager_id, application_id]);
    
    // Get manager's email and name (if you want to send email, you may need to join with tbl_users or use vw_staff.email)
    const managerEmail = managers[0].email || null;
    const managerName = managers[0].display_name || "Manager";
    
    // Get applicant and job info for the email
    const appSql = `
      SELECT a.application_id, pp.full_name AS applicant_name, j.title AS job_title
      FROM tbl_application a
      LEFT JOIN tbl_personal_particulars pp ON a.user_id = pp.user_id
      LEFT JOIN tbl_jobs j ON a.job_id = j.job_id
      WHERE a.application_id = ?
    `;
    const appRows = await db.executeQuery(appSql, [application_id]);
    const applicantName = appRows.length ? appRows[0].applicant_name : "Applicant";
    const jobTitle = appRows.length ? appRows[0].job_title : "Unknown Position";
    
    const frontendUrl = process.env.FRONTEND_URL || "https://ejob.eaim.edu.sg";
    const assessmentLink = `${frontendUrl}/manager/assessment?applicationId=${application_id}`;

    // Compose email
    const emailHtml = `
      <p>Dear ${managerName},</p>
      <p>You have been assigned to assess the application for <strong>${applicantName}</strong> (Position: <strong>${jobTitle}</strong>).</p>
      <p>Please <a href="${assessmentLink}">click here</a> to log in and complete the assessment.</p>
      <p>Or copy and paste this link into your browser: <br>${assessmentLink}</p>
    `;
    
    if (managerEmail) {
      await transporter.sendMail({
        from: `"EAIM" <${process.env.SMTP_USER}>`,
        to: managerEmail,
        subject: "New Candidate Assessment Assigned",
        html: emailHtml
      });
    }
    return res.status(200).json({ success: true, message: "Manager assigned to application." });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get applications assigned to the current manager for review
const getManagerReviewApplications = async (req, res) => {
  try {
    const manager_id = req.user.user_id;

    // Get all applications assigned to this manager
    const sql = `
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
    `;
    const rows = await db.executeQuery(sql, [manager_id]);

    // Split into pending and completed
    const pending = [];
    const completed = [];
    rows.forEach(row => {
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
          assessment_date: row.assessment_date
        });
      } else {
        pending.push(app);
      }
    });

    return res.status(200).json({
      success: true,
      pending,
      completed
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const saveAssessment = async (req, res) => {
  try {
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
      q1, q1_remark,
      q2, q2_remark,
      q3, q3_remark,
      q4, q4_remark,
      q5, q5_remark,
      q6, q6_remark,
      q7, q7_remark,
      q8, q8_remark,
      q9, q9_remark,
      q10, q10_remark,
      q11, q11_remark,
      q12, q12_remark,
      q13, q13_remark,
      q14,
      comments
    } = req.body;

    if (!application_id) {
      return res.status(400).json({ success: false, message: "Missing application_id" });
    }

    // Get current date in YYYY-MM-DD (Singapore time)
    const sgDate = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);


    const sql = `
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
    `;

    await db.executeQuery(sql, [
      application_id, candidate_name, age, department, position,
      current_salary, expected_salary, interviewer, notice_period,
      interview_date, interview_time,
      q1, q1_remark, q2, q2_remark, q3, q3_remark, q4, q4_remark,
      q5, q5_remark, q6, q6_remark, q7, q7_remark, q8, q8_remark,
      q9, q9_remark, q10, q10_remark, q11, q11_remark, q12, q12_remark,
      q13, q13_remark, q14, comments, sgDate
    ]);

    const updateAppSql = `
      UPDATE tbl_application
      SET assessment_done = 'Yes',
          application_status = 'Assessed'
      WHERE application_id = ?
    `;
    await db.executeQuery(updateAppSql, [application_id]);

    return res.status(200).json({ success: true, message: "Assessment saved." });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getAssessmentDetails = async (req, res) => {
  try {
    const { application_id } = req.params;
    const sql = `SELECT * FROM tbl_assessment WHERE application_id = ? LIMIT 1`;
    const rows = await db.executeQuery(sql, [application_id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Assessment not found" });
    }
    return res.status(200).json({ success: true, assessment: rows[0] });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Replace getAllJobRequisitionsWithRequestor with this version:
const getAllJobRequisitionsWithRequestor = async (req, res) => {
  try {
    const sql = `
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
    `;
    const rows = await db.executeQuery(sql);

    // Format requestor name (fallback to user_id if display_name is missing)
    const data = rows.map(row => ({
      job_requisition_id: row.job_requisition_id,
      job_title: row.job_title,
      posting_date: row.posting_date,
      requisition_status: row.requisition_status,
      user_id: row.user_id,
      requestor_name: row.requestor_name || row.user_id || "—"
    }));

    return res.status(200).json({ success: true, data });
  } catch (e) {
    console.error("Failed to fetch job requisitions with requestor:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Update job requisition status and details
const reviewJobRequisition = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      jobTitle,
      jobCategory,
      jobType,
      jobRequirements,
      jobResponsibilities,
      seekersRequired,
      requisition_status,
      remarks,
      hiringStatus
    } = req.body;

    if (!id || !requisition_status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Get current values first
    const selectSql = `SELECT * FROM tbl_job_requisition WHERE job_requisition_id = ?`;
    const rows = await db.executeQuery(selectSql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Job requisition not found" });
    }
    const current = rows[0];

    // Use provided value or keep current
    const updateSql = `
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
    `;

    const result = await db.executeQuery(updateSql, [
      jobTitle !== undefined ? jobTitle : current.job_title,
      jobCategory !== undefined ? jobCategory : current.job_category,
      jobType !== undefined ? jobType : current.job_type,
      hiringStatus !== undefined ? hiringStatus : current.hiring_status,
      jobRequirements !== undefined ? jobRequirements : current.job_requirements,
      jobResponsibilities !== undefined ? jobResponsibilities : current.job_responsibilities,
      seekersRequired !== undefined ? seekersRequired : current.seekers_required,
      requisition_status,
      remarks !== undefined ? remarks : current.remarks,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Job requisition not found" });
    }

    return res.status(200).json({ success: true, message: "Job requisition updated" });
  } catch (e) {
    console.error("Failed to review job requisition:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Get job requisition details by ID
const getJobRequisitionDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const sql = `
      SELECT 
        r.*,
        u.first_name,
        u.last_name
      FROM tbl_job_requisition r
      LEFT JOIN tbl_users u ON r.user_id = u.user_id
      WHERE r.job_requisition_id = ?
    `;
    const rows = await db.executeQuery(sql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Job requisition not found" });
    }
    const row = rows[0];
    row.requestor_name = row.first_name && row.last_name
      ? `${row.first_name} ${row.last_name}`
      : row.first_name || row.last_name || "—";
    return res.status(200).json({ success: true, data: row });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const postVerifiedRequisitionAsJob = async (req, res) => {
  try {
    const { id } = req.params;

    // Get the requisition details
    const selectSql = `SELECT * FROM tbl_job_requisition WHERE job_requisition_id = ? AND requisition_status = 'Verified'`;
    const rows = await db.executeQuery(selectSql, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Verified requisition not found" });
    }
    const reqData = rows[0];

    // Insert into tbl_jobs
    const insertSql = `
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
    `;
    await db.executeQuery(insertSql, [
      reqData.job_title,
      reqData.job_category,
      reqData.job_type,
      "Hiring",
      reqData.job_requirements,
      reqData.job_responsibilities,
      reqData.seekers_required,
      new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString().slice(0, 19).replace("T", " ")
    ]);

    // Delete the requisition
    const deleteSql = `DELETE FROM tbl_job_requisition WHERE job_requisition_id = ?`;
    await db.executeQuery(deleteSql, [id]);

    return res.status(200).json({ success: true, message: "Job posted and requisition removed." });
  } catch (e) {
    console.error("Failed to post job from requisition:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const getAllFullApplicantProfiles = async (req, res) => {
  try {
    // Fetch all full application profiles
    const sql = `
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
    `;
    const rows = await db.executeQuery(sql);

    // Format each field as a readable string (if stored as JSON, parse and join)
    const formatted = rows.map(app => ({
      name: app.full_name,
      email: app.email,
      education: app.education_background || "",
      scholarships: app.scholarship_awards || "",
      qualifications: app.other_qualifications || "",
      work: app.work_experience || "",
      teaching: app.teaching_experience || "",
      skills: app.skills || "",
      languages: app.languages || ""
    }));

    return res.status(200).json({ success: true, data: formatted });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

// Add this function:
const getUserEmailById = async (req, res) => {
  try {
    const { userId } = req.params;
    const sql = `SELECT email FROM tbl_users WHERE user_id = ? LIMIT 1`;
    const rows = await db.executeQuery(sql, [userId]);
    if (!rows.length) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, email: rows[0].email });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};



module.exports = {
  postJobs,
  updateJob,
  getJobs,
  getJobById,
  deleteJob,
  bookmarkJob,
  getBookmarks,
  deleteBookmark,
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
  saveAttachments,
  getAttachments,
  deleteAttachments,
  uploadFile,
  uploadMiddleware: upload.single('file'),
  replaceAttachmentFile,
  submitApplication,
  getAppliedJobs,
  getApplicants,
  getApplicantPersonalParticulars,
  getApplicantEducation,
  getApplicantWork,
  getApplicantFamily,
  getApplicantSupport,
  scheduleInterview,
  updateInterview,
  deleteInterview,
  getAllInterviews,
  getPendingApplicants,
  getAllApplicants,
  getAllJobs,
  updateApplicationStatus,
  checkPersonalParticularsCompleteness,
  checkEducationCompleteness,
  checkWorkCompleteness,
  checkFamilyCompleteness,
  checkSupportCompleteness,
  getFullApplicantProfile,
  getUserInfo,
  updateUserInfo,
  getApplicantNationalityStats,
  getApplicationStatusStats,
  sendEmailToUser,
  saveApplicationFullDetails,
  getApplicationFullDetails,
  getApplicationById,
  getCountryList,
  saveJobRequisition,
  updateJobRequisition,
  getMyJobRequisitions,
  getAllJobRequisitionsWithRequestor,
  getAllManagers,
  assignManagerToApplication,
  getManagerReviewApplications,
  saveAssessment,
  getAssessmentDetails,
  getJobRequisitionDetails,
  reviewJobRequisition,
  postVerifiedRequisitionAsJob,
  getAllFullApplicantProfiles,
  getUserEmailById
};


// let testFunction = async (req, res) => {
//   return res.status(200).json({
//     success: true,
//     message: "test",
//   });
// };

// let testSelect = async (req, res) => {
//   try {
//     let sql = `select * from table1`;
//     let result = await db.executeQuery(sql);
//     return res.status(200).json({
//       success: true,
//       message: "success",
//       data: result,
//     });
//   } catch (e) {
//     return res.status(500).json({
//       success: false,
//       message: "Server error " + e,
//       error: e.message,
//     });
//   }
// };

// module.exports = {


//   testFunc: testFunction,
//   testSelect: testSelect,
// };