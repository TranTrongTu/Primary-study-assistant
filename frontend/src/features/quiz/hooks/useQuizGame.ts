import { useState, useCallback, useMemo } from "react";
import type { QuizState } from "../types/quiz.ts";

/**
 * Hook quản lý game state cho quiz: current question, answers, status
 * @param {Array} questions - Mảng quiz questions từ backend
 * @returns {Object} - currentQuestion, navigation, answer handling, progress
 */
export const useQuizGame = (questions: any[] = []) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(string | null)[]>(() =>
    new Array(questions.length).fill(null),
  );
  const [status, setStatus] = useState<
    "idle" | "answering" | "reviewing" | "submitted"
  >("answering");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Đảm bảo questions là mảng
  const questionsList = useMemo(() => {
    return Array.isArray(questions) ? questions : [];
  }, [questions]);

  // Lấy câu hỏi hiện tại
  const currentQuestion = questionsList[currentIndex];

  // Chọn option
  const handleSelectOption = useCallback(
    (optionId: string | number) => {
      if (status === "submitted") return; // Không cho chọn nếu đã nộp bài

      const optionIdStr = String(optionId);
      setSelectedOption(optionIdStr);

      // Cập nhật answer cho câu hỏi hiện tại
      setAnswers((prev) => {
        const newAnswers = [...prev];
        newAnswers[currentIndex] = optionIdStr;
        return newAnswers;
      });
    },
    [currentIndex, status],
  );

  // Chuyển sang câu tiếp theo
  const nextQuestion = useCallback(() => {
    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
    }
  }, [currentIndex, questionsList.length]);

  // Quay lại câu trước
  const prevQuestion = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setSelectedOption(null);
    }
  }, [currentIndex]);

  // Jump tới câu hỏi cụ thể
  const jumpToQuestion = useCallback(
    (index: number) => {
      if (index >= 0 && index < questionsList.length) {
        setCurrentIndex(index);
        setSelectedOption(null);
      }
    },
    [questionsList.length],
  );

  // Reset quiz
  const resetQuiz = useCallback(() => {
    setCurrentIndex(0);
    setAnswers(new Array(questionsList.length).fill(null));
    setStatus("answering");
    setSelectedOption(null);
  }, [questionsList.length]);

  // Tính toán các giá trị dùng cho UI
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questionsList.length - 1;
  const progress =
    questionsList.length > 0
      ? ((currentIndex + 1) / questionsList.length) * 100
      : 0;
  const answeredCount = answers.filter((a) => a !== null).length;

  return {
    // State
    currentQuestion,
    currentIndex,
    answers,
    status,
    selectedOption,

    // Navigation
    nextQuestion,
    prevQuestion,
    jumpToQuestion,

    // Actions
    handleSelectOption,
    setStatus,
    resetQuiz,

    // UI info
    isFirst,
    isLast,
    progress,
    totalQuestions: questionsList.length,
    answeredCount,
  };
};
