import React from "react";
import { X } from "lucide-react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

const QuizSidebarInfo = ({
  quiz,
  isEditing,
  setIsEditing,
  draftName,
  setDraftName,
  draftDescription,
  setDraftDescription,
  handleSave,
  isSaving
}) => {
  const { isNight } = useTheme();
  const isSubmitted = Boolean(quiz?.isSubmitted);

  return (
    <div className={`rounded-[2rem] border-2 p-5 shadow-sm ${isNight ? "border-[#7d95e2]/40 bg-[#111a38]/80" : "border-[#8ce1d8]/35 bg-gradient-to-br from-white/92 to-[#eefbff]/86"}`}>
      {/* Edit Mode vs View Mode */}
      {isEditing ? (
        <div className="space-y-3">
          <input 
            value={draftName} 
            onChange={(e) => setDraftName(e.target.value)} 
            className={`w-full rounded-xl border px-3 py-2 text-sm font-semibold ${isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-100" : "border-gray-200 bg-white text-gray-800"}`} 
            placeholder="Tên quiz" 
          />
          <textarea 
            value={draftDescription} 
            onChange={(e) => setDraftDescription(e.target.value)} 
            className={`min-h-[72px] w-full resize-none rounded-xl border px-3 py-2 text-sm ${isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-200" : "border-gray-200 bg-white text-gray-700"}`} 
            placeholder="Mô tả ngắn..." 
          />
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold ${isNight ? "border-[#7d95e2]/45 bg-[#1a254f] text-slate-200" : "border-gray-200 bg-white text-gray-600"}`}>Hủy</button>
            <button onClick={handleSave} disabled={isSaving} className="flex-1 rounded-xl bg-[#4ecdc4] px-3 py-2 text-xs font-bold text-white disabled:opacity-60">Lưu</button>
          </div>
        </div>
      ) : (
        <div className="relative group pr-6">
          <h3 className={`text-lg font-bold leading-tight ${isNight ? "text-slate-100" : "text-gray-800"}`}>{quiz.name}</h3>
          <p className={`mt-2 text-xs leading-relaxed ${isNight ? "text-slate-300" : "text-gray-600"}`}>{quiz.description || "Chưa có mô tả."}</p>
          <button onClick={() => setIsEditing(true)} className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1">
            ✎
          </button>
        </div>
      )}

      {/* Status Badge Button */}
      <div className="mt-4">
        <button disabled className={`w-full rounded-xl px-4 py-2 text-xs font-black tracking-wide shadow-sm transition-all ${
          isSubmitted
            ? isNight ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : isNight ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "bg-amber-100 text-amber-700 border border-amber-200"
        }`}>
          {isSubmitted ? "● ĐÃ NỘP BÀI" : "○ ĐANG LÀM BÀI"}
        </button>
      </div>
    </div>
  );
};

export default QuizSidebarInfo;