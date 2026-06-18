/**
 * Wraps an async route/middleware function so thrown errors and rejected
 * promises are passed to Express's `next`, instead of crashing the process.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
