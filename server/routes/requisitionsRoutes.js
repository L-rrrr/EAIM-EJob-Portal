const express = require("express");
const accountApi = require("../controllers/userController");
const { authenticateToken } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/save-job-requisition", authenticateToken, accountApi.saveJobRequisition);
router.put("/update-job-requisition/:id", authenticateToken, accountApi.updateJobRequisition);
router.get("/my-job-requisitions", authenticateToken, accountApi.getMyJobRequisitions);
router.get("/all-job-requisitions", authenticateToken, accountApi.getAllJobRequisitionsWithRequestor);

router.get("/job-requisition/:id", authenticateToken, accountApi.getJobRequisitionDetails);
router.put("/job-requisition/:id/review", authenticateToken, accountApi.reviewJobRequisition);
router.post("/job-requisition/:id/post-job", authenticateToken, accountApi.postVerifiedRequisitionAsJob);

module.exports = router;
