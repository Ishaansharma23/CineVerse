const razorpay = require("razorpay");

// refund amount calculate krega
const calculateRefundAmount = async (booking, show) => {
  if (!show || !show.date) {
    return { eligible: false, refundAmount: 0, refundPercentage: 0 };
  }

  const showDateTime = new Date(show.date);
  let hours = 0;
  let minutes = 0;

  if (show.startTime) {
    const parts = String(show.startTime).trim().split(" ");
    const timeParts = parts[0].split(":").map(Number);
    hours = timeParts[0] || 0;
    minutes = timeParts[1] || 0;
    if (parts.length === 2) {
      const modifier = parts[1].toUpperCase();
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
    }
  }

  showDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const difference = showDateTime - now;
  const hoursLeft = difference / (1000 * 60 * 60);

  if (hoursLeft < 2) {
    return {
      eligible: false,
      refundAmount: 0,
      refundPercentage: 0,
      hoursLeft,
    };
  }

  let refundPercentage = 50;
  if (hoursLeft >= 48) {
    refundPercentage = 100;
  } else if (hoursLeft >= 24) {
    refundPercentage = 75;
  }

  const refundAmount = Math.round((booking.totalAmount * refundPercentage) / 100);

  return {
    eligible: true,
    refundAmount,
    refundPercentage,
    hoursLeft,
  };
};

module.exports = {
  calculateRefundAmount,
};

