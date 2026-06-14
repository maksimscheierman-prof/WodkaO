import { Text, View } from "react-native";
import {
  formatSeatNameLine,
  formatSeatStatus,
} from "../utils/playerSeatCore";

/**
 * Single player name + optional status line (no duplicate layers).
 */
export default function PlayerNameLabel({
  name,
  isMe = false,
  isCurrentTurn = false,
  isStartPlayer = false,
  maxWidth = 120,
  compact = false,
}) {
  const nameLine = formatSeatNameLine(name, isMe);
  const statusLine = formatSeatStatus({ isCurrentTurn, isStartPlayer });
  const nameColor = isCurrentTurn ? "#7fff7f" : isMe ? "#ffe08a" : "#fff";
  const fontSize = isCurrentTurn ? (compact ? 12 : 14) : compact ? 11 : 12;

  return (
    <View
      style={{
        width: maxWidth,
        alignItems: "center",
        marginTop: 4,
        minHeight: statusLine ? 34 : 18,
      }}
    >
      <Text
        style={{
          color: nameColor,
          fontSize,
          fontWeight: isCurrentTurn ? "700" : "600",
          textAlign: "center",
          width: maxWidth,
          includeFontPadding: false,
        }}
        numberOfLines={1}
        ellipsizeMode="tail"
      >
        {nameLine}
      </Text>
      {statusLine ? (
        <Text
          style={{
            color: isCurrentTurn ? "#7fff7f" : "#ffe08a",
            fontSize: compact ? 9 : 10,
            marginTop: 2,
            textAlign: "center",
            includeFontPadding: false,
          }}
          numberOfLines={1}
        >
          {statusLine}
        </Text>
      ) : null}
    </View>
  );
}
