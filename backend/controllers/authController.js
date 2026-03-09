const { getConnection, sql } = require("../config/db");

/* =================================
   USER SIGNUP
================================= */
async function signup(req, res) {
  try {
    const { name, email, password, role } = req.body;

    const pool = await getConnection();

    /* -------- Check if email already exists -------- */
    const existingUser = await pool
      .request()
      .input("email", sql.NVarChar, email).query(`
        SELECT *
        FROM users
        WHERE email = @email
      `);

    if (existingUser.recordset.length > 0) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    /* -------- Insert new user -------- */
    const result = await pool
      .request()
      .input("name", sql.NVarChar, name)
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, password)
      .input("role", sql.NVarChar, role || "user").query(`
        INSERT INTO users (name, email, password, role)
        VALUES (@name, @email, @password, @role);

        SELECT SCOPE_IDENTITY() AS id
      `);

    const userId = result.recordset[0].id;

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: userId,
        name,
        email,
        role: role || "user",
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      message: "Server error during signup",
    });
  }
}

/* =================================
   USER LOGIN
================================= */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const pool = await getConnection();

    /* -------- Validate credentials -------- */
    const result = await pool
      .request()
      .input("email", sql.NVarChar, email)
      .input("password", sql.NVarChar, password).query(`
        SELECT u.*, d.name AS department_name
        FROM users u
        LEFT JOIN departments d
          ON u.department_id = d.id
        WHERE u.email = @email
          AND u.password = @password
          AND u.is_active = 1
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    const user = result.recordset[0];

    /* -------- Send user data -------- */
    res.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        department_name: user.department_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Server error during login",
    });
  }
}

/* =================================
   EXPORT FUNCTIONS
================================= */
module.exports = {
  signup,
  login,
};
