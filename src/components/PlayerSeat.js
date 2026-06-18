import { Alert, Image, TouchableOpacity, View } from "react-native";
import {
  getMonsterPressLog,
  getNativeImageSourceFromCard,
  isValidPlayableCard,
  normalizeCardForDisplay,
} from "../utils/cardDisplay";
import { getViewingCardLabel } from "../utils/viewingCardText";
import PlayerNameLabel from "./PlayerNameLabel";
import PlayerSilhouette from "./PlayerSilhouette";
import ViewingCardBubble from "./ViewingCardBubble";

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
  isStartPlayer = false,
  isMe,
  onSelectCard,
  compact = false,
}) {
  if (!player || !cardPosition || !avatarPosition) return null;

  const bubbleText = !isMe
    ? getViewingCardLabel(player?.viewingCard?.type)
    : null;

  const openSeatCard = (rawCard, cardType) => {
    const defaultType = cardType === "trap" ? "trap" : "monster";
    const pressLog = getMonsterPressLog(rawCard, {
      defaultType,
      playerKey: player.id || player.name,
      playerName: player.name,
    });
    console.log(
      cardType === "monster" ? "[MONSTER PRESS]" : "[TRAP PRESS]",
      pressLog
    );

    if (!isValidPlayableCard(rawCard, { defaultType })) {
      console.warn("[CARD PRESS] Invalid card", pressLog);
      Alert.alert(
        "Karte nicht verfügbar",
        "Diese Karte konnte nicht geladen werden."
      );
      return;
    }

    const normalized = normalizeCardForDisplay(
      { ...rawCard, type: defaultType },
      { defaultType }
    );
    if (!normalized) {
      console.warn("[CARD PRESS] Normalize failed", pressLog);
      Alert.alert(
        "Karte nicht verfügbar",
        "Diese Karte konnte nicht angezeigt werden."
      );
      return;
    }

    onSelectCard(normalized, player.name);
  };

  const monsterSource = player.monster
    ? getNativeImageSourceFromCard(player.monster)
    : null;

  return (
    <>
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
          {player.monster && monsterSource && (
            <TouchableOpacity
              onPress={() => openSeatCard(player.monster, "monster")}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
            >
              <Image
                source={monsterSource}
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
              onPress={() => openSeatCard(player.trap, "trap")}
              hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
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

      <View
        style={{
          position: "absolute",
          left: avatarPosition.x - avatarLabelWidth / 2,
          top: avatarPosition.y - avatarBlockHeight / 2,
          width: avatarLabelWidth,
          alignItems: "center",
          zIndex: 4,
          overflow: "visible",
        }}
      >
        <View
          style={{
            width: avatarLabelWidth,
            alignItems: "center",
            position: "relative",
          }}
        >
          {bubbleText ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: avatarHeight + 40,
                alignItems: "center",
                zIndex: 6,
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
            showInitial={false}
          />

          <PlayerNameLabel
            name={player.name}
            isMe={isMe}
            isCurrentTurn={isCurrentTurn}
            isStartPlayer={isStartPlayer}
            maxWidth={avatarLabelWidth}
            compact={compact}
          />
        </View>
      </View>
    </>
  );
}
