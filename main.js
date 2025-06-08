require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");



const app = express();
app.use(express.json());
app.use(cors());

const otpStore = {}; // { email: { otp: "123456", expiresAt: timestamp } }

const transporter = nodemailer.createTransport({
  service: "Outlook",
  auth: {
    user: process.env.OUTLOOK_USER,
    pass: process.env.OUTLOOK_PASS,
  },
});

const OTP_EXPIRATION_MINUTES = 5;

// ✅ Send OTP
app.post("/send-otp", (req, res) => {
  const { email } = req.body;

  if (!email) return res.status(400).json({ message: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000;

  otpStore[email] = { otp, expiresAt };

  const mailOptions = {
    from: process.env.OUTLOOK_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}. It will expire in ${OTP_EXPIRATION_MINUTES} minutes.`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
      return res.status(500).json({ message: "Failed to send OTP" });
    }
    console.log(`OTP ${otp} sent to ${email}`);
    res.status(200).json({ message: "OTP sent successfully" });
  });
});

// ✅ Verify OTP
app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp)
    return res.status(400).json({ message: "Email and OTP are required" });

  const storedData = otpStore[email];
  if (!storedData)
    return res.status(400).json({ message: "No OTP found for this email" });

  const { otp: storedOtp, expiresAt } = storedData;

  if (Date.now() > expiresAt) {
    delete otpStore[email]; // Clean up expired OTP
    return res.status(410).json({ message: "OTP has expired" });
  }

  if (storedOtp === otp) {
    delete otpStore[email]; // OTP verified, clear entry
    return res.status(200).json({ message: "OTP verified successfully" });
  } else {
    return res.status(401).json({ message: "Invalid OTP" });
  }
});

// Start Server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
