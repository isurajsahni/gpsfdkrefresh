const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

(async () => {
  try {
    console.log(`Connecting to ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT} as ${process.env.EMAIL_USER}...`);
    await transporter.verify();
    console.log('✅ SMTP Authenticated!');
    
    console.log('Sending test email to isurajsahni7@gmail.com...');
    const result = await transporter.sendMail({
      from: `"GPSFDK" <${process.env.EMAIL_USER}>`, // NOTE: if user isn't 'resend', this will be their verified domain email
      to: 'isurajsahni7@gmail.com',
      subject: 'Resend Test',
      html: '<h1>It works!</h1>'
    });
    console.log('✅ Sent! Message ID:', result.messageId);
  } catch (err) {
    console.error('❌ FAILED: ', err.message);
  }
})();
