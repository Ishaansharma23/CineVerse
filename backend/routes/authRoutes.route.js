const express = require('express');
const {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getAllUsersAdmin,
  updatePartnerVerification,
} = require('../controllers/authController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.get('/admin/users', protect, authorizeRoles('admin'), getAllUsersAdmin);
router.put('/verify-partner', protect, authorizeRoles('admin'), updatePartnerVerification);

module.exports = router;