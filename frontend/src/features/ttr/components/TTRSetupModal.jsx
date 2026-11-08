import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../components/theme/ThemeWrapper'; 
import ErrorBanner from '../../../components/ErrorBanner';

import { TTR_SAMPLE_PROMPTS } from '../constants';


export const TTRSetupModal = ({ isOpen, onClose, onSubmit, managerError, clearManagerError }) => {
  const { isNight } = useTheme();
  const [content, setContent] = useState('');
  const [selectedPrompts, setSelectedPrompts] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [subject, setSubject] = useState('MATHS'); 
  
  // 🎯 Mặc định là thấp nhất hết
  const [mode, setMode] = useState('normal'); 
  const [difficulty, setDifficulty] = useState('easy'); 
  const [questionCount, setQuestionCount] = useState(5); // Giảm số câu để AI dễ xử lý hơn

  const [suggestedPrompts, setSuggestedPrompts] = useState([]);
  const refreshPrompts = () => {
    const shuffled = [...TTR_SAMPLE_PROMPTS].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 3; // 3 hoặc 4
    setSuggestedPrompts(shuffled.slice(0, count));
  };


  useEffect(() => { 
    if (isOpen) { 
      setContent(''); 
      setSelectedPrompts([]); 
      setErrorMsg(''); 
      setSubject('MATHS');
      setMode('normal');
      setDifficulty('easy');
      refreshPrompts();
    } 
  }, [isOpen]);

  if (!isOpen) return null;

const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim() && selectedPrompts.length === 0) {
      setErrorMsg('❌ Bé ơi, nhập nội dung hoặc chọn gợi ý nhé!');
      return;
    }

    const finalContent = [content.trim(), ...selectedPrompts].filter(Boolean).join('\n\n');
    
    // Default cho easy
    let minBlank = 1; let maxBlank = 2;
    if (difficulty === 'medium') { minBlank = 2; maxBlank = 3; }
    if (difficulty === 'hard') { minBlank = 3; maxBlank = 4; }

    const isEnglish = subject === 'ENGLISH';

    // Số distractor tăng theo độ khó
    const distractorCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4;

    const finalPrompt = `
Create exactly ${questionCount} gap-fill (cloze) problems about the following topic: "${finalContent}".

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
2. Each "text" should be 2–3 sentences max (4 sentences absolute maximum).
3. Each "text" must contain BETWEEN ${minBlank} AND ${maxBlank} blanks (i.e. ${minBlank}–${maxBlank} occurrences of $!BLANK!$). "corrects" must contain the words that fill those blanks IN ORDER. The number of words in "corrects" MUST EXACTLY MATCH the number of $!BLANK!$ in "text".
4. "distractors" should be ${distractorCount} words that are semantically similar to the correct answers but wrong.
5. Blanked-out words must be key concepts — important terms the student needs to memorize.
6. ${subject === 'ENGLISH' ? 'Write ALL content in English.' : subject === 'VIETNAMESE' ? 'Viết toàn bộ nội dung bằng tiếng Việt.' : 'Viết toàn bộ nội dung bằng tiếng Việt, dùng thuật ngữ toán học chuẩn.'}
    `;

    console.log("Subject đang gửi đi:", subject);
    onSubmit({ prompt: finalPrompt.trim(), gameMode: mode, subjectType: subject });
  };

  const togglePrompt = (p) => {
    setSelectedPrompts(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className={`fixed inset-0 z-[110] flex flex-col items-center justify-center p-6 backdrop-blur-md animate-in fade-in zoom-in duration-300 rounded-[2.5rem] ${isNight ? 'bg-black/60' : 'bg-white/40'}`}>
      
      <div className={`relative w-full max-w-[800px] rounded-[2.5rem] p-10 shadow-[0_32px_64px_rgba(0,0,0,0.2)] backdrop-blur-xl border transition-all ${
        isNight 
          ? "bg-[#1e293b]/90 border-white/10 text-gray-100" 
          : "bg-white/90 border-white/40 text-gray-800"
      }`}>
        
        <button onClick={onClose} className="absolute right-8 top-8 text-gray-400 hover:text-red-500 transition-all hover:rotate-90 z-10">
          <span className="text-2xl font-bold">✕</span>
        </button>

        <header className="mb-6 flex items-center gap-3">
          <span className="text-4xl">🧠</span>
          <h2 className={`text-3xl font-black tracking-tight ${isNight ? 'text-gray-100' : 'text-blue-600'}`}>Cấu hình Tap To Review</h2>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className={`rounded-2xl p-5 border ${isNight ? 'bg-[#1e252e] border-gray-700' : 'bg-white border-gray-200 shadow-sm'}`}>
            <textarea 
              value={content}
              onChange={(e) => { setContent(e.target.value); setErrorMsg(''); }}
              placeholder="Nhập nội dung bài học hoặc dán văn bản vào đây..."
              className={`h-32 w-full rounded-xl border p-4 text-base outline-none transition-all resize-none ${
                isNight ? 'border-gray-600 bg-[#2d3540] focus:border-purple-500 text-white placeholder-gray-400' : 'border-gray-300 bg-gray-50 focus:border-purple-600 text-gray-800'
              }`}
            />
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase opacity-60">Gợi ý từ Cú Mèo:</h4>
              <button type="button" onClick={refreshPrompts} className="text-[10px] font-bold text-blue-500 hover:underline">
                  Đổi gợi ý khác
              </button>
          </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {suggestedPrompts.map((p, i) => ( // Dùng suggestedPrompts thay vì SUGGESTED_PROMPTS
                <button key={i} type="button" onClick={() => togglePrompt(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    selectedPrompts.includes(p) 
                      ? 'bg-purple-600 border-purple-700 text-white shadow-md shadow-purple-500/20' 
                      : (isNight ? 'bg-[#2d3540] border-gray-600 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700')
                  }`}>
                  {p}
                </button>
              ))}
              
            </div>
            {errorMsg && <p className="mt-3 text-red-500 text-xs font-bold animate-bounce">{errorMsg}</p>}
          </div>

          {/* [MỚI] Sửa grid thành 3 cột và thêm khối chọn môn học */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Cột 1: Môn học */}
            <div className={`rounded-2xl p-4 border ${isNight ? 'bg-[#1e252e] border-gray-700' : 'bg-white border-gray-200'}`}>
              <p className="text-sm font-bold mb-3 flex items-center gap-2">📚 Môn học:</p>
              <div className="flex gap-2">
                {[
                  { id: 'MATHS', label: 'TOÁN' },
                  { id: 'VIETNAMESE', label: 'T.VIỆT' },
                  { id: 'ENGLISH', label: 'T.ANH' }
                ].map(s => (
                  <button key={s.id} type="button" onClick={() => setSubject(s.id)} className={`flex-1 p-2 rounded-xl border-2 text-[10px] font-bold transition-all uppercase whitespace-nowrap ${subject === s.id ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cột 2: Chế độ */}
            <div className={`rounded-2xl p-4 border ${isNight ? 'bg-[#1e252e] border-gray-700' : 'bg-white border-gray-200'}`}>
              <p className="text-sm font-bold mb-3 flex items-center gap-2">🕹️ Chế độ:</p>
              <div className="flex gap-1.5">
                {['normal', 'speed', 'survival'].map(m => (
                  <button key={m} type="button" onClick={() => setMode(m)} className={`flex-1 p-2 rounded-xl border-2 text-[9px] font-bold transition-all uppercase whitespace-nowrap ${mode === m ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                    {m === 'normal' ? 'ÔN TẬP' : m === 'speed' ? 'TỐC ĐỘ' : 'S.TỒN'}
                  </button>
                ))}
              </div>
            </div>

            {/* Cột 3: Độ khó */}
            <div className={`rounded-2xl p-4 border ${isNight ? 'bg-[#1e252e] border-gray-700' : 'bg-white border-gray-200'}`}>
              <p className="text-sm font-bold mb-3 flex items-center gap-2">📶 Độ khó:</p>
              <div className="flex gap-2">
                {['easy', 'medium', 'hard'].map(d => (
                  <button key={d} type="button" onClick={() => setDifficulty(d)} className={`flex-1 p-2 rounded-xl border-2 text-[10px] font-bold transition-all uppercase whitespace-nowrap ${difficulty === d ? 'border-purple-500 bg-purple-500/10 text-purple-400' : 'border-gray-600 text-gray-400 hover:border-gray-500'}`}>
                    {d === 'easy' ? 'DỄ' : d === 'medium' ? 'VỪA' : 'KHÓ'}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-2">
            {managerError && (
              <div className="w-full">
                <ErrorBanner error={managerError} onDismiss={clearManagerError} />
              </div>
            )}
            <div className="w-full flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="w-full md:w-1/2 flex items-center gap-4">
              <span className="text-sm font-bold whitespace-nowrap">Số câu: {questionCount}</span>
              <input type="range" min="5" max="20" value={questionCount} onChange={(e) => setQuestionCount(e.target.value)} className="w-full accent-purple-600"/>
            </div>
            <button type="submit" className="w-full md:w-auto bg-purple-600 text-white px-10 py-4 rounded-2xl font-black hover:scale-105 active:scale-95 shadow-lg transition-all flex items-center justify-center gap-2">
              🌟 BẮT ĐẦU TẠO BÀI
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};