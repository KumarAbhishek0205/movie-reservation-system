const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db/pool');
const config = require('../config/env');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !name.trim()) throw new AppError('Name is required.', 422);
  if (!email || !EMAIL_RE.test(email)) throw new AppError('A valid email is required.', 422);
  if (!password || password.length < 8) {
    throw new AppError('Password must be at least 8 characters.', 422);
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows.length > 0) {
    throw new AppError('An account with that email already exists.', 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Signup always creates a regular user — promotion to admin is a
  // separate, admin-only action, never something a user can grant
  // themselves at signup.
  const result = await query(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES ($1, $2, $3, 'user')
     RETURNING id, name, email, role`,
    [name.trim(), email.toLowerCase(), passwordHash]
  );

  const user = result.rows[0];
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw new AppError('Email and password are required.', 422);

  const result = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
  const user = result.rows[0];
  if (!user) throw new AppError('Invalid email or password.', 401);

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) throw new AppError('Invalid email or password.', 401);

  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
});

const me = asyncHandler(async (req, res) => {
  const result = await query('SELECT id, name, email, role, created_at FROM users WHERE id = $1', [
    req.user.id,
  ]);
  if (result.rows.length === 0) throw new AppError('User not found.', 404);
  res.json({ user: result.rows[0] });
});

module.exports = { signup, login, me };
