import React from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import { XIcon, SparkleIcon, TargetIcon, RocketLaunchIcon } from "@phosphor-icons/react";

import ReactMarkdown from 'react-markdown';

export const LearningPathModal = ({ isOpen, onClose, isLoading, pathContent, onGenerate }) => {
  const { isNight } = useTheme();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center backdrop-blur-md p-4 transition-all duration-300 ${isNight ? 'bg-black/70' : 'bg-slate-900/50'}`} onClick={onClose}>
      <div 
        className={`relative w-full max-w-[800px] max-h-[85vh] flex flex-col rounded-[2.5rem] shadow-2xl border animate-in zoom-in-95 duration-300 ${
          isNight ? 'bg-gray-900 border-gray-700' : 'bg-white border-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button onClick={onClose} className="absolute right-6 top-6 z-10 p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors">
          <XIcon size={24} weight="bold" />
        </button>

        {/* Header */}
        <div className={`p-8 pb-6 border-b shrink-0 ${isNight ? 'border-gray-800' : 'border-gray-100'}`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#4ecdc4] to-[#2ab7a8] flex items-center justify-center shadow-lg shadow-[#4ecdc4]/30 shrink-0">
             <RocketLaunchIcon size={32} weight="fill" className="text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isNight ? 'text-gray-100' : 'text-slate-800'}`}>
                Lộ trình học tập của bé
              </h2>
              <p className={`text-sm font-semibold mt-1 ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                Cú Mèo AI đã phân tích tài liệu và gợi ý kế hoạch siêu đỉnh! 🌟
              </p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] opacity-80">
              <div className="relative flex items-center justify-center mb-6">
                 <div className="absolute w-20 h-20 border-4 border-t-[#4ecdc4] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                 <div className="absolute w-14 h-14 border-4 border-b-[#bf94e4] border-r-transparent border-t-transparent border-l-transparent rounded-full animate-spin direction-reverse"></div>
                 <SparkleIcon size={32} weight="fill" className="text-[#4ecdc4] animate-pulse" />
              </div>
              <p className={`font-black text-lg ${isNight ? 'text-[#4ecdc4]' : 'text-[#2ab7a8]'}`}>
                Đang dùng phép thuật AI...
              </p>
              <p className={`text-sm font-medium mt-2 ${isNight ? 'text-gray-400' : 'text-gray-500'}`}>
                Vui lòng đợi một chút, Cú Mèo đang đọc tài liệu của bé!
              </p>
            </div>
          ) : !pathContent ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px]">
              <TargetIcon size={64} weight="duotone" className={`mb-4 ${isNight ? 'text-gray-700' : 'text-slate-200'}`} />
              <p className={`text-center font-bold max-w-md ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                Bấm nút bên dưới để AI tự động trích xuất các ý chính và lên lịch học ôn tập cho bé dựa trên các tài liệu đã tải lên nhé.
              </p>
            </div>
          ) : (
            <div className={`prose prose-lg max-w-none ${isNight ? 'prose-invert prose-p:text-gray-300 prose-headings:text-gray-100 prose-strong:text-[#4ecdc4] prose-li:text-gray-300' : 'prose-p:text-slate-600 prose-headings:text-slate-800 prose-strong:text-[#2ab7a8] prose-li:text-slate-600'}`}>
              
              {/* Đã thay thế dangerouslySetInnerHTML bằng ReactMarkdown */}
              <ReactMarkdown>{pathContent}</ReactMarkdown>
              
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-6 border-t flex justify-end gap-3 shrink-0 ${isNight ? 'border-gray-800' : 'border-gray-100'}`}>
           {!isLoading && (
             <button 
                onClick={onGenerate}
                className="flex items-center gap-2 rounded-xl bg-[#4ecdc4] px-8 py-3.5 font-black text-white transition hover:bg-[#38b5ac] hover:-translate-y-0.5 shadow-md shadow-[#4ecdc4]/20"
             >
               <SparkleIcon size={20} weight="fill" />
               {pathContent ? "Tạo lại lộ trình" : "Bắt đầu tạo lộ trình"}
             </button>
           )}
        </div>
      </div>
    </div>
  );
};