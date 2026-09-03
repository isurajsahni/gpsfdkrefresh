// App-store review demo login.
//
// App Review needs a working sign-in (Guideline 2.1) to reach self-serve
// account deletion (5.1.1(v)). Our app login is passwordless: a random OTP is
// mailed to whatever address the reviewer types. A reviewer can't read our
// mailbox, so without a fixed code they can never get past the OTP screen.
//
// Both env vars must be set for the bypass to exist at all — there is no
// default identifier and no default code, so this is inert on production and
// on every dev machine until someone deliberately sets them:
//
//   DEMO_LOGIN_EMAIL=appreview@gpsfdk.com
//   DEMO_LOGIN_OTP=147852
//
// The code is long-lived, so it is deliberately NOT exempted from otpLimiter
// (5 verify attempts / 10 min / IP) — that rate limit is the only thing
// standing between a leaked demo address and a brute-forced 6-digit code.
// Rotate DEMO_LOGIN_OTP after each review round, and unset both vars once the
// app is out of review if you'd rather not keep a standing fixed-code account.

// Returns { email, otp } only when BOTH vars are set and non-empty; null
// otherwise, which is what makes every caller a no-op by default.
const getDemoLogin = () => {
  const email = (process.env.DEMO_LOGIN_EMAIL || '').trim().toLowerCase();
  const otp = (process.env.DEMO_LOGIN_OTP || '').trim();
  if (!email || !otp) return null;
  return { email, otp };
};

// True only for the exact configured identifier. Normalisation matches
// sendPasswordlessOtp's, so callers can pass the raw user-supplied value.
const isDemoIdentifier = (identifier) => {
  const demo = getDemoLogin();
  if (!demo || typeof identifier !== 'string') return false;
  return identifier.trim().toLowerCase() === demo.email;
};

module.exports = { getDemoLogin, isDemoIdentifier };
