import React from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

const QuizConfirmModal = ({ isOpen, onClose, onConfirm, unansweredCount, flaggedCount, isSubmitting }) => {
  const { isNight } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className={`w-full max-w-sm rounded-3xl border p-6 shadow-2xl ${isNight ? "border-[#7d95e2]/45 bg-[#111a38]" : "border-white/30 bg-white"}`}>
        <h3 className={`text-xl font-black ${isNight ? "text-slate-100" : "text-gray-800"}`}>Nộp bài ngay? 🚀</h3>
        
        <div className="mt-4 space-y-2 text-sm">
          <p className={isNight ? "text-slate-300" : "text-gray-600"}>
            • Còn <span className="font-bold text-rose-500">{unansweredCount}</span> câu chưa làm.
          </p>
          <p className={isNight ? "text-slate-300" : "text-gray-600"}>
            • Có <span className="font-bold text-yellow-500">{flaggedCount}</span> câu đang phân vân.
          </p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button onClick={onClose} className={`flex-1 rounded-xl border px-4 py-3 text-sm font-bold transition-all ${isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-100" : "border-gray-200 bg-white text-gray-600"}`}>
            Hủy
          </button>
          <button onClick={onConfirm} disabled={isSubmitting} className="flex-1 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-black text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60">
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizConfirmModal;