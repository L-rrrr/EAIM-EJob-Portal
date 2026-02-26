const express = require("express");
const accountApi = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/post-jobs", authenticateToken, accountApi.postJobs);
router.put("/jobs/:id", authenticateToken, accountApi.updateJob);
router.get("/jobs", authenticateToken, accountApi.getJobs);
router.get("/jobs/:id", authenticateToken, accountApi.getJobById);
router.delete("/jobs/:id", authenticateToken, accountApi.deleteJob);

router.post("/post-bookmarks", authenticateToken, accountApi.bookmarkJob);
router.get("/bookmarks", authenticateToken, accountApi.getBookmarks);
router.delete("/bookmarks", authenticateToken, accountApi.deleteBookmark);

router.get("/all-jobs", authenticateToken, accountApi.getAllJobs);

module.exports = router;
