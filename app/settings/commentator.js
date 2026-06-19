import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { ScrollView, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  COMMENTATOR_STYLE_LABELS,
  COMMENTATOR_STYLE_ORDER,
} from "../../src/features/commentator/commentatorStyles";
import { useCommentatorSettings } from "../../src/features/commentator/useCommentatorSettings";
import { VOICE_PROFILE_ORDER, getVoiceProfilesList } from "../../src/features/commentator/voiceProfiles";
import { isVoiceProfileReady } from "../../src/features/commentator/voiceService";
import { hiddenHeaderScreenOptions } from "../../src/utils/stackScreenOptions";

export const options = hiddenHeaderScreenOptions;

const voiceProfiles = getVoiceProfilesList();

export default function CommentatorSettings() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings, loaded, updateSettings } = useCommentatorSettings();

  const voiceSectionEnabled =
    settings.commentatorEnabled && settings.voiceCommentatorEnabled;

  return (
    <LinearGradient
      colors={["#1a0033", "#000000"]}
      style={{
        flex: 1,
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 16,
        paddingHorizontal: 20,
      }}
    >
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Text style={{ color: "#b8d4ff", fontSize: 16 }}>← Zurück</Text>
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={{ color: "#fff", fontSize: 24, fontWeight: "bold", marginBottom: 8 }}>
          🎙️ Kommentator
        </Text>
        <Text style={{ color: "#ccc", fontSize: 14, marginBottom: 24 }}>
          Persönlichkeit und An/Aus — nur lokal auf diesem Gerät.
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Kommentator aktiv
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              Spielereignisse werden kommentiert
            </Text>
          </View>
          <Switch
            value={settings.commentatorEnabled}
            disabled={!loaded}
            onValueChange={(commentatorEnabled) => updateSettings({ commentatorEnabled })}
            trackColor={{ false: "#444", true: "#7a5cb8" }}
            thumbColor={settings.commentatorEnabled ? "#e8dcff" : "#ccc"}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
            opacity: settings.commentatorEnabled ? 1 : 0.55,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              AI-Kommentator
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              Dynamische Sprüche per API — Fallback auf lokale Texte
            </Text>
          </View>
          <Switch
            value={settings.useAiCommentator}
            disabled={!loaded || !settings.commentatorEnabled}
            onValueChange={(useAiCommentator) => updateSettings({ useAiCommentator })}
            trackColor={{ false: "#444", true: "#7a5cb8" }}
            thumbColor={settings.useAiCommentator ? "#e8dcff" : "#ccc"}
          />
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            opacity: settings.commentatorEnabled ? 1 : 0.55,
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600" }}>
              Sprachausgabe
            </Text>
            <Text style={{ color: "#aaa", fontSize: 12, marginTop: 4 }}>
              Kommentare vorlesen — OpenAI Onyx (Standard) oder ElevenLabs
            </Text>
          </View>
          <Switch
            value={settings.voiceCommentatorEnabled}
            disabled={!loaded || !settings.commentatorEnabled}
            onValueChange={(voiceCommentatorEnabled) =>
              updateSettings({ voiceCommentatorEnabled })
            }
            trackColor={{ false: "#444", true: "#7a5cb8" }}
            thumbColor={settings.voiceCommentatorEnabled ? "#e8dcff" : "#ccc"}
          />
        </View>

        <Text
          style={{
            color: "#fff",
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 12,
            opacity: voiceSectionEnabled ? 1 : 0.55,
          }}
        >
          Stimme
        </Text>

        {VOICE_PROFILE_ORDER.map((profileKey) => {
          const profile = voiceProfiles.find((p) => p.key === profileKey);
          if (!profile) return null;
          const selected = settings.voiceProfile === profileKey;
          const configured = isVoiceProfileReady(profileKey);

          return (
            <TouchableOpacity
              key={profileKey}
              disabled={!loaded || !voiceSectionEnabled}
              onPress={() => updateSettings({ voiceProfile: profileKey })}
              style={{
                backgroundColor: selected ? "#D9C9A3" : "rgba(255,255,255,0.08)",
                borderRadius: 10,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 10,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? "#5C4033" : "rgba(255,255,255,0.12)",
                opacity: loaded && voiceSectionEnabled ? 1 : 0.55,
              }}
            >
              <Text
                style={{
                  color: selected ? "#2E1F12" : "#fff",
                  fontSize: 15,
                  fontWeight: selected ? "bold" : "600",
                }}
              >
                {profile.name}
                {!configured ? " (API-Key fehlt)" : ""}
              </Text>
              <Text
                style={{
                  color: selected ? "#4a3a28" : "#aaa",
                  fontSize: 12,
                  marginTop: 4,
                }}
              >
                {profile.description}
              </Text>
            </TouchableOpacity>
          );
        })}

        <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", marginTop: 16, marginBottom: 12 }}>
          Stil
        </Text>

        {COMMENTATOR_STYLE_ORDER.map((styleKey) => {
          const selected = settings.commentatorStyle === styleKey;
          return (
            <TouchableOpacity
              key={styleKey}
              disabled={!loaded}
              onPress={() => updateSettings({ commentatorStyle: styleKey })}
              style={{
                backgroundColor: selected ? "#D9C9A3" : "rgba(255,255,255,0.08)",
                borderRadius: 10,
                paddingVertical: 14,
                paddingHorizontal: 16,
                marginBottom: 10,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? "#5C4033" : "rgba(255,255,255,0.12)",
                opacity: loaded ? 1 : 0.6,
              }}
            >
              <Text
                style={{
                  color: selected ? "#2E1F12" : "#fff",
                  fontSize: 15,
                  fontWeight: selected ? "bold" : "600",
                }}
              >
                {COMMENTATOR_STYLE_LABELS[styleKey]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}
