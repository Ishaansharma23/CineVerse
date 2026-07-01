let io;

// Socket.io initialize
const initSocket = (socketIo) => {
  io = socketIo;
};

// Kahin se bhi io chahiye ho
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }

  return io;
};

module.exports = {
  initSocket,
  getIO,
};