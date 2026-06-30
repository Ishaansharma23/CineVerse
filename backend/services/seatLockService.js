const { redisClient } = require("../config/redis");

// Seat ko temporarily lock karo
const lockSeat = async (showId, seatNumber, userId) => {
  // Har show aur seat ki unique Redis key
  const key = `seat:${showId}:${seatNumber}`;

  //(((((OWNER SHIP CHECK )))))
  // Pehle check karo seat Redis me already locked hai ya nahi.
  // Agar locked hai to kis user ne lock ki hai wo bhi pata chalega.
  // Kyuki SET NX sirf ye batata hai ki key create hui ya nahi,
  // lekin existing lock ka owner kaun hai ye nahi batata.
  const existingLock = await redisClient.get(key);

  // Agar seat already locked hai
  if (existingLock) {
    // Redis se JSON object ko normal object me convert karo, as redis rtring store krta
    const lockData = JSON.parse(existingLock);

    // Agar current user ne hi seat lock ki hui hai
    if (lockData.userId === userId.toString()) {
      return {
        success: true,
        alreadyOwned: true,
      };
    }

    // Kisi aur user ne lock ki hui hai
    return {
      success: false,
      lockedByAnotherUser: true,
    };
  }

  // Redis me store hone wala data
  const seatLockData = {
    userId: userId.toString(),
    lockedAt: new Date(),
  };

  // Sirf tab lock karo jab seat pehle se locked na ho
  const result = await redisClient.set(key, JSON.stringify(seatLockData), {
    NX: true,
    EX: 300, // 5 Minutes
  });

  // Seat successfully lock ho gayi
  if (result === "OK") {
    return {
      success: true,
      alreadyOwned: false,
    };
  }

  // Kisi aur ne isi time lock kar li
  return {
    success: false,
    lockedByAnotherUser: true,
  };
};

// Seat unlock karo
const unlockSeat = async (showId, seatNumber) => {
  // Redis key
  const key = `seat:${showId}:${seatNumber}`;

  // Redis se key delete kar do
  await redisClient.del(key);
};

// Ye sirf ek particular seat ka Redis lock status check karta hai.
// Sirf A5 locked hai ya nahi, aur agar hai to kis user ne lock ki hai
const isSeatLocked = async (showId, seatNumber) => {
  // Redis key
  const key = `seat:${showId}:${seatNumber}`;

  // Redis se value lao
  const result = await redisClient.get(key);

  // Agar seat locked hi nahi hai
  if (!result) {
    return null;
  }

  // JSON ko object me convert karke return karo
  return JSON.parse(result);
};

// Ye poore show ki saari locked seats btayega , 1 show ki jitni seats locked horkhi
const getLockedSeats = async (showId) => {
  // Is show ki saari seat keys ka pattern
  const pattern = `seat:${showId}:*`; // * mtlb jo b showid hai us naam ki jitni seats locked h wo de

  // Cursor SCAN ke liye -> states Main thoda-thoda data dunga. as wrna redis busy hojayega bht sara 10lakh hui toh
  let cursor = "0"; // cursor use hota hai ki ab yha se utha rha hu , next time isse aage se utha

  // Locked seats store karne ke liye
  const lockedSeats = [];

  do {
    // SCAN ->. "Database scan karo." iska mtlb ye hota hai
    // Redis me matching keys scan karo, cursor s start kr yani 0 se
    const reply = await redisClient.scan(cursor, {
      MATCH: pattern, // Sirf pattern wali keys do. jonsi showId ki mangi h
      COUNT: 100, // Ek baar me lagbhag 100 keys dene ki koshish karo. , not exact 100 hi do, 110 b de skta kbi
    });

    // Redis ne jo next cursor diya hai usse next SCAN continue hoga.
    // Cursor "last count" nahi hota, ye Redis ka internal scan position hota hai.
    cursor = reply.cursor;

    // Jo keys mili yani showid or seat ke naam ki
    const keys = reply.keys;

    // Har key se seat number nikalo
    for (const key of keys) {
      // seat:show123:A5
      // Split karne ke baad ["seat","show123","A5"]
      const seatNumber = key.split(":")[2];

      lockedSeats.push(seatNumber); // locked seats array me store krta
    }
  } while (cursor !== "0"); // Jab Redis cursor dobara "0" return karega, iska matlab poora scan complete ho gaya.

  return lockedSeats;
};
module.exports = {
  lockSeat,
  unlockSeat,
  isSeatLocked,
  getLockedSeats,
};
