import { useCallback, useEffect, useState } from "react";
import {
  useReadQuizzes,
  useCreateQuiz,
  useGetQuiz,
  useUpdateQuiz,
  useDeleteQuiz,
} from "./useQuiz";
import { parseBackendError, logBackendError, setErrorFromParsed } from "../../../utils/backendError";

const useQuizManagement = (interactionId) => {
  // Local state to keep the UI snappy (Optimistic Updates)
  const [quizzes, setQuizzes] = useState([]);
  const [globalError, setGlobalError] = useState(null);

  // Initialize API hooks (No more manual try/catch/finally needed)
  const { mutate: fetchQuizzes, isPending: isFetching } = useReadQuizzes();
  const { mutate: createQuiz, isPending: isCreating } = useCreateQuiz();
  const { mutate: fetchQuizDetail, isPending: isFetchingDetail } = useGetQuiz();
  const { mutate: updateQuiz, isPending: isUpdating } = useUpdateQuiz();
  const { mutate: deleteQuiz, isPending: isDeleting } = useDeleteQuiz();

  // Combined loading state to keep backward compatibility with QuizPanel
  const isLoading =
    isFetching || isCreating || isFetchingDetail || isUpdating || isDeleting;

  const loadQuizzes = useCallback(async () => {
    if (!interactionId) return;
    setGlobalError(null);

    try {
      const data = await fetchQuizzes(interactionId);
      setQuizzes(data);
    } catch (error) {
      const parsed = parseBackendError(error, "Không tải được danh sách trắc nghiệm. Bé thử lại sau nhé.");
      logBackendError("useQuizManagement.loadQuizzes", parsed);
      setErrorFromParsed(setGlobalError, parsed);
    }
  }, [interactionId, fetchQuizzes]);

  useEffect(() => {
    setQuizzes([]);
    if (interactionId) {
      loadQuizzes();
    }
  }, [interactionId, loadQuizzes]);

  const createNewQuiz = async (data) => {
    if (!interactionId) return null;

    try {
      const newQuiz = await createQuiz(interactionId, data);
      setQuizzes((prev) => [newQuiz, ...prev]); // New quiz appears at the top
      return newQuiz;
    } catch (error) {
      const parsed = parseBackendError(error, "Chưa tạo được bài trắc nghiệm mới. Bé thử lại nhé.");
      logBackendError("useQuizManagement.createNewQuiz", parsed);
      setErrorFromParsed(setGlobalError, parsed);
      return null;
    }
  };

  const loadQuizDetail = async (quizId) => {
    try {
      const detail = await fetchQuizDetail(quizId);
      setQuizzes((prev) =>
        prev.map((item) => (item.id === detail.id ? detail : item)),
      );
      return detail;
    } catch (error) {
      const parsed = parseBackendError(error, "Không tải được chi tiết bài trắc nghiệm. Bé thử lại nhé.");
      logBackendError("useQuizManagement.loadQuizDetail", parsed);
      
      if (parsed.status === 404) {
        setQuizzes((prev) => prev.filter((item) => item.id !== quizId));
      }
      setErrorFromParsed(setGlobalError, parsed);
      return null;
    }
  };

  const removeQuiz = async (quizId) => {
    if (!interactionId) return null;

    try {
      await deleteQuiz(quizId);
      setQuizzes((prev) => prev.filter((item) => item.id !== quizId));
      return true;
    } catch (error) {
      const parsed = parseBackendError(error, "Chưa xóa được bài trắc nghiệm. Bé thử lại nhé.");
      logBackendError("useQuizManagement.removeQuiz", parsed);
      
      if (parsed.status === 404) {
        setQuizzes((prev) => prev.filter((item) => item.id !== quizId));
      }
      setErrorFromParsed(setGlobalError, parsed);
      return null;
    }
  };

  const updateQuizMeta = async (quizId, data) => {
    if (!interactionId) return null;

    try {
      const updated = await updateQuiz(quizId, data);
      setQuizzes((prev) =>
        prev.map((item) =>
          item.id === updated.id
            ? {
                ...item,
                name: updated.name,
                title: updated.title,
                description: updated.description,
              }
            : item,
        ),
      );
      return updated;
    } catch (error) {
      const parsed = parseBackendError(error, "Chưa cập nhật được thông tin bài trắc nghiệm. Bé thử lại nhé.");
      logBackendError("useQuizManagement.updateQuizMeta", parsed);
      
      if (parsed.status === 404) {
        setQuizzes((prev) => prev.filter((item) => item.id !== quizId));
      }
      setErrorFromParsed(setGlobalError, parsed);
      return null;
    }
  };

  const updateQuizInList = (updatedQuiz) => {
    setQuizzes((prev) =>
      prev.map((item) => (item.id === updatedQuiz.id ? updatedQuiz : item)),
    );
  };

  return {
    quizzes,
    isLoading,   // For general UI blocking
    isFetching,  // Specific states for granular UI control (e.g. skeleton loading)
    isCreating,  // e.g. Show spinner only on the 'Create' button
    isDeleting,  // e.g. Show spinner on the specific trash bin icon
    isUpdating,  
    error: globalError,
    clearError: () => setGlobalError(null),
    createNewQuiz,
    removeQuiz,
    loadQuizDetail,
    updateQuizMeta,
    updateQuizInList,
  };
};

export default useQuizManagement;