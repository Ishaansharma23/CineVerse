const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

// Ticket PDF generate karega
const generateTicketPdf = async (booking) => {

  // PDF save kaha hogi
  const filePath = path.join(
    __dirname,
    `../tickets/${booking.bookingId}.pdf`
  );

  // PDF document banao
  const doc = new PDFDocument();

  // PDF ko file me likho
  doc.pipe(fs.createWriteStream(filePath));

  // Heading
  doc
    .fontSize(22)
    .text("🎬 CineVerse Ticket", {
      align: "center",
    });

  doc.moveDown();

  // Booking Details
  doc.fontSize(14);

  doc.text(`Booking ID : ${booking.bookingId}`);

  doc.text(
    `Movie : ${booking.show.movie.title}`
  );

  doc.text(
    `Date : ${booking.show.date.toDateString()}`
  );

  doc.text(
    `Time : ${booking.show.startTime}`
  );

  doc.text(
    `Seats : ${booking.seats.join(", ")}`
  );

  doc.text(
    `Amount : ₹${booking.totalAmount}`
  );

  doc.moveDown();

  // QR Heading
  doc.text("QR Ticket");

  doc.moveDown();

  // Base64 se image banao
  const base64Data =
    booking.ticketQr.replace(
      /^data:image\/png;base64,/,
      ""
    );

  const imageBuffer = Buffer.from(
    base64Data,
    "base64"
  );

  // QR PDF me insert karo
  doc.image(imageBuffer, {
    fit: [180, 180],
    align: "center",
  });

  doc.moveDown();

  doc.text(
    "Please show this ticket at theatre entrance.",
    {
      align: "center",
    }
  );

  // PDF close
  doc.end();

  // PDF ka path return karo
  return filePath;
};

module.exports = {
  generateTicketPdf,
};