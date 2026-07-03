const razorpay = require("razorpay");

// refund amount calculate krega
const calculateRefundAmount = async (booking, show) => {
  // show start time , new Date("2026-07-15") -> ab isme dekh time nahi hai to wahi set krna hia ,  automatic
  // 00:00:00 ye time maan leta hai js new Date wale usme
  const showDateTime = new Date(show.date); // isme start date + date hum combine krke ek usme store kr re

  // HH:MM m split
  const [hours, minutes] = show.startTime.split(":"); // start time ko

  showDateTime.setHours(hours);
  showDateTime.setMinutes(minutes);

  // current date or time nikalo
  const now = new Date(); // isme date time month milisencds seconds sb ayenge obj m

  // ab show or currnt time k bich ka diff nikalo
  // Example
  // 18:30 - 16:00
  //
  // Result
  // 2.5 hours (milliseconds me)
  const difference = showDateTime - now; // startring point leta hia y kuch fir diff milliseconcds m ata hia 
  // bht bda number hota ha ye 

  // ab miliseconds ko hours m convert kro 
   const hoursLeft = difference / (1000 * 60 * 60);
   // we know 1 hr = 3600000 milliseconds


// Agar show start hone me
  // 2 ghante se kam bache hain
  //
  // Refund allow nahi hoga
  if (hoursLeft < 2) {

    return {
      eligible: false,
      refundAmount: 0,
      refundPercentage: 0,
    };
  }

  //   // Default refund percentage
  let refundPercentage = 0;


  // Agar 48 ghante ya usse zyada bache hain
  //
  // 100% refund
  if (hoursLeft >= 48) {

    refundPercentage = 100;

  }

  // Agar 24 se 48 ghante ke beech hai
  //
  // 75% refund
  else if (hoursLeft >= 24) {

    refundPercentage = 75;

  }

  // Agar 2 se 24 ghante ke beech hai
  //
  // 50% refund
  else {

    refundPercentage = 50;

  }
  
  // Final refund amount nikalo
  //
  // Example
  // totalAmount = 500
  //
  // refundPercentage = 75
  //
  // refundAmount = 375
  const refundAmount =
    (booking.totalAmount * refundPercentage) / 100;


  // Final result return karo
  return {

    // Refund milega
    eligible: true,

    // Kitna percentage refund milega
    refundPercentage,

    // Kitna paisa refund hoga
    refundAmount,

  };
};

