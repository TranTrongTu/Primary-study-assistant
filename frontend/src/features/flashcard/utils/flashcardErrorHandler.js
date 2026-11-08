import { parseBackendError, logBackendError } from "../../../utils/backendError";
import { getFlashcardErrorInfo } from "./flashcardErrorMessages";

export const resolveFlashcardError = (error, options = {}) => {
    const { action, fallbackMessage, scope } = options;

    const parsed = parseBackendError(error);
    const info = getFlashcardErrorInfo(parsed, action, { fallbackMessage });

    if (scope) {
        logBackendError(scope, parsed, { isDeveloperFix: info.isDeveloperFix });
    }

    return {
        ...info,
        parsed,
    };
};