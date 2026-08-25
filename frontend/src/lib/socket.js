import { io } from "socket.io-client";
import { BACKEND_URL } from "@/utils/constant";

let socket = null;
let connectedToken = null;

export function connectSocket(token) {
  if (!token) return null;
  if (socket && connectedToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  connectedToken = token;
  socket = io(BACKEND_URL, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
    connectedToken = null;
  }
}

export function getSocket() {
  return socket;
}
