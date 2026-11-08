import { useMutation } from "@tanstack/react-query";
import { quizService } from "../services/quiz.service.ts";
import type { CreateQuizParams } from "../types/quiz.ts";

export const useCreateQuiz = () => {
  return useMutation({
    mutationFn: ({ interactionId, data }: CreateQuizParams) =>
      quizService.createQuiz(interactionId, data),
  });
};

export const useGetQuiz = () => {
  return useMutation({
    mutationFn: (quizId: number) => quizService.getQuiz(quizId),
  });
};

export const useSubmitAnswer = () => {
  return useMutation({
    mutationFn: ({
      exerciseItemId,
      attempt,
    }: {
      exerciseItemId: number;
      attempt: string | number;
    }) => quizService.submitAnswer(exerciseItemId, attempt),
  });
};

export const useSubmitQuiz = () => {
  return useMutation({
    mutationFn: (quizId: number) => quizService.submitQuiz(quizId),
  });
};

export const useDeleteQuiz = () => {
  return useMutation({
    mutationFn: (quizId: number) => quizService.deleteQuiz(quizId),
  });
};
