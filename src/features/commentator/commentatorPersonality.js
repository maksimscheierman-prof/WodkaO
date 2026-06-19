import { updateDoc } from "firebase/firestore";
import { withActivity } from "../../utils/lobbyLifecycle";
import {
  mergeConsentPatch,
  mergeFriendInputPatch,
} from "./commentatorPersonalityCore";

export {
  ROAST_LEVELS,
  ROAST_LEVEL_LABELS,
  allowsPersonalComments,
  collectFriendInputsAboutPlayer,
  formatNoGoTopicsForInput,
  getConsentForPlayer,
  getDefaultConsentSettings,
  getFriendInputForAuthorTarget,
  parseNoGoTopicsInput,
  sanitizeFriendInput,
  sanitizePlayerCommentatorSettings,
} from "./commentatorPersonalityCore";

export async function savePlayerCommentatorConsent(lobbyRef, lobbyData, playerId, rawConsent) {
  const personality = mergeConsentPatch(lobbyData?.commentatorPersonality, playerId, rawConsent);
  if (!personality) return null;

  await updateDoc(lobbyRef, withActivity({ commentatorPersonality: personality }));
  return personality;
}

export async function saveFriendInputForTarget(
  lobbyRef,
  lobbyData,
  authorPlayerId,
  targetPlayerId,
  rawInput
) {
  const personality = mergeFriendInputPatch(
    lobbyData?.commentatorPersonality,
    authorPlayerId,
    targetPlayerId,
    rawInput
  );

  await updateDoc(lobbyRef, withActivity({ commentatorPersonality: personality }));
  return personality;
}
