const jobsService = require("./user/jobsService");
const profileService = require("./user/profileService");
const attachmentService = require("./user/attachmentService");
const applicationsService = require("./user/applicationsService");
const interviewService = require("./user/interviewService");
const requisitionsService = require("./user/requisitionsService");

module.exports = {
  ...jobsService,
  ...profileService,
  ...attachmentService,
  ...applicationsService,
  ...interviewService,
  ...requisitionsService,
};


