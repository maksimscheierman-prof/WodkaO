import { useEffect, useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { getTimers } from "../config/timers";
import Card from "./Card";

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
}) {
  //Hooks
  const src = (img) => (typeof img === "string" ? { uri: img } : img);
  const isMagic = (t) => typeof t === "string" && t.toLowerCase() === "magic";

  const [trapRevealed, setTrapRevealed] = useState(false);

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
    if (isVoting && voteLeft === 0) {
      const voted =
        (lobby?.votes?.ja || []).includes(me.name) ||
        (lobby?.votes?.nein || []).includes(me.name);
      if (!voted) handleVote("ja");
    }
  }, [isVoting, voteLeft]);

  useEffect(() => {
    if (hasResult && ackLeft === 0 && !lobby?.resultAcks?.[me.name]) {
      onResultOk(me.name);
    }
  }, [hasResult, ackLeft]);

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

  // Auto: Voting → JA nach 30s
  useEffect(() => {
    if (!isVoting || voteLeft > 0) return;
    const alreadyVoted =
      (lobby?.votes?.ja || []).includes(me.name) ||
      (lobby?.votes?.nein || []).includes(me.name);
    if (!alreadyVoted) handleVote("ja");
  }, [isVoting, voteLeft]);

  // Auto: Ergebnis → OK nach 10s
  useEffect(() => {
    if (!hasResult || ackLeft > 0) return;
    if (!lobby?.resultAcks?.[me.name]) onResultOk(me.name);
  }, [hasResult, ackLeft]);

  // Auto: Reaktionsphase → Done nach 60s (nur Nicht-Zugspieler, wenn noch nicht reagiert)
  useEffect(() => {
    if (!inReaction || reactLeft > 0) return;
    const hasReacted = !!lobby?.reactions?.[me.name]?.done;
    if (!isMyTurn && !hasReacted) onDone(me.name);
  }, [inReaction, reactLeft]);

  // Voting-Priorität: wenn Voting aktiv, Modal immer zeigen
  if (isVoting) {
    const eff = lobby.activeEffect;
    return (
      <Modal visible transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.9)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Image
            source={
              typeof eff.card?.image === "string"
                ? { uri: eff.card.image }
                : eff.card?.image
            }
            style={{ width: 200, height: 300 }}
          />
          <Text style={{ color: "#fff", marginTop: 10, fontSize: 18 }}>
            {eff.card?.name}
          </Text>
          <Text style={{ color: "#fff", marginTop: 10, fontSize: 16 }}>
            Effekt von {eff.player} zulassen?
          </Text>

          <View style={{ flexDirection: "row", marginTop: 20 }}>
            <TouchableOpacity
              onPress={() => handleVote("ja")}
              style={{
                backgroundColor: "#1b5e20",
                padding: 10,
                borderRadius: 8,
                marginHorizontal: 10,
              }}
            >
              <Text style={{ color: "#bbb", marginTop: 8 }}>
                Auto-Ja in {fmt(voteLeft)}
              </Text>

              <Text style={{ color: "#fff" }}>Ja ✅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleVote("nein")}
              style={{
                backgroundColor: "#b71c1c",
                padding: 10,
                borderRadius: 8,
                marginHorizontal: 10,
              }}
            >
              <Text style={{ color: "#fff" }}>Nein ❌</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }
  if (hasResult) {
    const eff = lobby.resolvedEffect; // { player, card, approved }
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
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          {!!eff?.card && (
            <Image
              source={src(eff.card.image)}
              style={{ width: 200, height: 300 }}
            />
          )}
          <Text
            style={{
              color: "#fff",
              fontSize: 20,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {lobby.voteResult}
          </Text>

          {/* Info: wie viele Bestätigungen fehlen noch */}
          {remaining > 0 && (
            <Text style={{ color: "#ddd", marginTop: 8 }}>
              Warten auf {remaining} Spieler…
            </Text>
          )}

          {/* Mein OK sendet ACK; Overlay bleibt bis ALLE ok gedrückt haben */}
          {!acks[me.name] ? (
            <TouchableOpacity
              onPress={() => onResultOk(me.name)}
              style={{
                marginTop: 20,
                backgroundColor: "#D9C9A3",
                padding: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#000" }}>OK</Text>
              <Text style={{ color: "#bbb", marginTop: 8 }}>
                Auto-Ja in {fmt(voteLeft)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ color: "#9f9", marginTop: 16 }}>✔️ Bestätigt</Text>
          )}
          {!acks[me.name] && (
            <Text style={{ color: "#bbb", marginTop: 8 }}>
              Automatisch OK in {fmt(ackLeft)}
            </Text>
          )}
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

  const hasReacted = reactions[me.name]?.done;
  const allDone =
    Object.values(reactions).filter((r) => r.done).length >=
    (lobby.players?.length || 0) - 1;

  return (
    <Modal visible transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.85)",
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        {/* --- Karte anzeigen --- */}

        <Card
          title={card.name}
          description={card.effect}
          atk={card.atk}
          def={card.def}
          type={card.type || "magic"}
          stars={card.stars}
          monsterType={card.monsterType}
          image={card.image}
        />

        {/* --- PHASE 1: Nur Show für Zugspieler --- */}
        {isMyTurn && !lobby.showMagic && (
          <TouchableOpacity
            onPress={handleShow}
            style={{
              marginTop: 15,
              backgroundColor: "#D9C9A3",
              padding: 10,
              borderRadius: 8,
            }}
          >
            <Text>👁️ Zeigen</Text>
          </TouchableOpacity>
        )}

        {/* --- PHASE 2: Reaktionsphase (nach Show) --- */}
        {lobby.showMagic && !lobby.votingOpen && (
          <>
            {/* Nur andere Spieler dürfen reagieren */}
            {!isMyTurn && !hasReacted && (
              <View
                style={{
                  width: "100%",
                  alignItems: "center",
                  marginTop: 20,
                }}
              >
                {/* 🍺 Trinken zentriert */}
                <TouchableOpacity
                  onPress={() => handleDrink(me.name)}
                  style={{
                    backgroundColor: "#D9C9A3",
                    paddingVertical: 10,
                    paddingHorizontal: 20,
                    borderRadius: 8,
                    marginBottom: 10,
                    width: 160,
                    alignItems: "center",
                  }}
                >
                  <Text>🍺 Trinken (+1)</Text>
                </TouchableOpacity>

                {/* Untere Reihe: Monster + Falle */}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-evenly",
                    width: "100%",
                  }}
                >
                  {/* MONSTER (klickbar: Effekt aktivieren) */}
                  <View
                    style={{
                      alignItems: "center",
                      transform: [{ scale: 0.9 }],
                    }}
                  >
                    {me?.monster && (
                      <>
                        <Card
                          title={me.monster.name}
                          description={me.monster.effect}
                          atk={me.monster.atk}
                          def={me.monster.def}
                          type={me.monster.type}
                          stars={me.monster.stars}
                          monsterType={me.monster.monsterType}
                          image={me.monster.image}
                        />

                        {/* ⬇️ vorher disabled – jetzt aktiv */}
                        <TouchableOpacity
                          onPress={() => handleActivateEffect(me.monster)}
                          style={{
                            marginTop: 5,
                            backgroundColor: "#337",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#fff" }}>
                            ⚡ Monster aktivieren
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>

                  {/* FALLE (verdeckt / aufdeckbar) */}
                  <View
                    style={{
                      alignItems: "center",
                      transform: [{ scale: 0.9 }],
                    }}
                  >
                    {me?.trap && (
                      <>
                        <TouchableOpacity
                          onPress={() => setTrapRevealed((prev) => !prev)}
                        >
                          {trapRevealed ? (
                            <Card
                              title={me.trap.name}
                              description={me.trap.effect}
                              atk={me.trap.atk}
                              def={me.trap.def}
                              type={me.trap.type}
                              stars={me.trap.stars}
                              monsterType={me.trap.monsterType}
                              image={me.trap.image}
                            />
                          ) : (
                            <View
                              style={{
                                width: 320, // leicht größer, damit scale 0.9 passt
                                height: 550,
                                justifyContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <Image
                                source={require("../../assets/images/card_back.png")}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  borderRadius: 16,
                                  shadowColor: "#000",
                                  shadowOpacity: 0.5,
                                  shadowOffset: { width: 0, height: 4 },
                                  shadowRadius: 6,
                                }}
                                resizeMode="cover"
                              />
                            </View>
                          )}
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleActivateEffect(me.trap)}
                          style={{
                            marginTop: 5,
                            backgroundColor: "#A33",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#fff" }}>
                            ⚡ Falle aktivieren
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>

                {/* ✅ Done zentriert darunter */}
                <TouchableOpacity
                  onPress={() => {
                    onDone(me.name);
                    setTrapRevealed(false);
                  }}
                  style={{
                    backgroundColor: "#D9C9A3",
                    padding: 10,
                    borderRadius: 8,
                    marginTop: 20,
                    width: 160,
                    alignItems: "center",
                  }}
                >
                  <Text>✅ Done</Text>
                  <Text style={{ color: "#bbb", marginTop: 8 }}>
                    Automatisch Done in {fmt(reactLeft)}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Wenn bereits reagiert */}
            {!isMyTurn && hasReacted && (
              <Text style={{ color: "#ccc", marginTop: 20 }}>
                ✅ Reaktion gespeichert
              </Text>
            )}

            {/* Zugspieler: warten, bis alle fertig sind */}
            {isMyTurn && !allDone && (
              <Text style={{ color: "#aaa", marginTop: 20 }}>
                ⏳ Warten auf andere Spieler...
              </Text>
            )}

            {/* Wenn alle reagiert haben → ablegen */}
            {isMyTurn && allDone && (
              <TouchableOpacity
                onPress={handleDiscard}
                style={{
                  marginTop: 20,
                  backgroundColor: "#d98c8c",
                  padding: 10,
                  borderRadius: 8,
                }}
              >
                <Text>🗑️ Magiekarte ablegen</Text>
                {isMyTurn && lobby?.allReactionsDone && (
                  <Text style={{ color: "#bbb", marginTop: 8 }}>
                    Automatisch ablegen in {fmt(discardLeft)}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}

        {/* --- PHASE 3: Abstimmung (Voting) --- */}
        {lobby.activeEffect && lobby.votingOpen && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.9)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <Image
              source={lobby.activeEffect.card.image}
              style={{ width: 200, height: 300 }}
              resizeMode="cover"
            />
            <Text style={{ color: "#fff", marginTop: 10, fontSize: 18 }}>
              {lobby.activeEffect.card.name}
            </Text>
            <Text style={{ color: "#fff", marginTop: 10, fontSize: 16 }}>
              Effekt von {lobby.activeEffect.player} zulassen?
            </Text>

            <View style={{ flexDirection: "row", marginTop: 20 }}>
              <TouchableOpacity
                onPress={() => handleVote("ja")}
                style={{
                  backgroundColor: "#1b5e20",
                  padding: 10,
                  borderRadius: 8,
                  marginHorizontal: 10,
                }}
              >
                <Text style={{ color: "#fff" }}>Ja ✅</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleVote("nein")}
                style={{
                  backgroundColor: "#b71c1c",
                  padding: 10,
                  borderRadius: 8,
                  marginHorizontal: 10,
                }}
              >
                <Text style={{ color: "#fff" }}>Nein ❌</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* --- Abstimmungsergebnis --- */}
        {!lobby.votingOpen && lobby.voteResult && (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.85)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            {/* Zeige die aktivierte Karte (Trap/Monster), nicht die Magie */}
            {!!lobby.resolvedEffect?.card && (
              <Image
                source={
                  typeof lobby.resolvedEffect.card.image === "string"
                    ? { uri: lobby.resolvedEffect.card.image }
                    : lobby.resolvedEffect.card.image
                }
                style={{ width: 200, height: 300 }}
                resizeMode="cover"
              />
            )}

            <Text
              style={{
                color: "#fff",
                fontSize: 20,
                textAlign: "center",
                marginTop: 10,
              }}
            >
              {lobby.voteResult}
            </Text>

            <TouchableOpacity
              onPress={handleCloseVoteResult} // ⬅️ statt setSelectedCard(null)
              style={{
                marginTop: 20,
                backgroundColor: "#D9C9A3",
                padding: 10,
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#000" }}>OK</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}
