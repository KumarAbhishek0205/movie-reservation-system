/**
 * Applies schema.sql to the configured database.
 *
 * Usage:
 *   node src/db/migrate.js          # create tables (idempotent)
 *   node src/db/migrate.js --drop   # drop everything first, then recreate
 */
const fs = require('fs');
const path = require('path');
const { pool } = require('./pool');

const DROP_SQL = `
  DROP TABLE IF EXISTS reservation_seats CASCADE;
  DROP TABLE IF EXISTS reservations CASCADE;
  DROP TABLE IF EXISTS showtimes CASCADE;
  DROP TABLE IF EXISTS seats CASCADE;
  DROP TABLE IF EXISTS rooms CASCADE;
  DROP TABLE IF EXISTS movie_genres CASCADE;
  DROP TABLE IF EXISTS movies CASCADE;
  DROP TABLE IF EXISTS genres CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

async function migrate() {
  const shouldDrop = process.argv.includes('--drop');
  const client = await pool.connect();
  try {
    if (shouldDrop) {
      console.log('Dropping existing tables...');
      await client.query(DROP_SQL);
    }

    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    console.log('Applying schema...');
    await client.query(schemaSql);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
