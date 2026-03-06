const express = require('express');
const { getMonthlyStats, getCategoryStats, getStatusStats, getDashboardSummary } = require('../controllers/analyticsController');
const protect = require('../middleware/auth');
const authorize = require('../middleware/authorize');

const router = express.Router();

// All analytics routes require teacher/admin
router.get('/summary', protect, authorize('teacher', 'admin'), getDashboardSummary);
router.get('/monthly', protect, authorize('teacher', 'admin'), getMonthlyStats);
router.get('/categories', protect, authorize('teacher', 'admin'), getCategoryStats);
router.get('/status', protect, authorize('teacher', 'admin'), getStatusStats);

module.exports = router;
