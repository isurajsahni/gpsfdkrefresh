const { Resend } = require('resend');

// Support both RESEND_API_KEY (recommended) and EMAIL_PASS (legacy)
const getApiKey = () => (process.env.RESEND_API_KEY || process.env.EMAIL_PASS || '').trim();

const sendEmail = async (options) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Previously this returned silently — callers like the OTP route would then
    // record a `success: true` even though nothing was sent. Throw instead so
    // failures are loud and visible to the user (and to the route's error path).
    const msg = 'Email service not configured: set RESEND_API_KEY (and EMAIL_FROM) in env.';
    console.warn(`📭 ${msg}`);
    const err = new Error(msg);
    err.status = 503;
    throw err;
  }

  const resend = new Resend(apiKey);
  
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
