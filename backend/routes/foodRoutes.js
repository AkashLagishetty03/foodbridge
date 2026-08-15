const express = require('express');
const router = express.Router();
const {
  create,
  getAll,
  getOne,
  getMyFoods,
  update,
  remove,
} = require('../controllers/foodController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @route   GET /api/food
// @desc    Get all food listings (with filters)
// @access  Private
router.get('/', protect, getAll);

// @route   GET /api/food/my
// @desc    Get donor's own food listings
// @access  Private (DONOR)
router.get('/my', protect, authorize('DONOR'), getMyFoods);

// @route   GET /api/food/:id
// @desc    Get single food listing
// @access  Private
router.get('/:id', protect, getOne);

// @route   POST /api/food
// @desc    Create food listing
// @access  Private (DONOR)
router.post('/', protect, authorize('DONOR'), create);

// @route   PUT /api/food/:id
// @desc    Update food listing
// @access  Private (DONOR)
router.put('/:id', protect, authorize('DONOR'), update);

// @route   DELETE /api/food/:id
// @desc    Delete food listing
// @access  Private (DONOR, ADMIN)
router.delete('/:id', protect, authorize('DONOR', 'ADMIN'), remove);

module.exports = router;
