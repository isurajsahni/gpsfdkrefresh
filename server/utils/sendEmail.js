const { Resend } = require('resend');

const sendEmail = async (options) => {
  if (!process.env.EMAIL_PASS) {
    console.warn('Resend API key missing in EMAIL_PASS, skipping email.');
    return; // Silent fail gracefully in dev if no key
  }

  const resend = new Resend(process.env.EMAIL_PASS);
  
  // Use the verified domain from EMAIL_FROM, fallback to testing address
  const senderEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  try {
    const data = await resend.emails.send({
      from: `"GPSFDK" <${senderEmail}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
    
    // Resend API returns an error property if something failed logically (like unverified domain)
    if (data.error) {
      console.error(`❌ Resend API Error for ${options.email}:`, data.error.message);
      throw new Error(data.error.message);
    }

    console.log(`✅ Email sent to ${options.email}. ID: ${data.data?.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Email failed to ${options.email}:`, error.message);
    throw error;
  }
};

module.exports = sendEmail;
