const { query } = require('../db/pool');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const listUsers = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
  );
  res.json({ users: result.rows });
});

const promoteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    throw new AppError("Role must be 'user' or 'admin'.", 422);
  }

  const result = await query(
    'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
    [role, id]
  );
  if (result.rows.length === 0) throw new AppError('User not found.', 404);

  res.json({ user: result.rows[0] });
});

module.exports = { listUsers, promoteUser };
