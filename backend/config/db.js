const sql = require('mssql');

const config = {
    user: 'sa',
    password: 'Password123',
    server: 'localhost',
    database: 'FacultyComplaintDB',
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

let pool = null;

async function getConnection() {
    if (!pool) {
        pool = await sql.connect(config);
    }
    return pool;
}

module.exports = { getConnection, sql };
