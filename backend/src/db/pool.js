const { Pool } = require('pg');
const config = require('../config/env');

const pool = new Pool(
  config.databaseUrl
    ? { connectionString: config.databaseUrl }
    : config.pg
);

pool.on('error', (err) => {
  // Idle client errors should not crash the whole process.
  console.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Run a query against the pool.
 * @param {string} text
 * @param {Array} params
 */
function query(text, params) {
  return pool.query(text, params);
}

/**
 * Run a callback with a single client checked out of the pool, wrapped in a
 * transaction. The callback receives the client and must use it (not the
 * pool) for every query so all statements share the same transaction.
 */
async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
