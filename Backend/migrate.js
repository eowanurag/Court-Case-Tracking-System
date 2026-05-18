// Direct migration: Add pairokar_id column to fir_cases
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add pairokar_id to fir_cases...');
    
    await client.query(`
      ALTER TABLE fir_cases 
      ADD COLUMN IF NOT EXISTS pairokar_id integer 
      REFERENCES users(id) ON DELETE SET NULL;
    `);
    
    console.log('✅ Migration complete: pairokar_id column added to fir_cases.');
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
