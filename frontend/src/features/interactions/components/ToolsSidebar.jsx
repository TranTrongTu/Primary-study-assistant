import React, { useState } from "react";
import videoIcon from "../../../assets/icon/video.svg";
import slideIcon from "../../../assets/icon/slide.svg";
import quizIcon from "../../../assets/icon/Quiz.svg";
import { Trash, WarningCircle, X } from "@phosphor-icons/react";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import { ConfirmModal } from "../../../components/ConfirmModal";

const TOOLS_LIST = [
  { id: "mindmap", name: "Ôn Tập Điền Từ", icon: "🧠", isSvg: false },
  { id: "flashcard", name: "Thẻ Học Tập", icon: "📕", isSvg: false },
  { id: "quiz", name: "Trắc Nghiệm", icon: quizIcon, isSvg: true },
  { id: "essay", name: "Tự Luận", icon: "📝", isSvg: false },
];

export const ToolsSidebar = ({ 
  onOpenTTR, 
  ttrTasks, 
  onPlayTTR, 
  onRemoveTTRTask,
  onToolClick, 
  toolLoadingStates = {}, 
  activities = [], 
  quizActivities = [],
  onActivityClick, 
  onQuizClick,
  onDeleteActivity, 
  isCreatingNewActivity,
  flashcardSets = [], 
  onOpenFlashcardSet, 
  onDeleteFlashcardSet,
  // 1. NHẬN PROPS LỖI VÀO ĐÂY
  toolError,
  onClearToolError
}) => {
  const { isNight } = useTheme();
  
  const [deleteTarget, setDeleteTarget] = useState({
    isOpen: false, id: null, type: "", name: ""
  });

  const openDeleteModal = (id, type, name) => {
    setDeleteTarget({ isOpen: true, id, type, name });
  };

  const closeDeleteModal = () => {
    setDeleteTarget({ isOpen: false, id: null, type: "", name: "" });
  };

  const confirmDelete = () => {
    const { id, type } = deleteTarget;
    if (type === "QUIZ" && onDeleteActivity) onDeleteActivity(id);
    if (type === "TTR" && onRemoveTTRTask) onRemoveTTRTask(id);
    if (type === "OPEN_ENDED" && onDeleteActivity) onDeleteActivity(id);
    if (type === "FLASHCARD" && onDeleteFlashcardSet) onDeleteFlashcardSet(id);
    closeDeleteModal();
  };

  return (
    <aside
      className={`flex w-[20%] flex-col space-y-4 rounded-3xl p-6 backdrop-md shadow-xl border transition-colors duration-500 ${
        isNight
          ? "bg-gray-900/60 border-gray-700/50"
          : "bg-white/30 border-white/20"
      }`}
    >
      {/* 2. KHU VỰC BÁO LỖI (Sẽ trượt mượt mà xuống khi có lỗi) */}
      {toolError && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300">
          <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
            isNight ? "border-red-500/30 bg-[#2a1118]/80 text-red-200" : "border-red-200 bg-red-50 text-red-600"
          }`}>
            <WarningCircle size={20} weight="fill" className="shrink-0 text-red-500 mt-0.5" />
            <p className="flex-1 text-xs font-bold leading-snug">{toolError}</p>
            <button 
              onClick={onClearToolError} 
              className={`shrink-0 rounded-lg p-1 transition-colors ${
                isNight ? "hover:bg-red-500/20 text-red-400" : "hover:bg-red-200 text-red-500"
              }`}
            >
              <X size={14} weight="bold" />
            </button>
          </div>
        </div>
      )}

      {/* Section Công cụ */}
      <section>
        <header className="mb-4 space-y-4">
          <div
            className={`flex h-10 items-center space-x-2 text-2xl font-bold transition-colors ${
              isNight ? "text-gray-100" : "text-gray-800"
            }`}
          >
            <span>⚙️</span>
            <h2>Công cụ</h2>
          </div>
          <hr
            className={`border-t transition-colors ${isNight ? "border-gray-600/50" : "border-gray-400/30"}`}
          />
        </header>

        <div className="grid grid-cols-2 gap-3">
          {TOOLS_LIST.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === "mindmap" && onOpenTTR) {
                  onOpenTTR();
                } else if (onToolClick) {
                  onToolClick(item.id);
                }
              }}
              disabled={toolLoadingStates[item.id]}
              className={`flex flex-col items-center justify-center rounded-2xl p-3 shadow-sm hover:scale-105 transition-all ${
                isNight
                  ? "bg-gray-800/80 border border-gray-700 text-gray-300"
                  : "bg-[#FFEDE2B2]/80 text-gray-700"
              }`}
            >
              {item.isSvg ? (
                <img
                  src={item.icon}
                  alt={item.name}
                  className={`h-8 w-8 object-contain ${isNight ? "opacity-90" : ""}`}
                />
              ) : (
                <span className="text-2xl">{item.icon}</span>
              )}
              <span className="mt-2 text-[10px] font-extrabold uppercase opacity-90">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Section Học Liệu */}
      <section className="flex flex-1 flex-col overflow-hidden pt-2">
        <header className="mb-4 space-y-4">
          <div
            className={`flex items-center space-x-2 text-2xl font-bold transition-colors ${
              isNight ? "text-gray-100" : "text-gray-800"
            }`}
          >
            <span>📝</span>
            <h2>Học Liệu</h2>
          </div>
          <hr
            className={`border-t transition-colors ${isNight ? "border-gray-600/50" : "border-gray-400/30"}`}
          />
        </header>

        <nav className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* HIỂN THỊ DANH SÁCH BÀI TTR */}
          {ttrTasks && ttrTasks.map((task) => {
            if (task.status === 'error') {
              return (
                <div key={`ttr-${task.id}`} className={`flex flex-col rounded-2xl px-3 py-2 shadow-sm border transition-all ${
                  isNight ? 'bg-red-900/20 border-red-800/50 text-red-400' : 'bg-red-50 border-red-200 text-red-500'
                }`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs flex items-center gap-1">❌ Thất bại</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onRemoveTTRTask) onRemoveTTRTask(task.id);
                      }}
                      className="text-[10px] underline opacity-70 hover:opacity-100 transition-opacity"
                    >
                      Bỏ qua
                    </button>
                  </div>
                  <span className="text-[11px] leading-snug font-medium opacity-90">
                    {task.errorMessage || "Có lỗi xảy ra."}
                  </span>
                </div>
              );
            }

            return (
              <div key={`ttr-${task.id}`} className="group relative flex w-full items-center">
                <button 
                  onClick={() => task.status === 'ready' && onPlayTTR(task.id)}
                  disabled={task.status === 'loading'}
                  className={`flex cursor-pointer w-full items-center rounded-2xl px-4 py-3 shadow-sm border transition-all hover:scale-[1.02] active:scale-95 ${
                  task.status === 'loading' 
                    ? (isNight ? 'bg-gray-800/40 border-gray-700 opacity-60 cursor-wait' : 'bg-gray-100/50 border-gray-200 opacity-70 cursor-wait')
                    : (isNight ? 'bg-gray-800/80 border-purple-500/50 hover:bg-gray-700 hover:border-purple-400 text-gray-300' : 'bg-white border-purple-300 hover:bg-purple-50 hover:border-purple-400 text-gray-700')
                }`}>
                  <span className="mr-3 text-sm flex-shrink-0">
                    {task.status === 'loading' ? (
                      <svg className="animate-spin h-4 w-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    ) : '🧠'}
                  </span>
                  <span className={`text-sm font-semibold truncate text-left w-3/4 ${task.status === 'loading' ? 'animate-pulse text-gray-500' : (isNight ? 'text-purple-100' : 'text-purple-700')}`}>
                    {task.name}
                  </span>
                </button>
                
                {task.status === 'ready' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteModal(task.id, "TTR", task.name);
                    }}
                    className={`absolute right-2 flex cursor-pointer h-8 w-8 items-center justify-center rounded-xl text-red-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100 ${
                      isNight ? "hover:bg-gray-800/80" : "hover:bg-gray-200"
                    }`}
                  >
                    <Trash size={18} weight="bold" />
                  </button>
                )}
              </div>
            );
          })}

          {/* HIỂN THỊ DANH SÁCH BÀI QUIZ */}
          {quizActivities && quizActivities.map((quiz) => (
            <div key={`quiz-${quiz.id}`} className="group relative flex w-full items-center">
              <button
                onClick={() => onQuizClick && onQuizClick(quiz.id)}
                className={`flex cursor-pointer w-full items-center rounded-2xl px-4 py-3 shadow-sm border transition-all hover:scale-[1.02] active:scale-95 ${
                  isNight
                    ? "bg-gray-800/80 border-gray-700 hover:border-[#6c5ce7] text-gray-300"
                    : "bg-white/80 border-transparent hover:border-[#6c5ce7]/50 text-gray-700"
                }`}
              >
                <span className="mr-3 text-sm opacity-80">🧩</span>
                <span className="text-sm font-semibold truncate text-left w-3/4">
                  {quiz.name || `Quiz #${quiz.id}`}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(quiz.id, "QUIZ", quiz.name || `Quiz #${quiz.id}`);
                }}
                className={`absolute right-2 flex cursor-pointer h-8 w-8 items-center justify-center rounded-xl text-red-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100 ${
                  isNight ? "hover:bg-gray-800/80" : "hover:bg-gray-200"
                }`}
              >
                <Trash size={18} weight="bold" />
              </button>
            </div>
          ))}

          {/* HIỂN THỊ DANH SÁCH BỘ FLASHCARD */}
          {flashcardSets && flashcardSets.map((set) => (
            <div key={`flashcard-${set.id}`} className="group relative flex w-full items-center">
              <button
                onClick={() => onOpenFlashcardSet && onOpenFlashcardSet(set)}
                className={`flex cursor-pointer w-full items-center rounded-2xl px-4 py-3 shadow-sm border transition-all hover:scale-[1.02] active:scale-95 ${
                  isNight
                    ? "bg-gray-800/80 border-indigo-500/40 hover:border-indigo-400 text-gray-300"
                    : "bg-white/80 border-indigo-200 hover:border-indigo-400/70 text-gray-700"
                }`}
              >
                <span className="mr-3 text-sm opacity-80">📕</span>
                <span className={`text-sm font-semibold truncate text-left w-3/4 ${
                  isNight ? "text-indigo-100" : "text-indigo-700"
                }`}>
                  {set.name || `Flashcard #${set.id}`}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(set.id, "FLASHCARD", set.name || `Flashcard #${set.id}`);
                }}
                className={`absolute right-2 flex cursor-pointer h-8 w-8 items-center justify-center rounded-xl text-red-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100 ${
                  isNight ? "hover:bg-gray-800/80" : "hover:bg-gray-200"
                }`}
              >
                <Trash size={18} weight="bold" />
              </button>
            </div>
          ))}
        
          {/* HIỂN THỊ DANH SÁCH BÀI TỰ LUẬN (OPEN-ENDED) */}
          {activities && activities.map((act) => (
            <div key={`oe-${act.id}`} className="group relative flex w-full items-center">
              <button
                onClick={() => onActivityClick && onActivityClick(act.id)}
                className={`flex cursor-pointer w-full items-center rounded-2xl px-4 py-3 shadow-sm border transition-all hover:scale-[1.02] active:scale-95 ${
                  isNight
                    ? "bg-gray-800/80 border-gray-700 hover:border-[#4ecdc4] text-gray-300"
                    : "bg-white/80 border-transparent hover:border-[#4ecdc4]/50 text-gray-700"
                }`}
              >
                <span className="mr-3 text-sm opacity-80">📝</span>
                <span className="text-sm font-semibold truncate text-left w-3/4">
                  {act.name || `Bài tập #${act.id}`}
                </span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openDeleteModal(act.id, "OPEN_ENDED", act.name || `Bài tập #${act.id}`);
                }}
                className={`absolute right-2 flex cursor-pointer h-8 w-8 items-center justify-center rounded-xl text-red-400 opacity-0 transition-all hover:text-red-600 group-hover:opacity-100 ${
                  isNight ? "hover:bg-gray-800/80" : "hover:bg-gray-200"
                }`}
              >
                <Trash size={18} weight="bold" />
              </button>
            </div>
          ))}

          {/* INDICATOR OPEN ENDED LOADING */}
          {isCreatingNewActivity && (
            <div
              className={`flex w-full animate-pulse items-center rounded-2xl px-4 py-3 shadow-sm border transition-all cursor-not-allowed ${
                isNight
                  ? "bg-gray-800/50 border-gray-600"
                  : "bg-gray-100/80 border-gray-300"
              }`}
            >
              <span className="mr-3 text-sm opacity-50 animate-spin">⏳</span>
              <span className="text-sm font-semibold text-gray-400 italic">
                Cú Mèo đang soạn bài...
              </span>
            </div>
          )}
        </nav>
      </section>

      <ConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message={`Bé có chắc chắn muốn xóa "${deleteTarget.name}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        isDanger={true}
      />
    </aside>
  );
};