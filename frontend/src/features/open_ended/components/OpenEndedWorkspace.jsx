import React, { useEffect, useState } from "react";
import { CaretLeft, CaretRight, BookmarkSimple, PaperPlaneRight, Checks, TextT, Clock, Sparkle } from "@phosphor-icons/react";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import { SmartContent } from "../../../components/SmartContent";

export const OpenEndedWorkspace = ({
  currentItem, currentIndex, totalItems, draftValue, isSubmitted, isUnsure,
  onChange, onBlur, onToggleUnsure, onPrev, onNext, onSubmit
}) => {
  const { isNight } = useTheme();
  const [showSaved, setShowSaved] = useState(false);

  // UX: Tính số từ và thời gian đọc dự kiến
  const wordCount = draftValue?.trim() ? draftValue.trim().split(/\s+/).length : 0;
  const readTime = Math.ceil(wordCount / 100); // 100 từ mỗi phút cho trẻ em

  useEffect(() => {
    if (draftValue && !isSubmitted) {
      setShowSaved(true);
      const t = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(t);
    }
  }, [draftValue, isSubmitted]);

  return (
    <main className={`relative z-10 flex flex-1 flex-col overflow-hidden rounded-[2.5rem] shadow-2xl transition-all ${
      isNight ? "bg-[#1e293b] border border-gray-700" : "bg-white border border-gray-100"
    }`}>
      
      {/* THANH TIẾN ĐỘ TRÊN CÙNG */}
      <div className="absolute top-0 left-0 h-1.5 w-full bg-gray-100 dark:bg-gray-800">
        <div 
          className="h-full bg-gradient-to-r from-[#4ecdc4] to-[#a855f7] transition-all duration-500"
          style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
        />
      </div>

      <header className={`px-12 pt-12 pb-6 border-b ${isNight ? 'border-gray-700' : 'border-gray-50'}`}>
        <div className="flex items-center justify-between mb-4">
          <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
            isNight ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-50 text-purple-600'
          }`}>
            <Sparkle size={14} weight="fill" /> Bài tập tự luận
          </span>
          <button 
            onClick={() => onToggleUnsure(currentItem.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isUnsure ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <BookmarkSimple size={18} weight={isUnsure ? "fill" : "bold"} />
            {isUnsure ? 'Đã đánh dấu' : 'Cần xem lại'}
          </button>
        </div>
        <h3 className={`text-2xl font-black leading-tight ${isNight ? 'text-gray-100' : 'text-gray-800'}`}>
          <span className="text-purple-500 mr-3">#{currentIndex + 1 < 10 ? `0${currentIndex + 1}` : currentIndex + 1}</span>
          <SmartContent>
            {currentItem.question}
          </SmartContent>
        </h3>
      </header>

      {/* VÙNG TRẢ LỜI - DẠNG TRANG VỞ CÓ DÒNG KẺ */}
      <div className="relative flex flex-1 flex-col p-10 pt-6">
        <style>{`
          .notebook-lines {
            background-image: ${isNight 
              ? 'repeating-linear-gradient(transparent, transparent 39px, #334155 39px, #334155 40px)' 
              : 'repeating-linear-gradient(transparent, transparent 39px, #e2e8f0 39px, #e2e8f0 40px)'};
            background-size: 100% 40px;
            line-height: 40px !important;
          }
        `}</style>
        
        <textarea 
          value={draftValue} onChange={(e) => onChange(currentItem.id, e.target.value)} 
          onBlur={() => onBlur(currentItem.id)} disabled={isSubmitted} 
          placeholder={isSubmitted ? "Bài làm đã được khóa để chấm điểm." : "Viết những suy nghĩ của bé vào trang vở này nhé..."}
          className={`notebook-lines custom-scrollbar flex-1 w-full resize-none bg-transparent text-[1.25rem] font-medium outline-none transition-all ${
            isNight ? 'text-cyan-50 placeholder-gray-600' : 'text-gray-700 placeholder-gray-300'
          }`}
        />

        {/* FOOTER NHỎ TRONG VỞ: THỐNG KÊ BIẾT ĐỌC/VIẾT */}
        <div className={`mt-4 flex items-center gap-6 text-sm font-bold opacity-50 ${isNight ? 'text-gray-300' : 'text-gray-500'}`}>
          <span className="flex items-center gap-2"><TextT size={18} /> {wordCount} từ</span>
          <span className="flex items-center gap-2"><Clock size={18} /> ~{readTime} phút đọc</span>
          <div className={`ml-auto flex items-center gap-2 text-green-500 transition-all ${showSaved ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
            <Checks size={18} weight="bold" /> Tự động lưu
          </div>
        </div>
      </div>

      {/* NHẬN XÉT CỦA CÚ MÈO */}
      {isSubmitted && currentItem.explanation && (
        <div className={`mx-10 mb-6 p-6 rounded-3xl border animate-in slide-in-from-bottom-4 ${
          isNight ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-100 shadow-inner'
        }`}>
           <div className="flex items-center justify-between mb-2">
             <h4 className="flex items-center gap-2 font-black text-blue-600">
               <span className="text-xl">🦉</span> Cú Mèo nhận xét:
             </h4>
             <div className="px-4 py-1.5 rounded-2xl bg-white/50 dark:bg-black/20 font-black text-indigo-600">
                🎯 {Math.round(currentItem.user_score||0)} / {Math.round(currentItem.max_score||0)}
             </div>
           </div>
           <p className={`text-[1.05rem] leading-relaxed italic ${isNight ? 'text-blue-100' : 'text-blue-900'}`}>
             "{currentItem.explanation}"
           </p>
        </div>
      )}

      {/* ĐIỀU HƯỚNG */}
      <footer className={`flex items-center justify-between px-10 py-6 border-t ${isNight ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
         <div className="flex gap-3">
            <button onClick={onPrev} disabled={currentIndex === 0} className={`h-12 w-12 flex items-center justify-center rounded-2xl border-2 transition-all disabled:opacity-30 ${isNight ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <CaretLeft size={24} weight="bold" />
            </button>
            <button onClick={onNext} disabled={currentIndex === totalItems - 1} className={`h-12 w-12 flex items-center justify-center rounded-2xl border-2 transition-all disabled:opacity-30 ${isNight ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <CaretRight size={24} weight="bold" />
            </button>
         </div>

         {!isSubmitted && (
           <button onClick={onSubmit} className="flex items-center gap-3 px-10 py-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/20 transition-all hover:-translate-y-1 active:scale-95">
              NỘP BÀI NGAY <PaperPlaneRight size={24} weight="fill" />
           </button>
         )}
      </footer>
    </main>
  );
};