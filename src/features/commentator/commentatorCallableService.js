import { httpsCallable } from "firebase/functions";
import { functions } from "../../../firebaseConfig";
import {
  buildCallableRequest,
  CALLABLE_FUNCTION_NAME,
  executeCallableCall,
} from "./commentatorCallableCore";

/**
 * Request AI commentary via Firebase Callable (no client API key).
 * @returns {Promise<string|null>} comment text or null → caller uses local fallback
 */
export async function fetchCommentaryViaCallable(input) {
  const payload = buildCallableRequest(input);
  const callable = httpsCallable(functions, CALLABLE_FUNCTION_NAME);
  const { comment, error } = await executeCallableCall(
    (body) => callable(body),
    payload
  );

  if (error) {
    console.warn("[COMMENTATOR CALLABLE]", error.code, error.message);
  }

  return comment;
}

export {
  buildCallableRequest,
  mapCallableError,
  CALLABLE_FUNCTION_NAME,
} from "./commentatorCallableCore";
