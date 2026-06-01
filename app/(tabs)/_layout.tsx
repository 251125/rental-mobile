import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/store/auth.store";
import { COLORS } from "@/constants";
import { useUnreadCount } from "@/hooks/use-chats";
import { useIncomingRentalsCount } from "@/hooks/use-rentals";
import { Text } from "react-native";

function TabBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <Text
      style={{
        position: "absolute",
        top: -4,
        right: -8,
        backgroundColor: COLORS.danger,
        color: "#fff",
        fontSize: 10,
        fontWeight: "700",
        borderRadius: 8,
        paddingHorizontal: 4,
        paddingVertical: 1,
        minWidth: 16,
        textAlign: "center",
      }}
    >
      {count > 99 ? "99+" : count}
    </Text>
  );
}

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();
  const { data: unreadCount = 0 } = useUnreadCount(isAuthenticated);
  const { data: incomingCount = 0 } = useIncomingRentalsCount();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          paddingTop: 4,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          marginBottom: 0,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Избранное",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Чаты",
          tabBarIcon: ({ color, size, focused }) => (
            <>
              <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={size}
                color={color}
              />
              <TabBadge count={unreadCount} />
            </>
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: "Карта",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: "Кошелёк",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, size }) => (
            <>
              <Ionicons name="person-outline" size={size} color={color} />
              <TabBadge count={incomingCount} />
            </>
          ),
        }}
      />
    </Tabs>
  );
}
