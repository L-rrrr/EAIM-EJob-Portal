const userRepository = require("../../repositories/userRepository");

const createServiceError = (status, message, error) => ({ status, message, error });

const saveSgAddress = async ({ user_id, ...payload }) => {
  const { blk_no, street_name, unit_no, postal_code, mobile_no, home_no, is_draft } = payload;
  const isDraft = is_draft === "Y" ? "Y" : "N";

  await userRepository.executeQuery(
    `
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
    `,
    [
      user_id,
      blk_no || null,
      street_name || null,
      unit_no || null,
      postal_code || null,
      mobile_no || null,
      home_no || null,
      isDraft,
    ]
  );

  return {
    success: true,
    message: `Address ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
  };
};

const getSgAddress = async (user_id) => {
  const rows = await userRepository.executeQuery("SELECT * FROM tbl_sg_address WHERE user_id = ?", [user_id]);
  return rows.length > 0 ? rows[0] : null;
};

const savePersonalParticulars = async ({ user_id, ...payload }) => {
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
    is_draft,
  } = payload;

  const isDraft = is_draft === "Y" ? "Y" : "N";

  await userRepository.executeQuery(
    `
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
    `,
    [
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
      isDraft,
    ]
  );

  return {
    success: true,
    message: isDraft === "Y" ? "Draft saved." : "Personal particulars submitted.",
  };
};

const getPersonalParticulars = async (user_id) => {
  const rows = await userRepository.executeQuery("SELECT * FROM tbl_personal_particulars WHERE user_id = ?", [user_id]);
  return rows.length > 0 ? rows[0] : null;
};

const saveOverseasAddress = async ({ user_id, ...payload }) => {
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
    is_draft,
  } = payload;

  const isDraft = is_draft === "Y" ? "Y" : "N";

  await userRepository.executeQuery(
    `
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
    `,
    [
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
      isDraft,
    ]
  );

  return {
    success: true,
    message: `Overseas address ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
  };
};

const getOverseasAddress = async (user_id) => {
  const rows = await userRepository.executeQuery("SELECT * FROM tbl_overseas_address WHERE user_id = ?", [user_id]);
  return rows.length > 0 ? rows[0] : null;
};

const saveMilitaryService = async ({ user_id, ...payload }) => {
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
    is_draft,
  } = payload;

  const isDraft = is_draft === "Y" ? "Y" : "N";

  await userRepository.executeQuery(
    `
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
    `,
    [
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
      isDraft,
    ]
  );

  return {
    success: true,
    message: `Military service ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
  };
};

const getMilitaryService = async (user_id) => {
  const rows = await userRepository.executeQuery("SELECT * FROM tbl_military_service WHERE user_id = ?", [user_id]);
  return rows.length > 0 ? rows[0] : null;
};

const saveListRecords = async ({ user_id, records, is_draft, table, idKey, fields, messagePrefix }) => {
  const isDraft = is_draft === "Y" ? "Y" : "N";
  if (!Array.isArray(records)) {
    throw createServiceError(400, "Invalid data format.");
  }

  const savedRecords = [];
  for (const record of records) {
    const recordId = record[idKey];

    if (recordId) {
      const updateSql = `
        UPDATE ${table} SET
          ${fields.map((field) => `${field} = ?`).join(",\n          ")},
          is_draft = ?
        WHERE ${idKey} = ? AND user_id = ?
      `;
      const updateParams = [
        ...fields.map((field) => record[field] || null),
        isDraft,
        recordId,
        user_id,
      ];
      await userRepository.executeQuery(updateSql, updateParams);

      savedRecords.push({
        [idKey]: recordId,
        ...Object.fromEntries(fields.map((field) => [field, record[field]])),
        is_draft: isDraft,
      });
    } else {
      const insertSql = `
        INSERT INTO ${table} (
          user_id,
          ${fields.join(",\n          ")},
          is_draft
        ) VALUES (?, ${fields.map(() => "?").join(", ")}, ?)
      `;
      const insertParams = [
        user_id,
        ...fields.map((field) => record[field] || null),
        isDraft,
      ];

      const result = await userRepository.executeQuery(insertSql, insertParams);
      savedRecords.push({
        [idKey]: result.insertId,
        ...Object.fromEntries(fields.map((field) => [field, record[field]])),
        is_draft: isDraft,
      });
    }
  }

  return {
    success: true,
    message: `${messagePrefix} records ${isDraft === "Y" ? "saved as draft" : "submitted"} successfully.`,
    data: savedRecords,
  };
};

const getListRecords = async ({ user_id, table, idKey }) => {
  return userRepository.executeQuery(
    `SELECT * FROM ${table} WHERE user_id = ? ORDER BY ${idKey} ASC`,
    [user_id]
  );
};

const deleteListRecord = async ({ user_id, table, idKey, idValue, missingMessage, notFoundMessage, successMessage }) => {
  if (!idValue) {
    throw createServiceError(400, missingMessage);
  }

  const result = await userRepository.executeQuery(
    `DELETE FROM ${table} WHERE ${idKey} = ? AND user_id = ?`,
    [idValue, user_id]
  );

  if (result.affectedRows === 0) {
    throw createServiceError(404, notFoundMessage);
  }

  return {
    success: true,
    message: successMessage,
  };
};

const saveEducationBackground = async ({ user_id, educationRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: educationRecords,
    is_draft,
    table: "tbl_education_background",
    idKey: "education_id",
    fields: ["is_highest_qualification", "level_of_qualification", "institute", "qualification_attained", "year_from", "year_to"],
    messagePrefix: "Education records",
  });
};

const getEducationBackground = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_education_background", idKey: "education_id" });
};

const deleteEducationBackground = async ({ user_id, education_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_education_background",
    idKey: "education_id",
    idValue: education_id,
    missingMessage: "Education ID is required",
    notFoundMessage: "Education record not found",
    successMessage: "Education record deleted successfully",
  });
};

const saveScholarshipAwards = async ({ user_id, scholarshipRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: scholarshipRecords,
    is_draft,
    table: "tbl_scholarship_awards",
    idKey: "scholarship_id",
    fields: ["organization", "description", "certificate", "from_month", "from_year", "to_month", "to_year"],
    messagePrefix: "Scholarship/Awards records",
  });
};

const getScholarshipAwards = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_scholarship_awards", idKey: "scholarship_id" });
};

const deleteScholarshipAwards = async ({ user_id, scholarship_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_scholarship_awards",
    idKey: "scholarship_id",
    idValue: scholarship_id,
    missingMessage: "Scholarship ID is required",
    notFoundMessage: "Scholarship/Awards record not found",
    successMessage: "Scholarship/Awards record deleted successfully",
  });
};

const saveOtherQualifications = async ({ user_id, qualificationRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: qualificationRecords,
    is_draft,
    table: "tbl_other_qualifications",
    idKey: "qualification_id",
    fields: ["organization", "course", "certificate", "from_month", "from_year", "to_month", "to_year"],
    messagePrefix: "Other Qualifications records",
  });
};

const getOtherQualifications = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_other_qualifications", idKey: "qualification_id" });
};

const deleteOtherQualifications = async ({ user_id, qualification_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_other_qualifications",
    idKey: "qualification_id",
    idValue: qualification_id,
    missingMessage: "Qualification ID is required",
    notFoundMessage: "Other Qualifications record not found",
    successMessage: "Other Qualifications record deleted successfully",
  });
};

const saveWorkExperience = async ({ user_id, workRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: workRecords,
    is_draft,
    table: "tbl_work_experience",
    idKey: "work_id",
    fields: ["company", "role", "salary", "description", "reason", "from_month", "from_year", "to_month", "to_year"],
    messagePrefix: "Work experience records",
  });
};

const getWorkExperience = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_work_experience", idKey: "work_id" });
};

const deleteWorkExperience = async ({ user_id, work_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_work_experience",
    idKey: "work_id",
    idValue: work_id,
    missingMessage: "Work ID is required",
    notFoundMessage: "Work experience record not found",
    successMessage: "Work experience record deleted successfully",
  });
};

const saveTeachingExperience = async ({ user_id, teachingRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: teachingRecords,
    is_draft,
    table: "tbl_teaching_experience",
    idKey: "teaching_id",
    fields: ["institution", "position", "salary", "subject", "reason", "from_month", "from_year", "to_month", "to_year"],
    messagePrefix: "Teaching experience records",
  });
};

const getTeachingExperience = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_teaching_experience", idKey: "teaching_id" });
};

const deleteTeachingExperience = async ({ user_id, teaching_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_teaching_experience",
    idKey: "teaching_id",
    idValue: teaching_id,
    missingMessage: "Teaching ID is required",
    notFoundMessage: "Teaching experience record not found",
    successMessage: "Teaching experience record deleted successfully",
  });
};

const saveSkills = async ({ user_id, skillRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: skillRecords,
    is_draft,
    table: "tbl_skills",
    idKey: "skill_id",
    fields: ["name", "level"],
    messagePrefix: "Skills records",
  });
};

const getSkills = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_skills", idKey: "skill_id" });
};

const deleteSkills = async ({ user_id, skill_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_skills",
    idKey: "skill_id",
    idValue: skill_id,
    missingMessage: "Skill ID is required",
    notFoundMessage: "Skills record not found",
    successMessage: "Skills record deleted successfully",
  });
};

const saveLanguages = async ({ user_id, languageRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: languageRecords,
    is_draft,
    table: "tbl_languages",
    idKey: "language_id",
    fields: ["name", "spoken", "written", "reading"],
    messagePrefix: "Language records",
  });
};

const getLanguages = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_languages", idKey: "language_id" });
};

const deleteLanguages = async ({ user_id, language_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_languages",
    idKey: "language_id",
    idValue: language_id,
    missingMessage: "Language ID is required",
    notFoundMessage: "Language record not found",
    successMessage: "Language record deleted successfully",
  });
};

const saveFamilyBackground = async ({ user_id, familyRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: familyRecords,
    is_draft,
    table: "tbl_family_background",
    idKey: "record_id",
    fields: ["name", "relationship", "age", "occupation", "contact_no"],
    messagePrefix: "Family background records",
  });
};

const getFamilyBackground = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_family_background", idKey: "record_id" });
};

const deleteFamilyBackground = async ({ user_id, record_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_family_background",
    idKey: "record_id",
    idValue: record_id,
    missingMessage: "Record ID is required",
    notFoundMessage: "Family background record not found",
    successMessage: "Family background record deleted successfully",
  });
};

const saveEmergencyContact = async ({ user_id, emergencyRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: emergencyRecords,
    is_draft,
    table: "tbl_emergency_contact",
    idKey: "contact_id",
    fields: ["name", "contact_no", "relationship"],
    messagePrefix: "Emergency contact records",
  });
};

const getEmergencyContact = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_emergency_contact", idKey: "contact_id" });
};

const deleteEmergencyContact = async ({ user_id, contact_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_emergency_contact",
    idKey: "contact_id",
    idValue: contact_id,
    missingMessage: "Contact ID is required",
    notFoundMessage: "Emergency contact record not found",
    successMessage: "Emergency contact record deleted successfully",
  });
};

const saveReferences = async ({ user_id, referenceRecords, is_draft }) => {
  return saveListRecords({
    user_id,
    records: referenceRecords,
    is_draft,
    table: "tbl_references",
    idKey: "reference_id",
    fields: ["name", "occupation", "contact_no", "relationship"],
    messagePrefix: "Reference records",
  });
};

const getReferences = async (user_id) => {
  return getListRecords({ user_id, table: "tbl_references", idKey: "reference_id" });
};

const deleteReferences = async ({ user_id, reference_id }) => {
  return deleteListRecord({
    user_id,
    table: "tbl_references",
    idKey: "reference_id",
    idValue: reference_id,
    missingMessage: "Reference ID is required",
    notFoundMessage: "Reference record not found",
    successMessage: "Reference record deleted successfully",
  });
};

const checkPersonalParticularsCompleteness = async (user_id) => {
  const sqls = [
    `SELECT is_draft FROM tbl_personal_particulars WHERE user_id = ?`,
    `SELECT is_draft FROM tbl_sg_address WHERE user_id = ?`,
    `SELECT is_draft FROM tbl_overseas_address WHERE user_id = ?`,
    `SELECT is_draft FROM tbl_military_service WHERE user_id = ?`,
  ];

  const results = await Promise.all(sqls.map((sql) => userRepository.executeQuery(sql, [user_id])));
  const complete = results.every((rows) => rows.length > 0 && rows[0].is_draft === "N");
  return { success: true, complete };
};

const checkEducationCompleteness = async (user_id) => {
  const eduRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_education_background WHERE user_id = ?`, [user_id]);
  const scholarshipRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_scholarship_awards WHERE user_id = ?`, [user_id]);
  const qualificationRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_other_qualifications WHERE user_id = ?`, [user_id]);

  const eduComplete = eduRows.length > 0 && eduRows.every((row) => row.is_draft === "N");
  const scholarshipComplete = scholarshipRows.length === 0 || scholarshipRows.every((row) => row.is_draft === "N");
  const qualificationComplete = qualificationRows.length === 0 || qualificationRows.every((row) => row.is_draft === "N");

  return { success: true, complete: eduComplete && scholarshipComplete && qualificationComplete };
};

const checkWorkCompleteness = async (user_id) => {
  const workRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_work_experience WHERE user_id = ?`, [user_id]);
  const teachingRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_teaching_experience WHERE user_id = ?`, [user_id]);
  const skillsRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_skills WHERE user_id = ?`, [user_id]);
  const langRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_languages WHERE user_id = ?`, [user_id]);

  const workComplete = workRows.length === 0 || workRows.every((row) => row.is_draft === "N");
  const teachingComplete = teachingRows.length === 0 || teachingRows.every((row) => row.is_draft === "N");
  const skillsComplete = skillsRows.length > 0 && skillsRows.every((row) => row.is_draft === "N");
  const langComplete = langRows.length > 0 && langRows.every((row) => row.is_draft === "N");

  return { success: true, complete: workComplete && teachingComplete && skillsComplete && langComplete };
};

const checkFamilyCompleteness = async (user_id) => {
  const familyRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_family_background WHERE user_id = ?`, [user_id]);
  const emergencyRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_emergency_contact WHERE user_id = ?`, [user_id]);

  const familyComplete = familyRows.length > 0 && familyRows.every((row) => row.is_draft === "N");
  const emergencyComplete = emergencyRows.length > 0 && emergencyRows.every((row) => row.is_draft === "N");

  return { success: true, complete: familyComplete && emergencyComplete };
};

const checkSupportCompleteness = async (user_id) => {
  const refRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_references WHERE user_id = ?`, [user_id]);
  const attRows = await userRepository.executeQuery(`SELECT is_draft FROM tbl_attachments WHERE user_id = ?`, [user_id]);

  const refComplete = refRows.length >= 2 && refRows.every((row) => row.is_draft === "N");
  const attComplete = attRows.length >= 1 && attRows.every((row) => row.is_draft === "N");

  return { success: true, complete: refComplete && attComplete };
};

const getUserInfo = async (user_id) => {
  const rows = await userRepository.executeQuery(
    `SELECT first_name, last_name, email, nationality FROM tbl_users WHERE user_id = ?`,
    [user_id]
  );

  if (!rows.length) {
    throw createServiceError(404, "User not found");
  }

  return rows[0];
};

const updateUserInfo = async ({ user_id, first_name, last_name, email, nationality }) => {
  await userRepository.executeQuery(
    `
      UPDATE tbl_users
      SET first_name = ?, last_name = ?, email = ?, nationality = ?
      WHERE user_id = ?
    `,
    [first_name, last_name, email, nationality, user_id]
  );

  return { success: true, message: "User profile updated" };
};

const getApplicantNationalityStats = async () => {
  return userRepository.executeQuery(
    `
      SELECT u.nationality, COUNT(*) as count
      FROM tbl_users u
      INNER JOIN (
        SELECT DISTINCT user_id FROM tbl_application
      ) a ON u.user_id = a.user_id
      WHERE u.nationality IS NOT NULL AND u.nationality != ''
      GROUP BY u.nationality
      ORDER BY count DESC
    `
  );
};

const getApplicationStatusStats = async () => {
  return userRepository.executeQuery(
    `
      SELECT application_status, COUNT(*) as count
      FROM tbl_application
      WHERE application_status IS NOT NULL AND application_status != ''
      GROUP BY application_status
      ORDER BY count DESC
    `
  );
};

const getCountryList = async () => {
  const countries = await userRepository.executeQuery(`SELECT name FROM vw_country ORDER BY name ASC`);
  return countries.map((country) => country.name);
};

module.exports = {
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
};
