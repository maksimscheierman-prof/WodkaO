import { Text, View } from "react-native";

function getInitial(name) {
  const trimmed = (name || "?").trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

/**
 * Stilisierte sitzende Person: Kopf, Schultern, Oberkörper (~80–110 px).
 * Kein Asset, kein Emoji.
 */
export default function PlayerSilhouette({
  name,
  isCurrentTurn,
  isMe,
  height = 100,
}) {
  const initial = getInitial(name);
  const scale = height / 100;

  const headSize = Math.round(34 * scale);
  const shoulderW = Math.round(68 * scale);
  const shoulderH = Math.round(14 * scale);
  const torsoW = Math.round(46 * scale);
  const torsoH = Math.round(42 * scale);

  const skin = isMe ? "#6a6a7e" : "#5a5a6e";
  const body = isMe ? "#353545" : "#2d2d3d";
  const shoulder = isMe ? "#404050" : "#383848";

  const glow = isCurrentTurn
    ? {
        shadowColor: "#7fff7f",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 14,
        elevation: 8,
      }
    : {};

  return (
    <View
      style={[
        {
          alignItems: "center",
          height,
          justifyContent: "flex-end",
          paddingBottom: 2,
        },
        glow,
      ]}
    >
      {/* Kopf */}
      <View
        style={{
          width: headSize,
          height: headSize,
          borderRadius: headSize / 2,
          backgroundColor: skin,
          marginBottom: -shoulderH * 0.35,
          zIndex: 3,
          borderWidth: isCurrentTurn ? 2 : 0,
          borderColor: "#7fff7f",
        }}
      />

      {/* Schultern */}
      <View
        style={{
          width: shoulderW,
          height: shoulderH,
          borderTopLeftRadius: shoulderW * 0.35,
          borderTopRightRadius: shoulderW * 0.35,
          backgroundColor: shoulder,
          marginBottom: -4,
          zIndex: 2,
        }}
      />

      {/* Oberkörper */}
      <View
        style={{
          width: torsoW,
          height: torsoH,
          borderBottomLeftRadius: torsoW * 0.2,
          borderBottomRightRadius: torsoW * 0.2,
          backgroundColor: body,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <Text
          style={{
            color: "#D9C9A3",
            fontSize: Math.round(14 * scale),
            fontWeight: "bold",
          }}
        >
          {initial}
        </Text>
      </View>
    </View>
  );
}
