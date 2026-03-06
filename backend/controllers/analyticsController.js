const Complaint = require('../models/Complaint');

// @desc    Dashboard summary counts
// @route   GET /api/analytics/summary
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [total, high, medium, low, pending, inProgress, solved] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ priority: 'High' }),
      Complaint.countDocuments({ priority: 'Medium' }),
      Complaint.countDocuments({ priority: 'Low' }),
      Complaint.countDocuments({ status: 'Pending' }),
      Complaint.countDocuments({ status: 'In Progress' }),
      Complaint.countDocuments({ status: 'Solved' }),
    ]);

    res.json({
      success: true,
      summary: { total, high, medium, low, pending, inProgress, solved },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Monthly complaints count
// @route   GET /api/analytics/monthly
exports.getMonthlyStats = async (req, res, next) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();

    const data = await Complaint.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { month: { $month: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    // Fill missing months with 0
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = monthNames.map((name, idx) => {
      const found = data.find((d) => d._id.month === idx + 1);
      return { month: name, count: found ? found.count : 0 };
    });

    res.json({ success: true, year, monthly });
  } catch (err) {
    next(err);
  }
};

// @desc    Category distribution
// @route   GET /api/analytics/categories
exports.getCategoryStats = async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const categories = data.map((d) => ({
      category: d._id,
      count: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }));

    res.json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

// @desc    Solved vs Pending stats
// @route   GET /api/analytics/status
exports.getStatusStats = async (req, res, next) => {
  try {
    const data = await Complaint.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const total = data.reduce((sum, d) => sum + d.count, 0);
    const statuses = data.map((d) => ({
      status: d._id,
      count: d.count,
      percentage: total > 0 ? Math.round((d.count / total) * 100) : 0,
    }));

    res.json({ success: true, statuses });
  } catch (err) {
    next(err);
  }
};
