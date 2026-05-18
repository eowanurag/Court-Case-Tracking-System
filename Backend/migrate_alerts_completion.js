require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add completion_date and remarks to alerts...');
    
    await client.query(`
      ALTER TABLE alerts 
      ADD COLUMN IF NOT EXISTS completion_date date,
      ADD COLUMN IF NOT EXISTS remarks text;
    `);
    
    console.log('✅ Migration complete: columns added to alerts table.');
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
