const express = require('express');
const router = express.Router();
const {
  stats,
  users,
  removeUser,
  toggleUser,
  removeFood,
  foods,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// All admin routes require authentication + ADMIN role
router.use(protect, authorize('ADMIN'));

// @route   GET /api/admin/stats
// @desc    Dashboard statistics
router.get('/stats', stats);

// @route   GET /api/admin/users
// @desc    Get all users (with search, filter, pagination)
router.get('/users', users);

// @route   DELETE /api/admin/users/:id
// @desc    Delete a user and all related data
router.delete('/users/:id', removeUser);

// @route   PATCH /api/admin/users/:id/toggle
// @desc    Activate or deactivate a user
router.patch('/users/:id/toggle', toggleUser);

// @route   GET /api/admin/foods
// @desc    Get all food listings (admin view)
router.get('/foods', foods);

// @route   DELETE /api/admin/foods/:id
// @desc    Admin deletes a food listing
router.delete('/foods/:id', removeFood);

module.exports = router;
