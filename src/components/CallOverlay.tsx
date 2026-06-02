import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Image,
  Animated,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useCall } from "@/providers/CallProvider";
import { COLORS } from "@/constants";
import { useT } from "@/i18n/useT";

function useTimer(startTime?: number) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startTime) { setElapsed(0); return; }
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const s = (elapsed % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export default function CallOverlay() {
  const t = useT();
  const { callState, acceptCall, rejectCall, endCall, toggleMute, localStreamRef, remoteVideoRef, remoteStreamRef } = useCall();
  const timer = useTimer(callState.startTime);
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const [avatarError, setAvatarError] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoElRef = useRef<HTMLVideoElement | null>(null);

  // Attach streams when video elements mount (status becomes active)
  useEffect(() => {
    if (Platform.OS !== "web" || !callState.isVideo || callState.status !== "active") return;
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      localVideoRef.current.play().catch(() => {});
    }
    if (remoteVideoElRef.current) {
      remoteVideoRef.current = remoteVideoElRef.current;
      if (remoteStreamRef.current) {
        remoteVideoElRef.current.srcObject = remoteStreamRef.current;
        remoteVideoElRef.current.play().catch(() => {});
      }
    }
    return () => { remoteVideoRef.current = null; };
  }, [callState.isVideo, callState.status, localStreamRef, remoteStreamRef, remoteVideoRef]);

  useEffect(() => {
    setAvatarError(false);
  }, [callState.peerAvatar]);

  useEffect(() => {
    if (callState.status === "incoming" || callState.status === "outgoing") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [callState.status, pulseAnim]);

  if (callState.status === "idle") return null;

  const { status, peerName, peerAvatar, isMuted, isVideo } = callState;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={[styles.card, isVideo && Platform.OS === "web" && styles.cardVideo]}>
          {/* Video section for video calls */}
          {isVideo && Platform.OS === "web" && status === "active" && (
            <View style={styles.videoContainer}>
              {React.createElement("video", {
                ref: remoteVideoElRef,
                autoPlay: true,
                playsInline: true,
                style: {
                  width: "100%",
                  height: "240px",
                  objectFit: "cover",
                  backgroundColor: "#000",
                  borderRadius: "12px 12px 0 0",
                },
              })}
              {React.createElement("video", {
                ref: localVideoRef,
                autoPlay: true,
                playsInline: true,
                muted: true,
                style: {
                  position: "absolute",
                  bottom: "8px",
                  right: "8px",
                  width: "80px",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: "2px solid #fff",
                },
              })}
            </View>
          )}
          {/* Blue top section */}
          <View style={styles.top}>
            {peerAvatar && !avatarError ? (
              <Image
                source={{ uri: peerAvatar }}
                style={styles.avatar}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>{peerName.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <Text style={styles.peerName}>{peerName}</Text>
            <Text style={styles.statusText}>
              {status === "incoming" && t("Chat.incomingCall")}
              {status === "outgoing" && t("Chat.outgoingCall")}
              {status === "active" && timer}
            </Text>

            {(status === "incoming" || status === "outgoing") && (
              <View style={styles.dots}>
                {[0, 1, 2].map((i) => (
                  <View key={i} style={[styles.dot, { opacity: 0.5 + (i * 0.2) }]} />
                ))}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {status === "incoming" ? (
              <>
                <View style={styles.actionItem}>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={rejectCall}>
                    <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>{t("Chat.callReject")}</Text>
                </View>
                <View style={styles.actionItem}>
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={acceptCall}>
                      <Ionicons name="call" size={28} color="#fff" />
                    </TouchableOpacity>
                  </Animated.View>
                  <Text style={styles.actionLabel}>{t("Chat.callAccept")}</Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.actionItem}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.muteBtn, isMuted && styles.muteBtnActive]}
                    onPress={toggleMute}
                  >
                    <Ionicons name={isMuted ? "mic-off" : "mic"} size={24} color={isMuted ? COLORS.danger : COLORS.text} />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>{isMuted ? t("Chat.micOn") : t("Chat.micOff")}</Text>
                </View>
                <View style={styles.actionItem}>
                  <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={endCall}>
                    <Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: "135deg" }] }} />
                  </TouchableOpacity>
                  <Text style={styles.actionLabel}>{t("Chat.hangup")}</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 28,
    width: "100%",
    maxWidth: 340,
    overflow: "hidden",
  },
  cardVideo: {
    maxWidth: 360,
  },
  videoContainer: {
    position: "relative",
    width: "100%",
    height: 240,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 0,
  },
  top: {
    backgroundColor: "#1d4ed8",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 40,
    gap: 10,
  },
  avatar: { width: 96, height: 96, borderRadius: 48, borderWidth: 3, borderColor: "rgba(255,255,255,0.3)" },
  avatarFallback: { backgroundColor: "#2563eb", justifyContent: "center", alignItems: "center" },
  avatarLetter: { fontSize: 36, fontWeight: "800", color: "#fff" },
  peerName: { fontSize: 22, fontWeight: "700", color: "#fff" },
  statusText: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
  dots: { flexDirection: "row", gap: 6, marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },

  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 28,
    paddingHorizontal: 20,
    backgroundColor: "#f8fafc",
  },
  actionItem: { alignItems: "center", gap: 8 },
  actionBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  acceptBtn: { backgroundColor: "#22c55e" },
  rejectBtn: { backgroundColor: "#ef4444" },
  muteBtn: { backgroundColor: "#e2e8f0" },
  muteBtnActive: { backgroundColor: "#fee2e2" },
  actionLabel: { fontSize: 12, color: COLORS.muted },
});
