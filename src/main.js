let storedOTPs = {}; // In-memory OTP store (replace with DB/Redis in production)

export default async ({ req, res, log, env }) => {
  const nodemailer = await import('nodemailer');

  if (req.method === 'POST' && req.url === '/send-otp') {
    try {
      const body = JSON.parse(req.body || '{}');
      const { email } = body;

      if (!email) {
        return res.json({ success: false, message: 'Email is required' }, 400);
      }

      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      // Store OTP with timestamp
      storedOTPs[email] = { otp, createdAt: Date.now() };

      // Create transporter for Outlook
      const transporter = nodemailer.createTransport({
        service: 'Outlook',
        auth: {
          user: env.OUTLOOK_EMAIL,
          pass: env.OUTLOOK_PASS
        }
      });

      // Send email
      await transporter.sendMail({
        from: env.OUTLOOK_EMAIL,
        to: email,
        subject: 'Welcome! Your OTP Code',
        html: `
          <h2>Welcome to Our App 🎉</h2>
          <p>Your OTP is: <strong>${otp}</strong></p>
          <p>This OTP will expire in 5 minutes.</p>
        `
      });

      return res.json({ success: true, message: 'OTP sent successfully' });
    } catch (err) {
      log(err);
      return res.json({ success: false, message: 'Failed to send OTP' }, 500);
    }
  }

  if (req.method === 'POST' && req.url === '/verify-otp') {
    try {
      const body = JSON.parse(req.body || '{}');
      const { email, otp } = body;

      if (!email || !otp) {
        return res.json({ success: false, message: 'Email and OTP are required' }, 400);
      }

      const record = storedOTPs[email];
      if (!record) {
        return res.json({ success: false, message: 'OTP not found or expired' }, 404);
      }

      const { otp: storedOtp, createdAt } = record;

      // Check expiry (5 minutes = 300000ms)
      if (Date.now() - createdAt > 300000) {
        delete storedOTPs[email];
        return res.json({ success: false, message: 'OTP expired' }, 410);
      }

      if (otp === storedOtp) {
        delete storedOTPs[email]; // remove OTP after successful verification
        return res.json({ success: true, message: 'OTP verified successfully' });
      } else {
        return res.json({ success: false, message: 'Invalid OTP' }, 401);
      }

    } catch (err) {
      log(err);
      return res.json({ success: false, message: 'Error verifying OTP' }, 500);
    }
  }

  return res.json({ success: false, message: 'Invalid route or method' }, 404);
};
