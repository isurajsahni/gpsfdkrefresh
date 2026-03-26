/**
 * Welcome Email Template
 * Sent to new users upon registration
 */

const brandColor = '#0B5D3B';
const accentColor = '#F15A29';

const welcomeEmail = (userName) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to GPSFDK</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f7f7f7; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    @media only screen and (max-width: 600px) {
      .body { padding: 25px 20px !important; }
      .header { padding: 30px 20px !important; }
    }
  </style>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;">Welcome to GPSFDK! We're thrilled to have you.</div>
  <div class="container">
    <!-- Header -->
    <div class="header" style="background: ${brandColor}; padding: 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 2px;">GPSFDK</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">PREMIUM WALL ART & DECOR</p>
    </div>

    <!-- Body -->
    <div class="body" style="padding: 45px 40px;">
      <!-- Welcome -->
      <div style="text-align: center; margin-bottom: 35px;">
        <div style="font-size: 55px; margin-bottom: 10px;">🎨</div>
        <h2 style="color: #333; margin: 0; font-size: 26px; line-height: 1.3;">Welcome, ${userName}!</h2>
        <p style="color: #666; margin-top: 12px; font-size: 15px; line-height: 1.6;">
          Thank you for joining GPSFDK! We're excited to have you as part of our community of art lovers and decor enthusiasts.
        </p>
      </div>

      <!-- What you get -->
      <div style="background: #f0faf4; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
        <h3 style="color: ${brandColor}; margin: 0 0 15px; font-size: 16px;">Here's what you can enjoy:</h3>
        <table width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">🖼️</span>
            </td>
            <td style="padding: 8px 0; color: #555; font-size: 14px;">
              <strong>Premium Wall Art</strong> — Curated collection of stunning canvases and prints
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">🏷️</span>
            </td>
            <td style="padding: 8px 0; color: #555; font-size: 14px;">
              <strong>Custom Nameplates</strong> — Personalized nameplates for your home
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">🚚</span>
            </td>
            <td style="padding: 8px 0; color: #555; font-size: 14px;">
              <strong>Easy Tracking</strong> — Track your orders and get updates via email
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; vertical-align: top; width: 30px;">
              <span style="font-size: 18px;">💚</span>
            </td>
            <td style="padding: 8px 0; color: #555; font-size: 14px;">
              <strong>Exclusive Offers</strong> — Be the first to know about new arrivals and deals
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${process.env.CLIENT_URL || 'https://gpsfdkrefresh.vercel.app'}" 
           style="display: inline-block; background: ${brandColor}; color: #ffffff !important; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Start Shopping →
        </a>
      </div>

      <div style="text-align: center; color: #999; font-size: 13px; margin-top: 20px;">
        <p>Have questions? Simply reply to this email — we'd love to help!</p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background: #f0f0f0; padding: 25px 40px; text-align: center; font-size: 12px; color: #888;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} GPSFDK. All rights reserved.</p>
      <p style="margin: 6px 0 0;">customer@narsevafoundation.com</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = welcomeEmail;
