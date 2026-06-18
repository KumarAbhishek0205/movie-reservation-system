const express = require('express');
const { listUsers, promoteUser } = require('../controllers/users.controller');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate, requireAdmin);
router.get('/', listUsers);
router.patch('/:id/role', promoteUser);

module.exports = router;
