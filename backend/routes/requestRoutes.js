const express = require('express');
const router = express.Router();
const {
  create,
  getDonorRequests,
  getNGORequests,
  updateStatus,
  complete,
  getAll,
} = require('../controllers/requestController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

// @route   POST /api/request
// @desc    NGO creates a food request
// @access  Private (NGO)
router.post('/', protect, authorize('NGO'), create);

// @route   GET /api/request/donor
// @desc    Donor sees incoming requests for their listings
// @access  Private (DONOR)
router.get('/donor', protect, authorize('DONOR'), getDonorRequests);

// @route   GET /api/request/ngo
// @desc    NGO sees their own submitted requests
// @access  Private (NGO)
router.get('/ngo', protect, authorize('NGO'), getNGORequests);

// @route   GET /api/request/all
// @desc    Admin sees all requests
// @access  Private (ADMIN)
router.get('/all', protect, authorize('ADMIN'), getAll);

// @route   PUT /api/request/:id/status
// @desc    Donor accepts or rejects a request
// @access  Private (DONOR)
router.put('/:id/status', protect, authorize('DONOR'), updateStatus);

// @route   PUT /api/request/:id/complete
// @desc    Donor marks request as completed
// @access  Private (DONOR)
router.put('/:id/complete', protect, authorize('DONOR'), complete);

module.exports = router;
