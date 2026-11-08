import React from 'react';
import { useTheme } from '../../../components/theme/ThemeWrapper';

export const TTRActionModal = ({ isOpen, onClose, onSelectMode }) => {
  const { isNight } = useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl border text-center transition-all animate-in zoom-in-95 ${
        isNight ? 'bg-[#1e252e] border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-xl font-bold mb-6 ${isNight ? 'text-gray-100' : 'text-gray-800'}`}>
          Bạn muốn thử thách ở chế độ nào?
        </h3>
        
        <div className="flex flex-col gap-3">
          <button onClick={() => onSelectMode('normal')} className="w-full py-3 rounded-xl font-bold bg-purple-600 text-white hover:bg-purple-500 shadow-md active:scale-95 transition-all">
            🎮 Cơ bản (Ôn tập)
          </button>
          
          <button onClick={() => onSelectMode('speed')} className="w-full py-3 rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-500 shadow-md active:scale-95 transition-all">
            ⏱️ Tốc độ (Time Rush)
          </button>

          <button onClick={() => onSelectMode('survival')} className="w-full py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-500 shadow-md active:scale-95 transition-all">
            🛡️ Sinh tồn (Hardcore)
          </button>
          
          <div className={`w-full h-px my-1 ${isNight ? 'bg-gray-700' : 'bg-gray-200'}`} />

          <button onClick={() => onSelectMode('review')} className="w-full py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-500 shadow-md active:scale-95 transition-all">
            📖 Xem đáp án
          </button>
          
          <button onClick={onClose} className={`w-full py-3 rounded-xl font-bold mt-2 transition-all ${
              isNight ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}>
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};