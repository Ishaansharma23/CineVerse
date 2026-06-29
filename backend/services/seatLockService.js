const { redisClient } = require("../config/redis");

// Seat ko temporarily lock karo
const lockSeat = async (showId, seatNumber, userId) => {

    // Har show aur seat ki unique Redis key
    const key = `seat:${showId}:${seatNumber}`;

    // Sirf tab lock karo jab seat pehle se locked na ho
    const result = await redisClient.set(
        key,
        userId,
        {
            NX: true, // Agar key already exist karti hai toh set mt kro
            EX: 300, // 5 minutes expiry time
        }
    );

    return result === "OK";
};

// ab seat unlock (jab payment fail hojayue, user cancel krde)
const unlockSeat = async (showId, seatNumber) => {
    // redis key banaio
    const key = `seat:${showId}:${seatNumber}`;
    // seat ko unlock krdo
    await redisClient.del(key);
}

// Check karo seat locked hai ya nahi
const isSeatLocked = async (showId, seatNumber) => {

    // Redis key
    const key = `seat:${showId}:${seatNumber}`;

    // Redis se value lao
    const result = await redisClient.get(key);

    return result;
};

module.exports = {
    lockSeat,
    unlockSeat,
    isSeatLocked,
};