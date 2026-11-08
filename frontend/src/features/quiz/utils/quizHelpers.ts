/**
 * Utility functions cho quiz feature
 */

/**
 * Tính điểm dựa trên number of correct answers
 */
export const calculateScore = (
  questions: any[],
  answers: (string | null)[],
): number => {
  let totalScore = 0;

  questions.forEach((question, index) => {
    const selectedOptionId = answers[index];
    if (selectedOptionId) {
      const correctOption = question.options?.find((opt: any) => opt.isCorrect);
      if (
        correctOption &&
        String(correctOption.id) === String(selectedOptionId)
      ) {
        totalScore += question.maxScore || 0;
      }
    }
  });

  return totalScore;
};

/**
 * Tính phần trăm hoàn thành quiz
 */
export const calculateProgress = (
  currentIndex: number,
  totalQuestions: number,
): number => {
  if (totalQuestions === 0) return 0;
  return ((currentIndex + 1) / totalQuestions) * 100;
};

/**
 * Định dạng điểm thành string với % chắc chắn
 */
export const formatScore = (score: number, maxScore: number): string => {
  if (maxScore === 0) return "0%";
  const percentage = Math.round((score / maxScore) * 100);
  return `${percentage}%`;
};

/**
 * Check xem quiz đã hoàn thành chưa (tất cả câu đã trả lời)
 */
export const isQuizComplete = (answers: (string | null)[]): boolean => {
  return answers.every((answer) => answer !== null && answer !== "");
};

/**
 * Map question format type sang Vietnamese label
 */
export const getActivityFormatLabel = (format: string): string => {
  const labels: Record<string, string> = {
    MULTIPLE_CHOICE_QUESTIONS: "Trắc nghiệm",
    OPEN_ENDED: "Tự luận",
    FLASHCARDS: "Thẻ ghi nhớ",
    TAP_TO_REVIEW: "Tập điền lỗ",
  };
  return labels[format] || format;
};

/**
 * Get badge color cho activity type
 */
export const getActivityTypeBadgeColor = (type: string): string => {
  const colors: Record<string, string> = {
    EXERCISE: "bg-red-100 text-red-800",
    REVIEW: "bg-blue-100 text-blue-800",
  };
  return colors[type] || "bg-gray-100 text-gray-800";
};
