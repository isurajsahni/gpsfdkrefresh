const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const fs = require('fs');

const TARGET_EMAIL = 'isurajsahni7@gmail.com';
const log = [];
const print = (msg) => { console.log(msg); log.push(msg); };

(async () => {
  print('=== ENV CHECK ===');
  print('EMAIL_HOST: ' + (process.env.EMAIL_HOST || 'MISSING'));
  print('EMAIL_PORT: ' + (process.env.EMAIL_PORT || 'MISSING'));
  print('EMAIL_USER: ' + (process.env.EMAIL_USER || 'MISSING'));
  print('EMAIL_PASS: ' + (process.env.EMAIL_PASS ? `SET (${process.env.EMAIL_PASS.length} chars)` : 'MISSING/EMPTY'));

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
    port: parseInt(process.env.EMAIL_PORT) || 465,
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
  });

  print('\n=== SMTP VERIFY ===');
  try {
    await transporter.verify();
    print('SMTP: OK');
  } catch (e) {
    print('SMTP FAILED: ' + e.message + ' (code: ' + e.code + ')');
    fs.writeFileSync('email-diag.log', log.join('\n'));
    process.exit(1);
  }

  print('\n=== DIRECT SEND ===');
  try {
    const info = await transporter.sendMail({
      from: `"GPSFDK" <${process.env.EMAIL_USER}>`,
      to: TARGET_EMAIL,
      subject: 'GPSFDK Direct Test - ' + new Date().toLocaleTimeString(),
      html: '<h2>Direct test works!</h2><p>Sent at ' + new Date().toISOString() + '</p>',
    });
    print('SENT OK - ID: ' + info.messageId);
    print('Response: ' + info.response);
  } catch (e) {
    print('SEND FAILED: ' + e.message);
  }

  print('\n=== PRODUCTION sendEmail() ===');
  try {
    const sendEmail = require('./utils/sendEmail');
    const welcomeEmail = require('./utils/welcomeEmailTemplate');
    const html = welcomeEmail('Test User');
    print('Template length: ' + html.length);
    
    const result = await sendEmail({
      email: TARGET_EMAIL,
      subject: 'GPSFDK Welcome Test - ' + new Date().toLocaleTimeString(),
      html: html,
    });
    if (result) {
      print('sendEmail returned: ' + result.messageId);
      print('Response: ' + result.response);
    } else {
      print('sendEmail returned: ' + JSON.stringify(result) + ' (null/undefined means transporter was null!)');
    }
  } catch (e) {
    print('sendEmail THREW: ' + e.message);
  }

  print('\n=== DONE ===');
  fs.writeFileSync('email-diag.log', log.join('\n'));
  process.exit(0);
})();
