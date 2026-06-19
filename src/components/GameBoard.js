import { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GAME_PHASES } from "../config/gamePhases";
import { getTableStackCounts } from "../utils/deckCounts";
import {
  computeBoardLayout,
  logLayoutDebug,
  MIN_BOARD_HEIGHT,
  orderPlayersWithMeAtBottom,
} from "../utils/tableLayout";
import { getNativeImageSourceFromCard } from "../utils/cardDisplay";
import {
  DEBUG_SLOT_COLORS,
  isLayoutDebugEnabled,
  slotToPosition,
} from "../utils/tableSlotLayout";
import StackPile from "./StackPile";
import PlayerSeat from "./PlayerSeat";

const CARD_BACK = require("../../assets/images/card_back.png");

const getImageSource = (cardOrImage) => {
  if (!cardOrImage) return CARD_BACK;
  if (cardOrImage.image != null || cardOrImage.imageName != null) {
    return getNativeImageSourceFromCard(cardOrImage);
  }
  return getNativeImageSourceFromCard({ image: cardOrImage });
};

function SlotDebugRect({ slot, color, label }) {
  if (!slot || !isLayoutDebugEnabled()) return null;
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: slot.left,
        top: slot.top,
        width: slot.width,
        height: slot.height,
        backgroundColor: color,
        borderWidth: 1,
        borderColor: color.replace(/0\.\d+\)$/, "0.8)"),
        zIndex: 50,
      }}
    >
      {label ? (
        <Text style={{ fontSize: 8, color: "#fff", padding: 1 }}>{label}</Text>
      ) : null}
    </View>
  );
}

export default function GameBoard({
  lobby,
  me,
  playerName,
  onSelectCard,
  setSelectedCard,
}) {
  const [boardSize, setBoardSize] = useState({ width: 0, height: 0 });
  const lastDebugKey = useRef("");

  const players = useMemo(() => lobby.players || [], [lobby.players]);
  const currentPlayerName = players[lobby.turn]?.name;

  const orderedPlayers = useMemo(
    () => orderPlayersWithMeAtBottom(players, playerName || me?.name),
    [players, playerName, me?.name]
  );

  const layout = useMemo(() => {
    if (!boardSize.width || !boardSize.height) return null;
    return computeBoardLayout(
      boardSize.width,
      boardSize.height,
      orderedPlayers.length
    );
  }, [boardSize.width, boardSize.height, orderedPlayers.length]);

  const slots = layout?.slotLayout?.slots;

  const playerSlots = useMemo(() => {
    if (!slots?.playerSlots) return [];
    return slots.playerSlots.map((ps) => ({
      card: slotToPosition(ps.monster),
      avatar: slotToPosition(ps.avatar),
      role: ps.role,
    }));
  }, [slots]);

  useEffect(() => {
    if (!layout || !slots) return;
    const key = `${layout.boardWidth}x${layout.boardHeight}-${layout.contentScale}-${orderedPlayers.length}`;
    if (key === lastDebugKey.current) return;
    lastDebugKey.current = key;

    logLayoutDebug("GameBoard", {
      board: { w: layout.boardWidth, h: layout.boardHeight },
      contentScale: layout.contentScale,
      hasOverlap: layout.slotLayout.hasOverlap,
      tableRect: {
        w: Math.round(slots.tableRect.width),
        h: Math.round(slots.tableRect.height),
      },
      slots: {
        deck: slotToPosition(slots.centerDeckSlot),
        discard: slotToPosition(slots.centerDiscardSlot),
        topMonster: slotToPosition(slots.topMonsterSlot),
        bottomMonster: slotToPosition(slots.bottomMonsterSlot),
      },
      playerSlots: playerSlots.map((p, i) => ({
        i,
        role: p.role,
        monster: p.card,
        avatar: p.avatar,
      })),
    });
  }, [layout, slots, orderedPlayers.length, playerSlots]);

  const stackCounts = useMemo(() => getTableStackCounts(lobby), [lobby]);

  const topDiscard = lobby.discardPile?.length
    ? lobby.discardPile[lobby.discardPile.length - 1]
    : null;
  const topDiscardImage = topDiscard
    ? getImageSource(topDiscard)
    : null;

  const inPlayingPhase = lobby.gamePhase === GAME_PHASES.PLAYING;

  const onBoardLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setBoardSize((prev) =>
        prev.width === width && prev.height === height
          ? prev
          : { width, height }
      );
    }
  };

  if (!layout || !slots) {
    return (
      <View
        style={{ flex: 1, minHeight: MIN_BOARD_HEIGHT }}
        onLayout={onBoardLayout}
      />
    );
  }

  const {
    boardWidth,
    cardWidth,
    cardHeight,
    seatWidth,
    avatarHeight,
    avatarLabelWidth,
    avatarBlockHeight,
    stackW,
    stackH,
    tableEllipse,
  } = layout;

  const compact = boardWidth < 400;
  const activeCardW = Math.round(cardWidth * 1.35);
  const activeCardH = Math.round(cardHeight * 1.35);

  const deckCol = slots.centerDeckSlot;
  const discardCol = slots.centerDiscardSlot;

  return (
    <View
      style={{ flex: 1, minHeight: MIN_BOARD_HEIGHT }}
      onLayout={onBoardLayout}
    >
      <View style={{ flex: 1, position: "relative", overflow: "visible" }}>
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

        <SlotDebugRect slot={slots.tableRect} color={DEBUG_SLOT_COLORS.table} label="table" />
        <SlotDebugRect slot={slots.deckColumnSlot} color={DEBUG_SLOT_COLORS.deckColumn} label="deckCol" />
        <SlotDebugRect slot={slots.centerDeckSlot} color={DEBUG_SLOT_COLORS.centerDeck} label="deck" />
        <SlotDebugRect slot={slots.centerDiscardSlot} color={DEBUG_SLOT_COLORS.centerDiscard} label="discard" />
        <SlotDebugRect slot={slots.topMonsterSlot} color={DEBUG_SLOT_COLORS.topMonster} label="topMon" />
        <SlotDebugRect slot={slots.bottomMonsterSlot} color={DEBUG_SLOT_COLORS.bottomMonster} label="botMon" />

        {lobby.round ? (
          <Text
            style={{
              position: "absolute",
              left: slots.roundLabelSlot.left,
              top: slots.roundLabelSlot.top,
              width: slots.roundLabelSlot.width,
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

        {inPlayingPhase && (
          <>
            <View
              style={{
                position: "absolute",
                left: deckCol.left,
                top: deckCol.top,
                width: deckCol.width,
                alignItems: "center",
                zIndex: 2,
              }}
            >
              <StackPile
                label="Saufstapel"
                count={stackCounts.sauf}
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
            </View>

            <View
              style={{
                position: "absolute",
                left: discardCol.left,
                top: discardCol.top,
                width: discardCol.width,
                alignItems: "center",
                zIndex: 2,
              }}
            >
              {lobby.lastMagic && lobby.showMagic && (
                <View style={{ alignItems: "center", marginBottom: 6 }}>
                  <TouchableOpacity
                    onPress={() =>
                      setSelectedCard({ ...lobby.lastMagic, type: "magic" })
                    }
                  >
                    <Image
                      source={getImageSource(lobby.lastMagic)}
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
          </>
        )}

        {slots.playerSlots.map((ps) => (
          <SlotDebugRect
            key={`av-${ps.seatIndex}`}
            slot={ps.avatar}
            color={DEBUG_SLOT_COLORS.avatar}
            label={`av${ps.seatIndex}`}
          />
        ))}
        {slots.playerSlots.map((ps) => (
          <SlotDebugRect
            key={`mon-${ps.seatIndex}`}
            slot={ps.monster}
            color={
              ps.role === "left" || ps.role === "right"
                ? DEBUG_SLOT_COLORS.sideMonster
                : DEBUG_SLOT_COLORS.topMonster
            }
            label={`m${ps.seatIndex}`}
          />
        ))}

        {inPlayingPhase &&
          orderedPlayers.map((player, index) => (
            <PlayerSeat
              key={player.id || player.name}
              player={player}
              cardPosition={playerSlots[index]?.card}
              avatarPosition={playerSlots[index]?.avatar}
              seatWidth={seatWidth}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              avatarHeight={avatarHeight}
              avatarBlockHeight={avatarBlockHeight}
              avatarLabelWidth={avatarLabelWidth}
              isCurrentTurn={currentPlayerName === player.name}
              isStartPlayer={lobby.startPlayerName === player.name}
              isMe={player.name === (playerName || me?.name)}
              onSelectCard={onSelectCard}
              compact={compact}
              currentRound={lobby?.round ?? 1}
              effectsUsed={lobby?.effectsUsed}
            />
          ))}
      </View>
    </View>
  );
}
