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


const getGenreTagline = (genreData) => {
  const genreStr = Array.isArray(genreData) ? genreData.join(" ") : String(genreData || "");
  const lower = genreStr.toLowerCase();

  if (lower.includes("romance") || lower.includes("romantic")) {
    return { hero: "❤️ Your perfect movie date is waiting." };
  }
  if (lower.includes("comedy")) {
    return { hero: "😂 The laughs haven't started without you." };
  }
  if (lower.includes("horror") || lower.includes("thriller")) {
    return { hero: "👻 Something scary is waiting..." };
  }
  if (lower.includes("action") || lower.includes("adventure")) {
    return { hero: "🔥 Action starts soon." };
  }
  if (lower.includes("sci-fi") || lower.includes("science fiction") || lower.includes("fantasy")) {
    return { hero: "🚀 Your journey through another universe begins shortly." };
  }
  return { hero: "🎬 Don't let your movie night slip away!" };
};

 // Send Abandoned Booking Reminder Email

const sendAbandonedBookingReminderEmail = async (booking) => {
  const userEmail = booking.user?.email;
  const userName = booking.user?.name || "Movie Lover";
  const movieTitle = booking.show?.movie?.title || "Movie";
  const theatreName = booking.show?.screen?.theatre?.name || "CineVerse Multiplex";
  const showDate = booking.show?.date ? new Date(booking.show.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : "";
  const showTime = booking.show?.startTime || "";
  const seatsList = Array.isArray(booking.seats) ? booking.seats.join(", ") : "";

  // Poster Image URL
  let posterUrl = "";
  if (booking.show?.movie?.posterPath) {
    posterUrl = booking.show.movie.posterPath.startsWith("http")
      ? booking.show.movie.posterPath
      : `https://image.tmdb.org/t/p/w500${booking.show.movie.posterPath}`;
  }

  // Genre tagline
  const genreTagline = getGenreTagline(booking.show?.movie?.genre);

  // Frontend URL link
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const checkoutUrl = `${frontendUrl}/checkout?bookingId=${booking._id}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>CineVerse Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0A0A0A; padding: 40px 16px;">
        <tr>
          <td align="center">
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #171717; border: 1px solid #262626; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.8);">
              
              <!-- Brand Header -->
              <tr>
                <td style="padding: 32px 32px 16px 32px; text-align: center;">
                  <div style="font-size: 26px; font-weight: 900; color: #FFFFFF; letter-spacing: -0.5px;">
                    🎬 Cine<span style="color: #E11D48;">Verse</span>
                  </div>
                </td>
              </tr>

              <!-- Hero Header -->
              <tr>
                <td style="padding: 0 32px; text-align: center;">
                  <h1 style="color: #FFFFFF; font-size: 22px; font-weight: 800; margin: 8px 0 12px 0; line-height: 1.3;">
                    ${genreTagline.hero}
                  </h1>
                  <p style="color: #A3A3A3; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0;">
                    Hi <strong style="color: #FFFFFF;">${userName}</strong>,<br>
                    You were just one step away from enjoying <strong style="color: #E11D48;">${movieTitle}</strong>. We've safely reserved your seats for a little longer, but they'll be released soon if payment isn't completed.
                  </p>
                </td>
              </tr>

              <!-- Movie Details Card -->
              <tr>
                <td style="padding: 0 32px 24px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #262626; border-radius: 12px; padding: 20px;">
                    <tr>
                      ${posterUrl ? `
                      <td width="90" valign="top" style="padding-right: 16px;">
                        <img src="${posterUrl}" alt="${movieTitle}" width="90" style="border-radius: 8px; display: block; object-fit: cover;" />
                      </td>
                      ` : ''}
                      <td valign="top">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #A3A3A3;">
                              🎥 <strong style="color: #E5E5E5;">Movie:</strong> <span style="color: #FFFFFF; font-weight: 600;">${movieTitle}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #A3A3A3;">
                              📍 <strong style="color: #E5E5E5;">Theatre:</strong> ${theatreName}
                            </td>
                          </tr>
                          ${showDate ? `
                          <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #A3A3A3;">
                              🗓 <strong style="color: #E5E5E5;">Date:</strong> ${showDate}
                            </td>
                          </tr>
                          ` : ''}
                          ${showTime ? `
                          <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #A3A3A3;">
                              ⏰ <strong style="color: #E5E5E5;">Time:</strong> ${showTime}
                            </td>
                          </tr>
                          ` : ''}
                          <tr>
                            <td style="padding: 4px 0; font-size: 13px; color: #A3A3A3;">
                              💺 <strong style="color: #E5E5E5;">Seats:</strong> <span style="color: #E11D48; font-weight: 700;">${seatsList}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0 0 0; font-size: 14px; color: #A3A3A3;">
                              💳 <strong style="color: #E5E5E5;">Amount:</strong> <span style="color: #10B981; font-weight: 800; font-size: 16px;">₹${booking.totalAmount}</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Urgency Warning Box -->
              <tr>
                <td style="padding: 0 32px 24px 32px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: rgba(225, 29, 72, 0.1); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 12px; padding: 16px; text-align: center;">
                    <tr>
                      <td>
                        <div style="color: #F43F5E; font-weight: 800; font-size: 14px; margin-bottom: 4px;">
                          ⏳ Hurry!
                        </div>
                        <div style="color: #D4D4D4; font-size: 13px; line-height: 1.5;">
                          Your reserved seats will be released very soon.<br>Complete your payment before someone else books them.
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- CTA Button -->
              <tr>
                <td style="padding: 0 32px 32px 32px; text-align: center;">
                  <a href="${checkoutUrl}" style="display: inline-block; background-color: #E11D48; color: #FFFFFF; font-weight: 800; font-size: 15px; padding: 16px 36px; border-radius: 9999px; text-decoration: none; box-shadow: 0 10px 25px -5px rgba(225, 29, 72, 0.5); letter-spacing: 0.3px;">
                    🍿 Resume Payment
                  </a>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: #121212; border-top: 1px solid #262626; padding: 24px 32px; text-align: center;">
                  <p style="color: #737373; font-size: 12px; margin: 0 0 8px 0;">
                    Need help? Our support team is always here for you.
                  </p>
                  <p style="color: #E5E5E5; font-weight: 700; font-size: 13px; margin: 0 0 4px 0;">
                    See you soon at CineVerse 🍿
                  </p>
                  <p style="color: #525252; font-size: 11px; font-style: italic; margin: 0;">
                    Lights. Camera. Action.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: userEmail,
    subject: "🍿 Your movie night is waiting...",
    html,
  });
};

module.exports = {
  sendTicketEmail,
  sendRefundEmail,
  sendAbandonedBookingReminderEmail,
};
