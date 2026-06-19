import { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTimers } from "../config/timers";
import { canActivateMonsterEffect } from "../utils/effectsUsed";
import {
  getReactionMagicCardBounds,
} from "../utils/reactionLayout";
import MagicReactionPanel from "./MagicReactionPanel";
import SafeText from "./SafeText";
import TemplateCardRenderer from "./TemplateCardRenderer";
import VotingPhasePanel, { VoteButton, VoteButtonRow } from "./VotingPhasePanel";

export default function MagicCardModal({
  lobby,
  me,
  isMyTurn,
  selectedCard,
  setSelectedCard,
  handleShow,
  handleDiscard,
  handleCloseVoteResult,
  handleDrink,
  handleActivateEffect,
  handleVote,
  onDone,
  onResultOk,
  actionDisabled = false,
}) {
  const actionOpacity = actionDisabled ? 0.5 : 1;
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const magicBounds = getReactionMagicCardBounds(screenWidth, screenHeight);

  const touchBtn = {
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  };

  const playerKey = me?.name ?? "";

  //Hooks
  const isMagic = (t) => typeof t === "string" && t.toLowerCase() === "magic";

  const [selectedReactionCard, setSelectedReactionCard] = useState(null);

  const useCountdown = (startMs, durationSec, active) => {
    const [left, setLeft] = useState(durationSec);

    useEffect(() => {
      if (!active || !startMs) {
        setLeft(durationSec);
        return;
      }
      const update = () => {
        const elapsed = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        setLeft(Math.max(0, durationSec - elapsed));
      };
      update();
      const id = setInterval(update, 1000); // eigener Intervall pro Hook
      return () => clearInterval(id);
    }, [startMs, durationSec, active]);

    return left;
  };

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
      2,
      "0"
    )}`;

  useEffect(() => {
    const isMagicSelected =
      typeof selectedCard?.type === "string" &&
      selectedCard.type.toLowerCase() === "magic";

    if (!lobby.lastMagic && isMagicSelected) {
      setSelectedCard(null); // 👈 falls lokal noch Magic liegt, schließen
    }
  }, [lobby.lastMagic]);

  // Ableitungen/Nebenflags */
  const selectedIsMagic = isMagic(selectedCard?.type);
  const magicFromLobby = lobby.lastMagic || null;
  const card = selectedIsMagic ? selectedCard : magicFromLobby;

  //Flags
  const timers = getTimers(lobby);
  const isVoting = !!(lobby?.activeEffect && lobby?.votingOpen);
  const hasResult = !!(!lobby?.votingOpen && lobby?.voteResult);
  const inReaction = !!(lobby?.showMagic && !isVoting && !hasResult);

  // Countdowns
  const voteLeft = useCountdown(
    lobby?.votingStartedAt,
    timers.votingSeconds,
    isVoting
  );
  const ackLeft = useCountdown(
    lobby?.resultStartedAt,
    timers.ackSeconds,
    hasResult
  );
  const reactLeft = useCountdown(
    lobby?.reactionsStartedAt,
    timers.reactionSeconds,
    inReaction
  );
  const discardLeft = useCountdown(
    lobby?.discardStartedAt,
    timers.discardSeconds,
    isMyTurn &&
      lobby?.allReactionsDone &&
      !!lobby?.lastMagic &&
      lobby?.showMagic &&
      !isVoting &&
      !hasResult
  );

  // Auto-Aktionen:
  useEffect(() => {
    if (!inReaction) setSelectedReactionCard(null);
  }, [inReaction]);

  useEffect(() => {
    if (!playerKey) return;
    if (!isVoting || voteLeft > 0) return;
    const alreadyVoted =
      (lobby?.votes?.ja || []).includes(playerKey) ||
      (lobby?.votes?.nein || []).includes(playerKey);
    if (!alreadyVoted) handleVote("ja");
  }, [isVoting, voteLeft, playerKey]);

  useEffect(() => {
    if (!playerKey) return;
    if (!hasResult || ackLeft > 0) return;
    if (!lobby?.resultAcks?.[playerKey]) onResultOk(playerKey);
  }, [hasResult, ackLeft, playerKey]);

  useEffect(() => {
    if (!isMyTurn) return;
    if (!lobby?.allReactionsDone) return;
    if (isVoting || hasResult) return; // kein Discard, wenn Voting/Ergebnis offen
    if (!lobby?.lastMagic) return;
    if (discardLeft === 0) handleDiscard(); // automatisch ablegen
  }, [
    isMyTurn,
    lobby?.allReactionsDone,
    isVoting,
    hasResult,
    discardLeft,
    lobby?.lastMagic,
  ]);

  // Auto: Reaktionsphase → Done nach 60s (nur Nicht-Zugspieler, wenn noch nicht reagiert)
  useEffect(() => {
    if (!playerKey) return;
    if (!inReaction || reactLeft > 0) return;
    const hasReacted = !!lobby?.reactions?.[playerKey]?.done;
    if (!isMyTurn && !hasReacted) onDone(playerKey);
  }, [inReaction, reactLeft, playerKey, isMyTurn]);

  if (!playerKey) return null;

  // Voting-Priorität: wenn Voting aktiv, Modal immer zeigen
  if (isVoting) {
    const eff = lobby.activeEffect;
    return (
      <Modal visible transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          <VotingPhasePanel
            effectCard={eff?.card}
            effectPlayer={eff?.player}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            subtitle={`Effekt von ${eff?.player} zulassen?`}
            actionDisabled={actionDisabled}
          >
            <VoteButtonRow>
              <VoteButton
                label={actionDisabled ? "⏳" : "Ja ✅"}
                subLabel={`Auto-Ja in ${fmt(voteLeft)}`}
                onPress={() => handleVote("ja")}
                disabled={actionDisabled}
                backgroundColor="#1b5e20"
              />
              <VoteButton
                label={actionDisabled ? "⏳" : "Nein ❌"}
                onPress={() => handleVote("nein")}
                disabled={actionDisabled}
                backgroundColor="#b71c1c"
              />
            </VoteButtonRow>
          </VotingPhasePanel>
        </View>
      </Modal>
    );
  }
  if (hasResult) {
    const eff = lobby.resolvedEffect;
    const acks = lobby.resultAcks || {};
    const total = lobby.players?.length || 0;
    const ackCount = Object.values(acks).filter(Boolean).length;
    const remaining = Math.max(total - ackCount, 0);

    return (
      <Modal visible transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
        >
          <VotingPhasePanel
            effectCard={eff?.card}
            effectPlayer={eff?.player}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            subtitle={lobby.voteResult}
            actionDisabled={actionDisabled}
          >
            {remaining > 0 ? (
              <SafeText
                component="MagicCardModal.resultWait"
                style={{ color: "#ddd", fontSize: 13, marginBottom: 8, textAlign: "center" }}
              >
                Warten auf {remaining} Spieler…
              </SafeText>
            ) : null}

            {!acks[playerKey] ? (
              <>
                <VoteButton
                  label={actionDisabled ? "⏳" : "OK"}
                  subLabel={`Automatisch OK in ${fmt(ackLeft)}`}
                  onPress={() => onResultOk(playerKey)}
                  disabled={actionDisabled}
                  backgroundColor="#D9C9A3"
                  textColor="#2E1F12"
                />
              </>
            ) : (
              <SafeText
                component="MagicCardModal.resultAck"
                style={{ color: "#9f9", fontSize: 15, marginTop: 8 }}
              >
                ✔️ Bestätigt
              </SafeText>
            )}
          </VotingPhasePanel>
        </View>
      </Modal>
    );
  }
  // Sichtbarkeit:
  // - wenn selected Magic → immer sichtbar (Zugspieler hat gerade gezogen)
  // - sonst nur, wenn die auf Tisch liegende Magic gezeigt wird
  const visible = !!card && (selectedIsMagic || lobby.showMagic || isMyTurn);
  if (!visible || !card) return null;

  // Reaktionsstatus
  const reactions = lobby.reactions || {};

  const hasReacted = reactions[playerKey]?.done;
  const allDone =
    Object.values(reactions).filter((r) => r.done).length >=
    (lobby.players?.length || 0) - 1;

  const inReactionRespond =
    lobby.showMagic && !lobby.votingOpen && !isMyTurn && !hasReacted;
  const canActivateMonster = canActivateMonsterEffect(
    lobby.effectsUsed,
    playerKey,
    lobby.round ?? 1
  );

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        }}
      >
        {inReactionRespond ? (
          <MagicReactionPanel
            magicCard={card}
            me={me}
            screenWidth={screenWidth}
            screenHeight={screenHeight}
            selectedReactionCard={selectedReactionCard}
            onSelectReactionCard={setSelectedReactionCard}
            onDrink={() => handleDrink(playerKey)}
            onActivateMonster={() => handleActivateEffect(me.monster)}
            onActivateTrap={() => handleActivateEffect(me.trap)}
            onDone={() => {
              onDone(playerKey);
              setSelectedReactionCard(null);
            }}
            canActivateMonster={canActivateMonster}
            actionDisabled={actionDisabled}
            reactLeft={reactLeft}
            fmt={fmt}
          />
        ) : (
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 12,
              paddingVertical: 16,
            }}
            bounces={false}
          >
            {card ? (
              <TemplateCardRenderer
                card={card}
                fallbackType="magic"
                maxWidth={magicBounds.maxWidth}
                maxHeight={magicBounds.maxHeight}
              />
            ) : null}

            {isMyTurn && !lobby.showMagic && (
              <TouchableOpacity
                onPress={handleShow}
                disabled={actionDisabled}
                style={{
                  marginTop: 15,
                  backgroundColor: "#D9C9A3",
                  opacity: actionOpacity,
                  ...touchBtn,
                }}
              >
                <Text>{actionDisabled ? "⏳ ..." : "👁️ Zeigen"}</Text>
              </TouchableOpacity>
            )}

            {lobby.showMagic && !lobby.votingOpen && (
              <>
                {!isMyTurn && hasReacted && (
                  <Text style={{ color: "#ccc", marginTop: 20 }}>
                    ✅ Reaktion gespeichert
                  </Text>
                )}

                {isMyTurn && !allDone && (
                  <Text style={{ color: "#aaa", marginTop: 20 }}>
                    ⏳ Warten auf andere Spieler...
                  </Text>
                )}

                {isMyTurn && allDone && (
                  <TouchableOpacity
                    onPress={handleDiscard}
                    disabled={actionDisabled}
                    style={{
                      marginTop: 20,
                      backgroundColor: "#d98c8c",
                      opacity: actionOpacity,
                      ...touchBtn,
                    }}
                  >
                    <Text>
                      {actionDisabled ? "⏳ ..." : "🗑️ Magiekarte ablegen"}
                    </Text>
                    <Text style={{ color: "#bbb", marginTop: 8 }}>
                      Automatisch ablegen in {fmt(discardLeft)}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
