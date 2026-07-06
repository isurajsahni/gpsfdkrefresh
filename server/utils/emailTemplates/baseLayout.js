/**
 * Base Email Layout
 * Shared HTML shell used by all authentication email templates.
 * Provides header, footer, responsive CSS, and brand styling.
 *
 * @param {Object} options
 * @param {string} options.preheaderText - Hidden preview text for email clients
 * @param {string} options.content      - Template-specific HTML body content
 * @returns {string} Complete HTML email string
 */

const BRAND_COLOR = '#0B5D3B';
const BRAND_GRADIENT_END = '#065F46';

const baseLayout = ({ preheaderText, content }) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>GPSFDK</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }

    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f7f5;
      -webkit-font-smoothing: antialiased;
    }

    .email-wrapper {
      width: 100%;
      background-color: #f4f7f5;
      padding: 40px 0;
    }

    .email-card {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
    }

    .email-header {
      background: linear-gradient(135deg, ${BRAND_COLOR} 0%, ${BRAND_GRADIENT_END} 100%);
      padding: 44px 40px;
      text-align: center;
    }

    .email-body {
      padding: 48px 40px;
      text-align: center;
    }

    .email-footer {
      background: #f8faf9;
      border-top: 1px solid #e8ece9;
      padding: 28px 40px;
      text-align: center;
    }

    /* OTP Box */
    .otp-container {
      background: #f0faf4;
      border: 2px dashed ${BRAND_COLOR};
      border-radius: 14px;
      padding: 24px 20px;
      margin: 32px auto;
      max-width: 320px;
    }

    .otp-code {
      color: ${BRAND_COLOR};
      margin: 0;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: 10px;
      font-family: 'Courier New', Courier, monospace;
    }

    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-wrapper { padding: 20px 10px !important; }
      .email-card { border-radius: 12px !important; }
      .email-header { padding: 32px 24px !important; }
      .email-body { padding: 32px 24px !important; }
      .email-footer { padding: 24px 20px !important; }
      .otp-code { font-size: 32px !important; letter-spacing: 8px !important; }
    }
  </style>
</head>
<body>
  <!-- Preheader (hidden preview text) -->
  <div style="display:none;font-size:1px;color:#f4f7f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${preheaderText}
  </div>

  <div class="email-wrapper">
    <div class="email-card">

      <!-- ─── Header ─── -->
      <div class="email-header">
        <a href="${process.env.CLIENT_URL || 'https://gpsfdk.com'}" style="text-decoration: none;">
          <h1 style="color: #ffffff; margin: 0; font-size: 30px; font-weight: 700; letter-spacing: 3px;">GPSFDK</h1>
        </a>
        <p style="color: rgba(255,255,255,0.65); margin: 8px 0 0; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase;">
          Premium Wall Art &amp; Decor
        </p>
      </div>

      <!-- ─── Body ─── -->
      <div class="email-body">
        ${content}
      </div>

      <!-- ─── Footer ─── -->
      <div class="email-footer">
        <p style="margin: 0; font-size: 12px; color: #999; line-height: 1.6;">
          &copy; ${new Date().getFullYear()} GPSFDK. All rights reserved.
        </p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #aaa;">
          Need help? Contact us at
          <a href="mailto:support@gpsfdk.com" style="color: ${BRAND_COLOR}; text-decoration: none;">support@gpsfdk.com</a>
        </p>
      </div>

    </div>
  </div>
</body>
</html>
`;

module.exports = { baseLayout, BRAND_COLOR };
