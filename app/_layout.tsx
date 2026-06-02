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
import { useLocaleStore } from "@/store/locale.store";
import { useT } from "@/i18n/useT";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const triedRef = useRef(false);
  const { setAuth, logout } = useAuthStore();
  const hydrateLocale = useLocaleStore((s) => s.hydrate);

  useEffect(() => {
    if (triedRef.current) return;
    triedRef.current = true;

    const init = async () => {
      try {
        await hydrateLocale();
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

function AppStack() {
  const t = useT();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen
        name="listings/[id]"
        options={{ headerShown: true, title: t("Listing.detail") }}
      />
      <Stack.Screen
        name="listings/create"
        options={{ headerShown: true, title: t("Listing.createTitle") }}
      />
      <Stack.Screen
        name="listings/edit/[id]"
        options={{ headerShown: true, title: t("Listing.editTitle") }}
      />
      <Stack.Screen
        name="rentals/my"
        options={{ headerShown: true, title: t("Rental.myRentals") }}
      />
      <Stack.Screen
        name="rentals/incoming"
        options={{ headerShown: true, title: t("Rental.incoming") }}
      />
      <Stack.Screen
        name="rentals/scan/[token]"
        options={{ headerShown: true, title: t("Rental.qrTitle") }}
      />
      <Stack.Screen
        name="profile/[id]"
        options={{ headerShown: true, title: t("Profile.title") }}
      />
      <Stack.Screen
        name="profile/my-listings"
        options={{ headerShown: true, title: t("Nav.myListings") }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{ headerShown: true, title: t("Profile.edit") }}
      />
      <Stack.Screen
        name="profile/language"
        options={{ headerShown: true, title: t("Locale.title") }}
      />
      <Stack.Screen
        name="chats/[id]"
        options={{ headerShown: true, title: t("Chat.title") }}
      />
      <Stack.Screen
        name="admin/index"
        options={{ headerShown: true, title: t("Nav.admin") }}
      />
      <Stack.Screen
        name="admin/disputes"
        options={{ headerShown: true, title: t("Dispute.myTitle") }}
      />
      <Stack.Screen
        name="admin/finance"
        options={{ headerShown: true, title: t("Wallet.title") }}
      />
      <Stack.Screen
        name="profile/change-password"
        options={{ headerShown: true, title: t("Profile.changePassword") }}
      />
      <Stack.Screen
        name="profile/blocked"
        options={{ headerShown: true, title: t("Nav.blocked") }}
      />
      <Stack.Screen
        name="disputes"
        options={{ headerShown: true, title: t("Dispute.myTitle") }}
      />
      <Stack.Screen
        name="about"
        options={{ headerShown: true, title: t("About.title") }}
      />
      <Stack.Screen
        name="compare"
        options={{ headerShown: true, title: t("Compare.title") }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <AuthInitializer>
          <NotificationsProvider>
          <CallProvider>
          <AppStack />
          <CallOverlay />
          </CallProvider>
          </NotificationsProvider>
        </AuthInitializer>
        <Toast visibilityTime={3000} topOffset={60} />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
