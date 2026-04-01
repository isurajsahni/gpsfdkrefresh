const { Resend } = require('resend');

const sendEmail = async (options) => {
  if (!process.env.EMAIL_PASS) {
    console.warn('Resend API key missing in EMAIL_PASS, skipping email.');
    return; // Silent fail gracefully in dev if no key
  }

  const resend = new Resend(process.env.EMAIL_PASS);
  
  // Use the verified domain from EMAIL_FROM, fallback to testing address
  const senderEmail = (process.env.EMAIL_FROM || 'onboarding@resend.dev').trim();

  try {
    const data = await resend.emails.send({
      from: `"GPSFDK" <${senderEmail}>`,
      to: options.email,
      subject: options.subject,
      html: options.html,
    });
    
    // Resend API returns an error property if something failed logically (like unverified domain)
    if (data.error) {
      const errorMsg = `❌ Resend API Error for ${options.email}: ${data.error.message} (${data.error.name})`;
      console.error(errorMsg);
      const err = new Error(data.error.message);
      err.status = 400; // Client-side identifiable error
      throw err;
    }

    console.log(`✅ Email sent to ${options.email}. ID: ${data.data?.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Email send failed to ${options.email}. Full Error:`, error);
    if (!error.status) error.status = 500;
    throw error;
  }
};

module.exports = sendEmail;
