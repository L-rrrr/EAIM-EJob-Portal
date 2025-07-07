const db = require("../dbConn");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const postJobs = async (req, res) => {
  const {jobTitle, jobCategory, jobType, hiringStatus,jobRequirements, jobResponsibilities, seekersRequired } = req.body;

  try {
    const postingDate = new Date(Date.now() + 8 * 60 * 60 * 1000) // UTC+8
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

const getJobs = async (req, res) => {
  try {
    const sql = "SELECT * FROM tbl_jobs ORDER BY posting_date DESC";
    const jobs = await db.executeQuery(sql);
    return res.status(200).json({ success: true, data: jobs });
  } catch (e) {
    console.error("Failed to fetch jobs:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const bookmarkJob = async (req, res) => {
  try {
    const { title, jobCategory, jobType, hiringStatus, jobRequirements, jobResponsibilities } = req.body;
    const username = req.user.username; // From JWT middleware
    const user_id = req.user.user_id;


    // Check if this job is already bookmarked by the user
    const checkSql = `
      SELECT * FROM tbl_bookmark
      WHERE title = ? AND username = ?
    `;
    const existing = await db.executeQuery(checkSql, [title, username]);

    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: "This job is already bookmarked." });
    }

    // If not bookmarked yet, insert it
    const insertSql = `
      INSERT INTO tbl_bookmark
      (title, job_category, job_type, hiring_status, job_requirements, job_responsibilities, username, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.executeQuery(insertSql, [
      title,
      jobCategory,
      jobType,
      hiringStatus,
      jobRequirements,
      jobResponsibilities,
      username,
      user_id,
    ]);

    return res.status(200).json({ success: true, message: "Job bookmarked successfully." });
  } catch (e) {
    console.error("Failed to bookmark job:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};


const getBookmarks = async (req, res) => {
  try {
    const username = req.user.username;
    const sql = `SELECT * FROM tbl_bookmark WHERE username = ?`;
    const bookmarks = await db.executeQuery(sql, [username]);
    return res.status(200).json({ success: true, data: bookmarks });
  } catch (e) {
    console.error("Failed to fetch bookmarks:", e);
    return res.status(500).json({ success: false, message: "Server error", error: e.message });
  }
};

const deleteBookmark = async (req, res) => {
  try {
    const username = req.user.username;
    const { title } = req.body;

    const sql = `DELETE FROM tbl_bookmark WHERE username = ? AND title = ?`;
    await db.executeQuery(sql, [username, title]);

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
    const user_id = req.user.user_id; // assuming user is authenticated

    const {
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
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
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

module.exports = {
  postJobs,
  getJobs,
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
  replaceAttachmentFile
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