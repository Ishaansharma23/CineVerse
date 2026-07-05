const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsersAdmin,
} = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.get('/admin/users', protect, authorizeRoles('admin'), getAllUsersAdmin);

module.exports = router;