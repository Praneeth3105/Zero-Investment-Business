import express from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

import User from "../models/User.js";
import { generateOTP } from "../utils/otp.js";

const router = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/*
SEND OTP
*/
router.post("/send-otp", async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !email) {
      return res.status(400).json({
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
        phone,
      });
    } else {
      user.name = name;

      if (phone) {
        user.phone = phone;
      }

      await user.save();
    }

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Your 0% Investment Business Login OTP",
      html: `
        <div style="font-family:Arial;padding:30px">

          <h2>0% Investment Business</h2>

          <p>Your login verification code is:</p>

          <h1 style="letter-spacing:8px">
            ${otp}
          </h1>

          <p>
            This OTP expires in 10 minutes.
          </p>

        </div>
      `,
    });

    res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to send OTP",
    });
  }
});

/*
VERIFY OTP
*/
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    });

    if (!user) {
      return res.status(404).json({
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

    res.json({
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
    console.error(error);

    res.status(500).json({
      message: "OTP verification failed",
    });
  }
});

export default router;
