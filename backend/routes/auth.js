import express from "express";
import jwt from "jsonwebtoken";
import { google } from "googleapis";

import User from "../models/User.js";
import { generateOTP } from "../utils/otp.js";

const router = express.Router();

/*
  Gmail API configuration
  These values must be stored in Render Environment Variables.
*/
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  "http://localhost:3000/oauth2callback",
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const gmail = google.gmail({
  version: "v1",
  auth: oauth2Client,
});

/*
  Create Gmail message
*/
const createEmailMessage = ({ to, subject, html }) => {
  const message = [
    `From: 0% Investment Business <${process.env.GMAIL_SENDER}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
  ].join("\r\n");

  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/*
  SEND OTP
*/
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      user = await User.create({
        name,
        email: normalizedEmail,
        phone: phone || "",
      });
    } else {
      user.name = name;

      if (phone) {
        user.phone = phone;
      }

      await user.save();
    }

    /*
      Generate OTP
    */
    const otp = generateOTP();

    user.otp = otp;
    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    console.log("OTP generated for:", normalizedEmail);

    /*
      Create email
    */
    const html = `
      <div style="
        font-family: Arial, sans-serif;
        padding: 30px;
        max-width: 600px;
        margin: auto;
        background: #ffffff;
      ">

        <h2 style="margin-bottom: 20px;">
          0% Investment Business
        </h2>

        <p>
          Hello ${name},
        </p>

        <p>
          Your login verification code is:
        </p>

        <h1 style="
          letter-spacing: 8px;
          font-size: 36px;
          margin: 20px 0;
        ">
          ${otp}
        </h1>

        <p>
          This OTP expires in 10 minutes.
        </p>

        <p>
          If you did not request this OTP, you can safely ignore this email.
        </p>

        <p style="margin-top: 30px;">
          Regards,<br>
          0% Investment Business
        </p>

      </div>
    `;

    const rawMessage = createEmailMessage({
      to: normalizedEmail,
      subject: "Your 0% Investment Business Login OTP",
      html,
    });

    /*
      Send email using Gmail API
    */
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: rawMessage,
      },
    });

    console.log("OTP email sent successfully.");
    console.log("Gmail message ID:", result.data.id);

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(
      "GMAIL OTP ERROR:",
      error.response?.data || error.message || error,
    );

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP email",
    });
  }
});

/*
  VERIFY OTP
*/
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      !user.otp ||
      user.otp !== otp ||
      !user.otpExpires ||
      user.otpExpires < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    user.otp = null;
    user.otpExpires = null;

    await user.save();

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        hasPurchased: user.hasPurchased,
      },
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "OTP verification failed",
    });
  }
});

export default router;
