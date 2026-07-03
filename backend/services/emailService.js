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

module.exports = {
  sendTicketEmail,
};
