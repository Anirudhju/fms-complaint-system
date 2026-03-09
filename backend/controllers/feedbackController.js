const { getConnection, sql } = require("../config/db");

/* ============================================
   SUBMIT FEEDBACK + CLOSE COMPLAINT
============================================ */
async function submitFeedback(req, res) {
  const { complaint_id, user_id, feedback_text } = req.body;

  // Basic validation
  if (!complaint_id || !user_id || !feedback_text) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  const pool = await getConnection();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    /* -------- Verify Complaint Ownership -------- */
    request.input("complaint_id", sql.Int, complaint_id);
    request.input("user_id", sql.Int, user_id);

    const complaintCheck = await request.query(`
      SELECT status
      FROM complaints
      WHERE id = @complaint_id
        AND created_by = @user_id
    `);

    if (complaintCheck.recordset.length === 0) {
      throw new Error("Complaint not found or unauthorized");
    }

    const currentStatus = complaintCheck.recordset[0].status;

    if (currentStatus !== "Resolved") {
      throw new Error("Feedback allowed only for resolved complaints");
    }

    /* -------- Prevent Duplicate Feedback -------- */
    const feedbackCheck = await request.query(`
      SELECT id
      FROM feedback
      WHERE complaint_id = @complaint_id
    `);

    if (feedbackCheck.recordset.length > 0) {
      throw new Error("Feedback already submitted");
    }

    /* -------- Insert Feedback -------- */
    request.input("feedback_text", sql.NVarChar(sql.MAX), feedback_text);

    await request.query(`
      INSERT INTO feedback (complaint_id, user_id, feedback_text)
      VALUES (@complaint_id, @user_id, @feedback_text)
    `);

    /* -------- Close Complaint -------- */
    await request.query(`
      UPDATE complaints
      SET status = 'Closed'
      WHERE id = @complaint_id
    `);

    /* -------- Insert Log Entry -------- */
    request.input("oldStatus", sql.NVarChar, "Resolved");
    request.input(
      "remark",
      sql.NVarChar(sql.MAX),
      "Complaint closed after user feedback submission",
    );

    await request.query(`
      INSERT INTO complaint_logs
      (complaint_id, changed_by, old_status, new_status, remark)
      VALUES
      (@complaint_id, @user_id, @oldStatus, 'Closed', @remark)
    `);

    await transaction.commit();

    res.json({
      message: "Feedback submitted and complaint closed",
    });
  } catch (error) {
    await transaction.rollback();
    res.status(400).json({
      message: error.message,
    });
  }
}

/* ============================================
   GET FEEDBACK (SECURE ACCESS)
============================================ */
async function getFeedback(req, res) {
  try {
    const { complaintId } = req.params;
    const { userId, role } = req.query;

    if (!userId || !role) {
      return res.status(403).json({
        message: "Unauthorized request",
      });
    }

    const pool = await getConnection();

    /* -------- Check Complaint Exists -------- */
    const complaintCheck = await pool
      .request()
      .input("complaintId", sql.Int, complaintId).query(`
        SELECT id, created_by, status
        FROM complaints
        WHERE id = @complaintId
      `);

    if (complaintCheck.recordset.length === 0) {
      return res.status(404).json({
        message: "Complaint not found",
      });
    }

    const complaint = complaintCheck.recordset[0];

    /* -------- Role & Ownership Validation -------- */
    if (role !== "user") {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    if (complaint.created_by !== Number(userId)) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    /* -------- Fetch Feedback -------- */
    const feedbackResult = await pool
      .request()
      .input("complaintId", sql.Int, complaintId).query(`
        SELECT
          f.feedback_text,
          f.created_at,
          u.name AS user_name
        FROM feedback f
        JOIN users u ON f.user_id = u.id
        WHERE f.complaint_id = @complaintId
      `);

    // If feedback exists → return it
    if (feedbackResult.recordset.length > 0) {
      return res.json({
        exists: true,
        feedback: feedbackResult.recordset[0],
      });
    }

    // If no feedback and complaint is not resolved → deny
    if (complaint.status !== "Resolved") {
      return res.status(403).json({
        message: "Feedback allowed only for resolved complaints",
      });
    }

    // Complaint is resolved but feedback not submitted yet
    return res.json({ exists: false });
  } catch (error) {
    console.error("Get Feedback Error:", error);
    res.status(500).json({
      message: "Server error while fetching feedback",
    });
  }
}

/* ============================================
   EXPORT FUNCTIONS
============================================ */
module.exports = {
  submitFeedback,
  getFeedback,
};
