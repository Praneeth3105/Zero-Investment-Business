import express from "express";
import jwt from "jsonwebtoken";
import { Resend } from "resend";

import User from "../models/User.js";
import { generateOTP } from "../utils/otp.js";

const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);

/*
====================================================
SEND OTP
====================================================
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

    /*
    ==================================================
    FIND OR CREATE USER
    ==================================================
    */

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

    /*
    ==================================================
    GENERATE OTP
    ==================================================
    */

    const otp = generateOTP();

    user.otp = otp;

    user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    await user.save();

    console.log("OTP generated for:", normalizedEmail);

    /*
    ==================================================
    SEND EMAIL USING RESEND
    ==================================================
    */

    const { data, error } = await resend.emails.send({
      from: "0% Investment Business <onboarding@resend.dev>",
      to: [normalizedEmail],
      subject: "Your 0% Investment Business Login OTP",
      html: `
        <div
          style="
            font-family: Arial, sans-serif;
            padding: 30px;
            max-width: 600px;
            margin: auto;
          "
        >

          <h2>0% Investment Business</h2>

          <p>Your login verification code is:</p>

          <h1
            style="
              letter-spacing: 8px;
              font-size: 36px;
            "
          >
            ${otp}
          </h1>

          <p>
            This OTP expires in 10 minutes.
          </p>

          <p>
            If you did not request this OTP, you can safely ignore this email.
          </p>

        </div>
      `,
    });

    /*
    ==================================================
    HANDLE RESEND ERROR
    ==================================================
    */

    if (error) {
      console.error("RESEND EMAIL ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email",
      });
    }

    console.log("OTP email sent successfully.");
    console.log("Resend email ID:", data?.id);

    /*
    ==================================================
    SUCCESS
    ==================================================
    */

    return res.json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("SEND OTP ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
});

/*
====================================================
VERIFY OTP
====================================================
*/

router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        message: "Email and OTP are required",
      });
    }

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

    /*
    ==================================================
    CLEAR OTP
    ==================================================
    */

    user.otp = null;
    user.otpExpires = null;

    await user.save();

    /*
    ==================================================
    CREATE JWT
    ==================================================
    */

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    /*
    ==================================================
    RESPONSE
    ==================================================
    */

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
