const Booking = require("../models/bookings");
const Payment = require("../models/Payment");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const { completeBookingPayment } = require("../services/paymentService");
const { unlockSeat } = require("../services/seatLockService");
const { getIO } = require("../config/socket");


// Sirf existing booking ke liye payment start karta hai. Booking exist karti? YES Pending hai? YES Razorpay Order Create

// ab razorpay order create kro
const createOrder = async (req, res) => {
  try {
    // Frontend se MongoDB booking _id lo
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking Id is required",
      });
    }

    // Booking database se fetch karo
    const booking = await Booking.findById(bookingId);

    // Booking exist nahi karti
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check karo booking isi logged-in user ki hai ya nahi
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access this booking",
      });
    }

    // Sirf pending booking ki payment allow hogi
    if (
      booking.paymentStatus !== "pending" ||
      booking.bookingStatus !== "pending"
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking is no longer available for payment",
      });
    }

    let finalAmount = booking.totalAmount;
    if (req.body.promoCode) {
      const Offer = require("../models/Offer");
      const offer = await Offer.findOne({ code: req.body.promoCode.toUpperCase(), isActive: true });
      if (offer && finalAmount >= offer.minPurchase) {
        let discount = 0;
        if (offer.discountType === "flat") {
          discount = offer.discountValue;
        } else if (offer.discountType === "percentage") {
          discount = Math.round((finalAmount * offer.discountValue) / 100);
        }
        const finalDiscount = Math.min(discount, finalAmount);
        finalAmount = finalAmount - finalDiscount;
        booking.totalAmount = finalAmount;
      }
    }

    // Razorpay order create karo, orders-> generate krta random order id by razorpay itself ( as a string )
    const order = await razorpay.orders.create({
      // Razorpay amount paisa me leta hai
      amount: finalAmount * 100,

      currency: "INR",

      // Hamara internal booking reference, reference numb hota
      receipt: booking.bookingId, // Ye payment meri booking CV-1001 ke liye hai.
    });

    // Jo Order ID Razorpay ne generate ki hai, usko meri MongoDB booking ke saath link kar do.
    booking.orderId = order.id; // iske bad ram m object bn jata

    await booking.save(); // fir mongodb m save

    // Create a new Payment record in MongoDB
    await Payment.create({
      booking: booking._id,
      user: req.user._id,
      amount: finalAmount,
      razorpayOrderId: order.id,
      status: "pending",
    });

    // Frontend ko order details bhejo
    res.status(200).json({
      success: true,
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    console.log("Error creating order:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};


// ** -> Ye payment asli hai? y chekc kr rha jo bheji h details razorpay n hi bheji n postman pr kisi n to nhi 
// Hum payment verify nahi kar rahe.
// Hum Razorpay ke RESPONSE ko verify kar rahe hain.
// Ye payment success ka response sach me Razorpay ne bheja hai ya kisi ne fake request bheji hai?
const verifyPayment = async (req, res) => {
  try {
    // frontend s details lo
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    // Order id se booking find karo
    const booking = await Booking.findOne({
      orderId: razorpay_order_id,
    });

    // Booking nahi mili
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Payment already ho chuki
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already verified",
      });
    }

    // Backend apni signature generate karega
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Signature match nahi hui
    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

     await completeBookingPayment( booking, razorpay_payment_id, razorpay_signature,);

    // Update corresponding Payment document
    await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: "captured",
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      booking,
    });
  } catch (error) {
    console.log("Error verifying payment:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

// Razorpay -> Entire Request Body + Webhook Secret + Signature
const razorpayWebhook = async (req, res) => {
  try {
    // Razorpay request bhejta hai. Wo signature HTTP Header me bhejta hai
    // Header → Signature
    // Body → Event + Payment Data

    // Razorpay ki webhook signature
    const webhookSignature = req.headers["x-razorpay-signature"];

    // Raw request body, Ye normal JSON nahi hai. actually Buffer type ka hota
    const body = req.body; // Body me actual payment data hota hai.

    // Backend apni webhook signature generate karega
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    // Signature verify
    if (generatedSignature !== webhookSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    // ** Buffer = Raw binary data (bytes) jo network se aata hai.
    // Hum webhook me Buffer isliye use karte hain kyunki signature original bytes par hi generate hoti hai.
    // Agar pehle JSON bana diya jaye, to original data change ho sakta hai aur signature verify nahi hogi.

    // Buffer ko JSON object me convert karo
    const event = JSON.parse(body.toString());

    // PAYMENT SUCCESS

    // Sirf payment.captured event process karenge, webhook bht events bhejta jaise payment.failed, refund.created
    if (event.event === "payment.captured") { //Payment successfully complete. Captured = Paise successfully merchant (tumhare account) ke liye collect ho gaye.

      // Payment details nikalo
      const payment = event.payload.payment.entity; //Ye actual payment object hai. entity, Ye payment wali information hai. - payment

      // Booking find karo
      const booking = await Booking.findOne({
        orderId: payment.order_id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

     // Fir duplicate webhook handle karo: Razorpay kabhi-kabhi same webhook dobara bhej sakta hai.
      if (booking.paymentStatus === "paid") {
        return res.status(200).json({
          success: true,
          message: "Payment already processed",
        });
      }

      // Common payment complete service call
      await completeBookingPayment(
        booking,
        payment.id,
        webhookSignature
      );

      // Update corresponding Payment document
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          razorpaySignature: webhookSignature,
          status: "captured",
          rawWebhookPayload: event,
        },
        { new: true, upsert: true } // use upsert: true in case the document wasn't created yet
      );

      return res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
      });
    }

    // PAYMENT FAILED

    if (event.event === "payment.failed") { // Konsa webhook aaya? -> event batata(payment.captured , failed)
      // payload = actual data or uske andr payment object , uske andr entiti yani -> Original payment ki details. 

      // Payment details nikalo
      const payment = event.payload.payment.entity; // | upr dekh likha h iske 2 line upr 

      // Booking find karo
      const booking = await Booking.findOne({
        orderId: payment.order_id,
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found",
        });
      }

      // Agar payment pehle hi successful ho gayi thi to ignore
      if (booking.paymentStatus === "paid") {
        return res.status(200).json({
          success: true,
          message: "Payment already completed",
        });
      }

      // Booking failed mark karo
      booking.paymentStatus = "failed";
      booking.bookingStatus = "failed";

      // MongoDB save
      await booking.save();

      // Update corresponding Payment document
      await Payment.findOneAndUpdate(
        { razorpayOrderId: payment.order_id },
        {
          razorpayPaymentId: payment.id,
          status: "failed",
          rawWebhookPayload: event,
        },
        { new: true, upsert: true }
      );

      // Redis locks hatao
      for (const seat of booking.seats) {
        await unlockSeat(
          booking.show.toString(),
          seat
        );
      }

      // Frontend ko realtime update bhejo
      const io = getIO();

      io.to(booking.show.toString()).emit(
        "seat-unlocked",
        {
          showId: booking.show,
          seats: booking.seats,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Payment failed handled",
      });
    }

    // ==========================================================
    // Baaki saare webhook events ignore
    // ==========================================================

    return res.status(200).json({
      success: true,
      message: "Event ignored",
    });

  } catch (error) {
    console.log("Webhook Error:", error);

    res.status(500).json({
      success: false,
      message: "Webhook failed",
    });
  }
};


module.exports = { createOrder, verifyPayment , razorpayWebhook };
