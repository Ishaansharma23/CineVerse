const QRCode = require("qrcode");

// Ticket QR generate karega
const generateTicketQr = async (booking) => {
  // QR ke andar kya data store karna hai
  // Abhi sirf bookingId hi rakhte hain
  // Baad me aur fields bhi add kar sakte hain

  const qrData = JSON.stringify({
    // object directly encode nahi hota. Isliye object ko string banate hain.
    bookingId: booking.bookingId,
  movie: booking.show.movie.title,
  date: booking.show.date,
  time: booking.show.startTime,
  seats: booking.seats,
  });

  // QR Image Base64 format me generate hogi
  // Example:
  // data:image/png;base64,iVBORw0KGgoAAA...

  const qrImage = await QRCode.toDataURL(qrData);
  //ye PNG file nahi banati. y string yani url return krti jo frontend pr dalenge to qr show kregi

  // Generated QR return karo
  return qrImage;
};

module.exports = {
  generateTicketQr,
};
