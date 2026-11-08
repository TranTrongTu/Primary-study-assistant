import { useState, useCallback } from "react";
import { quizService } from "../services/quiz.service";

const createMutation = (fn) => {
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

export const useReadQuizzes = () => createMutation(quizService.readQuizzes);
export const useCreateQuiz = () => createMutation(quizService.createQuiz);
export const useGetQuiz = () => createMutation(quizService.readQuiz);
export const useUpdateQuiz = () => createMutation(quizService.updateQuiz);
export const useDeleteQuiz = () => createMutation(quizService.deleteQuiz);
export const useSubmitAnswer = () => createMutation(quizService.submitAnswer);
export const useSubmitQuiz = () => createMutation(quizService.submitQuiz);