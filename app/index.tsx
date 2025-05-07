import { Redirect } from "expo-router";
import { useAuthStore } from "@/store/auth.store";

export default function RootIndex() {
  const { isAuthenticated } = useAuthStore();
  return <Redirect href={isAuthenticated ? ("/(tabs)" as any) : "/auth/login"} />;
}
