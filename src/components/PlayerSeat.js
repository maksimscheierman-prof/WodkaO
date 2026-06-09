import { Image, Text, TouchableOpacity, View } from "react-native";
import { getViewingCardLabel } from "../utils/viewingCardText";
import PlayerSilhouette from "./PlayerSilhouette";
import ViewingCardBubble from "./ViewingCardBubble";

const getImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img;
  if (img.uri) return { uri: img.uri };
  if (typeof img === "string") return { uri: img };
  return null;
};

export default function PlayerSeat({
  player,
  cardPosition,
  avatarPosition,
  seatWidth,
  cardWidth,
  cardHeight,
  avatarHeight = 100,
  avatarBlockHeight = 136,
  avatarLabelWidth = 120,
  isCurrentTurn,
  isMe,
  onSelectCard,
  compact = false,
}) {
  if (!player || !cardPosition || !avatarPosition) return null;

  const nameColor = isCurrentTurn ? "#7fff7f" : isMe ? "#ffe08a" : "#fff";
  const fontSize = isCurrentTurn ? (compact ? 12 : 14) : compact ? 11 : 12;
  const bubbleText = !isMe
    ? getViewingCardLabel(player?.viewingCard?.type)
    : null;

  return (
    <>
      {/* Ebene 2: Karten am Tischrand */}
      <View
        style={{
          position: "absolute",
          left: cardPosition.x - seatWidth / 2,
          top: cardPosition.y - cardHeight / 2,
          width: seatWidth,
          alignItems: "center",
          zIndex: 2,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            padding: 3,
            borderRadius: 8,
            backgroundColor: "rgba(0,0,0,0.18)",
          }}
        >
          {player.monster && (
            <TouchableOpacity
              onPress={() =>
                onSelectCard(
                  { ...player.monster, type: "monster" },
                  player.name
                )
              }
            >
              <Image
                source={getImageSource(player.monster.image)}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  marginHorizontal: 2,
                  borderRadius: 4,
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
          {player.trap && (
            <TouchableOpacity
              onPress={() =>
                onSelectCard({ ...player.trap, type: "trap" }, player.name)
              }
            >
              <Image
                source={require("../../assets/images/card_back.png")}
                style={{
                  width: cardWidth,
                  height: cardHeight,
                  marginHorizontal: 2,
                  borderRadius: 4,
                }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Ebene 3: Avatar — tischzugewandte Kante berührt Ellipsenrand */}
      <View
        style={{
          position: "absolute",
          left: avatarPosition.x - avatarLabelWidth / 2,
          top: avatarPosition.y - avatarBlockHeight / 2,
          width: avatarLabelWidth,
          alignItems: "center",
          zIndex: 1,
        }}
      >
        {bubbleText ? (
          <View
            style={{
              position: "absolute",
              bottom: avatarBlockHeight - 12,
              alignItems: "center",
              width: avatarLabelWidth,
            }}
          >
            <ViewingCardBubble
              bubbleText={bubbleText}
              startedAt={player.viewingCard?.startedAt}
              compact={compact}
            />
          </View>
        ) : null}

        <PlayerSilhouette
          name={player.name}
          isCurrentTurn={isCurrentTurn}
          isMe={isMe}
          height={avatarHeight}
        />
        <Text
          style={{
            color: nameColor,
            fontSize,
            fontWeight: isCurrentTurn ? "bold" : "600",
            marginTop: 2,
            textAlign: "center",
          }}
          numberOfLines={1}
        >
          {player.name}
          {isMe ? " (Du)" : ""}
        </Text>
        {isCurrentTurn && (
          <Text style={{ color: "#7fff7f", fontSize: 10, marginTop: 2 }}>
            am Zug
          </Text>
        )}
      </View>
    </>
  );
}
