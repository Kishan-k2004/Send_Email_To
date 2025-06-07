const sdk = require("node-appwrite");
const nodemailer = require("nodemailer");

module.exports = async function (req, res) {
  const body = JSON.parse(req.bodyRaw);
  const { email, otp, type } = body;

  if (!email || !type) {
    return res.json({ success: false, message: "Missing required fields" });
  }

  if (type === "send-otp") {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000);

    // Save to temporary memory or DB - for now we'll use a simple object
    global.otpStore = global.otpStore || {};
    global.otpStore[email] = generatedOtp;

    const transporter = nodemailer.createTransport({
      service: "Outlook",
      auth: {
        user: process.env.OUTLOOK_EMAIL,
        pass: process.env.OUTLOOK_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.OUTLOOK_EMAIL,
      to: email,
      subject: "Welcome! Here's your OTP",
      html: `<h3>Your OTP is: ${generatedOtp}</h3><p>Welcome to our service!</p>`,
    });

    return res.json({ success: true, message: "OTP sent!" });
  }

  if (type === "verify-otp") {
    if (global.otpStore?.[email] == otp) {
      return res.json({ success: true, message: "OTP Verified!" });
    } else {
      return res.json({ success: false, message: "Invalid OTP" });
    }
  }

  res.json({ success: false, message: "Unknown action" });
};
