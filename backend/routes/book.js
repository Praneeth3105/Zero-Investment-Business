import express from "express";
import fs from "fs";
import path from "path";

import User from "../models/User.js";
import Order from "../models/Order.js";

import auth from "../middleware/auth.js";

const router = express.Router();

/*
====================================================
CHECK BOOK STATUS
====================================================

This checks BOTH:

1. users.hasPurchased
2. orders.status === "paid"

So an already-paid customer will get access even
if hasPurchased was not updated correctly.
*/

router.get("/status", auth, async (req, res) => {
  try {
    console.log("\n========== BOOK STATUS ==========");

    console.log("User ID:", req.userId);

    const user = await User.findById(req.userId);

    if (!user) {
      console.log("User not found");

      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /*
      Find a successful paid order
      belonging to this user
      */

    const paidOrder = await Order.findOne({
      userId: req.userId,

      status: "paid",
    }).sort({
      createdAt: -1,
    });

    const hasPaidOrder = !!paidOrder;

    /*
      Access is granted if either
      condition is true.
      */

    const hasAccess = user.hasPurchased === true || hasPaidOrder;

    /*
      Synchronize the user document.

      This fixes users whose payment succeeded
      but hasPurchased was not updated.
      */

    if (hasPaidOrder && user.hasPurchased !== true) {
      user.hasPurchased = true;

      user.purchaseDate = paidOrder.createdAt || new Date();

      user.razorpayOrderId = paidOrder.razorpayOrderId;

      user.razorpayPaymentId = paidOrder.razorpayPaymentId;

      await user.save();

      console.log("User purchase status synchronized.");
    }

    console.log("Email:", user.email);

    console.log("User hasPurchased:", user.hasPurchased);

    console.log("Paid order:", hasPaidOrder);

    console.log("Final access:", hasAccess);

    res.json({
      success: true,

      hasPurchased: hasAccess,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        phone: user.phone,

        hasPurchased: hasAccess,
      },

      purchase: hasPaidOrder
        ? {
            orderId: paidOrder.razorpayOrderId,

            paymentId: paidOrder.razorpayPaymentId,

            amount: paidOrder.amount,

            currency: paidOrder.currency,

            purchasedAt: paidOrder.createdAt,
          }
        : null,
    });
  } catch (error) {
    console.error("BOOK STATUS ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Unable to check book access",
    });
  }
});

/*
====================================================
SECURE BOOK ACCESS
====================================================

The original PDF stays inside:

backend/private/book.pdf

It is NOT publicly exposed.
*/

router.get("/access", auth, async (req, res) => {
  try {
    console.log("\n========== BOOK ACCESS ==========");

    console.log("User ID:", req.userId);

    /*
      Find user
      */

    const user = await User.findById(req.userId);

    if (!user) {
      console.log("User not found");

      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    /*
      Check user's paid orders
      */

    const paidOrder = await Order.findOne({
      userId: req.userId,

      status: "paid",
    }).sort({
      createdAt: -1,
    });

    const hasAccess = user.hasPurchased === true || !!paidOrder;

    console.log("Email:", user.email);

    console.log("User hasPurchased:", user.hasPurchased);

    console.log("Paid order:", !!paidOrder);

    console.log("Final access:", hasAccess);

    /*
      Deny access
      */

    if (!hasAccess) {
      console.log("ACCESS DENIED");

      return res.status(403).json({
        success: false,

        message: "You have not purchased this book",
      });
    }

    /*
      PDF location
      */

    const bookPath = path.join(process.cwd(), "private", "book.pdf");

    console.log("Book path:", bookPath);

    /*
      Check if PDF exists
      */

    if (!fs.existsSync(bookPath)) {
      console.log("PDF NOT FOUND");

      return res.status(404).json({
        success: false,

        message: "Book PDF not found on server",
      });
    }

    /*
      Get file information
      */

    const stats = fs.statSync(bookPath);

    console.log("PDF size:", stats.size, "bytes");

    if (stats.size <= 0) {
      return res.status(500).json({
        success: false,

        message: "Book PDF is empty",
      });
    }

    /*
      Security headers
      */

    res.setHeader("Content-Type", "application/pdf");

    res.setHeader("Content-Disposition", 'inline; filename="book.pdf"');

    res.setHeader("Content-Length", stats.size);

    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private",
    );

    res.setHeader("Pragma", "no-cache");

    res.setHeader("Expires", "0");

    res.setHeader("X-Content-Type-Options", "nosniff");

    /*
      Send PDF
      */

    const stream = fs.createReadStream(bookPath);

    stream.on("error", (error) => {
      console.error("PDF STREAM ERROR:", error);
    });

    console.log("SUCCESS: Sending PDF");

    stream.pipe(res);
  } catch (error) {
    console.error("BOOK ACCESS ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Unable to load book",

      error: error.message,
    });
  }
});

export default router;
