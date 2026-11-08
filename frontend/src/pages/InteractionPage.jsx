import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";

// ==========================================
// 1. IMPORTS HOOKS
// ==========================================
import { useInteractions } from "../features/interactions/hooks/useInteractions";
import { useDocuments } from "../features/documents/hooks/useDocuments";
import { useChat } from "../features/chat/hooks/useChat";
import useFlashcardSetManagement from "../features/flashcard/hooks/useFlashcardSetManagement";
import { useStudyActivities } from "../features/open_ended/hooks/useStudyActivities";
import { useInteractionTools } from "../features/interactions/hooks/useInteractionTools";

// ==========================================
// 2. IMPORTS COMPONENTS
// ==========================================
import { InteractionLayout } from "../features/interactions/components/InteractionLayout";
import { SourceSidebar } from "../features/documents/components/SourceSidebar";
import { ChatArea } from "../features/chat/components/ChatArea";
import { ToolsSidebar } from "../features/interactions/components/ToolsSidebar";
import { AddSourceModal } from "../features/documents/components/AddSourceModal";
import { OpenEndedContainer } from "../features/open_ended/components/OpenEndedContainer";
import { ToolSetupArea } from "../features/interactions/components/ToolSetupArea";

import { TTRFeature } from "../features/ttr/index";
import { TTRSetupModal } from "../features/ttr/components/TTRSetupModal";
import {
  createTTRActivity,
  fetchActivitiesByInteraction,
  deleteTTRActivity
} from "../features/ttr/api/ttrApi";

import { createStudyActivity } from "../features/open_ended/api/studyActivityApi";
import { QuizPanel } from "../features/quiz/components";
import { createFlashcard } from "../features/flashcard/api/flashcardAPI";

import FlashcardPanel from "../features/flashcard/components/FlashcardPanel";



export const InteractionPage = () => {
  const { interactionId } = useParams();

  // ==========================================
  // STATE QUẢN LÝ GIAO DIỆN
  // ==========================================
  // State Tài liệu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [_isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [_selectedDoc, setSelectedDoc] = useState(null);
  const [isFlashcardMode, setIsFlashcardMode] = useState(false);
  const [flashcardPanelMode, setFlashcardPanelMode] = useState('create');
  const [selectedFlashcardSet, setSelectedFlashcardSet] = useState(null);

  // State Tap To Review (TTR)
  const [isSetupOpen, setIsSetupOpen] = useState(false); 
  const [isTTROpen, setIsTTROpen] = useState(false);     
  const [currentActivityId, setCurrentActivityId] = useState(null); 
  const [currentIsNew, setCurrentIsNew] = useState(false); 
  const [ttrTasks, setTtrTasks] = useState([]); 
  const [currentMode, setCurrentMode] = useState('normal');

  // State Open Ended
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [testSidebarError, setTestSidebarError] = useState(null);

  // State Quiz
  const [currentQuizId, setCurrentQuizId] = useState(null);
  const [isQuizOpen, setIsQuizOpen] = useState(false);

  // ==========================================
  // GỌI CÁC CUSTOM HOOKS
  // ==========================================

  const [tempBackgroundTasks, setTempBackgroundTasks] = useState([]);
  
  const { handleNewChatClick } = useInteractions();

  const {
    documents,
    selectedDocIds,
    uploadMultipleFiles,
    updateDocument,
    documentName,
    setDocumentName,
    editingID,
    handleStartEdit,
    handleDocCheck,
    deleteDocument,
    isLoading: isDocsLoading,
  } = useDocuments(interactionId);

  const {
    chatlog,
    promptText,
    setPromptText,
    askLLM,
    isLoading: isChatLoading,
  } = useChat(interactionId);

  const {
    flashcardSets,
    isLoading,
    isCreatingWithAI,
    error,
    createNewFlashcardSet,
    createEmptyFlashcardSet,
    removeFlashcardSet,
    loadFlashcardSets
  } = useFlashcardSetManagement(interactionId);

  const { activities, fetchActivities, handleDeleteActivity } =
    useStudyActivities(interactionId);

  const {
    handleToolClick,
    activeToolSetup,
    setActiveToolSetup,
    createToolError,
    clearCreateToolError,
    handleConfirmCreate,
    toolLoadingStates,
    isCreatingNewActivity,
  } = useInteractionTools(interactionId, fetchActivities);

  const normalizeValue = (value) =>
    String(value ?? "")
      .trim()
      .toUpperCase();
  const getActivityFormat = (item) => normalizeValue(item?.activity_format);
  const getActivityType = (item) => normalizeValue(item?.activity_type);

  // ==========================================
  // LOGIC TTR CHẠY NGẦM
  // ==========================================
  useEffect(() => {
    const loadTTR = async () => {
      try {
        const data = await fetchActivitiesByInteraction(interactionId);
        if (Array.isArray(data)) {
          const filteredData = data.filter(
            (item) =>
              getActivityType(item) === "REVIEW" &&
              getActivityFormat(item) === "GAP_FILL",
          );
          console.log("[InteractionPage] TTR activities:", filteredData);
          const sortedData = filteredData.sort((a, b) => b.id - a.id);
          const formatted = sortedData.map((item) => ({
            id: item.id,
            name:
              item.name.length > 25
                ? item.name.substring(0, 25) + "..."
                : item.name,
            status: "ready",
            isNew: false,
          }));
          setTtrTasks(formatted);
        } else {
          setTtrTasks([]);
        }
      } catch (err) {
        console.error("Lỗi tải TTR Data:", err);
      }
    };
    loadTTR();
  }, [interactionId]);

  const openEndedActivities = (activities || []).filter(
    (item) =>
      getActivityType(item) === "EXERCISE" &&
      getActivityFormat(item) === "OPEN_ENDED",
  );

  const quizActivities = (activities || []).filter(
    (item) =>
      getActivityType(item) === "EXERCISE" &&
      getActivityFormat(item) === "MULTIPLE_CHOICE_QUESTIONS",
  );

  const displayedFlashcardSets = [
    ...tempBackgroundTasks.filter((item) => item.activity_format === "FLASHCARDS"),
    ...(flashcardSets || [])
  ];

  // 1. Hàm tự động dán câu hỏi ra Chat và gửi
  const handleAutoChat = (text, documentId) => {
    askLLM(text, documentId);
  };

  // 2. Hàm phân luồng tự động tạo mọi loại bài tập
  const handleAutoGenerate = async (format, prompt, subjectType, documentId) => {
    
    // TTR đã có luồng xử lý riêng ở dưới nên cho qua
    if (format === 'GAP_FILL') {
      handleCreateTTRBackground({ prompt, gameMode: 'normal', subjectType, document_id: documentId });
      return;
    } 

    // Bơm Fake Task vào danh sách để giao diện hiện trạng thái "Đang tạo..."
    const tempId = Date.now();
    const newTask = {
      id: tempId,
      name: "Cú Mèo AI đang tạo bài...",
      status: "loading", // Cờ để Sidebar biết là đang loading
      isNew: true,
      activity_format: format,
      activity_type: format === 'FLASHCARDS' ? 'REVIEW' : 'EXERCISE'
    };
    setTempBackgroundTasks(prev => [newTask, ...prev]);

    try {
      if (format === 'FLASHCARDS') {
        // GỌI THẲNG API CHO FLASHCARD VÀ CHẠY NGẦM
        await createFlashcard(interactionId, { prompt, subject_type: subjectType, document_id: documentId });
        loadFlashcardSets(); // Render lại mảng flashcards thật
      } 
      else if (format === 'MULTIPLE_CHOICE_QUESTIONS') {
        // GỌI THẲNG API CHO QUIZ
        await createStudyActivity(interactionId, {
          prompt, subject_type: subjectType, activity_type: "EXERCISE", activity_format: "MULTIPLE_CHOICE_QUESTIONS", document_id: documentId
        });
        fetchActivities(); // Render lại mảng bài tập thật
      } 
      else if (format === 'OPEN_ENDED') {
        // GỌI THẲNG API CHO TỰ LUẬN
        await createStudyActivity(interactionId, {
          prompt, subject_type: subjectType, activity_type: "EXERCISE", activity_format: "OPEN_ENDED", document_id: documentId
        });
        fetchActivities(); 
      }
    } catch (error) {
      console.error(`Lỗi tạo ${format}:`, error);
      alert("❌ Cú Mèo đang bị nghẽn mạng, chưa tạo được bài. Bé thử lại sau nhé!");
    } finally {
      // Dù thành công hay thất bại thì cũng xóa cái Fake Task đi
      setTempBackgroundTasks(prev => prev.filter(t => t.id !== tempId));
    }
  };
  
  const handleCreateTTRBackground = (data) => {
    const { prompt: finalPrompt, gameMode, subjectType, document_id } = data; // Bắt document_id

    const tempId = Date.now();
    const newTask = { id: tempId, name: "Đang AI tạo bài...", status: "loading" };
    setTtrTasks((prev) => [newTask, ...prev]);
    setIsSetupOpen(false);

    // Đóng gói JSON y hệt ảnh Swagger bạn gửi
    const payload = { 
      prompt: finalPrompt,
      subject_type: subjectType,
      document_id: document_id 
    };

    createTTRActivity(interactionId, payload)
      .then(newActivity => {
        setTtrTasks(prev => prev.map(task => 
          task.id === tempId 
            ? { ...task, id: newActivity.id, name: newActivity.name, status: 'ready', isNew: true, gameMode: gameMode } 
            : task
        ));
      })
      .catch(error => {
        let uiMessage = "Lỗi hệ thống. Vui lòng thử lại.";
        
        if (error.status_code === 401) {
          uiMessage = "Phiên đăng nhập hết hạn. Vui lòng tải lại trang.";
        } else if (error.status_code === 404) {
          uiMessage = "Tài nguyên không tìm thấy hoặc đã bị xóa.";
        } else if (error.status_code === 400) {
          uiMessage = "Dữ liệu gửi lên không hợp lệ.";
        } else if (error.status_code === 502 || error.status_code === 503) {
          uiMessage = "AI bị nghẽn hoặc làm sai. Hãy thử giảm độ khó hoặc viết prompt rõ hơn.";
        } else if (error.status_code === 500) {
          uiMessage = "Lỗi từ Backend (500). Đã báo cáo hệ thống.";
        }

        setTtrTasks(prev => prev.map(task => 
          task.id === tempId 
            ? { ...task, status: 'error', errorMessage: uiMessage, rawError: error.exception_type } 
            : task
        ));
        
        console.error("Lỗi tạo bài: ", error.message);
      });
  };

  const openFlashcardCreate = () => {
    setSelectedFlashcardSet(null);
    setFlashcardPanelMode('create');
    setIsFlashcardMode(true);
  };

  const openFlashcardSet = (set) => {
    setSelectedFlashcardSet(set);
    setFlashcardPanelMode('study');
    setIsFlashcardMode(true);
  };

  const closeFlashcardPanel = () => {
    setIsFlashcardMode(false);
    setSelectedFlashcardSet(null);
  };

  const handleDeleteTTR = async (activityId) => {
    try {
      // 1. Tìm task đang muốn xóa trong danh sách
      const taskToDelete = ttrTasks.find((t) => t.id === activityId);

      // 2. Nếu là task lỗi (do AI tạo xịt) hoặc đang loading (có ID tạm thời từ Date.now())
      // thì chỉ cần xóa ở giao diện, KHÔNG gọi xuống Backend
      if (taskToDelete && (taskToDelete.status === 'error' || taskToDelete.status === 'loading')) {
        setTtrTasks((prev) => prev.filter((t) => t.id !== activityId));
        return; 
      }

      // 3. Với các bài tập bình thường đã lưu trên DB, gọi xuống Backend để xóa
      await deleteTTRActivity(activityId);
      
      // 4. Nếu BE xóa thành công, cập nhật lại giao diện
      setTtrTasks(prev => prev.filter(t => t.id !== activityId));
      console.log("Đã xóa TTR thành công:", activityId);
    } catch (error) {
      console.error("Lỗi khi xóa TTR:", error);
      alert("Không thể xóa bài tập lúc này, vui lòng thử lại sau.");
    }
  };

  // ==========================================
  // RENDER GIAO DIỆN
  // ==========================================
  return (
    <InteractionLayout
      onNewChat={handleNewChatClick}
      modals={
        <>
          <AddSourceModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            onAdd={uploadMultipleFiles} 
          />
          
          <TTRSetupModal 
            isOpen={isSetupOpen} 
            onClose={() => setIsSetupOpen(false)} 
            onSubmit={(data) => {
              console.log("Dữ liệu bẫy được tại Component cha:", data);
              handleCreateTTRBackground({
                prompt: data.prompt,
                gameMode: data.gameMode,
                subjectType: data.subjectType
              });
            }} 
          />

          {/* FIX ĐỒNG BỘ: Đưa ToolSetupArea vào khu vực modals dưới dạng Lớp phủ (Modal Overlay) */}
          {activeToolSetup && (
            <ToolSetupArea
              toolId={activeToolSetup}
              isLoading={isCreatingNewActivity}
              errorMessage={createToolError}
              onClearError={clearCreateToolError}
              onConfirm={handleConfirmCreate}
              onCancel={() => setActiveToolSetup(null)}
            />
          )}
          
          {/* LỚP PHỦ GAME TTR */}
          {isTTROpen && currentActivityId && (
            <TTRFeature 
              activityId={currentActivityId} 
              isNew={currentIsNew} 
              initialMode={currentMode}
              onClose={() => { 
                setIsTTROpen(false); 
                setCurrentActivityId(null); 
              }} 
            />
          )}

          {/* LỚP PHỦ QUIZ */}
          {isQuizOpen && currentQuizId && (
            <QuizPanel
              interactionId={interactionId}
              quizId={currentQuizId}
              onClose={() => {
                setIsQuizOpen(false);
                setCurrentQuizId(null);
              }}
            />
          )}

          {isFlashcardMode && (
            <FlashcardPanel
              isLoading={isLoading}
              error={error}
              isCreatingWithAI={isCreatingWithAI}
              initialViewMode={flashcardPanelMode}
              initialSelectedSet={selectedFlashcardSet}
              onCreateFlashcardSet={createNewFlashcardSet}
              onCreateEmptyFlashcardSet={createEmptyFlashcardSet}
              onFlashcardSetCreated={loadFlashcardSets}
              onClose={closeFlashcardPanel}
            />
          )}
        </>
      }
    >
      {/* 1. CỘT TRÁI */}
      <SourceSidebar
        documents={documents}
        isLoading={isDocsLoading}
        selectedDocIds={selectedDocIds}
        onAddClick={() => setIsModalOpen(true)}
        editingId={editingID}
        setEditingId={handleStartEdit}
        tempName={documentName}
        setTempName={setDocumentName}
        onRename={updateDocument}
        onDelete={deleteDocument}
        onDocCheck={handleDocCheck}
        onPreview={(doc) => {
          setSelectedDoc(doc);
          setIsPreviewOpen(true);
        }}

        onGenerateTTR={handleCreateTTRBackground}
        onGenerateQuiz={handleConfirmCreate}

        onAutoChat={handleAutoChat}
        onAutoGenerate={handleAutoGenerate}

      />

      {/* 2. CỘT GIỮA - LUÔN LUÔN RENDER CHAT AREA ĐỂ GIỮ FORM CHO BACKGROUND ĐẰNG SAU */}
      <ChatArea
        messages={chatlog}
        isLoading={isChatLoading}
        promptText={promptText}
        setPromptText={setPromptText}
        onSend={() => askLLM()}
      />

      {/* 3. CỘT PHẢI */}
      <ToolsSidebar
        // Props TTR
        onOpenTTR={() => setIsSetupOpen(true)} 
        ttrTasks={ttrTasks} 
        onRemoveTTRTask={handleDeleteTTR}
        onPlayTTR={(id) => {
          const task = ttrTasks.find((t) => t.id === id);
          setCurrentActivityId(id);
          setCurrentIsNew(task ? task.isNew : false);
          setCurrentMode(task?.gameMode || 'normal');
          setIsTTROpen(true);
          setSelectedActivityId(null);
          setIsQuizOpen(false);
          setCurrentQuizId(null);
          if (task && task.isNew) {
            setTtrTasks((prev) =>
              prev.map((t) => (t.id === id ? { ...t, isNew: false } : t)),
            );
          }
        }}
        // Props Open-Ended
        activities={openEndedActivities}
        // Props Quiz
        quizActivities={quizActivities}
        // Props Flashcard
        flashcardSets={displayedFlashcardSets}
        onOpenFlashcardSet={openFlashcardSet}
        onDeleteFlashcardSet={removeFlashcardSet}
        onToolClick={(toolId) => {
          if (toolId === 'flashcard') {
            openFlashcardCreate();
            return;
          }
          handleToolClick(toolId);
        }}
        onActivityClick={(id) => {
          setIsQuizOpen(false);
          setCurrentQuizId(null);
          setSelectedActivityId(id);
        }}
        onQuizClick={(id) => {
          setSelectedActivityId(null);
          setIsQuizOpen(true);
          setCurrentQuizId(id);
        }}
        onDeleteActivity={handleDeleteActivity}
        toolLoadingStates={toolLoadingStates}
        isCreatingNewActivity={isCreatingNewActivity || isCreatingWithAI}

        toolError={createToolError || testSidebarError}
        onClearToolError={() => {
          clearCreateToolError();
          setTestSidebarError(null);
        }}
      />

      {/* 4. LỚP PHỦ BÀI TẬP OPEN ENDED */}
      <OpenEndedContainer
        activityId={selectedActivityId}
        onClose={() => setSelectedActivityId(null)}
      />

    </InteractionLayout>
  );
};
