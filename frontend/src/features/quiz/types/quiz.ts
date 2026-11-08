import type { StudyActivityInput } from "../../../api/api.schemas.ts";

export type CreateQuizParams = {
  interactionId: number;
  data: StudyActivityInput;
};

export interface QuizQuestion {
  id: number;
  question: string;
  maxScore: number;
  userScore: number;
  explanation: string | null;
  attempt: string | null;
  options: QuizOption[];
}

export interface QuizOption {
  id: number;
  content: string;
  isCorrect: boolean;
}

export interface Quiz {
  id: number;
  studyActivityId: number;
  name: string;
  description: string;
  questions: QuizQuestion[];
  totalScore: number | null;
  isSubmitted: boolean;
  submittedAt: string | null;
  createdAt: string;
}

export interface QuizState {
  currentIndex: number;
  answers: (string | null)[]; // lưu câu trả lời người dùng cho từng câu
  status: "idle" | "answering" | "reviewing" | "submitted";
  selectedOption: string | null;
}
