import React from 'react';
import { SmartContent } from "../../../components/SmartContent";


export const MessageBubble = ({ role, content, isNight }) => {
  const isUser = role === "user";

  return (
    <div className={`flex items-end gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      
      {/* Avatar */}
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-2xl shadow-lg ${
        isUser 
          ? (isNight ? "border-gray-600 bg-blue-600" : "border-white bg-blue-400") 
          : (isNight ? "border-gray-600 bg-yellow-600" : "border-white bg-yellow-400")
      }`}>
        {isUser ? "👦" : "🤖"}
      </div>
      
      {/* Khung nội dung */}
      <div className={`relative max-w-[70%] rounded-[2rem] border-2 px-6 py-4 text-lg font-medium leading-relaxed ${
        isUser 
          ? (isNight 
              // Bong bóng User ban đêm: Xanh sậm, bớt chói
              ? "rounded-br-none border-[#2a827c] bg-[#2c8886] text-white/90 shadow-[0_8px_0_0_#1d5c5a]" 
              // Bong bóng User ban ngày
              : "rounded-br-none border-[#3dbbb2] bg-[#4ecdc4] text-white shadow-[0_8px_0_0_rgba(0,0,0,0.05)]")
          : (isNight 
              // Bong bóng AI ban đêm: Xám đen, chữ trắng xám
              ? "rounded-tl-none border-gray-600 bg-gray-800 text-gray-200 shadow-[0_8px_0_0_rgba(0,0,0,0.3)]"
              // Bong bóng AI ban ngày
              : "rounded-tl-none border-gray-100 bg-white text-gray-700 shadow-[0_8px_0_0_rgba(0,0,0,0.05)]")
      }`}>
        <SmartContent>{content}</SmartContent>
        
        {/* Cái đuôi nhọn của bong bóng chat - Cần đổi màu nền khớp với khung */}
        <div className={`absolute bottom-0 h-4 w-4 ${
          isUser 
            ? (isNight ? "-right-2 bg-[#2c8886] clip-path-right-tail" : "-right-2 bg-[#4ecdc4] clip-path-right-tail")
            : (isNight ? "-left-2 bg-gray-800 clip-path-left-tail" : "-left-2 bg-white clip-path-left-tail")
        }`} />
      </div>

    </div>
  );
};