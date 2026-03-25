const nodemailer = require('nodemailer');
const dns = require('dns');

// Force IPv4 resolution — fixes ENETUNREACH on Render/cloud hosts
// where smtp.hostinger.com resolves to IPv6 but IPv6 is not reachable
dns.setDefaultResultOrder('ipv4first');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not found in env, emails will be skipped.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: parseInt(process.env.EMAIL_PORT) === 587 ? false : true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });

  return transporter;
};

const sendEmail = async (options) => {
  const t = getTransporter();
  if (!t) return;

  const mailOptions = {
    from: `"GPSFDK" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  try {
    const info = await t.sendMail(mailOptions);
    console.log(`✅ Email sent to ${options.email}: ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`❌ Email failed to ${options.email}:`, err.message);
    transporter = null;
    throw err;
  }
};

module.exports = sendEmail;
