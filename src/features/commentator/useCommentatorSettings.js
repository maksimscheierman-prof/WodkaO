import { useCallback, useEffect, useState } from "react";
import { DEFAULT_COMMENTATOR_SETTINGS, sanitizeCommentatorSettings } from "./commentatorSettingsCore";
import {
  loadCommentatorSettings,
  saveCommentatorSettings,
} from "./commentatorSettingsStorage";

export function useCommentatorSettings() {
  const [settings, setSettings] = useState({ ...DEFAULT_COMMENTATOR_SETTINGS });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadCommentatorSettings().then((next) => {
      if (!active) return;
      setSettings(next);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateSettings = useCallback(async (patch) => {
    setSettings((prev) => {
      const next = sanitizeCommentatorSettings({ ...prev, ...patch });
      saveCommentatorSettings(next).catch(() => {});
      return next;
    });
  }, []);

  return { settings, loaded, updateSettings };
}
