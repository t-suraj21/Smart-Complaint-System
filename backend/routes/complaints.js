const express = require('express');
const { body } = require('express-validator');
const {
  submitComplaint,
  getAllComplaints,
  getComplaintById,
  updateComplaintStatus,
  getMyComplaints,
} = require('../controllers/complaintController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// POST /api/complaints – student submits
router.post(
  '/',
  protect,
  authorize('student'),
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('description')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
  ],
  submitComplaint
);

// GET /api/complaints – teacher/admin views all
router.get('/', protect, authorize('teacher', 'admin'), getAllComplaints);

// GET /api/complaints/my – student views own complaints
router.get('/my', protect, authorize('student'), getMyComplaints);

// GET /api/complaints/:id – single complaint
router.get('/:id', protect, getComplaintById);

// PUT /api/complaints/:id/status – teacher updates status
router.put(
  '/:id/status',
  protect,
  authorize('teacher', 'admin'),
  [
    body('status')
      .isIn(['Pending', 'In Progress', 'Solved'])
      .withMessage('Invalid status'),
  ],
  updateComplaintStatus
);

module.exports = router;
