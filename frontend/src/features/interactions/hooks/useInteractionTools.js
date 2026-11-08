import { useState } from "react";

import { useCreateEssay } from "../../open_ended/hooks/useCreateEssay";
import { useCreateQuiz } from "../../quiz/hooks/useQuiz";
import { resolveQuizError } from "../../quiz/utils/quizErrorHandler";
// Tương lai nhóm code xong thì mở comment ra:
// import { useCreateTTR } from "../../mindmap/hooks/useCreateTTR";
// import { useCreateFlashcard } from "../../flashcard/hooks/useCreateFlashcard";

export const useInteractionTools = (interactionId, onActivityCreated) => {
  // State lưu ID của tool đang được setup (null, 'essay', 'quiz'...)
  const [activeToolSetup, setActiveToolSetup] = useState(null);
  const [createToolError, setCreateToolError] = useState(null);

  // 1. Gọi các hooks của từng tính năng
  const { isCreatingEssay, handleCreateEssay } = useCreateEssay(
    interactionId,
    () => {
      setActiveToolSetup(null);
      if (onActivityCreated) onActivityCreated();
    },
  );

  const { mutate: createQuizMutate, isPending: isCreatingQuiz } =
    useCreateQuiz();

  const handleCreateQuiz = async (setupData) => {
    if (!interactionId) return;
    try {
      setCreateToolError(null);
      const payload = {
        subjectType: setupData?.subject,
        prompt: setupData?.prompt,
      };
      console.log("[useInteractionTools] Create quiz payload:", payload);
      const newQuiz = await createQuizMutate(interactionId, payload);
      console.log("[useInteractionTools] Created quiz:", newQuiz);
      if (newQuiz && newQuiz.id) {
        if (onActivityCreated) onActivityCreated();
      } else {
        console.error(
          "[useInteractionTools] Quiz creation did not return an id:",
          newQuiz,
        );
        setCreateToolError(
          "Hệ thống chưa trả về bài trắc nghiệm hợp lệ. Bé thử lại giúp Cú Mèo nhé.",
        );
      }
    } catch (error) {
      const { userMessage } = resolveQuizError(error, {
        action: "create",
        fallbackMessage: "Chưa tạo được bài trắc nghiệm. Bé thử lại sau nhé.",
        scope: "useInteractionTools.handleCreateQuiz",
      });
      setCreateToolError(userMessage);
    }
  };

  // Tương lai:
  // const { isCreatingQuiz, handleCreateQuiz } = useCreateQuiz(interactionId, onActivityCreated);
  // const { isCreatingTTR, handleCreateTTR } = useCreateTTR(interactionId, onActivityCreated);

  // 2. Hàm điều phối trung tâm
  const handleToolClick = (toolId) => {
    setCreateToolError(null);
    setActiveToolSetup(toolId);
  };

  const handleConfirmCreate = (setupData) => {
    if (activeToolSetup === "essay") {
      setActiveToolSetup(null); // Đóng bảng setup ngay lập tức
      handleCreateEssay(setupData);
      return;
    }
    if (activeToolSetup === "quiz") {
      setActiveToolSetup(null); // Đóng bảng setup ngay lập tức
      handleCreateQuiz(setupData);
      return;
    }
  };

  // 3. Gom trạng thái Loading của tất cả các nút lại thành 1 Object
  const toolLoadingStates = {
    essay: isCreatingEssay,
    quiz: isCreatingQuiz,
    // ttr: isCreatingTTR,
    // flashcard: false
  };

  // 4. Kiểm tra xem có BẤT KỲ tool nào đang chạy hay không để hiện màn hình chờ
  const isCreatingNewActivity = Object.values(toolLoadingStates).some(
    (state) => state === true,
  );

  return {
    activeToolSetup,
    setActiveToolSetup,
    createToolError,
    clearCreateToolError: () => setCreateToolError(null),
    handleToolClick,
    handleConfirmCreate,
    toolLoadingStates,
    isCreatingNewActivity,
  };
};