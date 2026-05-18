require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add new fields to fir_cases...');
    
    await client.query(`
      ALTER TABLE fir_cases 
      ADD COLUMN IF NOT EXISTS accused_names text,
      ADD COLUMN IF NOT EXISTS court_case_type varchar(100),
      ADD COLUMN IF NOT EXISTS case_initial_date date,
      ADD COLUMN IF NOT EXISTS last_hearing_date date,
      ADD COLUMN IF NOT EXISTS order_sent_date date,
      ADD COLUMN IF NOT EXISTS due_date date;
    `);
    
    console.log('✅ Migration complete: new fields added to fir_cases.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
