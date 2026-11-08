import React, { useEffect, useState, useRef } from "react";
import Confetti from "react-confetti";
import {
  ChevronLeft,
  ChevronRight,
  Send,
  Flag,
  PartyPopper,
} from "lucide-react";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import QuestionCard from "./QuestionCard";
import QuizMilestone from "./QuizMilestone";
import QuizNavigator from "./QuizNavigator";
import QuizScoreBoard from "./QuizScoreBoard";
import QuizSidebarInfo from "./QuizSidebarInfo";
import QuizConfirmModal from "./QuizConfirmModal";
import ErrorBanner from "../../../components/ErrorBanner";

const QuizView = ({ quiz, game, onUpdateMeta, isSaving }) => {
  const { isNight } = useTheme();

  // Local States
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftDescription, setDraftDescription] = useState("");
  const [resultFilter, setResultFilter] = useState("all");
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // ==========================================
  // [SỬA LỖI]: BỘ NHỚ LỊCH SỬ NỘP BÀI
  // ==========================================
  const [showCelebration, setShowCelebration] = useState(false);

  // Lưu lại ID và trạng thái nộp bài LÚC MỚI MỞ lên
  const prevQuizIdRef = useRef(quiz?.id);
  const prevIsSubmittedRef = useRef(quiz?.isSubmitted);

  useEffect(() => {
    // Nếu người dùng chuyển sang một Quiz khác (hoặc vừa mở lại một quiz)
    if (prevQuizIdRef.current !== quiz?.id) {
      prevQuizIdRef.current = quiz?.id;
      prevIsSubmittedRef.current = quiz?.isSubmitted;
      setShowCelebration(false); // Đảm bảo đóng thông báo cũ
    }
    // Nếu vẫn đang xem Quiz hiện tại (người dùng vừa bấm nút Nộp bài)
    else {
      // Chỉ kích hoạt khi: Lúc trước là Chưa nộp (false) -> Bây giờ là Đã nộp (true)
      if (!prevIsSubmittedRef.current && quiz?.isSubmitted) {
        setShowCelebration(true);
      }
      prevIsSubmittedRef.current = quiz?.isSubmitted;
    }
  }, [quiz?.id, quiz?.isSubmitted]);
  // ==========================================

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!quiz) return;
    setDraftName(quiz.name || "");
    setDraftDescription(quiz.description || "");
    setIsEditing(false);
  }, [quiz]);

  const {
    currentQuestion,
    currentIndex,
    totalQuestions,
    selectedOption,
    questionStatus,
    unansweredCount,
    flaggedCount,
    milestoneMessage,
    clearMilestoneMessage,
    actionError,
    clearActionError,
    isSubmitting,
    handleSelectOption,
    nextQuestion,
    prevQuestion,
    jumpToQuestion,
    toggleFlagCurrentQuestion,
    submitQuiz,
  } = game;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (["input", "textarea"].includes(activeTag)) return;
      if (isConfirmOpen) return;
      if (event.key === "ArrowLeft" && canGoPrev) handlePrevQuestion();
      if (event.key === "ArrowRight" && canGoNext) handleNextQuestion();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, isConfirmOpen]);

  const handleSave = async () => {
    if (!onUpdateMeta) return;
    const trimmedName = draftName.trim();
    if (!trimmedName) return;
    const updated = await onUpdateMeta(quiz.id, {
      name: trimmedName,
      description: draftDescription.trim(),
    });
    if (updated) setIsEditing(false);
  };

  const questionList = quiz?.questions ?? [];
  const isSubmitted = Boolean(quiz?.isSubmitted);
  const scoreSummary = quiz?.score || null;
  const scorePercent = scoreSummary?.percent ?? 0;

  // Filtering Logic
  const isFilterActive = isSubmitted && resultFilter !== "all";
  const matchesFilter = (question) => {
    if (!isFilterActive) return true;

    const hasAttempt = !!question.attemptId;
    const isCorrect =
      hasAttempt &&
      question.options.find((opt) => opt.id === question.attemptId)?.isCorrect;

    if (resultFilter === "correct") return hasAttempt && isCorrect;
    if (resultFilter === "wrong") return hasAttempt && !isCorrect;
    if (resultFilter === "unanswered") return !hasAttempt;

    return true;
  };

  const filteredIndices = isSubmitted
    ? questionList.reduce((acc, q, index) => {
        if (matchesFilter(q)) acc.push(index);
        return acc;
      }, [])
    : [];

  const filteredIndexSet = new Set(filteredIndices);
  const hasFilterMatches = filteredIndices.length > 0;
  const currentFilteredPosition = isFilterActive
    ? filteredIndices.indexOf(currentIndex)
    : -1;

  // Auto-jump logic
  useEffect(() => {
    if (!isFilterActive || !currentQuestion || !hasFilterMatches) return;
    if (!matchesFilter(currentQuestion)) jumpToQuestion(filteredIndices[0]);
  }, [
    isFilterActive,
    currentQuestion?.id,
    hasFilterMatches,
    filteredIndices,
    jumpToQuestion,
  ]);

  const canGoPrev = isFilterActive
    ? hasFilterMatches && currentFilteredPosition > 0
    : currentIndex > 0;
  const canGoNext = isFilterActive
    ? hasFilterMatches && currentFilteredPosition < filteredIndices.length - 1
    : currentIndex < totalQuestions - 1;

  const handlePrevQuestion = () => {
    if (!isFilterActive) {
      prevQuestion();
      return;
    }
    if (!hasFilterMatches) return;
    jumpToQuestion(filteredIndices[Math.max(currentFilteredPosition - 1, 0)]);
  };

  const handleNextQuestion = () => {
    if (!isFilterActive) {
      nextQuestion();
      return;
    }
    if (!hasFilterMatches) return;
    jumpToQuestion(
      filteredIndices[
        Math.min(currentFilteredPosition + 1, filteredIndices.length - 1)
      ],
    );
  };

  if (!quiz) return null;

  return (
    <div className="flex h-full flex-col gap-5 relative">
      {/* 1. HIỆU ỨNG PHÁO HOA & CHÚC MỪNG TOÀN MÀN HÌNH (ĐÃ SỬA CHẾ ĐỘ NỀN SÁNG/TỐI) */}
      {showCelebration && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="absolute top-1/4 left-1/4 firework-particle bg-pink-400"></div>
          <div className="absolute top-1/3 right-1/4 firework-particle bg-cyan-400 delay-200"></div>
          <div className="absolute bottom-1/3 left-1/3 firework-particle bg-yellow-400 delay-500"></div>
          <div className="absolute top-1/2 right-1/3 firework-particle bg-emerald-400 delay-300"></div>

          {/* ĐÃ SỬA: Dùng biến isNight để tự động lật màu nền và viền card */}
          <div
            className={`relative rounded-[2.5rem] p-8 md:p-10 text-center max-w-md mx-4 border-4 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in zoom-in duration-500 ${
              isNight
                ? "bg-[#111a38] border-yellow-500/70 shadow-yellow-500/5"
                : "bg-white border-yellow-400"
            }`}
          >
            {/* ĐÃ SỬA: Nền icon thay đổi theo theme */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 animate-bounce ${
                isNight ? "bg-yellow-500/10" : "bg-yellow-100"
              }`}
            >
              <PartyPopper size={44} className="text-yellow-500" />
            </div>

            {/* ĐÃ SỬA: Chữ tiêu đề Gradient lật màu theo theme */}
            <h3
              className={`text-2xl md:text-3xl font-black uppercase tracking-tight bg-clip-text text-transparent bg-gradient-to-r ${
                isNight
                  ? "from-yellow-400 to-orange-500"
                  : "from-blue-600 via-purple-600 to-pink-500"
              }`}
            >
              Nộp bài thành công!
            </h3>

            {/* ĐÃ SỬA: Màu chữ mô tả đồng bộ */}
            <p
              className={`text-sm md:text-base font-bold mt-3 leading-relaxed ${
                isNight ? "text-slate-300" : "text-gray-600"
              }`}
            >
              Chúc mừng bé đã hoàn thành xuất sắc thử thách! Hãy cùng xem lại
              điểm số và các câu trả lời nhé. ✨
            </p>

            <button
              onClick={() => setShowCelebration(false)}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black text-sm rounded-2xl shadow-xl hover:shadow-indigo-500/20 active:scale-95 transition-all"
            >
              XEM KẾT QUẢ NGAY 🎯
            </button>
          </div>
        </div>
      )}

      {/* CSS nội bộ cho pháo hoa */}
      <style>{`
        @keyframes explode {
          0% { transform: scale(0); opacity: 1; box-shadow: 0 0 0 0 calc(var(--color, #ff0055)); }
          50% { opacity: 1; }
          100% { transform: scale(3); opacity: 0; box-shadow: 0 0 20px 30px transparent; }
        }
        .firework-particle {
          width: 8px; height: 8px; border-radius: 50%;
          animation: explode 1.2s ease-out infinite;
        }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* [SỬA LỖI]: Pháo hoa điểm cao (Confetti) giờ cũng chỉ hiện 1 lần cùng lúc với showCelebration */}
      {showCelebration && scorePercent >= 85 && (
        <div className="pointer-events-none fixed inset-0 z-[100]">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            recycle={false}
            numberOfPieces={400}
            gravity={0.15}
          />
        </div>
      )}

      <QuizMilestone
        milestoneMessage={milestoneMessage}
        clearMilestoneMessage={clearMilestoneMessage}
      />

      {/* actionError: hiện inline ngay trong luồng làm bài, không nổi lên che nội dung */}
      <ErrorBanner error={actionError} onDismiss={clearActionError} />

      <div className="grid gap-6 xl:grid-cols-[1fr_260px] items-start">
        {/* LEFT COLUMN: Questions & Controls */}
        <div className="space-y-3">
          {isSubmitted && (
            <QuizScoreBoard
              scoreSummary={scoreSummary}
              scorePercent={scorePercent}
              resultFilter={resultFilter}
              setResultFilter={setResultFilter}
            />
          )}

          {/* CHẶN HIỂN THỊ CÂU HỎI KHI BỘ LỌC RỖNG */}
          {isFilterActive && filteredIndexSet.size === 0 ? (
            <div
              className={`flex flex-col items-center justify-center rounded-[2rem] border-2 p-12 text-center shadow-sm ${
                isNight
                  ? "bg-[#1a254f]/80 border-blue-500/20"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <span className="text-6xl mb-4 drop-shadow-md">
                {resultFilter === "wrong" ? "🎉" : "🔍"}
              </span>
              <h3
                className={`text-xl font-black uppercase tracking-wide ${isNight ? "text-slate-200" : "text-gray-700"}`}
              >
                Không có câu hỏi nào
              </h3>
              <p
                className={`text-sm mt-3 font-semibold ${isNight ? "text-slate-400" : "text-gray-500"}`}
              >
                {resultFilter === "correct" &&
                  "Bé chưa làm đúng câu nào cả. Lần sau cố lên nhé!"}
                {resultFilter === "wrong" &&
                  "Tuyệt vời! Bé không làm sai câu nào!"}
                {resultFilter === "unanswered" &&
                  "Bé đã hoàn thành tất cả các câu hỏi. Rất chăm chỉ!"}
              </p>
            </div>
          ) : (
            /* Khối hiển thị bình thường khi có câu hỏi */
            <>
              {totalQuestions > 0 ? (
                <QuestionCard
                  question={currentQuestion}
                  selectedOption={selectedOption}
                  onSelectOption={handleSelectOption}
                  isSubmitted={quiz.isSubmitted}
                  compact={quiz.isSubmitted ? "tight" : false}
                />
              ) : (
                <div
                  className={`rounded-2xl border border-dashed p-6 text-center text-sm ${isNight ? "border-[#7d95e2]/45 bg-[#111a38]/70 text-slate-300" : "border-gray-300 bg-white/40 text-gray-500"}`}
                >
                  {quiz.hasDetails
                    ? "Quiz chưa có câu hỏi."
                    : "Đang tải câu hỏi..."}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevQuestion}
                    disabled={!canGoPrev}
                    className={`flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-all active:scale-95 ${isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-100 hover:bg-[#253468]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    <ChevronLeft size={18} /> Trước
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={!canGoNext}
                    className={`flex items-center gap-1 rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-50 transition-all active:scale-95 ${isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-100 hover:bg-[#253468]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                  >
                    Tiếp <ChevronRight size={18} />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {!quiz.isSubmitted && (
                    <button
                      onClick={toggleFlagCurrentQuestion}
                      className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 ${questionStatus[currentIndex]?.isFlagged ? (isNight ? "border-yellow-400 bg-yellow-400/20 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.2)]" : "border-yellow-500 bg-yellow-100 text-yellow-800") : isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-100 hover:bg-[#253468]" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}
                    >
                      <Flag
                        size={16}
                        fill={
                          questionStatus[currentIndex]?.isFlagged
                            ? "currentColor"
                            : "none"
                        }
                      />{" "}
                      Phân vân
                    </button>
                  )}
                  {!quiz.isSubmitted && (
                    <button
                      onClick={() => setIsConfirmOpen(true)}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-5 py-2 text-sm font-bold text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-60"
                    >
                      <Send size={16} /> Nộp bài
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Sidebar Info & Navigator */}
        <aside className="space-y-4">
          <QuizSidebarInfo
            quiz={quiz}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            draftName={draftName}
            setDraftName={setDraftName}
            draftDescription={draftDescription}
            setDraftDescription={setDraftDescription}
            handleSave={handleSave}
            isSaving={isSaving}
          />
          <QuizNavigator
            quiz={quiz}
            questionStatus={questionStatus}
            currentIndex={currentIndex}
            isFilterActive={isFilterActive}
            filteredIndexSet={filteredIndexSet}
            jumpToQuestion={jumpToQuestion}
          />
        </aside>
      </div>

      <QuizConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false);
          submitQuiz();
        }}
        unansweredCount={unansweredCount}
        flaggedCount={flaggedCount}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default QuizView;
