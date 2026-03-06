const { validationResult } = require('express-validator');
const axios = require('axios');
const Complaint = require('../models/Complaint');
const { sendHighPriorityEmail } = require('../utils/mailer');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Fallback NLP if Python service is unavailable
const fallbackNLP = (text) => {
  const lower = text.toLowerCase();
  const harassmentWords = ['harassment', 'ragging', 'violence', 'threat', 'abuse', 'attack', 'bully'];
  const highWords = ['urgent', 'emergency', 'immediately', 'serious', 'dangerous', 'fire', 'flood'];
  const mediumWords = ['wifi', 'internet', 'cleaning', 'electricity', 'water', 'broken', 'repair', 'dirty', 'smell'];

  let category = 'Other';
  let priority = 'Low';
  let priorityScore = 1;
  let sentiment = 'Neutral';

  // Category detection
  if (lower.includes('hostel') || lower.includes('room') || lower.includes('dormitory')) category = 'Hostel Problem';
  if (lower.includes('library') || lower.includes('book') || lower.includes('reading room')) category = 'Library Issue';
  if (lower.includes('exam') || lower.includes('result') || lower.includes('grade') || lower.includes('marks')) category = 'Exam Issue';
  if (lower.includes('faculty') || lower.includes('teacher') || lower.includes('professor') || lower.includes('lecture')) category = 'Faculty Issue';
  if (lower.includes('wifi') || lower.includes('internet') || lower.includes('electricity') || lower.includes('water') || lower.includes('building') || lower.includes('infra')) category = 'Infrastructure';
  if (harassmentWords.some(w => lower.includes(w))) category = 'Ragging / Harassment';

  // Priority detection
  if (harassmentWords.some(w => lower.includes(w)) || highWords.some(w => lower.includes(w))) {
    priority = 'High'; priorityScore = 3;
  } else if (mediumWords.some(w => lower.includes(w))) {
    priority = 'Medium'; priorityScore = 2;
  }

  // Sentiment
  const negWords = ['not working', 'broken', 'issue', 'problem', 'bad', 'terrible', 'horrible', 'worst', 'harassment', 'dirty'];
  if (negWords.some(w => lower.includes(w))) sentiment = 'Negative';

  return { category, priority, priorityScore, sentiment };
};

// @desc    Submit a complaint
// @route   POST /api/complaints
exports.submitComplaint = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { title, description, isAnonymous } = req.body;
    const combinedText = `${title} ${description}`;

    let nlpResult = null;
    let nlpSource = 'fallback';

    // Try Python ML service
    try {
      const mlResponse = await axios.post(
        `${ML_SERVICE_URL}/predict`,
        { text: combinedText },
        { timeout: 5000 }
      );
      if (mlResponse.data && mlResponse.data.category) {
        nlpResult = mlResponse.data;
        nlpSource = 'ml_model';
      }
    } catch (mlErr) {
      console.warn('⚠️  ML service unavailable, using fallback NLP');
    }

    if (!nlpResult) {
      nlpResult = fallbackNLP(combinedText);
    }

    const { category, priority, priorityScore, sentiment } = nlpResult;

    const complaint = await Complaint.create({
      studentId: req.user.id,
      title,
      description,
      category,
      priority,
      priorityScore,
      sentiment,
      isAnonymous: isAnonymous || false,
      nlpRaw: { ...nlpResult, source: nlpSource },
    });

    // Send email to admin if High priority
    if (priority === 'High') {
      try {
        await sendHighPriorityEmail(complaint);
      } catch (mailErr) {
        console.warn('Email notification failed:', mailErr.message);
      }
    }

    await complaint.populate('studentId', 'name email department rollNumber');

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all complaints (teacher/admin)
// @route   GET /api/complaints
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { category, priority, status, search, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Complaint.countDocuments(filter);

    const complaints = await Complaint.find(filter)
      .populate('studentId', 'name email department rollNumber')
      .populate('resolvedBy', 'name')
      .sort({ priorityScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      complaints,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get my complaints (student)
// @route   GET /api/complaints/my
exports.getMyComplaints = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = { studentId: req.user.id };
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Complaint.countDocuments(filter);
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, complaints });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
exports.getComplaintById = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('studentId', 'name email department rollNumber')
      .populate('resolvedBy', 'name');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Students can only see their own
    if (
      req.user.role === 'student' &&
      complaint.studentId._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
exports.updateComplaintStatus = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { status, teacherNote } = req.body;
    const update = { status, teacherNote };

    if (status === 'Solved') {
      update.resolvedAt = new Date();
      update.resolvedBy = req.user.id;
    }

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).populate('studentId', 'name email department');

    if (!complaint) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    res.json({ success: true, message: 'Status updated', complaint });
  } catch (err) {
    next(err);
  }
};
