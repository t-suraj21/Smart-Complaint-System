/**
 * seed.js – Creates demo users and sample complaints for testing
 * Run: node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Complaint = require('./models/Complaint');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/complaint_system';

const demoUsers = [
  {
    name: 'Demo Student',
    email: 'student@demo.com',
    password: '123456',
    role: 'student',
    department: 'Computer Science',
    rollNumber: '2021CS001',
  },
  {
    name: 'Demo Teacher',
    email: 'teacher@demo.com',
    password: '123456',
    role: 'teacher',
    department: 'Computer Science',
  },
  {
    name: 'Admin User',
    email: 'admin@demo.com',
    password: '123456',
    role: 'admin',
    department: 'Administration',
  },
];

const sampleComplaints = [
  {
    title: 'WiFi not working in Hostel Block B',
    description: 'The WiFi connectivity in hostel block B has been down since the last 3 days. Students are unable to access internet for study purposes.',
    category: 'Infrastructure',
    priority: 'Medium',
    priorityScore: 2,
    sentiment: 'Negative',
    status: 'Pending',
  },
  {
    title: 'Ragging and harassment by seniors',
    description: 'Senior students are harassing and bullying juniors in the hostel corridor at night. This needs immediate attention and action.',
    category: 'Ragging / Harassment',
    priority: 'High',
    priorityScore: 3,
    sentiment: 'Negative',
    status: 'In Progress',
  },
  {
    title: 'Library books not updated',
    description: 'The library does not have the latest editions of core engineering books. Many books are outdated and torn.',
    category: 'Library Issue',
    priority: 'Low',
    priorityScore: 1,
    sentiment: 'Neutral',
    status: 'Pending',
  },
  {
    title: 'Professor absent from classes regularly',
    description: 'The professor assigned for Data Structures has not attended class for the past 2 weeks without any substitute.',
    category: 'Faculty Issue',
    priority: 'High',
    priorityScore: 3,
    sentiment: 'Negative',
    status: 'Solved',
  },
  {
    title: 'Hostel mess food quality very poor',
    description: 'The mess food quality has degraded significantly. The food is often unhygienic and not nutritious for students.',
    category: 'Hostel Problem',
    priority: 'Medium',
    priorityScore: 2,
    sentiment: 'Negative',
    status: 'In Progress',
  },
  {
    title: 'Exam results not uploaded on portal',
    description: 'The mid-semester exam results were supposed to be available last week but are still not on the student portal.',
    category: 'Exam Issue',
    priority: 'Medium',
    priorityScore: 2,
    sentiment: 'Neutral',
    status: 'Pending',
  },
  {
    title: 'Gas leak smell near hostel kitchen',
    description: 'There is a strong smell of gas leak near the hostel kitchen area. This is dangerous and needs emergency inspection.',
    category: 'Hostel Problem',
    priority: 'High',
    priorityScore: 3,
    sentiment: 'Negative',
    status: 'Solved',
    isAnonymous: true,
  },
  {
    title: 'Computer lab computers are very slow',
    description: 'The computers in lab 3 are outdated and extremely slow, making it impossible to run modern software for practical sessions.',
    category: 'Infrastructure',
    priority: 'Low',
    priorityScore: 1,
    sentiment: 'Neutral',
    status: 'Pending',
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing demo data
    await User.deleteMany({ email: { $in: demoUsers.map((u) => u.email) } });
    const studentEmails = sampleComplaints.map(() => 'student@demo.com');

    // Create users
    const createdUsers = await Promise.all(
      demoUsers.map(async (u) => {
        const hashed = await bcrypt.hash(u.password, 12);
        return User.create({ ...u, password: hashed });
      })
    );
    console.log(`✅ Created ${createdUsers.length} demo users`);

    const studentUser = createdUsers.find((u) => u.role === 'student');

    // Create complaints
    const now = new Date();
    const complaints = sampleComplaints.map((c, i) => ({
      ...c,
      studentId: studentUser._id,
      createdAt: new Date(now - i * 3 * 24 * 60 * 60 * 1000), // spread over past days
      nlpRaw: { source: 'seed', category_confidence: 0.85, priority_confidence: 0.9 },
    }));

    await Complaint.deleteMany({ studentId: studentUser._id });
    const createdComplaints = await Complaint.insertMany(complaints);
    console.log(`✅ Created ${createdComplaints.length} sample complaints`);

    console.log('\n🎉 Seeding complete!');
    console.log('\nDemo Credentials:');
    console.log('  Student  → student@demo.com / 123456');
    console.log('  Teacher  → teacher@demo.com / 123456');
    console.log('  Admin    → admin@demo.com   / 123456');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
