import { useEffect } from "react";
import { io, Socket } from "socket.io-client";
import Toast from "react-native-toast-message";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/auth.store";
import { SOCKET_URL } from "@/constants";
import { getToken } from "@/services/api";
import { getSocket } from "@/services/socket";
import { useNotificationsStore } from "@/store/notifications.store";

let notifSocket: Socket | null = null;

interface ChatMessagePayload {
  chatId: string;
  message: {
    sender_id: string;
    content: string;
    sender: { name: string };
  };
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const queryClient = useQueryClient();
  const increment = useNotificationsStore((s) => s.increment);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (notifSocket) {
        notifSocket.disconnect();
        notifSocket = null;
      }
      return;
    }

    notifSocket = io(SOCKET_URL, {
      path: "/ws-notifications",
      auth: (cb) => {
        void getToken().then((token) => cb({ token }));
      },
      transports: ["websocket"],
    });

    notifSocket.on("rental_status_changed", (data: { message: string }) => {
      Toast.show({ type: "info", text1: "Изменение статуса", text2: data.message });
      increment();
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    });

    notifSocket.on("payment_received", (data: { message: string }) => {
      Toast.show({ type: "success", text1: "Оплата получена", text2: data.message });
      increment();
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    });

    notifSocket.on("payment_made", (data: { message: string }) => {
      Toast.show({ type: "info", text1: "Оплата прошла", text2: data.message });
      increment();
      void queryClient.invalidateQueries({ queryKey: ["wallet"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
    });

    notifSocket.on("incoming_rental", (data: { message: string }) => {
      Toast.show({ type: "info", text1: "Новая заявка", text2: data.message });
      increment();
      void queryClient.invalidateQueries({ queryKey: ["rentals", "incoming"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "incoming", "count"] });
    });

    // Eagerly open chats socket for global chat_updated events
    const chatsSocket = getSocket();
    const handleChatUpdated = (data: ChatMessagePayload) => {
      const me = useAuthStore.getState().user?.id;
      void queryClient.invalidateQueries({ queryKey: ["chats"] });
      void queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });
      if (data.message.sender_id === me) return;
      Toast.show({
        type: "info",
        text1: data.message.sender.name,
        text2: data.message.content.slice(0, 80),
      });
    };
    const handleChatRead = () => {
      // Server confirmed messages read — drop badges instantly
      void queryClient.invalidateQueries({ queryKey: ["chats"] });
      void queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });
    };
    chatsSocket.on("chat_updated", handleChatUpdated);
    chatsSocket.on("chat_read", handleChatRead);

    return () => {
      chatsSocket.off("chat_updated", handleChatUpdated);
      chatsSocket.off("chat_read", handleChatRead);
      notifSocket?.disconnect();
      notifSocket = null;
    };
  }, [isAuthenticated, user, queryClient]);

  return <>{children}</>;
}
