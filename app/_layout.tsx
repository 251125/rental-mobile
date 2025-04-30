import { useEffect } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth" />
          <Stack.Screen
            name="listings/[id]"
            options={{ headerShown: true, title: "Объявление" }}
          />
          <Stack.Screen
            name="listings/create"
            options={{ headerShown: true, title: "Новое объявление" }}
          />
          <Stack.Screen
            name="listings/edit/[id]"
            options={{ headerShown: true, title: "Редактировать" }}
          />
          <Stack.Screen
            name="rentals/my"
            options={{ headerShown: true, title: "Мои аренды" }}
          />
          <Stack.Screen
            name="rentals/incoming"
            options={{ headerShown: true, title: "Входящие заявки" }}
          />
          <Stack.Screen
            name="profile/[id]"
            options={{ headerShown: true, title: "Профиль" }}
          />
          <Stack.Screen
            name="profile/my-listings"
            options={{ headerShown: true, title: "Мои объявления" }}
          />
          <Stack.Screen
            name="chats/[id]"
            options={{ headerShown: true, title: "Чат" }}
          />
          <Stack.Screen
            name="admin/index"
            options={{ headerShown: true, title: "Администрирование" }}
          />
        </Stack>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
