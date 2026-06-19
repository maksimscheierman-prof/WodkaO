import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  formatNoGoTopicsForInput,
  getConsentForPlayer,
  getFriendInputForAuthorTarget,
  ROAST_LEVEL_LABELS,
  ROAST_LEVELS,
  saveFriendInputForTarget,
  savePlayerCommentatorConsent,
} from "./commentatorPersonality";

const fieldStyle = {
  backgroundColor: "rgba(255,255,255,0.92)",
  borderRadius: 8,
  paddingHorizontal: 10,
  paddingVertical: 8,
  fontSize: 14,
  color: "#1a0033",
  marginTop: 6,
};

const labelStyle = {
  color: "#e8dcff",
  fontSize: 13,
  marginTop: 10,
};

function FriendInputBlock({ label, value, onChangeText, compact }) {
  return (
    <View style={{ marginTop: compact ? 8 : 10 }}>
      <Text style={labelStyle}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Optional"
        placeholderTextColor="#888"
        multiline
        style={[fieldStyle, { minHeight: compact ? 36 : 40 }]}
      />
    </View>
  );
}

export default function CommentatorLobbyPrepPanel({
  lobbyRef,
  lobbyData,
  me,
  players = [],
  disabled = false,
}) {
  const { width } = useWindowDimensions();
  const compact = width < 400;
  const panelWidth = Math.min(width - 40, 520);

  const [expanded, setExpanded] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);
  const [friendSavingId, setFriendSavingId] = useState(null);
  const [consentDraft, setConsentDraft] = useState(null);
  const [friendDrafts, setFriendDrafts] = useState({});

  const personality = lobbyData?.commentatorPersonality ?? null;
  const otherPlayers = useMemo(
    () => players.filter((p) => p.id && p.id !== me?.id),
    [players, me?.id]
  );

  useEffect(() => {
    if (!me?.id) return;
    const consent = getConsentForPlayer(personality, me.id);
    setConsentDraft({
      consentToPersonalComments: consent.consentToPersonalComments,
      roastLevel: consent.roastLevel,
      noGoTopicsText: formatNoGoTopicsForInput(consent.noGoTopics),
    });
  }, [me?.id, personality]);

  useEffect(() => {
    if (!me?.id) return;
    const next = {};
    for (const target of otherPlayers) {
      const input = getFriendInputForAuthorTarget(personality, me.id, target.id);
      next[target.id] = {
        suggestedNickname: input.suggestedNickname || "",
        typicalMoment: input.typicalMoment || "",
        runningJoke: input.runningJoke || "",
        harmlessRoast: input.harmlessRoast || "",
        oneLiner: input.oneLiner || "",
      };
    }
    setFriendDrafts(next);
  }, [me?.id, otherPlayers, personality]);

  if (!me?.id || !lobbyRef) return null;

  const saveConsent = async () => {
    if (!consentDraft || consentSaving || disabled) return;
    setConsentSaving(true);
    try {
      await savePlayerCommentatorConsent(lobbyRef, lobbyData, me.id, {
        consentToPersonalComments: consentDraft.consentToPersonalComments,
        roastLevel: consentDraft.roastLevel,
        noGoTopics: consentDraft.noGoTopicsText,
      });
    } catch (err) {
      console.error("[COMMENTATOR CONSENT SAVE]", err);
    } finally {
      setConsentSaving(false);
    }
  };

  const saveFriendInput = async (target) => {
    if (!target?.id || friendSavingId || disabled) return;
    const draft = friendDrafts[target.id];
    if (!draft) return;

    setFriendSavingId(target.id);
    try {
      await saveFriendInputForTarget(lobbyRef, lobbyData, me.id, target.id, draft);
    } catch (err) {
      console.error("[COMMENTATOR FRIEND INPUT SAVE]", err);
    } finally {
      setFriendSavingId(null);
    }
  };

  const updateFriendDraft = (targetId, field, value) => {
    setFriendDrafts((prev) => ({
      ...prev,
      [targetId]: {
        ...(prev[targetId] || {}),
        [field]: value,
      },
    }));
  };

  const roastOptions =
    consentDraft?.consentToPersonalComments
      ? ROAST_LEVELS.filter((level) => level !== "off")
      : ["off"];

  return (
    <View style={{ width: panelWidth, maxWidth: 520, marginTop: 20 }}>
      <TouchableOpacity
        onPress={() => setExpanded((v) => !v)}
        disabled={disabled}
        style={{
          backgroundColor: "rgba(255,255,255,0.1)",
          borderRadius: 12,
          padding: compact ? 12 : 14,
          borderWidth: 1,
          borderColor: "rgba(180, 140, 255, 0.35)",
        }}
      >
        <Text style={{ color: "#fff", fontSize: compact ? 15 : 16, fontWeight: "700" }}>
          🎙️ Kommentator vorbereiten {expanded ? "▲" : "▼"}
        </Text>
        <Text style={{ color: "#bbb", fontSize: 12, marginTop: 4 }}>
          Optional — überspringbar, blockiert den Start nicht.
        </Text>
      </TouchableOpacity>

      {expanded ? (
        <ScrollView
          style={{ maxHeight: compact ? 420 : 520, marginTop: 10 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: compact ? 12 : 14,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Deine Grenzen
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              Nur du kontrollierst, ob andere über dich persönliche Kommentare erlauben.
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <Text style={{ color: "#e8dcff", flex: 1, paddingRight: 8, fontSize: 13 }}>
                Persönliche Kommentare über mich erlauben
              </Text>
              <Switch
                value={!!consentDraft?.consentToPersonalComments}
                disabled={disabled || consentSaving}
                onValueChange={(consentToPersonalComments) =>
                  setConsentDraft((prev) => ({
                    ...prev,
                    consentToPersonalComments,
                    roastLevel:
                      consentToPersonalComments && prev.roastLevel === "off"
                        ? "mild"
                        : prev.roastLevel,
                  }))
                }
                trackColor={{ false: "#444", true: "#7a5cb8" }}
                thumbColor={consentDraft?.consentToPersonalComments ? "#e8dcff" : "#ccc"}
              />
            </View>

            <Text style={labelStyle}>Roast-Level</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {roastOptions.map((level) => {
                const active = consentDraft?.roastLevel === level;
                return (
                  <TouchableOpacity
                    key={level}
                    disabled={disabled || consentSaving}
                    onPress={() =>
                      setConsentDraft((prev) => ({ ...prev, roastLevel: level }))
                    }
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                      borderRadius: 8,
                      backgroundColor: active ? "#7a5cb8" : "rgba(255,255,255,0.12)",
                      borderWidth: 1,
                      borderColor: active ? "#e8dcff" : "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 11 }}>
                      {ROAST_LEVEL_LABELS[level] || level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={labelStyle}>No-Go-Themen (kommagetrennt)</Text>
            <TextInput
              value={consentDraft?.noGoTopicsText || ""}
              onChangeText={(noGoTopicsText) =>
                setConsentDraft((prev) => ({ ...prev, noGoTopicsText }))
              }
              editable={!disabled && !consentSaving}
              placeholder="z. B. Arbeit, Ex-Freund, Politik"
              placeholderTextColor="#888"
              style={fieldStyle}
            />

            <TouchableOpacity
              onPress={saveConsent}
              disabled={disabled || consentSaving}
              style={{
                marginTop: 14,
                backgroundColor: "#D9C9A3",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                opacity: disabled || consentSaving ? 0.6 : 1,
              }}
            >
              {consentSaving ? (
                <ActivityIndicator size="small" color="#2E1F12" />
              ) : (
                <Text style={{ color: "#2E1F12", fontWeight: "700" }}>Grenzen speichern</Text>
              )}
            </TouchableOpacity>
          </View>

          {otherPlayers.length === 0 ? (
            <Text style={{ color: "#aaa", fontSize: 13, textAlign: "center" }}>
              Warte auf weitere Spieler, um Inside-Joke-Fragen zu beantworten.
            </Text>
          ) : (
            otherPlayers.map((target) => {
              const draft = friendDrafts[target.id] || {};
              const saving = friendSavingId === target.id;
              return (
                <View
                  key={target.id}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.08)",
                    borderRadius: 12,
                    padding: compact ? 12 : 14,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                    Über {target.name}
                  </Text>
                  <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
                    Deine Antworten — {target.name} entscheidet selbst über Grenzen.
                  </Text>

                  <FriendInputBlock
                    compact={compact}
                    label={`Spitzname für ${target.name}`}
                    value={draft.suggestedNickname || ""}
                    onChangeText={(v) => updateFriendDraft(target.id, "suggestedNickname", v)}
                  />
                  <FriendInputBlock
                    compact={compact}
                    label={`Typischer ${target.name}-Moment`}
                    value={draft.typicalMoment || ""}
                    onChangeText={(v) => updateFriendDraft(target.id, "typicalMoment", v)}
                  />
                  <FriendInputBlock
                    compact={compact}
                    label={`Running Gag zu ${target.name}`}
                    value={draft.runningJoke || ""}
                    onChangeText={(v) => updateFriendDraft(target.id, "runningJoke", v)}
                  />
                  <FriendInputBlock
                    compact={compact}
                    label={`Harmloser Roast über ${target.name}`}
                    value={draft.harmlessRoast || ""}
                    onChangeText={(v) => updateFriendDraft(target.id, "harmlessRoast", v)}
                  />
                  <FriendInputBlock
                    compact={compact}
                    label={`Ein Satz, der ${target.name} beschreibt`}
                    value={draft.oneLiner || ""}
                    onChangeText={(v) => updateFriendDraft(target.id, "oneLiner", v)}
                  />

                  <TouchableOpacity
                    onPress={() => saveFriendInput(target)}
                    disabled={disabled || saving}
                    style={{
                      marginTop: 14,
                      backgroundColor: "#D9C9A3",
                      borderRadius: 10,
                      paddingVertical: 10,
                      alignItems: "center",
                      opacity: disabled || saving ? 0.6 : 1,
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#2E1F12" />
                    ) : (
                      <Text style={{ color: "#2E1F12", fontWeight: "700" }}>
                        Antworten für {target.name} speichern
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
