import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import CommentatorSessionSummary from "../src/features/commentator/CommentatorSessionSummary";
import {
  computeSessionAwards,
  resolveSessionIntro,
} from "../src/features/commentator/commentatorAwards";
import {
  clearCommentatorSessionReport,
  loadCommentatorSessionReport,
} from "../src/features/commentator/commentatorSessionReportStorage";
import { speakCommentary, stopCommentaryVoice } from "../src/features/commentator/voiceService";
import { hiddenHeaderScreenOptions } from "../src/utils/stackScreenOptions";

export const options = hiddenHeaderScreenOptions;

export default function SessionSummary() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const playerName = Array.isArray(params.playerName)
    ? params.playerName[0]
    : params.playerName;

  const [loading, setLoading] = useState(true);
  const [intro, setIntro] = useState("");
  const [awards, setAwards] = useState([]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const report = await loadCommentatorSessionReport();
        if (!active) return;

        if (!report?.sessionStats) {
          router.replace({ pathname: "/", params: { playerName } });
          return;
        }

        const reportSettings = report.settings || {};

        const computed = computeSessionAwards(
          report.sessionStats,
          reportSettings.commentatorStyle || "locker",
          {
            commentatorPersonality: report.commentatorPersonality,
            players: report.players,
          }
        );
        setAwards(computed);

        const introText = await resolveSessionIntro({
          awards: computed,
          settings: reportSettings,
          sessionStats: report.sessionStats,
        });
        if (!active) return;
        setIntro(introText);

        if (reportSettings.voiceCommentatorEnabled && introText) {
          speakCommentary(introText, reportSettings).catch(() => {});
        }
      } catch (err) {
        console.warn("[SESSION SUMMARY]", err?.message || err);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
      stopCommentaryVoice().catch(() => {});
    };
  }, [playerName, router]);

  const handleDone = async () => {
    await stopCommentaryVoice().catch(() => {});
    await clearCommentatorSessionReport();
    router.replace({ pathname: "/", params: { playerName } });
  };

  if (loading) {
    return (
      <LinearGradient colors={["#1a0033", "#000000"]} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={{ color: "#ccc", marginTop: 12 }}>Abschlussbericht wird erstellt…</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#1a0033", "#000000"]} style={{ flex: 1 }}>
      <CommentatorSessionSummary
        intro={intro}
        awards={awards}
        onDone={handleDone}
      />
    </LinearGradient>
  );
}
