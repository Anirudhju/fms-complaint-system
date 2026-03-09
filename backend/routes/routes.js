const express = require("express");
const router = express.Router();

const { signup, login } = require("../controllers/authController");
const {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
  getComplaintDetails,
} = require("../controllers/complaintController");
const {
  getDepartments,
  createDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");
const {
  getAllUsers,
  updateUserRole,
  updateUserDepartment,
  deactivateUser,
  restoreUser,
} = require("../controllers/adminController");

const { upload } = require("../controllers/complaintController");

const feedbackController = require("../controllers/feedbackController");

router.post("/signup", signup);
router.post("/login", login);
router.post("/complaints", upload.single("image"), createComplaint);
router.get("/complaints", getComplaints);
router.get("/complaints/:id/details", getComplaintDetails);
router.patch("/complaints/:id", updateComplaintStatus);
router.get("/departments", getDepartments);
router.post("/departments", createDepartment);
router.delete("/departments/:id", deleteDepartment);
router.get("/admin/users", getAllUsers);
router.patch("/admin/users/:id/role", updateUserRole);
router.patch("/admin/users/:id/department", updateUserDepartment);
router.post("/feedback", feedbackController.submitFeedback);
router.get("/feedback/:complaintId", feedbackController.getFeedback);
router.patch("/admin/users/:id/deactivate", deactivateUser);
router.patch("/admin/users/:id/restore", restoreUser);

module.exports = router;
