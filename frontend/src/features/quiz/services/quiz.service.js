import * as quizAPI from "../api/quizAPI";

export const quizService = {
  readQuizzes: (interactionId) => quizAPI.readQuizzes(interactionId),
  createQuiz: (interactionId, data) => quizAPI.createQuiz(interactionId, data),
  readQuiz: (studyActivityId) => quizAPI.readQuiz(studyActivityId),
  updateQuiz: (studyActivityId, data) =>
    quizAPI.updateQuiz(studyActivityId, data),
  deleteQuiz: (studyActivityId) => quizAPI.deleteQuiz(studyActivityId),
  submitAnswer: (exerciseItemId, attempt) =>
    quizAPI.submitAnswer(exerciseItemId, attempt),
  submitQuiz: (studyActivityId) => quizAPI.submitQuiz(studyActivityId),
};
