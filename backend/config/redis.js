const { createClient } = require('redis');


// Mere backend ke liye Redis se baat karne wala client(object) bana do.
const redisClient = createClient({
    url : process.env.REDIS_URL,
});

// Ab is client ko Redis server se connect bhi kar do."
// Redis se connection establish hone par ye event chalega.
redisClient.on("connect", () => {
    console.log("Redis Connected");
});

redisClient.on("error", (error) => {
    console.log("Redis Error:", error);
});

const connectRedis = async () => {
    await redisClient.connect();
};

module.exports = {
    redisClient,
    connectRedis,
};