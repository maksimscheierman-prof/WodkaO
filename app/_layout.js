import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "../src/components/ErrorBoundary";
import TestAccessGate from "../src/components/TestAccessGate";
import { useTestAccess } from "../src/hooks/useTestAccess";
import {
  hiddenHeaderScreenOptions,
  stackScreenOptions,
} from "../src/utils/stackScreenOptions";

const screenEntries = [
  "index",
  "lobby",
  "game",
  "gallery",
  "settings/timers",
  "settings/commentator",
  "session-summary",
];

export default function Layout() {
  const [fontsLoaded] = useFonts({
    DidactGothic: require("../assets/fonts/DidactGothic-Regular.ttf"),
  });
  const {
    checked,
    granted,
    gateRequired,
    blockReason,
    onAccessGranted,
    resetAccess,
  } = useTestAccess();

  if (!fontsLoaded || (gateRequired && !checked)) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#1a0033",
        }}
      >
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ErrorBoundary>
        {gateRequired && !granted ? (
          <TestAccessGate
            onSuccess={onAccessGranted}
            onReset={resetAccess}
            blockReason={blockReason}
          />
        ) : (
          <Stack screenOptions={stackScreenOptions}>
            {screenEntries.map((name) => (
              <Stack.Screen
                key={name}
                name={name}
                options={hiddenHeaderScreenOptions}
              />
            ))}
          </Stack>
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
