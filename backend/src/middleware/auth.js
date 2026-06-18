const jwt = require('jsonwebtoken');
const config = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Verifies the Bearer token on the request and attaches `req.user` as
 * `{ id, role, email }`. Rejects with 401 if missing/invalid.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError('Authentication required.', 401));
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id, role: payload.role, email: payload.email };
    return next();
  } catch (err) {
    return next(new AppError('Invalid or expired session. Please log in again.', 401));
  }
}

/**
 * Like `authenticate`, but does not fail the request if no token is
 * present — useful for endpoints that behave slightly differently for
 * logged-in users without requiring login.
 */
function authenticateOptional(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next();

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.id, role: payload.role, email: payload.email };
  } catch (err) {
    // ignore invalid token in optional mode
  }
  return next();
}

/**
 * Restricts a route to admins. Must be used after `authenticate`.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required.', 403));
  }
  return next();
}

module.exports = { authenticate, authenticateOptional, requireAdmin };
