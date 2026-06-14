import { useCallback, useEffect } from "react";
import { Alert, BackHandler } from "react-native";

const LEAVE_TITLE = "Willst du das Spiel wirklich verlassen?";

/** @param {() => void | Promise<void>} onConfirmLeave */
export function confirmLeaveGame(onConfirmLeave) {
  Alert.alert(LEAVE_TITLE, undefined, [
    { text: "Nein", style: "cancel" },
    {
      text: "Ja",
      style: "destructive",
      onPress: () => {
        Promise.resolve(onConfirmLeave()).catch((err) =>
          console.error("[GAME LEAVE]", err)
        );
      },
    },
  ]);
}

/**
 * Android hardware back → confirm dialog (blocks default navigation).
 * @param {() => void} onRequestLeave — should open confirm dialog
 * @param {boolean} [enabled=true]
 */
export function useGameExitGuard(onRequestLeave, enabled = true) {
  const handleBack = useCallback(() => {
    onRequestLeave();
    return true;
  }, [onRequestLeave]);

  useEffect(() => {
    if (!enabled) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", handleBack);
    return () => sub.remove();
  }, [enabled, handleBack]);
}
