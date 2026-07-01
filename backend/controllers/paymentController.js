const Booking = require("../models/bookings");
const razorpay = require("../config/razorpay");
const crypto = require("crypto");
const { completeBookingPayment } = require("../services/paymentService");

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

    // Razorpay order create karo, orders-> generate krta random order id by razorpay itself ( as a string )
    const order = await razorpay.orders.create({
      // Razorpay amount paisa me leta hai
      amount: booking.totalAmount * 100,

      currency: "INR",

      // Hamara internal booking reference, reference numb hota
      receipt: booking.bookingId, // Ye payment meri booking CV-1001 ke liye hai.
    });

    // Jo Order ID Razorpay ne generate ki hai, usko meri MongoDB booking ke saath link kar do.
    booking.orderId = order.id; // iske bad ram m object bn jata

    await booking.save(); // fir mongodb m save

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
    const body = req.body;// Body me actual payment data hota hai.

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


    // ** Buffer = Raw binary data (bytes) jo network se aata hai. Hum webhook me Buffer isliye
    //  use karte hain kyunki signature original bytes par hi generate hoti hai.
    //  Agar pehle JSON bana diya jaye, to original data change ho sakta hai aur signature verify nahi hogi.
    // Buffer ko JSON object me convert karo, body buffer thi

const event = JSON.parse(body.toString());

// Sirf payment.captured event process karenge, webhook bht events bhejta jaise payment.failed, refund.created
if (event.event !== "payment.captured") { //Payment successfully complete. Captured = Paise successfully merchant (tumhare account) ke liye collect ho gaye.
  return res.status(200).json({
    success: true,
    message: "Event ignored",
  });
}

// Payment details nikalo , (Razorpay kis event ki notification bhej raha hai?) - event
const payment = event.payload.payment.entity; // Ye actual payment object hai. entity, Ye payment wali information hai. - payment


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
await completeBookingPayment(
  booking,
  payment.id,
  webhookSignature
);

return res.status(200).json({
  success: true,
  message: "Webhook processed successfully",
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
