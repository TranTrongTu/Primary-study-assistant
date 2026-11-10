import { getFastAPI } from "../../../api/api.ts";
import type { StudyActivityInput } from "../../../api/api.schemas.ts";

const api = getFastAPI();

// Generated client paths already start with /api, so strip it from VITE_API_URL
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? "").replace(/\/api\/?$/, "");

export const quizService = {
  createQuiz: async (interactionId: number, data: StudyActivityInput) => {
    const res =
      await api.createStudyActivityStudyActivityInteractionIdCreatePost(
        interactionId,
        data,
        {
          baseURL: API_ORIGIN,
        },
      );

    return res.data;
  },

  getQuiz: async (quizId: number) => {
    const res =
      await api.readStudyActivityCompleteStudyActivityStudyActivityIdGet(
        quizId,
        {
          baseURL: API_ORIGIN,
        },
      );

    return res.data;
  },

  getAllQuizzes: async (interactionId: number) => {
    const res = await api.readAllStudyActivityStudyActivityInteractionIdGet(
      interactionId,
      {
        baseURL: API_ORIGIN,
      },
    );

    return res.data;
  },

  submitAnswer: async (exerciseItemId: number, attempt: string | number) => {
    const res =
      await api.answerExerciseItemStudyActivityExerciseItemIdAnswerPatch(
        exerciseItemId,
        { attempt },
        {
          baseURL: API_ORIGIN,
        },
      );

    return res.data;
  },

  submitQuiz: async (quizId: number) => {
    const res =
      await api.submitExerciseActivityStudyActivityStudyActivityIdSubmitPatch(
        quizId,
        {
          baseURL: API_ORIGIN,
        },
      );

    return res.data;
  },

  deleteQuiz: async (quizId: number) => {
    const res = await api.deleteStudyActivityStudyActivityStudyActivityIdDelete(
      quizId,
      {
        baseURL: API_ORIGIN,
      },
    );

    return res.data;
  },
};
