const { getConnection, sql } = require("../config/db");
const multer = require("multer");
const path = require("path");

/* ============================================
   MULTER CONFIGURATION (IMAGE UPLOAD)
============================================ */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;

    const isValidExtension = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );

    const isValidMime = allowedTypes.test(file.mimetype);

    if (isValidExtension && isValidMime) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

/* ============================================
   CREATE COMPLAINT
============================================ */
async function createComplaint(req, res) {
  try {
    const { title, description, created_by, department_id } = req.body;

    const imagePath = req.file ? `uploads/${req.file.filename}` : null;

    const pool = await getConnection();

    const result = await pool
      .request()
      .input("title", sql.NVarChar, title)
      .input("description", sql.NVarChar, description)
      .input("status", sql.NVarChar, "Pending")
      .input("created_by", sql.Int, created_by)
      .input("department_id", sql.Int, department_id)
      .input("image_path", sql.NVarChar, imagePath).query(`
        INSERT INTO complaints
        (title, description, status, created_by, department_id, image_path)
        VALUES
        (@title, @description, @status, @created_by, @department_id, @image_path);

        SELECT SCOPE_IDENTITY() AS id
      `);

    res.status(201).json({
      message: "Complaint created successfully",
      id: result.recordset[0].id,
    });
  } catch (error) {
    console.error("Create complaint error:", error);
    res.status(500).json({ message: "Server error creating complaint" });
  }
}

/* ============================================
   GET COMPLAINTS (ROLE-BASED LIST)
============================================ */
async function getComplaints(req, res) {
  try {
    const { userId, role, departmentId } = req.query;

    const pool = await getConnection();
    const request = pool.request();

    const baseSelect = `
      SELECT
        c.*,
        u.name AS created_by_name,
        d.name AS department_name,
        CASE
          WHEN f.id IS NULL THEN 0
          ELSE 1
        END AS feedback_exists
      FROM complaints c
      JOIN users u ON c.created_by = u.id
      JOIN departments d ON c.department_id = d.id
      LEFT JOIN feedback f ON f.complaint_id = c.id
    `;

    let query = "";

    if (role === "user") {
      query = `
        ${baseSelect}
        WHERE c.created_by = @userId
        ORDER BY c.created_at DESC
      `;
      request.input("userId", sql.Int, userId);
    } else if (role === "staff") {
      query = `
        ${baseSelect}
        WHERE c.department_id = @departmentId
        ORDER BY c.created_at DESC
      `;
      request.input("departmentId", sql.Int, departmentId);
    } else if (role === "admin") {
      query = `
        ${baseSelect}
        ORDER BY c.created_at DESC
      `;
    } else {
      return res.status(403).json({ message: "Unauthorized role" });
    }

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (error) {
    console.error("Get complaints error:", error);
    res.status(500).json({ message: "Server error fetching complaints" });
  }
}

/* ============================================
   GET SINGLE COMPLAINT (SECURE)
============================================ */
async function getComplaintDetails(req, res) {
  try {
    const { id } = req.params;
    const { userId, role, departmentId } = req.query;

    if (!userId || !role) {
      return res.status(403).json({ message: "Unauthorized request" });
    }

    const pool = await getConnection();

    const complaintResult = await pool.request().input("id", sql.Int, id)
      .query(`
        SELECT
          c.*,
          u.name AS created_by_name,
          d.name AS department_name
        FROM complaints c
        JOIN users u ON c.created_by = u.id
        JOIN departments d ON c.department_id = d.id
        WHERE c.id = @id
      `);

    if (complaintResult.recordset.length === 0) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    const complaint = complaintResult.recordset[0];

    /* -------- Role-Based Authorization -------- */

    if (role === "user" && complaint.created_by !== Number(userId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (role === "staff" && complaint.department_id !== Number(departmentId)) {
      return res.status(403).json({ message: "Access denied" });
    }

    // admin → full access

    /* -------- Fetch Logs -------- */
    const logsResult = await pool.request().input("id", sql.Int, id).query(`
        SELECT
          l.*,
          u.name AS changed_by_name
        FROM complaint_logs l
        JOIN users u ON l.changed_by = u.id
        WHERE l.complaint_id = @id
        ORDER BY l.changed_at ASC
      `);

    /* -------- Fetch Feedback -------- */
    const feedbackResult = await pool.request().input("id", sql.Int, id).query(`
        SELECT
          f.feedback_text,
          f.created_at,
          u.name AS user_name
        FROM feedback f
        JOIN users u ON f.user_id = u.id
        WHERE f.complaint_id = @id
      `);

    res.json({
      complaint,
      logs: logsResult.recordset,
      feedback:
        feedbackResult.recordset.length > 0
          ? feedbackResult.recordset[0]
          : null,
    });
  } catch (error) {
    console.error("Get complaint details error:", error);
    res.status(500).json({
      message: "Server error fetching complaint details",
    });
  }
}

/* ============================================
   UPDATE COMPLAINT STATUS (TRANSACTION)
============================================ */
async function updateComplaintStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, role, userId, remark } = req.body;

    if (!role || !userId) {
      return res.status(403).json({ message: "Unauthorized request" });
    }

    if (role === "user") {
      return res.status(403).json({
        message: "Users cannot change complaint status",
      });
    }

    const pool = await getConnection();
    const transaction = new sql.Transaction(pool);

    await transaction.begin();
    const request = new sql.Request(transaction);

    /* -------- Get Current Status -------- */
    const currentResult = await request
      .input("id", sql.Int, id)
      .query(`SELECT status FROM complaints WHERE id = @id`);

    if (currentResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Complaint not found" });
    }

    const currentStatus = currentResult.recordset[0].status;

    if (currentStatus === status) {
      await transaction.rollback();
      return res.status(400).json({
        message: "New status must be different",
      });
    }

    /* -------- Staff Restrictions -------- */
    if (role === "staff" && status === "Closed") {
      await transaction.rollback();
      return res.status(403).json({
        message: "Staff cannot close complaint",
      });
    }

    if (role === "staff" && (!remark || remark.trim().length === 0)) {
      await transaction.rollback();
      return res.status(400).json({
        message: "Remark is mandatory for staff",
      });
    }

    /* -------- Update Complaint -------- */
    await request.input("newStatus", sql.NVarChar, status).query(`
        UPDATE complaints
        SET status = @newStatus
        WHERE id = @id
      `);

    /* -------- Insert Log -------- */
    await request
      .input("oldStatus", sql.NVarChar, currentStatus)
      .input("remark", sql.NVarChar(sql.MAX), remark || "")
      .input("changedBy", sql.Int, userId).query(`
        INSERT INTO complaint_logs
        (complaint_id, changed_by, old_status, new_status, remark)
        VALUES
        (@id, @changedBy, @oldStatus, @newStatus, @remark)
      `);

    await transaction.commit();

    res.json({ message: "Status updated successfully" });
  } catch (error) {
    console.error("Update complaint error:", error);
    res.status(500).json({ message: "Server error updating complaint" });
  }
}

/* ============================================
   EXPORTS
============================================ */
module.exports = {
  createComplaint,
  getComplaints,
  getComplaintDetails,
  updateComplaintStatus,
  upload,
};
