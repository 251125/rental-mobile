import { io, Socket } from "socket.io-client";
import { API_URL } from "@/constants";
import { getToken } from "./api";

let socket: Socket | null = null;

export async function getSocket(): Promise<Socket> {
  if (!socket) {
    const token = await getToken();
    socket = io(`${API_URL}/chats`, {
      auth: { token },
      autoConnect: true,
      transports: ["websocket"],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
