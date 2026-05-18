require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: drop unique constraint on full_fir_no...');
    
    await client.query(`
      ALTER TABLE fir_cases 
      DROP CONSTRAINT IF EXISTS fir_cases_full_fir_no_unique;
    `);
    
    console.log('✅ Migration complete: dropped unique constraint.');
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
