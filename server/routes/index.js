const express = require("express");

const authRoutes = require("./authRoutes");
const jobsRoutes = require("./jobsRoutes");
const profileRoutes = require("./profileRoutes");
const applicationsRoutes = require("./applicationsRoutes");
const requisitionsRoutes = require("./requisitionsRoutes");
const aiRoutes = require("./aiRoutes");

const router = express.Router();

router.use(authRoutes);
router.use(jobsRoutes);
router.use(profileRoutes);
router.use(applicationsRoutes);
router.use(requisitionsRoutes);
router.use(aiRoutes);

module.exports = router;
