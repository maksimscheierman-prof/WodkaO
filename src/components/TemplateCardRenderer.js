import { useMemo } from "react";
import { normalizeCardForDisplay } from "../utils/cardDisplay";
import { resolveCardFrameType } from "../utils/cardFrame";
import ScaledTemplateCard from "./ScaledTemplateCard";

/**
 * Shared template card renderer — modal, voting, reaction phase.
 * Normalizes card data, picks frame, scales without transform.
 */
export default function TemplateCardRenderer({
  card,
  fallbackType = "magic",
  maxWidth,
  maxHeight,
  modalArtwork = false,
}) {
  const normalized = useMemo(
    () => normalizeCardForDisplay(card, { defaultType: fallbackType }),
    [card, fallbackType]
  );

  const displayType = useMemo(() => {
    if (!normalized) return fallbackType;
    return resolveCardFrameType(normalized.type, fallbackType);
  }, [normalized, fallbackType]);

  if (!normalized) return null;

  return (
    <ScaledTemplateCard
      maxWidth={maxWidth}
      maxHeight={maxHeight}
      modalArtwork={modalArtwork}
      title={normalized.name}
      description={normalized.effect}
      image={normalized.image}
      type={displayType}
      atk={normalized.atk}
      def={normalized.def}
      stars={normalized.stars}
      monsterType={normalized.monsterType}
    />
  );
}
