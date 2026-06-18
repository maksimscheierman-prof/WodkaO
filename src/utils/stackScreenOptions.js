import { Platform } from "react-native";

/** Shared stack options — no native header on any platform. */
export const hiddenHeaderScreenOptions = {
  headerShown: false,
  title: "",
};

export const stackScreenOptions = {
  ...hiddenHeaderScreenOptions,
  contentStyle: { backgroundColor: "#1a0033" },
  animation: "fade",
  ...(Platform.OS === "web"
    ? {
        header: () => null,
        headerTitle: "",
        headerShadowVisible: false,
        headerStyle: {
          height: 0,
          maxHeight: 0,
          backgroundColor: "#1a0033",
        },
      }
    : {}),
};
