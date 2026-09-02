import express from "express";

import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

import supabase from "../config/supabase.js";

const router = express.Router();

/*
====================================================
BOOK STATUS
====================================================
*/

router.get("/status", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const paidOrder = await Order.findOne({
      userId: req.userId,
      status: "paid",
    });

    const hasAccess = user.hasPurchased || !!paidOrder;

    if (paidOrder && !user.hasPurchased) {
      user.hasPurchased = true;
      user.purchaseDate = paidOrder.updatedAt || new Date();
      user.razorpayOrderId = paidOrder.razorpayOrderId;
      user.razorpayPaymentId = paidOrder.razorpayPaymentId;

      await user.save();
    }

    return res.json({
      success: true,
      hasPurchased: hasAccess,
    });
  } catch (error) {
    console.error("BOOK STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to check book access",
    });
  }
});

/*
====================================================
BOOK ACCESS
====================================================
*/

router.get("/access", auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const paidOrder = await Order.findOne({
      userId: req.userId,
      status: "paid",
    });

    const hasAccess = user.hasPurchased || !!paidOrder;

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Book purchase required",
      });
    }

    /*
    ================================================
    CREATE TEMPORARY SUPABASE URL
    ================================================
    */

    const { data, error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .createSignedUrl("book.pdf", 60 * 60);

    if (error) {
      console.error("SUPABASE SIGNED URL ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to access book",
      });
    }

    return res.json({
      success: true,
      url: data.signedUrl,
    });
  } catch (error) {
    console.error("BOOK ACCESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load the book",
    });
  }
});

export default router;
