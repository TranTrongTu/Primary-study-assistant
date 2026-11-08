import React, { useState, useEffect, useMemo } from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";
import { BookOpenText, Target, MagicWand, X, Sparkle, WarningCircle, Trash } from "@phosphor-icons/react";

// 1. Import danh sách từ constants
import { QUIZ_SAMPLE_PROMPTS, ESSAY_SAMPLE_PROMPTS } from '../constants';

export const ToolSetupArea = ({
  toolId,
  onConfirm,
  onCancel,
  isLoading,
  errorMessage,
  onClearError,
}) => {
  const { isNight } = useTheme();
  
  const [userInput, setUserInput] = useState("");
  const [subject, setSubject] = useState("VIETNAMESE");
  const [selectedSamples, setSelectedSamples] = useState([]);
  
  // 2. State lưu danh sách gợi ý ngẫu nhiên
  const [suggestedPrompts, setSuggestedPrompts] = useState([]);

  // Hàm random 3-4 prompt
  const refreshPrompts = (type) => {
    const list = type === 'essay' ? ESSAY_SAMPLE_PROMPTS : QUIZ_SAMPLE_PROMPTS;
    const shuffled = [...list].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 3; // Lấy 3 hoặc 4
    setSuggestedPrompts(shuffled.slice(0, count));
  };

  // 3. Tự động làm mới khi toolId thay đổi
  useEffect(() => {
    refreshPrompts(toolId);
    setSelectedSamples([]); 
    setUserInput("");
  }, [toolId]);

  const toolInfo = useMemo(() => {
    switch (toolId) {
      case 'essay': return { title: 'Cấu hình Bài tập Tự luận', icon: <BookOpenText size={32} weight="fill" className="text-[#FF758F]" /> };
      case 'quiz': return { title: 'Cấu hình Trắc nghiệm', icon: <Target size={32} weight="fill" className="text-[#4ecdc4]" /> };
      default: return { title: `Cấu hình ${toolId}`, icon: <MagicWand size={32} weight="fill" className="text-purple-500" /> };
    }
  }, [toolId]);

  const handleToggleSample = (sample) => {
    if (onClearError) onClearError();
    setSelectedSamples(prev => 
      prev.includes(sample) ? prev.filter(s => s !== sample) : [...prev, sample]
    );
  };

  const isFormValid = userInput.trim().length > 0 || selectedSamples.length > 0;

  const handleConfirm = () => {
    if (!isFormValid) return;
    if (onClearError) onClearError();
    const finalPrompt = [userInput.trim(), ...selectedSamples].filter(Boolean).join(". ");
    onConfirm({ subject, prompt: finalPrompt });
  };

  return (
    <div className={`absolute inset-0 z-[50] flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in zoom-in duration-300 rounded-[2.5rem] ${isNight ? 'bg-black/60' : 'bg-white/40'}`}>
      <div className={`relative w-full max-w-[800px] rounded-[2.5rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl border transition-all ${isNight ? "bg-[#1e293b]/90 border-white/10 text-gray-100" : "bg-white/90 border-white/40 text-gray-800"}`}>
        
        <button onClick={onCancel} className="absolute right-8 top-8 text-gray-400 hover:text-red-500 transition-all hover:rotate-90 z-10">
          <X size={28} weight="bold" />
        </button>

        <header className="flex items-center gap-4 mb-8">
          <div className={`p-4 rounded-2xl ${isNight ? 'bg-gray-800/80' : 'bg-gray-100'} shadow-sm`}>{toolInfo.icon}</div>
          <div>
            <h2 className={`text-3xl font-black tracking-tight ${isNight ? 'text-blue-400' : 'text-blue-600'}`}>{toolInfo.title}</h2>
            <p className="text-sm font-bold opacity-60">Cú Mèo sẽ dựa vào đây để ra đề cho bé</p>
          </div>
        </header>

        <div className="mb-8">
          <textarea
            className={`w-full h-44 p-6 rounded-[2rem] border-2 text-[1.2rem] leading-relaxed outline-none transition-all resize-none custom-scrollbar ${isNight ? "bg-gray-900/50 border-gray-700 focus:border-blue-400 text-white" : "bg-white border-gray-200 focus:border-blue-500 text-gray-800"}`}
            placeholder="Nhập yêu cầu của bé hoặc dán văn bản vào đây..."
            value={userInput}
            onChange={(e) => { if (onClearError) onClearError(); setUserInput(e.target.value); }}
          />
          
          {/* 4. Hiển thị Suggested Prompts thay cho biến samples tĩnh cũ */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
               <h4 className="text-xs font-black uppercase opacity-60">Gợi ý từ Cú Mèo:</h4>
               <button onClick={() => refreshPrompts(toolId)} className="text-[10px] font-bold text-blue-500 hover:underline">
                 Đổi gợi ý khác
               </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map(sample => {
                const isSelected = selectedSamples.includes(sample);
                return (
                  <button 
                    key={sample}
                    onClick={() => handleToggleSample(sample)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl border-2 transition-all flex items-center gap-2 ${isSelected ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30 -translate-y-1" : (isNight ? "bg-gray-800/50 border-gray-700 text-gray-400" : "bg-white border-gray-200 text-gray-600")}`}
                  >
                    {isSelected && <Sparkle size={14} weight="fill" className="animate-pulse" />}
                    {sample}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* KHỐI CẤU HÌNH DƯỚI */}
        <div className="flex flex-col md:flex-row gap-6 mb-10">
          <div className={`flex-1 p-5 rounded-3xl border-2 ${isNight ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
            <h4 className="flex items-center gap-2 font-black text-sm uppercase tracking-widest mb-4 opacity-70">
              📚 Chọn Môn học:
            </h4>
            <div className="flex gap-2">
              {[
                { id: 'VIETNAMESE', label: 'Tiếng Việt' },
                { id: 'MATHS', label: 'Toán' },
                { id: 'ENGLISH', label: 'Tiếng Anh' }
              ].map(sub => (
                <button key={sub.id} onClick={() => {
                  if (onClearError) onClearError();
                  setSubject(sub.id);
                }}
                  className={`flex-1 rounded-xl py-3 text-xs font-black transition-all border-2 ${
                    subject === sub.id 
                      ? "border-purple-500 bg-purple-500 text-white shadow-lg" 
                      : (isNight ? "border-gray-700 bg-gray-800 text-gray-500 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50")
                  }`}>
                  {sub.label}
                </button>
              ))}
            </div>
          </div>
          
           <div className={`flex-1 p-5 rounded-3xl border-2 flex flex-col justify-center items-center text-center ${isNight ? 'border-gray-700 bg-gray-900/50' : 'border-gray-100 bg-gray-50'}`}>
             <p className="text-sm font-bold opacity-50 italic">
               Cú mèo sẽ tạo ra nhiều câu trắc nghiệm hay để bé ôn tập nhé.
             </p>
           </div>
        </div>

        {/* NÚT HÀNH ĐỘNG */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            {errorMessage && (
              <div className="mb-2 max-w-[28rem] rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400">
                {errorMessage}
              </div>
            )}
            {!isFormValid && (
              <span className="text-red-500 text-xs font-bold flex items-center gap-1 animate-pulse">
                <WarningCircle size={16} /> Bé chưa nhập nội dung bài học!
              </span>
            )}
            
          </div>

          <button 
            disabled={isLoading || !isFormValid} 
            onClick={handleConfirm}
            className={`group flex items-center gap-3 px-10 py-4 rounded-2xl font-black text-white shadow-xl transition-all active:scale-95 ${
              !isFormValid 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 hover:-translate-y-1 shadow-purple-500/20"
            }`}
          >
            {isLoading ? (
              <Sparkle size={24} className="animate-spin" />
            ) : (
              <MagicWand size={24} weight="fill" className="group-hover:rotate-12 transition-transform" />
            )}
            {isLoading ? "ĐANG SOẠN BÀI..." : "BẮT ĐẦU TẠO BÀI"}
          </button>
        </div>

      </div>
    </div>
  );
};