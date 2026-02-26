const db = require("../db");

const getCandidateBackgroundByUserId = async (userId) => {
  const [education, work, teaching] = await Promise.all([
    db.executeQuery("SELECT * FROM tbl_education_background WHERE user_id = ?", [userId]),
    db.executeQuery("SELECT * FROM tbl_work_experience WHERE user_id = ?", [userId]),
    db.executeQuery("SELECT * FROM tbl_teaching_experience WHERE user_id = ?", [userId]),
  ]);

  return { education, work, teaching };
};

module.exports = {
  getCandidateBackgroundByUserId,
};
