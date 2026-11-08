import { getFastAPI } from "../../../api/api.ts";
import type { StudyActivityInput } from "../../../api/api.schemas.ts";

const api = getFastAPI();

export const quizService = {
  createQuiz: async (interactionId: number, data: StudyActivityInput) => {
    const res =
      await api.createStudyActivityStudyActivityInteractionIdCreatePost(
        interactionId,
        data,
        {
          baseURL: "http://localhost:8000",
        },
      );

    return res.data;
  },

  getQuiz: async (quizId: number) => {
    const res =
      await api.readStudyActivityCompleteStudyActivityStudyActivityIdGet(
        quizId,
        {
          baseURL: "http://localhost:8000",
        },
      );

    return res.data;
  },

  getAllQuizzes: async (interactionId: number) => {
    const res = await api.readAllStudyActivityStudyActivityInteractionIdGet(
      interactionId,
      {
        baseURL: "http://localhost:8000",
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
          baseURL: "http://localhost:8000",
        },
      );

    return res.data;
  },

  submitQuiz: async (quizId: number) => {
    const res =
      await api.submitExerciseActivityStudyActivityStudyActivityIdSubmitPatch(
        quizId,
        {
          baseURL: "http://localhost:8000",
        },
      );

    return res.data;
  },

  deleteQuiz: async (quizId: number) => {
    const res = await api.deleteStudyActivityStudyActivityStudyActivityIdDelete(
      quizId,
      {
        baseURL: "http://localhost:8000",
      },
    );

    return res.data;
  },
};
