import axiosClient from "../../../api/axiosClient";
import {
  transformExerciseItem,
  transformStudyActivityDetail,
  transformStudyActivitySummary,
} from "../utils/quizHelpers";

const PATH = "/study-activity";

export const readQuizzes = async (interactionId) => {
  const response = await axiosClient.get(`${PATH}/${interactionId}/`);
  
  const filteredQuizzes = response.data.filter(
    (item) => item.activity_format === "MULTIPLE_CHOICE_QUESTIONS"
  );

  return filteredQuizzes.map(transformStudyActivitySummary);
};

export const createQuiz = async (interactionId, data) => {
  const documentId = data.document_id || 0; // 🎯 Lấy document_id

  const payload = {
    prompt: data.prompt || "",
    subject_type: data.subjectType || data.subject_type,
    activity_type: "EXERCISE",
    activity_format: "MULTIPLE_CHOICE_QUESTIONS",
    document_id: documentId // 🎯 Đẩy vào body
  };

  const response = await axiosClient.post(
    `${PATH}/${interactionId}/create`,
    payload,
  );
  return transformStudyActivityDetail(response.data);
};

export const readQuiz = async (studyActivityId) => {
  const response = await axiosClient.get(`${PATH}/${studyActivityId}`);
  return transformStudyActivityDetail(response.data);
};

export const updateQuiz = async (studyActivityId, data) => {
  const response = await axiosClient.patch(
    `${PATH}/${studyActivityId}/update`,
    data,
  );
  return transformStudyActivitySummary(response.data);
};

export const deleteQuiz = async (studyActivityId) => {
  await axiosClient.delete(`${PATH}/${studyActivityId}`);
  return true;
};

export const submitAnswer = async (exerciseItemId, attempt) => {
  const response = await axiosClient.patch(`${PATH}/${exerciseItemId}/answer`, {
    attempt,
  });
  return transformExerciseItem(response.data);
};

export const submitQuiz = async (studyActivityId) => {
  const response = await axiosClient.patch(`${PATH}/${studyActivityId}/submit`);
  return transformStudyActivityDetail(response.data);
};
