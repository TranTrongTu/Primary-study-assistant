import React from 'react';
import { useTheme } from '../../../components/theme/ThemeWrapper';
import { SmartContent } from "../../../components/SmartContent";

export const BlankSlot = ({ isActive, filledWord, isWrong, isSuccess, onClick, onDropWord }) => {
  const { isNight } = useTheme();

  const handleDragOver = (e) => {
    e.preventDefault(); 
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedWord = e.dataTransfer.getData("text/plain"); 
    if (droppedWord && onDropWord) {
      onDropWord(droppedWord);
    }
  };

  let baseClass = `inline-flex items-center justify-center min-w-[100px] min-h-[58px] px-4 mx-2 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer align-middle text-lg font-bold ${
    isNight ? 'border-gray-500 bg-gray-800/80 text-gray-400 hover:bg-gray-700' : 'border-gray-400 bg-gray-100 text-gray-500 hover:bg-gray-200'
  }`;

  if (isActive && !filledWord) {
    baseClass = `inline-flex items-center justify-center min-w-[100px] min-h-[58px] px-4 mx-2 rounded-xl border-2 transition-all duration-200 cursor-pointer align-middle text-lg font-bold scale-110 shadow-lg ${
      isNight ? 'border-purple-400 bg-purple-900/80 text-purple-200 ring-2 ring-purple-500/50' : 'border-purple-600 bg-purple-50 text-purple-700 ring-4 ring-purple-200'
    }`;
  }

  if (filledWord && !isSuccess && !isWrong) {
    baseClass = `inline-flex items-center justify-center min-w-[100px] min-h-[58px] px-4 mx-2 rounded-xl border-2 transition-all duration-200 cursor-pointer align-middle text-lg font-bold shadow-md hover:scale-105 ${
      isNight ? 'border-indigo-400 bg-indigo-900/80 text-indigo-100' : 'border-indigo-500 bg-indigo-100 text-indigo-900'
    }`;
  }

  if (isWrong) {
    baseClass = `inline-flex items-center justify-center min-w-[100px] min-h-[58px] px-4 mx-2 rounded-xl transition-all duration-200 align-middle text-lg font-bold text-white shadow-md bg-red-500 border-2 border-red-600 animate-shake-ttr pointer-events-none`;
  }

  if (isSuccess) {
    baseClass = `inline-flex items-center justify-center min-w-[100px] min-h-[58px] px-4 mx-2 rounded-xl transition-all duration-200 align-middle text-lg font-bold text-white shadow-[0_0_20px_rgba(34,197,94,0.4)] bg-green-500 border-2 border-green-600 scale-105 pointer-events-none`;
  }

  return (
  <span className={baseClass} onClick={onClick} onDragOver={handleDragOver} onDrop={handleDrop}>
    {/* Bọc SmartContent xung quanh filledWord */}
    {filledWord ? (
  <SmartContent inline className="text-inherit font-bold">{filledWord}</SmartContent>
    ) : (
      isActive ? <span className="animate-pulse opacity-50">|</span> : ""
    )}
  </span>
);
};