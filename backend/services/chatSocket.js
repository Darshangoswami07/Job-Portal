let io = null;
const onlineUsers = new Set();

export const setChatSocket = (socketIo) => {
  io = socketIo;
};

export const getChatSocket = () => io;

export const setUserOnline = (userId) => {
  onlineUsers.add(String(userId));
};

export const setUserOffline = (userId) => {
  onlineUsers.delete(String(userId));
};

export const isUserOnline = (userId) => onlineUsers.has(String(userId));

export const getOnlineUsers = () => [...onlineUsers];

export const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

export const emitToConversation = (conversationId, event, payload) => {
  if (!io) return;
  io.to(`conversation:${conversationId}`).emit(event, payload);
};

export const emitPresence = (userId, online) => {
  if (!io) return;
  io.to("presence").emit("chat:presence", { userId, online });
};
