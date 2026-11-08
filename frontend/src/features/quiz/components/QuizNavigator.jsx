import React from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

const QuizNavigator = ({ 
  quiz, questionStatus, currentIndex, isFilterActive, filteredIndexSet, jumpToQuestion 
}) => {
  const { isNight } = useTheme();

  return (
    <div className={`rounded-[2rem] border-2 p-5 ${isNight ? "bg-[#1a254f]/40 border-blue-400/10" : "bg-white/40 border-blue-50"}`}>
      <p className="text-[10px] font-black uppercase opacity-40 mb-4 tracking-tighter">Danh sách câu hỏi</p>
      <div className="grid grid-cols-4 gap-2">
        {questionStatus.map((status, index) => {
          const isCurrent = index === currentIndex;
          const isMatch = !isFilterActive || filteredIndexSet.has(index);
          
          let btnClass = isNight ? "bg-white/5 border-white/10 text-white/40" : "bg-white border-gray-100 text-gray-400";

          if (quiz.isSubmitted) {
            // --- LOGIC KHI ĐÃ NỘP BÀI ---
            const q = quiz.questions[index];
            const isAttempted = !!q.attemptId;
            if (isAttempted) {
              const isCorrect = q.options?.find(o => o.id === q.attemptId)?.isCorrect;
              btnClass = isCorrect 
                ? "bg-emerald-500 border-emerald-600 text-white shadow-lg shadow-emerald-500/20" 
                : "bg-rose-500 border-rose-600 text-white shadow-lg shadow-rose-500/20";
            } else {
              btnClass = isNight 
                ? "bg-gray-500 border-gray-400 text-white shadow-md" 
                : "bg-gray-400 border-gray-500 text-white shadow-md";
            }
          } else {
            // --- LOGIC KHI ĐANG LÀM BÀI (ƯU TIÊN PHÂN VÂN) ---
            if (status.isFlagged) {
              btnClass = isNight 
                ? "bg-yellow-400 border-yellow-500 text-yellow-950 shadow-[0_0_15px_rgba(250,204,21,0.3)]" 
                : "bg-yellow-400 border-yellow-500 text-yellow-950 shadow-md";
            } else if (status.isAnswered) {
              btnClass = isNight
                ? "bg-[#4ecdc4]/80 border-[#4ecdc4] text-white"
                : "bg-[#4ecdc4] border-[#3eb7ae] text-white shadow-md";
            }
          }

          // [SỬA LỖI ĐÂY]: Ghi đè MÀU ĐỒNG NHẤT cho tất cả các câu bị lọc bỏ (không thỏa mãn bộ lọc)
          if (!isMatch) {
             btnClass = isNight 
               ? "bg-[#1e293b]/60 border-slate-700/50 text-slate-500" // Màu xám chuẩn cho Dark Mode (đồng nhất)
               : "bg-gray-100 border-gray-200 text-gray-400";          // Màu xám chuẩn cho Light Mode (đồng nhất)
          }

          return (
            <button 
              key={status.id} onClick={() => isMatch && jumpToQuestion(index)} disabled={!isMatch}
              // [SỬA LỖI]: Bỏ opacity và grayscale đi, chỉ giữ lại hiệu ứng scale và con trỏ chuột
              className={`relative flex items-center justify-center rounded-lg border-2 px-0 py-2.5 text-xs font-bold transition-all ${btnClass} ${
                isCurrent ? "ring-2 ring-offset-1 ring-blue-400/70 scale-105" : ""
              } ${!isMatch ? "scale-95 cursor-not-allowed" : "hover:-translate-y-0.5 hover:shadow-sm"}`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuizNavigator;