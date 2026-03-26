const dotenv = require('dotenv');
dotenv.config();
const { Resend } = require('resend');

const senderEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
console.log('API Key:', process.env.EMAIL_PASS ? `SET (${process.env.EMAIL_PASS.length} chars)` : 'MISSING');
console.log('Sender:', senderEmail);

(async () => {
  const resend = new Resend(process.env.EMAIL_PASS);
  try {
    const data = await resend.emails.send({
      from: `GPSFDK <${senderEmail}>`,
      to: 'isurajsahni7@gmail.com',
      subject: 'GPSFDK Local Test - ' + new Date().toLocaleTimeString(),
      html: '<h2>Resend HTTPS API works locally!</h2><p>Sent at: ' + new Date().toISOString() + '</p>',
    });
    console.log('Result:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
