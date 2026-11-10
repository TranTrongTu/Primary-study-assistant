import { useState, useCallback } from "react";
import { quizService } from "../services/quiz.service";

const useMutationState = (fn) => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  // Wrap with useCallback to maintain a stable reference across re-renders.
  // This prevents infinite loops when the returned mutate function is used inside useEffect dependencies.
  const mutate = useCallback(async (...args) => {
    setIsPending(true);
    setError(null);
    try {
      const result = await fn(...args);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsPending(false);
    }
  }, [fn]); 

  return { mutate, isPending, error, data };
};

export const useReadQuizzes = () => useMutationState(quizService.readQuizzes);
export const useCreateQuiz = () => useMutationState(quizService.createQuiz);
export const useGetQuiz = () => useMutationState(quizService.readQuiz);
export const useUpdateQuiz = () => useMutationState(quizService.updateQuiz);
export const useDeleteQuiz = () => useMutationState(quizService.deleteQuiz);
export const useSubmitAnswer = () => useMutationState(quizService.submitAnswer);
export const useSubmitQuiz = () => useMutationState(quizService.submitQuiz);