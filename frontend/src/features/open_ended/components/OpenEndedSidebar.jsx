import React, { useEffect, useRef } from "react";
import { SignOut, CheckCircle, Question, Circle } from "@phosphor-icons/react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

export const OpenEndedSidebar = ({ items, currentIndex, drafts, unsureItems, onSelect, onExit }) => {
  const { isNight } = useTheme();
  
  // 1. Khai báo ref để trỏ tới câu hỏi đang được chọn
  const activeItemRef = useRef(null);

  // 2. Tự động cuộn đến phần tử đang active mỗi khi currentIndex thay đổi
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center", // Cuộn sao cho phần tử nằm ở giữa khung nhìn
      });
    }
  }, [currentIndex]);

  return (
    <aside className={`relative z-10 flex w-1/4 min-w-[260px] flex-col rounded-[2.5rem] border p-6 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-xl transition-all ${
      isNight ? "border-white/10 bg-[#1e293b]/40" : "border-white/40 bg-white/30"
    }`}>
      <button onClick={onExit} className={`mb-8 flex w-full justify-center items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-black uppercase tracking-wider transition-all border-b-4 hover:-translate-y-1 active:translate-y-1 active:border-b-0 backdrop-blur-md ${
        isNight ? "bg-red-500/20 text-red-400 border-red-900/50 hover:bg-red-500/30" : "bg-white/50 text-red-600 border-white hover:bg-white"
      }`}>
        <SignOut size={20} weight="bold" /> RỜI KHỎI BÀI TẬP
      </button>

      <div className="mb-6 flex items-center justify-between px-2">
        <h2 className={`text-sm font-black uppercase tracking-[0.2em] drop-shadow-sm ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>Lộ trình</h2>
        <span className={`text-xs font-bold px-3 py-1 rounded-full backdrop-blur-md border ${isNight ? 'bg-gray-800/50 text-cyan-400 border-gray-600' : 'bg-white/60 text-blue-600 border-white'}`}>{items.length} CÂU</span>
      </div>

      <div className="relative flex flex-1 flex-col overflow-y-auto px-2 pb-4 scrollbar-hide">
        <div className={`absolute bottom-0 left-[23px] top-4 w-[2px] rounded-full ${isNight ? 'bg-gray-700/50' : 'bg-gray-400/30'}`} />
        {items.map((item, idx) => {
          const isCurrent = idx === currentIndex, hasAnswer = drafts[item.id]?.trim().length > 0, isUnsure = unsureItems.has(item.id);
          let NodeIcon = Circle, nodeColor = isNight ? "text-gray-500 bg-[#1e293b]/80" : "text-gray-400 bg-white/60", textColor = isNight ? "text-gray-400" : "text-gray-600", weight = "bold";

          if (isCurrent) { nodeColor = "text-[#4ecdc4] bg-transparent drop-shadow-[0_0_8px_rgba(78,205,196,0.8)]"; textColor = isNight ? "text-white font-black drop-shadow-md" : "text-gray-900 font-black"; weight = "fill"; } 
          else if (isUnsure) { nodeColor = "text-orange-500 bg-[#1e293b]/80"; textColor = "text-orange-500 font-bold drop-shadow-sm"; NodeIcon = Question; weight = "fill"; } 
          else if (hasAnswer) { nodeColor = "text-[#3b82f6] bg-[#1e293b]/80"; textColor = isNight ? "text-blue-300 font-bold" : "text-blue-700 font-bold"; NodeIcon = CheckCircle; weight = "fill"; }

          return (
            <div 
              key={item.id} 
              ref={isCurrent ? activeItemRef : null} // <-- Gắn ref vào phần tử đang được chọn
              onClick={() => onSelect(idx)} 
              className="group relative flex cursor-pointer items-center gap-5 py-4 transition-all hover:translate-x-2"
            >
              <div className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all backdrop-blur-md ${nodeColor}`}>
                {isCurrent && <div className="absolute inset-0 animate-ping rounded-full border-2 border-[#4ecdc4] opacity-50" />}
                <NodeIcon size={isCurrent ? 24 : 20} weight={weight} />
              </div>
              <span className={`text-[1.1rem] transition-all ${textColor} ${isCurrent ? 'scale-105' : 'group-hover:text-[#4ecdc4]'}`}>Câu số {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
            </div>
          );
        })}
      </div>
    </aside>
  );
};