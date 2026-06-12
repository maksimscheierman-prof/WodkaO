import { Text, TouchableOpacity, View } from "react-native";
import {
  GAME_PHASES,
  getPhaseLabel,
  isSetupPhase,
} from "../config/gamePhases";
import StackPile from "./StackPile";

export default function GameSetupPanel({
  lobby,
  playerName,
  onRollDice,
  onDrawMonster,
  actionDisabled = false,
  compact = false,
}) {
  const phase = lobby?.gamePhase;
  if (!isSetupPhase(phase)) return null;

  const players = lobby.players || [];
  const eligible = lobby.rollingEligible || [];
  const rolls = lobby.diceRolls || {};
  const isRollingPhase =
    phase === GAME_PHASES.ROLLING || phase === GAME_PHASES.RESOLVING_TIE;
  const isMonsterPhase = phase === GAME_PHASES.DRAWING_MONSTERS;

  const myRoll = rolls[playerName];
  const canRoll =
    isRollingPhase &&
    eligible.includes(playerName) &&
    myRoll == null &&
    !actionDisabled;

  const me = players.find((p) => p.name === playerName);
  const canDrawMonster =
    isMonsterPhase && me && !me.monster && !actionDisabled;

  const monstersDone = players.filter((p) => p.monster).length;
  const stackW = compact ? 48 : 56;
  const stackH = compact ? 72 : 84;

  const btnStyle = {
    backgroundColor: "#D9C9A3",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    minHeight: 44,
    marginTop: 12,
    opacity: actionDisabled ? 0.5 : 1,
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 72,
      }}
    >
      <Text
        style={{
          color: "#ffe08a",
          fontSize: compact ? 16 : 18,
          fontWeight: "bold",
          marginBottom: 8,
          textAlign: "center",
        }}
      >
        {getPhaseLabel(phase, lobby.diceRound)}
      </Text>

      {isRollingPhase && (
        <>
          <Text style={{ color: "#ccc", fontSize: 13, marginBottom: 16, textAlign: "center" }}>
            {phase === GAME_PHASES.RESOLVING_TIE
              ? "Gleichstand! Nur die Spieler mit der höchsten Zahl würfeln erneut."
              : "Jeder würfelt einmal. Die höchste Zahl bestimmt den Startspieler."}
          </Text>

          <View style={{ width: "100%", maxWidth: 320, gap: 8 }}>
            {players.map((p) => {
              const inRound = eligible.includes(p.name);
              const roll = rolls[p.name];

              return (
                <View
                  key={p.id || p.name}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.4)",
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: p.name === playerName ? 1 : 0,
                    borderColor: "#ffe08a",
                    opacity: inRound || roll != null ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {p.name}
                    {p.name === playerName ? " (Du)" : ""}
                  </Text>
                  <Text style={{ color: "#7fff7f", fontWeight: "bold" }}>
                    {!inRound && roll == null
                      ? "—"
                      : roll != null
                        ? `🎲 ${roll}`
                        : "⏳ wartet"}
                  </Text>
                </View>
              );
            })}
          </View>

          {canRoll && (
            <TouchableOpacity onPress={onRollDice} style={btnStyle}>
              <Text style={{ fontWeight: "bold", color: "#2E1F12", textAlign: "center" }}>
                🎲 Würfeln
              </Text>
            </TouchableOpacity>
          )}

          {eligible.includes(playerName) && myRoll != null && (
            <Text style={{ color: "#aaa", marginTop: 12 }}>
              Dein Ergebnis: 🎲 {myRoll} — warte auf andere Spieler…
            </Text>
          )}
        </>
      )}

      {isMonsterPhase && (
        <>
          {lobby.startPlayerName && (
            <Text
              style={{
                color: "#7fff7f",
                fontSize: 15,
                fontWeight: "bold",
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              🏁 Startspieler: {lobby.startPlayerName}
            </Text>
          )}

          <View style={{ flexDirection: "row", gap: 24, marginBottom: 16 }}>
            <StackPile
              label="Monsterstapel"
              count={lobby.monsterDeck?.length ?? 0}
              width={stackW}
              height={stackH}
            />
          </View>

          <Text style={{ color: "#ccc", marginBottom: 12, textAlign: "center" }}>
            Jeder zieht genau ein Monster ({monstersDone}/{players.length})
          </Text>

          <View style={{ width: "100%", maxWidth: 320, gap: 6 }}>
            {players.map((p) => (
              <View
                key={p.id || p.name}
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  backgroundColor: "rgba(0,0,0,0.35)",
                  padding: 8,
                  borderRadius: 6,
                }}
              >
                <Text style={{ color: "#fff" }}>{p.name}</Text>
                <Text style={{ color: p.monster ? "#7fff7f" : "#888" }}>
                  {p.monster ? "✅ Monster" : "⏳ offen"}
                </Text>
              </View>
            ))}
          </View>

          {canDrawMonster && (
            <TouchableOpacity onPress={onDrawMonster} style={btnStyle}>
              <Text style={{ fontWeight: "bold", color: "#2E1F12" }}>
                👹 Monster ziehen
              </Text>
            </TouchableOpacity>
          )}

          {me?.monster && monstersDone < players.length && (
            <Text style={{ color: "#aaa", marginTop: 12 }}>
              Warte, bis alle ein Monster gezogen haben…
            </Text>
          )}
        </>
      )}
    </View>
  );
}
