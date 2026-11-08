import React from "react";
import { CheckCircle2, XCircle, Award, BarChart2,MinusCircle} from "lucide-react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

const QuizScoreBoard = ({ scoreSummary, scorePercent, resultFilter, setResultFilter }) => {
  const { isNight } = useTheme();

  if (!scoreSummary) return null;

  return (
    <div className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border px-5 py-2.5 shadow-sm transition-all ${
      isNight 
        ? "bg-[#1a254f]/90 border-blue-500/30 text-white" 
        : "border-blue-100 bg-gradient-to-r from-blue-50/40 via-white to-emerald-50/20 text-gray-800"
    }`}>
      
      {/* 1. BÊN TRÁI: Thống kê điểm số rút gọn */}
      <div className="flex items-center gap-2.5">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
          isNight ? "bg-blue-500/20 text-blue-300" : "bg-blue-50 text-blue-700 border border-blue-100"
        }`}>
          <Award size={14} className="opacity-80" />
          <span>Điểm số: <span className="text-sm font-black">{scoreSummary.totalScore}</span>/{scoreSummary.totalMaxScore}</span>
        </div>
        
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold ${
          isNight ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
        }`}>
          <BarChart2 size={14} className="opacity-80" />
          <span>Tỉ lệ đúng: <span className="text-sm font-black">{scorePercent}%</span></span>
        </div>
      </div>
      
      {/* 2. BÊN PHẢI: Bộ lọc câu hỏi - Đã rút gọn text và thêm Hover rực rỡ */}
      <div className="flex items-center gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-xl">
        {[
          { 
            id: "all", label: "Tất cả", icon: null, 
            activeClass: "bg-[#4ecdc4] text-white shadow-sm",
            hoverClass: isNight ? "hover:bg-white/10 hover:text-white" : "hover:bg-black/10 hover:text-gray-800"
          },
          { 
            id: "correct", label: "Đúng", icon: <CheckCircle2 size={13} />, 
            activeClass: "bg-green-500 text-white shadow-sm",
            hoverClass: isNight ? "hover:bg-green-500/20 hover:text-green-400" : "hover:bg-green-100 hover:text-green-700"
          },
          { 
            id: "wrong", label: "Sai", icon: <XCircle size={13} />, 
            activeClass: "bg-red-500 text-white shadow-sm",
            hoverClass: isNight ? "hover:bg-red-500/20 hover:text-red-400" : "hover:bg-red-100 hover:text-red-700"
          },
          { 
            id: "unanswered", label: "Chưa làm", icon: <MinusCircle size={13} />, 
            activeClass: "bg-gray-500 text-white shadow-sm",
            hoverClass: isNight ? "hover:bg-gray-500/40 hover:text-gray-300" : "hover:bg-gray-200 hover:text-gray-700"
          }
        ].map((btn) => {
          const isActive = resultFilter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => setResultFilter(btn.id)}
              // Đã đổi px-3 thành px-2.5 để nút ngắn lại
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all active:scale-95 ${
                isActive 
                  ? btn.activeClass 
                  : `text-gray-500 dark:text-slate-400 ${btn.hoverClass}`
              }`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

    </div>
  );
};

export default QuizScoreBoard;