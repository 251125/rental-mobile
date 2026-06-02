import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

export default function QrScannerScreen() {
  const t = useT();
  const navigation = useNavigation();
  const containerRef = useRef<View>(null);
  const [status, setStatus] = useState<"scanning" | "error" | "found">("scanning");
  const [errorMsg, setErrorMsg] = useState("");
  const stopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    navigation.setOptions({ headerTitle: t("Profile.scanTitle") });
  }, [navigation]);

  const handleFound = useCallback((data: string) => {
    stopRef.current?.();
    const match = data.match(/\/rentals\/scan\/([a-zA-Z0-9-]+)/);
    if (match) {
      setStatus("found");
      router.replace(`/rentals/scan/${match[1]}` as never);
    } else {
      setStatus("error");
      setErrorMsg(t("Profile.scanInvalidQr"));
      setTimeout(() => setStatus("scanning"), 2000);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current as unknown as HTMLDivElement | null;
    if (!container) return;

    let stopped = false;
    let stream: MediaStream | null = null;
    let animFrame: number | null = null;

    const video = document.createElement("video");
    video.setAttribute("playsinline", "true");
    video.setAttribute("muted", "true");
    video.setAttribute("autoplay", "true");
    Object.assign(video.style, {
      width: "100%",
      height: "100%",
      objectFit: "cover",
    });

    const canvas = document.createElement("canvas");
    canvas.style.display = "none";

    container.appendChild(video);
    container.appendChild(canvas);

    const stop = () => {
      stopped = true;
      if (animFrame) cancelAnimationFrame(animFrame);
      stream?.getTracks().forEach((t) => t.stop());
    };
    stopRef.current = stop;

    const scanFrame = async () => {
      if (stopped) return;
      if (video.readyState >= 2) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx && canvas.width > 0) {
          ctx.drawImage(video, 0, 0);
          try {
            if ("BarcodeDetector" in window) {
              const bd = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
              const codes: { rawValue: string }[] = await bd.detect(canvas);
              if (codes.length > 0 && codes[0].rawValue) {
                handleFound(codes[0].rawValue);
                return;
              }
            } else {
              const jsQR = (await import("jsqr")).default;
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);
              if (code?.data) {
                handleFound(code.data);
                return;
              }
            }
          } catch {
            // continue scanning
          }
        }
      }
      if (!stopped) animFrame = requestAnimationFrame(scanFrame);
    };

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } } })
      .then((s) => {
        if (stopped) { s.getTracks().forEach((t) => t.stop()); return; }
        stream = s;
        video.srcObject = s;
        video.play().then(() => {
          animFrame = requestAnimationFrame(scanFrame);
        });
      })
      .catch(() => {
        if (!stopped) {
          setStatus("error");
          setErrorMsg(t("Profile.scanNoCameraAccess"));
        }
      });

    return stop;
  }, [handleFound]);

  return (
    <View style={styles.container}>
      <View ref={containerRef} style={styles.cameraBox} />

      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
        <Text style={styles.hint}>
          {status === "error"
            ? errorMsg
            : status === "found"
            ? "QR-код считан!"
            : t("Profile.scanPointCamera")}
        </Text>
      </View>

      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const CORNER = 24;
const BORDER = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  cameraBox: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  scanFrame: {
    width: 240,
    height: 240,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: COLORS.white,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: BORDER, borderLeftWidth: BORDER },
  cornerTR: { top: 0, right: 0, borderTopWidth: BORDER, borderRightWidth: BORDER },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: BORDER, borderLeftWidth: BORDER },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: BORDER, borderRightWidth: BORDER },
  hint: {
    marginTop: 20,
    color: COLORS.white,
    fontSize: 14,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  closeBtn: {
    position: "absolute",
    top: 52,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
  },
});
