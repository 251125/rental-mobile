import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/constants";
import { getToken } from "./api";

let socket: Socket | null = null;

export function getSocket(): Socket {
  // socket.active is true while connected or mid-reconnect
  if (socket && (socket.connected || socket.active)) {
    return socket;
  }
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = io(`${SOCKET_URL}/chats`, {
    // auth as callback: evaluated on every connection attempt (including reconnects)
    // so it always picks up the latest token after a silent refresh
    auth: (cb) => { void getToken().then((token) => cb({ token })); },
    autoConnect: true,
    transports: ["websocket"],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
