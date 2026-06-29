import { deleteField, updateDoc } from "firebase/firestore";
import { withActivity } from "../../utils/lobbyLifecycle";
import {
  getConsentFirestorePath,
  getFriendInputFirestorePath,
  mergeConsentPatch,
  mergeFriendInputPatch,
  sanitizeFriendInput,
  sanitizePlayerCommentatorSettings,
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
  getConsentFirestorePath,
  getFriendInputFirestorePath,
  parseNoGoTopicsInput,
  sanitizeFriendInput,
  sanitizePlayerCommentatorSettings,
} from "./commentatorPersonalityCore";

export async function savePlayerCommentatorConsent(
  lobbyRef,
  _lobbyData,
  playerId,
  rawConsent
) {
  const consent = sanitizePlayerCommentatorSettings(playerId, rawConsent);
  if (!consent) return null;

  await updateDoc(
    lobbyRef,
    withActivity({
      [getConsentFirestorePath(playerId)]: consent,
    })
  );
  return mergeConsentPatch(_lobbyData?.commentatorPersonality, playerId, rawConsent);
}

export async function saveFriendInputForTarget(
  lobbyRef,
  _lobbyData,
  authorPlayerId,
  targetPlayerId,
  rawInput
) {
  const input = sanitizeFriendInput(authorPlayerId, targetPlayerId, rawInput);
  const path = getFriendInputFirestorePath(authorPlayerId, targetPlayerId);

  await updateDoc(
    lobbyRef,
    withActivity({
      [path]: input ?? deleteField(),
    })
  );

  return mergeFriendInputPatch(
    _lobbyData?.commentatorPersonality,
    authorPlayerId,
    targetPlayerId,
    rawInput
  );
}
