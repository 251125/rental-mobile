import { useEffect, useRef, useState } from "react";
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
import { CallProvider } from "@/providers/CallProvider";
import { NotificationsProvider } from "@/providers/NotificationsProvider";
import CallOverlay from "@/components/CallOverlay";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const triedRef = useRef(false);
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    if (triedRef.current) return;
    triedRef.current = true;

    const init = async () => {
      try {
        // Always probe /users/me. The api interceptor will:
        //   - attach the saved access_token if present
        //   - silently refresh via /auth/refresh on 401 (using the
        //     refresh_token stored in SecureStore)
        //   - retry the original request
        // For a true guest the call fails fast and we just stay logged out.
        const user = await api.get("/users/me").then((r) => r.data);
        const fresh = await getToken();
        if (fresh) await setAuth(user, fresh);
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
          <NotificationsProvider>
          <CallProvider>
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
              name="rentals/scan/[token]"
              options={{ headerShown: true, title: "Оплата аренды" }}
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
              name="profile/edit"
              options={{ headerShown: true, title: "Редактировать профиль" }}
            />
            <Stack.Screen
              name="chats/[id]"
              options={{ headerShown: true, title: "Чат" }}
            />
            <Stack.Screen
              name="admin/index"
              options={{ headerShown: true, title: "Администрирование" }}
            />
            <Stack.Screen
              name="profile/change-password"
              options={{ headerShown: true, title: "Смена пароля" }}
            />
            <Stack.Screen
              name="compare"
              options={{ headerShown: true, title: "Сравнение" }}
            />
          </Stack>
          <CallOverlay />
          </CallProvider>
          </NotificationsProvider>
        </AuthInitializer>
        <Toast visibilityTime={3000} topOffset={60} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
