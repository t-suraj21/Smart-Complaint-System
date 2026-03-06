const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: 10,
    },
    category: {
      type: String,
      enum: [
        'Infrastructure',
        'Faculty Issue',
        'Hostel Problem',
        'Ragging / Harassment',
        'Library Issue',
        'Exam Issue',
        'Other',
      ],
      default: 'Other',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Low',
    },
    priorityScore: {
      type: Number,
      default: 1, // 3=High, 2=Medium, 1=Low – for sorting
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative'],
      default: 'Neutral',
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Solved'],
      default: 'Pending',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    teacherNote: {
      type: String,
      trim: true,
    },
    nlpRaw: {
      type: mongoose.Schema.Types.Mixed, // Store raw NLP output
    },
  },
  { timestamps: true }
);

// Index for sorting
complaintSchema.index({ priorityScore: -1, createdAt: -1 });
complaintSchema.index({ studentId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });

module.exports = mongoose.model('Complaint', complaintSchema);
