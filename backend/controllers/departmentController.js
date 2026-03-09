const { getConnection, sql } = require("../config/db");

/* =================================
   GET ALL DEPARTMENTS
================================= */
async function getDepartments(req, res) {
  try {
    const pool = await getConnection();

    const result = await pool.request().query(`
        SELECT *
        FROM departments
        ORDER BY name
      `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({
      message: "Server error fetching departments",
    });
  }
}

/* =================================
   CREATE NEW DEPARTMENT
================================= */
async function createDepartment(req, res) {
  try {
    const { name } = req.body;

    const pool = await getConnection();

    const result = await pool.request().input("name", sql.NVarChar, name)
      .query(`
        INSERT INTO departments (name)
        VALUES (@name);

        SELECT SCOPE_IDENTITY() AS id
      `);

    res.status(201).json({
      message: "Department created successfully",
      id: result.recordset[0].id,
    });
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({
      message: "Server error creating department",
    });
  }
}

/* =================================
   DELETE DEPARTMENT
================================= */
async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;

    const pool = await getConnection();

    await pool.request().input("id", sql.Int, id).query(`
        DELETE FROM departments
        WHERE id = @id
      `);

    res.json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({
      message:
        "Cannot delete department. It may have associated users or complaints.",
    });
  }
}

/* =================================
   EXPORT FUNCTIONS
================================= */
module.exports = {
  getDepartments,
  createDepartment,
  deleteDepartment,
};
