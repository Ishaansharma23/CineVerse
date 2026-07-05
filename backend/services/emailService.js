const nodemailer = require("nodemailer");

// * createTransport - > Ye SMTP server ki configuration + transporter object banata hai.

// Mail bhejne ke liye transporter banate hain.
// Transporter = Mail bhejne wali machine.
//
// Jaise browser HTTP request bhejta hai,
// waise hi transporter SMTP server ke through
// email send karta hai.
const transporter = nodemailer.createTransport({
  // Gmail SMTP use karenge
  service: "gmail",

  // Gmail account jis se mail jayegi, Ye SMTP connection ke liye login credentials hain.
  // Google App Password ka passsword
  auth: {
    // Sender email
    user: process.env.EMAIL_USER,

    // Google App Password
    // (Normal Gmail password nahi hota)
    pass: process.env.EMAIL_PASS,
  },
});

// Ticket email send karega
const sendTicketEmail = async (userEmail, booking, pdfPath) => {
  // Mail send karo
  await transporter.sendMail({
    // Kis email se jayegi
    from: process.env.EMAIL_USER,

    // Kisko bhejni hai
    to: userEmail,

    // Subject line
    subject: "🎟 CineVerse Ticket",

    attachments: [
      {
        filename: `${booking.bookingId}.pdf`,
        path: pdfPath,
        contentType: "application/pdf",
      },
    ],

    // HTML Mail
    html: `

      <h2>Booking Confirmed</h2>

      <p><b>Booking ID:</b> ${booking.bookingId}</p>

      <p><b>Movie:</b> ${booking.show.movie.title}</p>

      <p><b>Date:</b> ${booking.show.date}</p>

      <p><b>Time:</b> ${booking.show.startTime}</p>

      <p><b>Seats:</b> ${booking.seats.join(", ")}</p>

      <br>

      <!-- QR Image -->
      <img
        src="${booking.ticketQr}"
        width="220"
      />

      <br>

      <p>
        Please show this QR code at the theatre entrance.
      </p>

    `,
  });
};

const sendRefundEmail = async (userEmail, booking) => {
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "💸 CineVerse Ticket Cancellation & Refund Confirmed",
    html: `
      <h2>Ticket Cancelled Successfully</h2>
      <p>Dear Customer,</p>
      <p>Your ticket booking has been successfully cancelled and your refund has been processed.</p>
      <hr />
      <p><b>Booking ID:</b> ${booking.bookingId}</p>
      <p><b>Movie:</b> ${booking.show?.movie?.title || 'Movie'}</p>
      <p><b>Show Date & Time:</b> ${new Date(booking.show?.date).toLocaleDateString()} | ${booking.show?.startTime || ''}</p>
      <p><b>Cancelled Seats:</b> ${booking.seats.join(", ")}</p>
      <p><b>Total Booking Cost:</b> ₹${booking.totalAmount}</p>
      <p><b>Refund Amount Credited:</b> ₹${booking.refundAmount} (${booking.refundPercentage || 100}% refund percentage)</p>
      <br />
      <p>The refund amount will be credited back to your original source payment method. Standard refunds take 5 to 7 business days to reflect in your account.</p>
      <p>Thank you for choosing CineVerse!</p>
    `,
  });
};

module.exports = {
  sendTicketEmail,
  sendRefundEmail,
};
