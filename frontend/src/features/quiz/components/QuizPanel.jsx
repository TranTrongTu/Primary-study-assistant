import React, { useEffect, useMemo } from "react";
import QuizView from "./QuizView";
import useQuizManagement from "../hooks/useQuizManagement";
import { useQuizGame } from "../hooks/useQuizGame";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import ErrorBanner from "../../../components/ErrorBanner";

const QuizPanel = ({ interactionId, quizId, onClose }) => {
  const { isNight } = useTheme();
  
  const {
    quizzes,
    isLoading,
    error,
    clearError,
    loadQuizDetail,
    updateQuizMeta,
    updateQuizInList,
  } = useQuizManagement(interactionId);

  const selectedQuiz = useMemo(
    () => quizzes.find((item) => item.id === quizId) || null,
    [quizzes, quizId],
  );

  const game = useQuizGame(selectedQuiz, updateQuizInList);

  useEffect(() => {
    if (!quizId) return;
    if (!selectedQuiz || selectedQuiz.hasDetails) return;
    loadQuizDetail(quizId);
  }, [quizId, selectedQuiz, loadQuizDetail]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 lg:p-8 backdrop-blur-sm transition-all">
      <div
        /* [SỬA Ở ĐÂY]: Đổi gap-4 thành gap-2 để kéo khung lên cao hơn */
        className={`relative flex h-full max-h-[92vh] w-full max-w-6xl flex-col gap-2 overflow-hidden rounded-[2.5rem] border p-6 md:p-8 shadow-2xl ${
          isNight
            ? "border-[#7aa7ff]/30 bg-gradient-to-br from-[#0e1631]/95 via-[#1a1b3f]/95 to-[#18142b]/95 shadow-[0_28px_70px_rgba(2,10,35,0.7)]"
            : "border-white/50 bg-gradient-to-br from-[#dcfff7]/95 via-[#fff1e7]/95 to-[#e8f4ff]/95 shadow-[0_24px_60px_rgba(15,23,42,0.25)]"
        }`}
      >
        {/* Các hiệu ứng ánh sáng (Aurora Effects) */}
        <div className="quiz-aurora quiz-aurora-a -left-24 -top-20 z-0 opacity-70" />
        <div className="quiz-aurora quiz-aurora-b right-16 top-8 z-0 opacity-70" />
        <div className="quiz-aurora quiz-aurora-c bottom-0 left-1/2 z-0 -translate-x-1/2 opacity-70" />
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_80%_12%,rgba(255,255,255,0.26),transparent_40%)]" />

        {/* HEADER MỚI: CHIA 3 KHU VỰC */}
        <div className="relative z-10 flex items-center justify-between px-2">
          
          {/* 1. BÊN TRÁI: Dòng chữ rực rỡ và Icon tách riêng */}
          <div className="flex-1 flex items-center gap-3">
            <h2 className={`text-xl sm:text-2xl md:text-3xl pr-2 font-black tracking-tighter uppercase italic transition-all duration-700 bg-clip-text text-transparent bg-gradient-to-r whitespace-nowrap ${
              selectedQuiz?.isSubmitted
                ? isNight 
                  ? "from-yellow-400 via-emerald-400 to-orange-500 drop-shadow-[0_2px_10px_rgba(52,211,153,0.3)]" 
                  : "from-blue-600 via-cyan-500 to-emerald-500 drop-shadow-[0_2px_10px_rgba(14,165,233,0.2)]"
                : isNight
                  ? "from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_2px_10px_rgba(192,38,211,0.3)]"      
                  : "from-blue-600 via-violet-600 to-fuchsia-600 drop-shadow-[0_2px_10px_rgba(79,70,229,0.2)]"   
            }`}>
              {selectedQuiz?.isSubmitted ? "Kết quả làm bài" : "Không gian làm bài"}
            </h2>
            {/* Tách riêng Emoji ra ngoài thẻ h2 để không bị lỗi gradient */}
            <span className="text-2xl md:text-3xl drop-shadow-md">
              {selectedQuiz?.isSubmitted ? "✨" : "🚀"}
            </span>
          </div>

          {/* 2. Ở GIỮA: Khoảng trống để Switch đổi màu nền không bị đè lên */}
          <div className="flex-1 invisible">
             {/* Mục đích chỉ để giữ chỗ cân bằng layout */}
          </div>

          {/* 3. BÊN PHẢI: Nút Đóng màu đỏ đẹp */}
          <div className="flex-1 flex justify-end">
            <button
              onClick={onClose}
              className={`rounded-xl border-2 px-4 py-2 text-xs font-bold transition-all hover:-translate-y-1 hover:shadow-lg ${
                isNight
                  ? "border-[#88a1ff]/40 bg-[#1a254f]/80 text-slate-100 hover:bg-[#253468]"
                  : "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white hover:border-rose-500 hover:shadow-rose-500/30"
              }`}
            >
              Đóng 
            </button>
          </div>
        </div>

        {/* KHU VỰC LÀM BÀI CHÍNH (Chiếm toàn bộ không gian còn lại) */}
        <section
          className={`relative z-10 h-full w-full overflow-y-auto rounded-[2rem] border px-6 py-3 md:px-8 md:py-4 shadow-inner custom-scrollbar ${
            isNight
              ? "border-[#6e85d7]/35 bg-[#121d3c]/80"
              : "border-[#89e2d7]/40 bg-gradient-to-br from-white/95 via-[#f6fffd]/95 to-[#eefbff]/95"
          }`}
        >
          {error && (
            <ErrorBanner error={error} onDismiss={clearError} className="mb-3" />
          )}
          {!quizId ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <span className="animate-spin text-4xl">⏳</span>
                <p className={`font-bold ${isNight ? "text-slate-400" : "text-gray-500"}`}>
                  Đang nạp dữ liệu bài làm...
                </p>
              </div>
            </div>
          ) : (
            <QuizView
              quiz={selectedQuiz}
              game={game}
              onUpdateMeta={updateQuizMeta}
              isSaving={isLoading}
            />
          )}
        </section>
      </div>
    </div>
  );
};

export default QuizPanel;