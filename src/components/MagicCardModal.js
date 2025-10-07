import { useState } from "react";
import { Image, Modal, Text, TouchableOpacity, View } from "react-native";
import { handleReactionDone } from "../utils/gameActions";
import Card from "./Card";

export default function MagicCardModal({
  lobby,
  me,
  isMyTurn,
  selectedCard,
  setSelectedCard,
  handleShow,
  handleDiscard,
  handleDrink,
  handleActivateEffect,
  handleVote,
}) {
  const card = selectedCard || lobby.lastMagic;
  if (!card) return null;

  // Sichtbar wenn ich dran bin ODER Karte aufgedeckt ist
  const visible = !!card && (isMyTurn || lobby.showMagic);
  if (!visible) return null;

  // Reaktionsstatus
  const reactions = lobby.reactions || {};
  const [trapRevealed, setTrapRevealed] = useState(false);

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
                  {/* MONSTER (nicht klickbar) */}
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
                        <TouchableOpacity
                          disabled
                          style={{
                            opacity: 0.5,
                            marginTop: 5,
                            backgroundColor: "#337",
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ color: "#fff" }}>🐉 Effekt aktiv</Text>
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
                          onPress={() => handleActivateEffect(me.trap, "trap")}
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
                    handleReactionDone(lobby.ref, lobby, me.name);
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
            <Text style={{ color: "#fff", fontSize: 20, textAlign: "center" }}>
              {lobby.voteResult}
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedCard(null)}
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
