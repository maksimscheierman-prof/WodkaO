import { useEffect, useMemo, useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { getTableStackCounts } from "../utils/deckCounts";
import { loadCards } from "../utils/gameLogic";
import {
  getAvatarBlockHeight,
  getAvatarSize,
  getCardSize,
  getPlayerPositions,
  getTableEllipse,
  orderPlayersWithMeAtBottom,
} from "../utils/tableLayout";
import StackPile from "./StackPile";
import PlayerSeat from "./PlayerSeat";

const CARD_BACK = require("../../assets/images/card_back.png");

const getImageSource = (img) => {
  if (!img) return null;
  if (typeof img === "number") return img;
  if (img.uri) return { uri: img.uri };
  if (typeof img === "string") return { uri: img };
  return null;
};

export default function GameBoard({
  lobby,
  me,
  playerName,
  isMyTurn,
  onDraw,
  onShow,
  onDiscard,
  onSelectCard,
  setSelectedCard,
  actionDisabled = false,
}) {
  const { width: screenWidth } = useWindowDimensions();
  const [tableSize, setTableSize] = useState({ width: 0, height: 0 });
  const [magicPoolSize, setMagicPoolSize] = useState(null);

  const { width: cardWidth, height: cardHeight, seatWidth } = getCardSize(
    screenWidth
  );
  const { height: avatarHeight, labelWidth: avatarLabelWidth } =
    getAvatarSize(screenWidth);
  const avatarBlockHeight = getAvatarBlockHeight(avatarHeight);
  const stackW = Math.round(cardWidth * 1.15);
  const stackH = Math.round(cardHeight * 1.15);
  const compact = screenWidth < 400;
  const stackGap = compact ? 6 : 14;

  const players = useMemo(() => lobby.players || [], [lobby.players]);
  const currentPlayerName = players[lobby.turn]?.name;

  const orderedPlayers = useMemo(
    () => orderPlayersWithMeAtBottom(players, playerName || me?.name),
    [players, playerName, me?.name]
  );

  const tableEllipse = useMemo(
    () => getTableEllipse(tableSize.width, tableSize.height),
    [tableSize.width, tableSize.height]
  );

  const playerPositions = useMemo(
    () =>
      getPlayerPositions(
        orderedPlayers.length,
        tableSize.width,
        tableSize.height,
        avatarBlockHeight,
        { cardWidth, cardHeight, seatWidth }
      ),
    [
      orderedPlayers.length,
      tableSize.width,
      tableSize.height,
      avatarBlockHeight,
      cardWidth,
      cardHeight,
      seatWidth,
    ]
  );

  const stackCounts = useMemo(
    () => getTableStackCounts(lobby, magicPoolSize),
    [lobby, magicPoolSize]
  );

  const topDiscard = lobby.discardPile?.length
    ? lobby.discardPile[lobby.discardPile.length - 1]
    : null;
  const topDiscardImage = topDiscard
    ? getImageSource(topDiscard.image)
    : null;

  useEffect(() => {
    let cancelled = false;
    loadCards()
      .then((cards) => {
        if (cancelled) return;
        const n = cards.filter((c) => c.type === "MAGIC").length;
        setMagicPoolSize(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const btnStyle = {
    marginTop: 6,
    backgroundColor: "#D9C9A3",
    paddingVertical: compact ? 6 : 8,
    paddingHorizontal: compact ? 10 : 14,
    borderRadius: 8,
    opacity: actionDisabled ? 0.5 : 1,
  };

  const rowWidth = stackW * 3 + stackGap * 2;
  const centerLeft =
    tableSize.width > 0 ? tableSize.width / 2 - rowWidth / 2 : 0;
  const centerTop =
    tableSize.height > 0
      ? tableEllipse.centerY - stackH / 2 - 24
      : 0;

  const activeCardW = Math.round(cardWidth * 1.35);
  const activeCardH = Math.round(cardHeight * 1.35);

  const stackHeadroom =
    lobby.lastMagic && lobby.showMagic
      ? activeCardH + 10
      : lobby.lastMagic && !lobby.showMagic
        ? activeCardH * 0.35
        : 0;
  const roundTop = centerTop - stackHeadroom - (compact ? 20 : 26);

  return (
    <View
      style={{ flex: 1, minHeight: 280 }}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setTableSize({ width, height });
      }}
    >
      <View style={{ flex: 1, position: "relative" }}>
        {tableSize.width > 0 && (
          <View
            style={{
              position: "absolute",
              left: tableEllipse.left,
              top: tableEllipse.top,
              width: tableEllipse.width,
              height: tableEllipse.height,
              borderRadius: tableEllipse.borderRadius,
              backgroundColor: "rgba(20,80,40,0.35)",
              borderWidth: 2,
              borderColor: "rgba(217,201,163,0.35)",
            }}
          />
        )}

        {tableSize.width > 0 && lobby.round ? (
          <Text
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: roundTop,
              textAlign: "center",
              color: "rgba(217,201,163,0.95)",
              fontSize: compact ? 12 : 14,
              fontWeight: "600",
              zIndex: 3,
            }}
          >
            Runde {lobby.round}
          </Text>
        ) : null}

        {tableSize.width > 0 && (
          <View
            style={{
              position: "absolute",
              left: centerLeft,
              top: centerTop,
              width: rowWidth,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-end",
              zIndex: 2,
            }}
          >
            {/* Fallenkarten-Stapel (links) */}
            <StackPile
              label="Fallenkarten"
              count={stackCounts.traps}
              width={stackW}
              height={stackH}
            />

            {/* Magiestapel (mitte) + Ziehen/Aufdecken */}
            <View style={{ alignItems: "center", width: stackW + 16 }}>
              <StackPile
                label="Magiestapel"
                count={stackCounts.magic ?? 0}
                width={stackW}
                height={stackH}
              />

              {lobby.lastMagic && !lobby.showMagic && (
                <View
                  style={{
                    position: "absolute",
                    top: -activeCardH * 0.35,
                    alignItems: "center",
                  }}
                >
                  <Image
                    source={CARD_BACK}
                    style={{
                      width: activeCardW * 0.85,
                      height: activeCardH * 0.85,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: "#7fff7f",
                    }}
                    resizeMode="cover"
                  />
                  <Text style={{ color: "#aaa", fontSize: 9, marginTop: 2 }}>
                    gezogen
                  </Text>
                </View>
              )}

              {isMyTurn && !lobby.lastMagic && (
                <TouchableOpacity
                  onPress={onDraw}
                  disabled={actionDisabled}
                  style={btnStyle}
                >
                  <Text
                    style={{
                      color: "#2E1F12",
                      fontWeight: "bold",
                      fontSize: compact ? 11 : 13,
                    }}
                  >
                    {actionDisabled ? "⏳ ..." : "✨ Ziehen"}
                  </Text>
                </TouchableOpacity>
              )}

              {lobby.lastMagic && !lobby.showMagic && isMyTurn && (
                <TouchableOpacity
                  onPress={onShow}
                  disabled={actionDisabled}
                  style={btnStyle}
                >
                  <Text
                    style={{
                      color: "#2E1F12",
                      fontWeight: "bold",
                      fontSize: compact ? 11 : 13,
                    }}
                  >
                    {actionDisabled ? "⏳ ..." : "👁️ Aufdecken"}
                  </Text>
                </TouchableOpacity>
              )}

              {lobby.lastMagic && lobby.showMagic && isMyTurn && (
                <TouchableOpacity
                  onPress={onDiscard}
                  disabled={actionDisabled}
                  style={btnStyle}
                >
                  <Text
                    style={{
                      color: "#2E1F12",
                      fontWeight: "bold",
                      fontSize: compact ? 11 : 13,
                    }}
                  >
                    {actionDisabled ? "⏳ ..." : "🗑️ Ablegen"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Ablagestapel (rechts) + aktuelle Karte darüber */}
            <View style={{ alignItems: "center", width: stackW + 16 }}>
              {lobby.lastMagic && lobby.showMagic && (
                <View style={{ alignItems: "center", marginBottom: 6 }}>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedCard({ ...lobby.lastMagic, type: "magic" })
                    }
                  >
                    <Image
                      source={getImageSource(lobby.lastMagic.image)}
                      style={{
                        width: activeCardW,
                        height: activeCardH,
                        borderRadius: 6,
                        borderWidth: 2,
                        borderColor: "#D9C9A3",
                      }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                  <Text
                    style={{ color: "#fff", fontSize: 9, marginTop: 2 }}
                    numberOfLines={1}
                  >
                    {lobby.lastMagic.name}
                  </Text>
                </View>
              )}

              <StackPile
                label="Ablage"
                count={stackCounts.discard}
                width={stackW}
                height={stackH}
                topCardImage={topDiscardImage}
              />
            </View>
          </View>
        )}

        {orderedPlayers.map((player, index) => (
          <PlayerSeat
            key={player.id || player.name}
            player={player}
            cardPosition={playerPositions[index]?.card}
            avatarPosition={playerPositions[index]?.avatar}
            seatWidth={seatWidth}
            cardWidth={cardWidth}
            cardHeight={cardHeight}
            avatarHeight={avatarHeight}
            avatarBlockHeight={avatarBlockHeight}
            avatarLabelWidth={avatarLabelWidth}
            isCurrentTurn={currentPlayerName === player.name}
            isMe={player.name === (playerName || me?.name)}
            onSelectCard={onSelectCard}
            compact={compact}
          />
        ))}
      </View>
    </View>
  );
}
