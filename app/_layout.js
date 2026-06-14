import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import ErrorBoundary from "../src/components/ErrorBoundary";
import TestAccessGate from "../src/components/TestAccessGate";
import { useTestAccess } from "../src/hooks/useTestAccess";

const stackScreenOptions = {
  headerShown: false,
  contentStyle: { backgroundColor: "#1a0033" },
  animation: "fade",
};

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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
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
          <Stack screenOptions={stackScreenOptions} />
        )}
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
