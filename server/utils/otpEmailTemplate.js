/**
 * OTP Email Template
 * Sent to users when they request a password reset
 */

const brandColor = '#0B5D3B';

const otpEmail = (userName, otp) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
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
  <div style="display:none;max-height:0;overflow:hidden;">Your GPSFDK password reset code is ${otp}</div>
  <div class="container">
    <!-- Header -->
    <div class="header" style="background: ${brandColor}; padding: 40px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 32px; letter-spacing: 2px;">GPSFDK</h1>
      <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px; letter-spacing: 1px;">PREMIUM WALL ART & DECOR</p>
    </div>

    <!-- Body -->
    <div class="body" style="padding: 45px 40px; text-align: center;">
      <div style="font-size: 45px; margin-bottom: 20px;">🔒</div>
      <h2 style="color: #333; margin: 0; font-size: 24px;">Reset Your Password</h2>
      <p style="color: #666; margin-top: 15px; font-size: 15px; line-height: 1.6;">
        Hi ${userName},<br>
        We received a request to reset your password. Here is your 6-digit verification code:
      </p>

      <!-- OTP Box -->
      <div style="background: #f0faf4; border: 2px dashed ${brandColor}; border-radius: 12px; padding: 20px; margin: 30px auto; max-width: 300px;">
        <h1 style="color: ${brandColor}; margin: 0; font-size: 40px; letter-spacing: 8px;">${otp}</h1>
      </div>

      <p style="color: #666; font-size: 14px; line-height: 1.6;">
        This code is valid for <strong>10 minutes</strong>.<br>
        If you didn't request a password reset, you can safely ignore this email.
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #f0f0f0; padding: 25px 40px; text-align: center; font-size: 12px; color: #888;">
      <p style="margin: 0;">&copy; ${new Date().getFullYear()} GPSFDK. All rights reserved.</p>
      <p style="margin: 6px 0 0;">customer@gpsfdk.com</p>
    </div>
  </div>
</body>
</html>
`;

module.exports = otpEmail;
