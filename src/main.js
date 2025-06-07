import { Client } from 'node-appwrite';
import nodemailer from 'nodemailer';

export async function main(context) {
  try {
    const body = JSON.parse(context.req.bodyRaw);
    const receiverEmail = body.email;

    if (!receiverEmail) {
      return context.res.send({ success: false, error: "Email not provided" }, 400);
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in logs or database here (optional, based on your design)

    // Create Outlook transporter
    const transporter = nodemailer.createTransport({
      service: 'Outlook',
      auth: {
        user: process.env.OUTLOOK_EMAIL,      // e.g. yourname@outlook.com
        pass: process.env.OUTLOOK_PASS,   // your app password or actual password
      }
    });

    const mailOptions = {
      from: `"Your App Name" <${process.env.OUTLOOK_EMAIL}>`,
      to: receiverEmail,
      subject: "Welcome! Here's your OTP",
      html: `<h2>Welcome to our service!</h2><p>Your OTP is: <b>${otp}</b></p>`
    };

    const mailResponse = await transporter.sendMail(mailOptions);

    return context.res.send({
      success: true,
      message: "OTP sent successfully!",
      otp, // You can remove this in production
      response: mailResponse
    }, 200);
  } catch (error) {
    return context.res.send({
      success: false,
      error: error.message
    }, 500);
  }
}
