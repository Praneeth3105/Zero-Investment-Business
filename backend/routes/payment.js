import express from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = express.Router();

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error("Razorpay environment variables are missing.");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,

  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post("/create-order", auth, async (req, res) => {
  try {

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }
    const existingPaidOrder = await Order.findOne({
      userId: req.userId,

      status: "paid",
    });


    if (user.hasPurchased === true || existingPaidOrder) {
      console.log("DUPLICATE PURCHASE BLOCKED:", user.email);


      if (existingPaidOrder && user.hasPurchased !== true) {
        user.hasPurchased = true;
        user.purchaseDate = existingPaidOrder.createdAt;
        user.razorpayOrderId = existingPaidOrder.razorpayOrderId;
        user.razorpayPaymentId = existingPaidOrder.razorpayPaymentId;
        await user.save();
      }

      return res.status(409).json({
        success: false,

        alreadyPurchased: true,

        message: "You have already purchased this book.",
      });
    }

    const amount = Number(process.env.BOOK_PRICE || 9900);

    const currency = process.env.BOOK_CURRENCY || "INR";

    const razorpayOrder = await razorpay.orders.create({
      amount: amount,

      currency: currency,

      receipt: `book_${Date.now()}`,
    });


    const order = new Order({
      userId: req.userId,

      razorpayOrderId: razorpayOrder.id,

      amount: amount,

      currency: currency,

      status: "created",
    });

    await order.save();

    console.log("Razorpay order created:", razorpayOrder.id);

    console.log("Customer:", user.email);

    res.json({
      success: true,

      orderId: razorpayOrder.id,

      amount: amount,

      currency: currency,

      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Unable to create payment order",

      error: error.message,
    });
  }
});


router.post("/verify", auth, async (req, res) => {
  try {
    const {
      razorpay_order_id,

      razorpay_payment_id,

      razorpay_signature,
    } = req.body;


    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,

        message: "Missing Razorpay payment details",
      });
    }


    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");


    if (generatedSignature !== razorpay_signature) {
      console.log("INVALID RAZORPAY SIGNATURE");

      return res.status(400).json({
        success: false,

        message: "Payment verification failed",
      });
    }

    const order = await Order.findOne({
      razorpayOrderId: razorpay_order_id,

      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,

        message: "Order not found",
      });
    }


    if (order.status === "paid") {
      return res.json({
        success: true,

        message: "Payment already verified",

        orderId: razorpay_order_id,

        paymentId: order.razorpayPaymentId,

        hasPurchased: true,
      });
    }


    order.status = "paid";

    order.razorpayPaymentId = razorpay_payment_id;

    await order.save();
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,

        message: "User not found",
      });
    }

    user.hasPurchased = true;
    user.purchaseDate = new Date();
    user.razorpayOrderId = razorpay_order_id;
    user.razorpayPaymentId = razorpay_payment_id;
    await user.save();

    console.log("\n================================");
    console.log("PAYMENT VERIFIED SUCCESSFULLY");
    console.log("================================");
    console.log("Customer:", user.email);
    console.log("Order:", razorpay_order_id);
    console.log("Payment:", razorpay_payment_id);
    console.log("Status:", order.status);
    console.log("Book Access:", user.hasPurchased);
    console.log("================================\n");

    res.json({
      success: true,

      message: "Payment verified successfully",

      orderId: razorpay_order_id,

      paymentId: razorpay_payment_id,

      hasPurchased: true,
    });
  } catch (error) {
    console.error("PAYMENT VERIFY ERROR:", error);

    res.status(500).json({
      success: false,

      message: "Unable to verify payment",

      error: error.message,
    });
  }
});

export default router;
