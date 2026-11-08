import { parseBackendError, logBackendError } from "../../../utils/backendError";
import { getQuizErrorInfo } from "./quizErrorMessages";

export const resolveQuizError = (error, options = {}) => {
  const { action, fallbackMessage, scope } = options;

  const parsed = parseBackendError(error);
  const info = getQuizErrorInfo(parsed, action, { fallbackMessage });

  if (scope) {
    logBackendError(scope, parsed, { isDeveloperFix: info.isDeveloperFix });
  }

  return {
    ...info,
    parsed,
  };
};
