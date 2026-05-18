require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migration: add hearing_id to documents...');
    
    await client.query(`
      ALTER TABLE documents 
      ADD COLUMN IF NOT EXISTS hearing_id integer 
      REFERENCES hearings(id) ON DELETE CASCADE;
    `);
    
    console.log('✅ Migration complete: hearing_id column added to documents.');
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
