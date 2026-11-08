import { useState, useEffect } from 'react';
import { createTTRActivity, fetchActivitiesByInteraction } from '../api/ttrApi';
import { parseBackendError, logBackendError, setErrorFromParsed } from "../../../utils/backendError";

export const useTTRManager = (interactionId) => {
  const [isSetupOpen, setIsSetupOpen] = useState(false); 
  const [isTTROpen, setIsTTROpen] = useState(false);     
  const [ttrTasks, setTtrTasks] = useState([]); 
  const [actionModal, setActionModal] = useState({ isOpen: false, activityId: null });
  const [gameConfig, setGameConfig] = useState({ activityId: null, initialMode: 'play', gameMode: 'normal' });
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTTR = async () => {
      try {
        const data = await fetchActivitiesByInteraction(interactionId);
        if (data && data.length > 0) {
          const sortedData = data.sort((a, b) => b.id - a.id);

          const formatted = data.map(item => ({
            id: item.id,
            name: item.name.length > 25 ? item.name.substring(0, 25) + "..." : item.name,
            status: 'ready',
            isNew: false 
          }));
          setTtrTasks(formatted);
        }
      } catch (err) {
        const parsed = parseBackendError(err, "Không tải được danh sách bài TTR. Bé thử lại sau nhé!");
        logBackendError("useTTRManager.loadTTR", parsed);
        setErrorFromParsed(setError, parsed);
      }
    };
    if (interactionId) loadTTR();
  }, [interactionId]);

  // [MỚI] Nhận thêm subjectType
  const handleCreateTTRBackground = (data) => {
    // 1. Hút dữ liệu an toàn tuyệt đối từ Component cha truyền vào
    const finalPrompt = data.prompt;
    const gameMode = data.gameMode || 'normal';
    const finalSubject = data.subjectType || data.subject_type || "MATHS";

    const tempId = Date.now();
    const newTask = { id: tempId, name: "AI đang tạo bài...", status: 'loading' };
    setTtrTasks(prev => [newTask, ...prev]);
    setIsSetupOpen(false);

    // 2. Gom đúng 2 trường cần thiết đưa xuống ttrApi
    const payload = { 
      prompt: finalPrompt,
      subject_type: finalSubject 
    };

    console.log("🔥 Payload cuối cùng trước khi gọi API:", payload);

    createTTRActivity(interactionId, payload)
      .then(newActivity => {
        setTtrTasks(prev => prev.map(task => 
          task.id === tempId ? { ...task, id: newActivity.id, name: newActivity.name, status: 'ready', isNew: true, gameMode: gameMode } : task
        ));
      })
      .catch(error => {
        // [ĐỒNG BỘ] Bắt lỗi và log chuyên nghiệp
        const parsed = parseBackendError(error, "Lỗi khi tạo bài tập, bé thử lại nhé!");
        logBackendError("useTTRManager.handleCreateTTRBackground", parsed);
        
        setTtrTasks(prev => prev.filter(task => task.id !== tempId));
        setErrorFromParsed(setError, parsed); // Hiển thị thông báo thân thiện cho bé
      });
  };

  const handlePlayTask = (id) => {
    const task = ttrTasks.find(t => t.id === id);
    if (!task) return;

    if (task.isNew) {
      setGameConfig({ activityId: id, initialMode: task.gameMode || 'normal' });
      setIsTTROpen(true);
      setTtrTasks(prev => prev.map(t => t.id === id ? { ...t, isNew: false } : t));
    } else {
      setActionModal({ isOpen: true, activityId: id });
    }
  };

  const handleStartFromMenu = (mode) => {
    setGameConfig({ activityId: actionModal.activityId, initialMode: mode, gameMode: 'normal' });
    setActionModal({ isOpen: false, activityId: null });
    setIsTTROpen(true);
  };

  const closeGame = () => {
    setIsTTROpen(false);
    setGameConfig(prev => ({ ...prev, activityId: null }));
  };

  return {
    ttrTasks,
    isSetupOpen, setIsSetupOpen,
    isTTROpen, setIsTTROpen,
    actionModal, setActionModal,
    gameConfig,
    handleCreateTTRBackground,
    handlePlayTask,
    handleStartFromMenu,
    closeGame, 
    managerError: error,
    clearManagerError: () => setError(null)
  };
};