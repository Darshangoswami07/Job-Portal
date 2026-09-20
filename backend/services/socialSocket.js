let io = null;

export const setSocialSocket = (socketIo) => {
  io = socketIo;
};

export const getSocialSocket = () => io;

export const emitToSocialUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToSocialRoom = (room, event, payload) => {
  if (!io) return;
  io.to(room).emit(event, payload);
};