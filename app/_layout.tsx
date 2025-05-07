import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "@/store/auth.store";
import { getToken } from "@/services/api";
import api from "@/services/api";
import { COLORS } from "@/constants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const init = async () => {
      try {
        const token = await getToken();
        if (token) {
          const user = await api.get("/users/me").then((r) => r.data);
          await setAuth(user, token);
        }
      } catch {
        await logout();
      } finally {
        setReady(true);
      }
    };
    void init();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthInitializer>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
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
        </AuthInitializer>
        <Toast />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
