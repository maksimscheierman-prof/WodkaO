import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";
import {
  getGateBlockReason,
  isGateRequiredForPlatform,
} from "../utils/testAccessCore";
import {
  clearTestAccess,
  grantTestAccess,
  hasTestAccess,
} from "../utils/testAccessStorage";

export function useTestAccess() {
  const gateRequired = isGateRequiredForPlatform(Platform.OS, __DEV__);
  const blockReason = getGateBlockReason(__DEV__);
  const [checked, setChecked] = useState(!gateRequired);
  const [granted, setGranted] = useState(!gateRequired);

  useEffect(() => {
    if (!gateRequired) {
      setGranted(true);
      setChecked(true);
      return;
    }

    let active = true;
    hasTestAccess().then((ok) => {
      if (!active) return;
      setGranted(ok);
      setChecked(true);
    });

    return () => {
      active = false;
    };
  }, [gateRequired]);

  const onAccessGranted = useCallback(async () => {
    await grantTestAccess();
    setGranted(true);
  }, []);

  const resetAccess = useCallback(async () => {
    await clearTestAccess();
    setGranted(false);
  }, []);

  return {
    checked,
    granted,
    gateRequired,
    blockReason,
    onAccessGranted,
    resetAccess,
  };
}
