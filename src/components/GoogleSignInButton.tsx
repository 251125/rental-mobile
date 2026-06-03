import React, { useEffect, useRef } from "react";
import { Platform, View } from "react-native";
import { useGoogleSignIn } from "@/hooks/use-auth";

type CredentialResponse = { credential: string };
type GsiAPI = {
  accounts: {
    id: {
      initialize: (cfg: {
        client_id: string;
        callback: (resp: CredentialResponse) => void;
        ux_mode?: "popup" | "redirect";
      }) => void;
      renderButton: (container: HTMLElement, options: Record<string, unknown>) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GsiAPI;
  }
}

const SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const CLIENT_ID =
  (process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID as string | undefined) ?? "";

/**
 * Sign in with Google. Web (Expo web) loads Google Identity Services
 * and renders the official button. On native we render nothing for now —
 * a native flow needs platform-specific OAuth client IDs and will be
 * added when we publish a standalone iOS/Android build.
 */
export default function GoogleSignInButton() {
  const ref = useRef<View>(null);
  const { mutate: signIn } = useGoogleSignIn();

  useEffect(() => {
    if (Platform.OS !== "web" || !CLIENT_ID) return;

    const containerEl = ref.current as unknown as HTMLElement | null;
    if (!containerEl) return;

    const ensureScript = () =>
      new Promise<void>((resolve) => {
        if (window.google?.accounts?.id) return resolve();
        const existing = document.querySelector<HTMLScriptElement>(
          `script[src="${SCRIPT_SRC}"]`,
        );
        if (existing) {
          existing.addEventListener("load", () => resolve(), { once: true });
          return;
        }
        const s = document.createElement("script");
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        document.head.appendChild(s);
      });

    let cancelled = false;
    void ensureScript().then(() => {
      if (cancelled || !window.google || !containerEl) return;
      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: (resp) => signIn(resp.credential),
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(containerEl, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: containerEl.clientWidth || 320,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [signIn]);

  if (Platform.OS !== "web" || !CLIENT_ID) return null;
  return <View ref={ref} style={{ alignItems: "center" }} />;
}
