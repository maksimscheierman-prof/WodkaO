import { useEffect, useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import {
  getCardModalDebugEvents,
  getCardModalDebugSnapshot,
  isCardModalDebugOn,
} from "../utils/cardModalDebug";

export default function CardModalDebugOverlay() {
  const [snapshot, setSnapshot] = useState(getCardModalDebugSnapshot());
  const [events, setEvents] = useState(getCardModalDebugEvents());

  useEffect(() => {
    if (!isCardModalDebugOn()) return undefined;
    const id = setInterval(() => {
      setSnapshot(getCardModalDebugSnapshot());
      setEvents(getCardModalDebugEvents());
    }, 400);
    return () => clearInterval(id);
  }, []);

  if (!isCardModalDebugOn()) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 6,
        right: 6,
        bottom: 6,
        maxHeight: 150,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: "rgba(0,0,0,0.82)",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#7fff7f",
        padding: 6,
      }}
    >
      <Text style={{ color: "#7fff7f", fontSize: 10, fontWeight: "bold" }}>
        CARD MODAL DEBUG ({Platform.OS})
      </Text>
      <Text style={{ color: "#fff", fontSize: 9 }}>
        open={String(snapshot.modalOpen)} phase={snapshot.lastPhase || "—"}
      </Text>
      <Text style={{ color: "#fff", fontSize: 9 }} numberOfLines={1}>
        {snapshot.lastTapName || "—"} · {snapshot.lastTapType || "—"}
      </Text>
      <Text style={{ color: "#ccc", fontSize: 8 }} numberOfLines={1}>
        img: {snapshot.lastImageUri || "—"}
      </Text>
      <Text style={{ color: "#ccc", fontSize: 8 }}>
        mode: {snapshot.renderMode || "auto"}
      </Text>
      {snapshot.lastError ? (
        <Text style={{ color: "#ff8a8a", fontSize: 8 }} numberOfLines={2}>
          err: {snapshot.lastError}
        </Text>
      ) : null}
      <ScrollView style={{ maxHeight: 48, marginTop: 2 }}>
        {events.slice(0, 6).map((e) => (
          <Text key={`${e.ts}-${e.phase}`} style={{ color: "#aaa", fontSize: 7 }}>
            {e.phase}
            {e.name ? ` · ${e.name}` : ""}
            {e.error ? ` · ${e.error}` : ""}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
}
