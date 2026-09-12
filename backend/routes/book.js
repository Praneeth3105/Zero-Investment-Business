import express from "express";

import auth from "../middleware/auth.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

import supabase from "../config/supabase.js";

const router = express.Router();

/* =========================================================
   CHECK BOOK PURCHASE STATUS
   ========================================================= */

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

/* =========================================================
   GET BOOK PAGE
   =========================================================
   
   Example:
   
   /api/book/page/1
   /api/book/page/2
   ...
   /api/book/page/28

   The original PDF is NEVER sent to the browser.
   ========================================================= */

router.get("/page/:pageNumber", auth, async (req, res) => {
  try {
    const pageNumber = Number(req.params.pageNumber);

    /* -----------------------------------------------------
       VALIDATE PAGE NUMBER
       ----------------------------------------------------- */

    if (!Number.isInteger(pageNumber) || pageNumber < 1 || pageNumber > 28) {
      return res.status(400).json({
        success: false,
        message: "Invalid page number",
      });
    }

    /* -----------------------------------------------------
       FIND USER
       ----------------------------------------------------- */

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /* -----------------------------------------------------
       CHECK PURCHASE
       ----------------------------------------------------- */

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

    /* -----------------------------------------------------
       UPDATE USER PURCHASE STATUS IF NEEDED
       ----------------------------------------------------- */

    if (paidOrder && !user.hasPurchased) {
      user.hasPurchased = true;
      user.purchaseDate = paidOrder.updatedAt || new Date();
      user.razorpayOrderId = paidOrder.razorpayOrderId;
      user.razorpayPaymentId = paidOrder.razorpayPaymentId;

      await user.save();
    }

    /* -----------------------------------------------------
       CREATE SUPABASE FILE PATH
       ----------------------------------------------------- */

   const fileName = `page-${String(pageNumber).padStart(3, "0")}.jpg`;

   const filePath = fileName;

   console.log(`Loading book page ${pageNumber}: ${filePath}`);

   const { data, error } = await supabase.storage
     .from(process.env.SUPABASE_PAGES_BUCKET)
     .download(filePath);

    if (error) {
      console.error("SUPABASE PAGE DOWNLOAD ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load book page",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Book page not found",
      });
    }

 

    const arrayBuffer = await data.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);

  

    res.set({
      "Content-Type": "image/jpeg",

      "Content-Length": buffer.length,

      // Show in browser, don't force download
      "Content-Disposition": "inline",

      // Don't cache protected book pages
      "Cache-Control": "private, no-store, no-cache, must-revalidate",

      Pragma: "no-cache",

      Expires: "0",
    });

    return res.send(buffer);
  } catch (error) {
    console.error("BOOK PAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load book page",
    });
  }
});

export default router;
