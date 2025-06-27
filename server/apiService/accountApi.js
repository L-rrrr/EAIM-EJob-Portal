const db = require("../dbConn");

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

    // Optional: if is_draft === "N", you can validate required fields
    if (isDraft === "N") {
      const requiredFields = [blk_no, street_name, unit_no, postal_code, mobile_no, home_no];
      if (requiredFields.some((field) => field == null || field === "")) {
        return res.status(400).json({
          success: false,
          message: "All address fields must be filled when submitting as final."
        });
      }
    }

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

    // Optional validation for submission
    if (isDraft === "N") {
      const requiredFields = [
        salutation,
        full_name,
        nric,
        email,
        date_of_birth,
        marital_status,
        gender,
        nationality,
        status_in_sg,
        race,
        religion,
        country_of_birth,
        passport_no,
        passport_expiry
      ];

      if (requiredFields.some((field) => !field || field === "")) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be filled when submitting."
        });
      }
    }

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

    // Validate required fields if submitting final
    if (isDraft === "N") {
      const requiredFields = [
        blk_or_house_no,
        street_name,
        city,
        state_or_province,
        country,
        postal_code,
        mobile_country_code,
        mobile_number
      ];

      if (requiredFields.some((field) => field == null || field === "")) {
        return res.status(400).json({
          success: false,
          message: "All required fields must be filled when submitting as final."
        });
      }
    }

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

    if (isDraft === "N") {
      if (!ns_status) {
        return res.status(400).json({
          success: false,
          message: "NS Status is required when submitting final.",
        });
      }
    }

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
  getEducationBackground
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