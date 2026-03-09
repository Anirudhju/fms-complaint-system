const { getConnection, sql } = require("../config/db");

/* =================================
   GET ALL USERS
================================= */
async function getAllUsers(req, res) {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
      SELECT u.*, d.name AS department_name
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      ORDER BY u.id DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error fetching users" });
  }
}

/* =================================
   UPDATE USER ROLE
================================= */
async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const pool = await getConnection();

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("role", sql.NVarChar, role).query(`
        UPDATE users
        SET role = @role
        WHERE id = @id
      `);

    res.json({ message: "User role updated successfully" });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ message: "Server error updating role" });
  }
}

/* =================================
   UPDATE USER DEPARTMENT
================================= */
async function updateUserDepartment(req, res) {
  try {
    const { id } = req.params;
    const { department_id } = req.body;

    const pool = await getConnection();

    await pool
      .request()
      .input("id", sql.Int, id)
      .input("department_id", sql.Int, department_id || null).query(`
        UPDATE users
        SET department_id = @department_id
        WHERE id = @id
      `);

    res.json({ message: "User department updated successfully" });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({ message: "Server error updating department" });
  }
}

/* =================================
   DEACTIVATE USER
================================= */
async function deactivateUser(req, res) {
  try {
    const { id } = req.params;
    const { currentAdminId } = req.body;

    const pool = await getConnection();

    // Prevent admin from deactivating themselves
    if (parseInt(id) === parseInt(currentAdminId)) {
      return res.status(400).json({
        message: "You cannot deactivate yourself",
      });
    }

    // Check if user exists and get role
    const userCheck = await pool.request().input("id", sql.Int, id).query(`
        SELECT role
        FROM users
        WHERE id = @id
      `);

    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deactivating another admin
    if (userCheck.recordset[0].role === "admin") {
      return res.status(400).json({
        message: "Cannot deactivate another admin",
      });
    }

    // Deactivate user
    await pool.request().input("id", sql.Int, id).query(`
        UPDATE users
        SET is_active = 0
        WHERE id = @id
      `);

    res.json({ message: "User deactivated successfully" });
  } catch (error) {
    console.error("Deactivate user error:", error);
    res.status(500).json({ message: "Server error deactivating user" });
  }
}

/* =================================
   RESTORE USER
================================= */
async function restoreUser(req, res) {
  try {
    const { id } = req.params;
    const pool = await getConnection();

    await pool.request().input("id", sql.Int, id).query(`
        UPDATE users
        SET is_active = 1
        WHERE id = @id
      `);

    res.json({ message: "User restored successfully" });
  } catch (error) {
    console.error("Restore user error:", error);
    res.status(500).json({ message: "Server error restoring user" });
  }
}

/* =================================
   EXPORT CONTROLLER FUNCTIONS
================================= */
module.exports = {
  getAllUsers,
  updateUserRole,
  updateUserDepartment,
  deactivateUser,
  restoreUser,
};
