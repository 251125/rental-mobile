import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import api from "@/services/api";
import { getSocket } from "@/services/socket";
import { useAuthStore } from "@/store/auth.store";
import { Chat, Message } from "@/types";

export function useMyChats(enabled = true) {
  return useQuery<Chat[]>({
    queryKey: ["chats"],
    queryFn: () => api.get("/chats").then((r) => r.data),
    enabled,
    refetchInterval: 10000,
  });
}

export function useUnreadCount(enabled = true) {
  return useQuery<number>({
    queryKey: ["chats", "unread"],
    queryFn: () => api.get("/chats/unread-count").then((r) => r.data),
    enabled,
    refetchInterval: 10000,
  });
}

export function useOrCreateChat() {
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<Chat>(`/chats/with/${userId}`).then((r) => r.data),
  });
}

export function useChatMessages(chatId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const joinedRef = useRef(false);

  const { data, isLoading } = useQuery<Message[]>({
    queryKey: ["chats", chatId, "messages"],
    queryFn: () =>
      api.get(`/chats/${chatId}/messages`).then((r) => r.data),
    enabled: !!chatId,
  });

  useEffect(() => {
    if (data) setMessages(data);
  }, [data]);

  useEffect(() => {
    if (!chatId || !user) return;

    let socket: ReturnType<typeof getSocket> | null = null;

    const setup = () => {
      socket = getSocket();

      if (!joinedRef.current) {
        socket.emit("join_chat", chatId);
        joinedRef.current = true;
      }

      const handleNew = (msg: Message) => {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
        );
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        queryClient.invalidateQueries({ queryKey: ["chats", "unread"] });
      };

      socket.on("new_message", handleNew);
    };

    setup();

    return () => {
      if (socket) {
        socket.off("new_message");
        socket.emit("leave_chat", chatId);
        joinedRef.current = false;
      }
    };
  }, [chatId, user, queryClient]);

  const sendMessage = (content: string) => {
    getSocket().emit("send_message", { chatId, content });
  };

  return { messages, isLoading, sendMessage };
}
