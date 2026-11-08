import React, { useState, useEffect } from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper"; 
import { XIcon, SparkleIcon, TargetIcon, RocketLaunchIcon, TrashIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import ReactMarkdown from 'react-markdown';

const SUBJECTS = [
  { id: 'MATHS', label: 'Toán', emoji: '📐' },
  { id: 'VIETNAMESE', label: 'Tiếng Việt', emoji: '📖' },
  { id: 'ENGLISH', label: 'Tiếng Anh', emoji: '🔤' },
  { id: null, label: 'Khác', emoji: '📂' } 
];

export const DocumentDetailModal = ({ 
  document, isOpen, onClose, onRename, onDelete,
  isGeneratingPath, pathData, onGenerate, fileIcon,
  onAutoChat, onAutoGenerate // 🎯 Nhận 2 Master Router
}) => {
  const { isNight } = useTheme();
  
  const [tempName, setTempName] = useState("");
  

  const dotIndex = document?.name?.lastIndexOf('.') ?? -1;
  const baseName = dotIndex !== -1 ? document.name.substring(0, dotIndex) : (document?.name || "");
  const ext = dotIndex !== -1 ? document.name.substring(dotIndex) : "";

  const currentSubjectMapped = ['MATHS', 'VIETNAMESE', 'ENGLISH'].includes(document.subject_type) ? document.subject_type : null;
  
  const [tempSubject, setTempSubject] = useState(currentSubjectMapped);

  const isExpanded = isGeneratingPath || !!pathData;
  
  useEffect(() => {
    if (document) {
      setTempName(baseName);
      setTempSubject(currentSubjectMapped); // 🎯 Đồng bộ an toàn
    }
  }, [document, isOpen, baseName]);

  const isChanged = tempName.trim() !== baseName || tempSubject !== currentSubjectMapped;
  
  const handleSave = () => {
    const newFullName = tempName.trim() + ext;
    const updates = {};
    
    if (tempName.trim() && newFullName !== document.name) updates.name = newFullName;
    
    if (tempSubject !== currentSubjectMapped) {
      // 🎯 Sẽ trực tiếp gán updates.subject_type = null nếu chọn Khác
      updates.subject_type = tempSubject; 
    }
    
    if (Object.keys(updates).length > 0) {
      onRename(document.id, updates); 
      onClose();
    }
  };

  const fileTypeDisplay = document.type || ext.replace('.', '').toUpperCase() || "FILE";

  const markdownComponents = {
    h3: ({node, ...props}) => <h3 className={`text-lg font-black mt-4 mb-2 ${isNight ? 'text-white' : 'text-slate-800'}`} {...props} />,
    h4: ({node, ...props}) => <h4 className={`text-sm font-extrabold mt-3 mb-1.5 ${isNight ? 'text-slate-200' : 'text-slate-700'}`} {...props} />,
    p: ({node, ...props}) => <p className={`text-[13.5px] font-medium leading-relaxed mb-3 break-words whitespace-pre-wrap ${isNight ? 'text-gray-300' : 'text-slate-600'}`} {...props} />,
    strong: ({node, ...props}) => <strong className={`font-black ${isNight ? 'text-[#4ecdc4]' : 'text-[#269e94]'}`} {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-1" {...props} />,
    li: ({node, ...props}) => <li className={`text-[13.5px] font-medium break-words ${isNight ? 'text-gray-300' : 'text-slate-600'}`} {...props} />,
  };

  return (
    <div className={`fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-300 ${isNight ? 'bg-black/70' : 'bg-slate-900/50'}`} onClick={onClose}>
      
      <div 
        className={`relative flex flex-col md:flex-row overflow-hidden rounded-[2.5rem] shadow-2xl border transition-all duration-500 ease-in-out ${
          isExpanded 
            ? `w-[95vw] md:w-[90vw] lg:w-[85vw] max-w-7xl h-[90vh] ${isNight ? 'bg-gray-900 border-gray-700' : 'bg-white border-white'}`
            : `w-full max-w-md h-auto ${isNight ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-100'}`
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute right-4 top-4 md:right-6 md:top-6 z-50 p-2 rounded-full text-gray-400 hover:bg-gray-200 hover:text-red-500 transition-colors">
          <XIcon size={24} weight="bold" />
        </button>

        {/* ➖➖ CỘT TRÁI ➖➖ */}
        <div className={`flex flex-col shrink-0 overflow-y-auto custom-scrollbar transition-all duration-500 ${
          isExpanded 
            ? `w-full md:w-[30%] lg:w-[28%] p-6 lg:p-8 border-b md:border-b-0 md:border-r ${isNight ? 'bg-gray-800/40 border-gray-800' : 'bg-slate-50/50 border-slate-100'}`
            : 'w-full p-8'
        }`}>
           <p className="text-[11px] font-black uppercase tracking-widest text-[#4ecdc4] mb-6">Quản lý Tài liệu</p>
           
           <div className="flex flex-col gap-6 flex-1">
             <div>
               <label className={`text-[11px] font-extrabold uppercase mb-2 block ${isNight ? 'text-gray-500' : 'text-slate-500'}`}>Tên tài liệu</label>
               <div className={`flex items-center border-b-2 pb-1 focus-within:border-[#4ecdc4] transition-colors ${isNight ? 'border-gray-700' : 'border-slate-300'}`}>
                 <span className="mr-2 text-xl drop-shadow-sm">{fileIcon}</span>
                 <input
                   value={tempName}
                   onChange={(e) => setTempName(e.target.value)}
                   className={`w-full bg-transparent text-[15px] font-black outline-none break-words ${isNight ? 'text-white' : 'text-slate-800'}`}
                 />
                 <span className={`select-none pl-1 text-[15px] font-black ${isNight ? 'text-gray-600' : 'text-slate-400'}`}>{ext}</span>
               </div>
             </div>
             
             <div>
               <label className={`text-[11px] font-extrabold uppercase mb-3 block ${isNight ? 'text-gray-500' : 'text-slate-500'}`}>Đổi môn học</label>
               {/* 🎯 Redesign lại thành dạng Grid 2x2 cực kỳ gọn gàng */}
               <div className="grid grid-cols-2 gap-3">
                 {SUBJECTS.map(sub => (
                   <button
                     key={sub.id}
                     onClick={() => setTempSubject(sub.id)}
                     className={`flex items-center justify-start px-4 gap-2.5 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 border-2 ${
                       tempSubject === sub.id
                         ? `bg-[#4ecdc4]/10 border-[#4ecdc4] text-[#2ab7a8] shadow-[0_0_15px_rgba(78,205,196,0.15)]`
                         : (isNight ? "bg-gray-800/80 border-gray-700 text-gray-400 hover:border-gray-500 hover:bg-gray-700" : "bg-white border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50")
                     }`}
                   >
                     <span className="text-xl shrink-0 drop-shadow-sm">{sub.emoji}</span> 
                     <span className="truncate">{sub.label}</span>
                   </button>
                 ))}
               </div>
             </div>

             <div className="mt-2 text-xs font-semibold text-gray-400 flex flex-col gap-1">
                <p>📅 Ngày tải: {new Date(document.createdAt || document.created_at).toLocaleDateString("vi-VN")}</p>
                <p>🗂️ Định dạng: {fileTypeDisplay}</p>
             </div>
           </div>

           <div className={`${isExpanded ? 'mt-6 md:mt-auto' : 'mt-8'} pt-6 flex flex-col gap-2 shrink-0`}>
             {!isExpanded && (
               <button 
                 onClick={onGenerate}
                 className="flex items-center justify-center gap-2 rounded-xl bg-slate-800 py-3.5 font-bold text-white shadow-md hover:bg-slate-700 active:scale-95 transition-all mb-2"
               >
                 <SparkleIcon size={20} weight="fill" /> Phân tích AI & Lộ trình
               </button>
             )}

             {isChanged && (
               <button onClick={handleSave} className="flex items-center justify-center gap-2 rounded-xl bg-[#4ecdc4] py-3.5 font-bold text-white shadow-md shadow-[#4ecdc4]/30 hover:bg-[#38b5ac] active:scale-95 transition-all">
                 <FloppyDiskIcon size={20} weight="fill" /> Lưu thông tin
               </button>
             )}
             <button onClick={() => { onDelete(document.id); onClose(); }} className={`flex items-center justify-center gap-2 rounded-xl py-3.5 font-bold transition-all active:scale-95 ${isNight ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}>
               <TrashIcon size={20} weight="fill" /> Xóa tài liệu này
             </button>
           </div>
        </div>

        {/* ➖➖ CỘT PHẢI ➖➖ */}
        {isExpanded && (
          <div className={`w-full md:w-[70%] lg:w-[72%] flex flex-col relative min-w-0 transition-all duration-500 flex-1 ${isNight ? 'bg-gray-900' : 'bg-white'}`}>
            <div className={`p-6 lg:p-8 pb-5 border-b shrink-0 ${isNight ? 'border-gray-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4ecdc4] to-[#2ab7a8] flex items-center justify-center shadow-lg shadow-[#4ecdc4]/30 shrink-0">
                  <RocketLaunchIcon size={26} weight="fill" className="text-white" />
                </div>
                <div className="overflow-hidden">
                  <h2 className={`text-xl font-black truncate ${isNight ? 'text-gray-100' : 'text-slate-800'}`}>Lộ trình học tập cá nhân</h2>
                  <p className={`text-xs font-semibold mt-0.5 truncate ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>Cú Mèo AI phân tích riêng cho tài liệu này</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8 custom-scrollbar">
                {isGeneratingPath ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-80">
                    <div className="relative flex items-center justify-center mb-6">
                      <div className="absolute w-20 h-20 border-4 border-t-[#4ecdc4] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                      <SparkleIcon size={32} weight="fill" className="text-[#4ecdc4] animate-pulse" />
                    </div>
                    <p className={`font-black text-lg text-center px-4 ${isNight ? 'text-[#4ecdc4]' : 'text-[#2ab7a8]'}`}>Cú Mèo AI đang đọc và tóm tắt...</p>
                  </div>
                ) : pathData && (
                  <div className="space-y-6 w-full max-w-full pb-8">
                    
                    {pathData.summary && (
                      <div className={`p-5 rounded-2xl border w-full overflow-hidden ${isNight ? 'bg-gray-800/30 border-gray-700' : 'bg-slate-50 border-slate-100'}`}>
                        <h4 className={`text-xs font-black uppercase tracking-wider mb-2 flex items-center gap-1.5 ${isNight ? 'text-[#4ecdc4]' : 'text-[#2ab7a8]'}`}>
                          <span className="text-lg">📝</span> Tóm tắt tài liệu
                        </h4>
                        <ReactMarkdown components={markdownComponents}>
                          {pathData.summary}
                        </ReactMarkdown>
                      </div>
                    )}

                    {pathData.material_recommendations && pathData.material_recommendations.length > 0 && (
                      <div className="w-full">
                        <h4 className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                          <span className="text-lg">🎯</span> Bài tập Cú Mèo gợi ý tạo
                        </h4>
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 w-full">
                          {pathData.material_recommendations.map((item, idx) => {
                            let formatConfig = { emoji: "📝", label: "TỰ LUẬN", color: "from-blue-500 to-indigo-500" };
                            if (item.activity_format === "MULTIPLE_CHOICE_QUESTIONS") {
                              formatConfig = { emoji: "📋", label: "QUIZ", color: "from-[#4ecdc4] to-[#38b5ac]" };
                            } else if (item.activity_format === "FLASHCARDS") {
                              formatConfig = { emoji: "📕", label: "FLASHCARD", color: "from-red-400 to-red-500" };
                            } else if (item.activity_format === "GAP_FILL") {
                              formatConfig = { emoji: "🧠", label: "TAP TO REVIEW", color: "from-pink-400 to-rose-500" };
                            } else if (item.activity_format === "OPEN_ENDED") {
                              formatConfig = { emoji: "📝", label: "TỰ LUẬN", color: "from-amber-400 to-orange-500" };
                            }

                            return (
                              <div key={idx} className={`p-4 md:p-5 rounded-2xl border flex flex-col justify-between transition-all hover:-translate-y-0.5 hover:shadow-md w-full overflow-hidden ${isNight ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                                <div className="w-full">
                                  <div className="flex items-center gap-2 mb-3">
                                    <span className="text-2xl shrink-0">{formatConfig.emoji}</span>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-gradient-to-r text-white shrink-0 ${formatConfig.color}`}>
                                      {formatConfig.label}
                                    </span>
                                  </div>
                                  <p className={`text-[12.5px] font-medium leading-relaxed mt-2 line-clamp-3 break-words ${isNight ? 'text-gray-300' : 'text-slate-600'}`} title={item.prompt}>
                                    {item.prompt}
                                  </p>
                                </div>
                                
                                {/* 🎯 GỌI HÀM TẠO BÀI TẬP Ở ĐÂY */}
                                <button
                                  onClick={() => {
                                    onClose();
                                    if (onAutoGenerate) {
                                      const subjectType = item.subject_type || document.subject_type || null;

                                      if (item.activity_format === 'GAP_FILL') {
                                        // 🎯 Build prompt TTR chuẩn: 5-10 câu, 1-2 ô trống/câu, mode normal (mặc định)
                                        const questionCount = 8; // giữa 5-10
                                        const ttrPrompt = `
Create exactly ${questionCount} gap-fill (cloze) problems about the following topic: "${item.prompt}".

Return ONLY a raw JSON object. No markdown, no code blocks, no explanation — just the JSON.

Required JSON structure:
{
  "activity_items": [
    {
      "text": "Sentence with $!BLANK!$ placeholder",
      "corrects": ["correct_word_1"],
      "distractors": ["wrong1", "wrong2"]
    }
  ]
}

STRICT RULES:
1. The ONLY blank placeholder allowed is $!BLANK!$ — do NOT use [BLANK], ___, or any other format.
2. Each "text" must contain BETWEEN 1 AND 2 blanks (i.e. 1–2 occurrences of $!BLANK!$). "corrects" MUST EXACTLY MATCH the number of $!BLANK!$ in "text", in order.
3. Each "text" should be 2–3 sentences max (4 sentences absolute maximum).
4. "distractors" should be 2 words that are semantically similar to the correct answers but wrong.
5. Blanked-out words must be key concepts — important terms the student needs to memorize.
6. ${subjectType === 'ENGLISH' ? 'Write ALL content in English.' : subjectType === 'VIETNAMESE' ? 'Viết toàn bộ nội dung bằng tiếng Việt.' : subjectType === 'MATHS' ? 'Viết toàn bộ nội dung bằng tiếng Việt, dùng thuật ngữ toán học chuẩn.' : 'Detect and use the same language as the source document.'}
                                        `.trim();

                                        onAutoGenerate('GAP_FILL', ttrPrompt, subjectType, document.id);
                                      } else {
                                        onAutoGenerate(item.activity_format, item.prompt, subjectType, document.id);
                                      }
                                    }
                                  }}
                                  className="w-full mt-4 text-center py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all border-none cursor-pointer shadow-md"
                                >
                                  ✨ Bấm để tạo bài ngay
                                </button>

                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {pathData.question_recommendations && pathData.question_recommendations.length > 0 && (
                      <div className="pt-2 w-full">
                        <h4 className={`text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 ${isNight ? 'text-gray-400' : 'text-slate-500'}`}>
                          <span className="text-lg">💬</span> Gợi ý thảo luận với Cú Mèo
                        </h4>
                        <div className="flex flex-col gap-2 w-full">
                          {pathData.question_recommendations.map((q, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                onClose(); 
                                // 🎯 Gắn thêm document.id vào cuối
                                if (onAutoChat) onAutoChat(q.prompt, document.id); 
                              }}
                              className={`w-full text-left px-4 py-3.5 rounded-xl text-[12.5px] font-semibold border transition-all hover:scale-[1.01] flex items-start gap-3 cursor-pointer overflow-hidden ${
                                isNight ? 'bg-gray-800/30 border-gray-700 text-gray-300 hover:bg-gray-800/60 hover:text-white' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                              }`}
                            >
                              <span className="text-sm shrink-0 mt-0.5">💡</span>
                              <span className="break-words line-clamp-2">{q.prompt}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};