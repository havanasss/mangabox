const { neon } = require('@neondatabase/serverless');

// Ottieni la connection string da Neon dashboard
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };