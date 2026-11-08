import React, { useRef, useEffect } from "react";
import { StairsLoader } from "../../../components/StairsLoader";
import { MessageBubble } from "./MessageBubble";

import { useTheme } from "../../../components/theme/ThemeWrapper"; 

export const ChatArea = ({ messages, isLoading, promptText, setPromptText, onSend }) => {
  const messagesEndRef = useRef(null);
  const { isNight } = useTheme(); // <--- Kéo trạng thái Ngày/Đêm từ ThemeWrapper

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault(); 
    onSend();
  };

  return (
    <main className={`flex h-full flex-1 flex-col items-center justify-between rounded-3xl border p-6 shadow-xl backdrop--md transition-colors duration-500 ${
      isNight ? "border-gray-700/50 bg-gray-900/60" : "border-white/20 bg-white/40"
    }`}>
      
      {/* Header */}
      <header className="w-full space-y-4 text-center">
        <h1 className={`flex h-10 items-center justify-center text-3xl font-extrabold transition-colors ${
          isNight ? "text-gray-100" : "text-gray-800"
        }`}>
          Nội dung
        </h1>
        <hr className={`mx-auto w-full border-t transition-colors ${
          isNight ? "border-gray-600/50" : "border-gray-400/30"
        }`} />
      </header>

      {/* Vùng hiển thị tin nhắn */}
      <div className="custom-scrollbar mb-4 flex w-full flex-1 flex-col space-y-6 overflow-y-auto pr-2 pt-4">
        
        {messages.length === 0 && !isLoading ? (
          <div className={`flex w-full flex-1 flex-col items-center justify-center space-y-4 transition-colors ${
            isNight ? "text-gray-400" : "text-gray-500/70"
          }`}>
            <span className="text-6xl opacity-20">✨</span>
            <p className="font-medium italic tracking-wide">Bắt đầu cuộc trò chuyện...</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => (
              <MessageBubble 
                key={index} 
                role={msg.role} 
                content={msg.content} 
                isNight={isNight} 
              />
            ))}
            
            {/* Loading Indicator của AI */}
            {isLoading && (
              <div className="flex flex-row items-end gap-3 animate-pulse">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 text-2xl shadow-lg ${
                  isNight ? "border-gray-600 bg-yellow-600" : "border-white bg-yellow-400"
                }`}>🤖</div>
                <div className={`flex flex-col items-center gap-3 rounded-[2.5rem] rounded-bl-none border-2 px-8 py-5 transition-colors ${
                  isNight 
                    ? "border-gray-600 bg-[#a13f56] shadow-[0_12px_0_0_#75293c]" // Tối màu bớt chói
                    : "border-white/40 bg-[#FF758F] shadow-[0_12px_0_0_#E94E77]"
                }`}>
                  <span className="text-xs font-black uppercase italic text-white opacity-90">Tớ đang tìm đáp án...</span>
                  <StairsLoader />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Khung nhập liệu (Tự động đổi nền tối/chữ trắng vào ban đêm) */}
      <form onSubmit={handleSubmit} className="relative w-full max-w-3xl mx-auto flex items-center">
        <input 
          type="text" 
          value={promptText} 
          onChange={(e) => setPromptText(e.target.value)}
          placeholder="Nhập câu hỏi..."
          disabled={isLoading}
          className={`w-full rounded-full border px-6 py-4 text-[1.1rem] shadow-lg outline-none transition-colors duration-300 ${
            isNight 
              ? "bg-gray-800/90 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-[#4ecdc4]" 
              : "bg-white/90 border-gray-200 text-gray-800 placeholder-gray-500 focus:border-[#4ecdc4]"
          }`} 
        />
        <button 
          type="submit" 
          disabled={isLoading || !promptText.trim()} 
          className="absolute right-3 rounded-full bg-[#4ecdc4] p-3 text-white transition hover:scale-110 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
        >
          <span className="text-xl">✈️</span>
        </button>
      </form>

    </main>
  );
};