const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

exports.sendHighPriorityEmail = async (complaint) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email credentials not configured, skipping email notification');
    return;
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"Complaint System" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // Send to admin
    subject: `🚨 HIGH PRIORITY Complaint: ${complaint.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:2px solid #e53e3e;border-radius:8px;padding:24px">
        <h2 style="color:#e53e3e">🚨 High Priority Complaint Alert</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px;font-weight:bold;width:140px">Category:</td><td style="padding:8px">${complaint.category}</td></tr>
          <tr style="background:#fff5f5"><td style="padding:8px;font-weight:bold">Priority:</td><td style="padding:8px;color:#e53e3e;font-weight:bold">HIGH</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Title:</td><td style="padding:8px">${complaint.title}</td></tr>
          <tr style="background:#fff5f5"><td style="padding:8px;font-weight:bold;vertical-align:top">Description:</td><td style="padding:8px">${complaint.description}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Submitted At:</td><td style="padding:8px">${new Date(complaint.createdAt).toLocaleString()}</td></tr>
        </table>
        <p style="margin-top:16px;color:#718096">Please log in to the admin dashboard to take immediate action.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log('📧 High priority email sent');
};
