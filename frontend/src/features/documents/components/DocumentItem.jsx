import React, { useState } from "react";
import { createPortal } from "react-dom"; 
import { getFileIcon } from "../../interactions/utils/fileUtils";
import { DocumentDetailModal } from "./DocumentDetailModal";
import { useLearningPath } from "../hooks/useLearningPath"; 
import { TrashIcon } from "@phosphor-icons/react"; 

export const DocumentItem = ({ 
  document, onRename, onDelete, onCheck,
  isSelected, isEditing, tempName, setTempName, setEditingId, isNight,
  onAutoChat, onAutoGenerate // 🎯 1. NHẬN 2 HÀM Ở ĐÂY
}) => {
  const [showModal, setShowModal] = useState(false);
  
  const isUploading = document.isUploading;
  const isError = document.isError; 

  const { isGeneratingPath, pathData, generateLearningPath } = useLearningPath();

  const dotIndex = document.name?.lastIndexOf('.') ?? -1;
  const ext = dotIndex !== -1 ? document.name.substring(dotIndex) : '';
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") onRename(document.id);
    if (e.key === "Escape") setEditingId(null); 
  };

  const fileIcon = getFileIcon(document.name);

  return (
    <>
      <div className={`group flex items-center justify-between rounded-2xl px-4 py-3 shadow-sm transition-all duration-300 border ${
        isEditing ? (isNight ? "bg-gray-800 border-[#4ecdc4]" : "bg-white border-[#4ecdc4]") : isError ? (isNight ? "bg-red-900/20 border-red-800/50" : "bg-red-50/70 border-red-300 shadow-[0_0_10px_rgba(239,68,68,0.1)]") : isUploading ? (isNight ? "bg-[#4ecdc4]/10 border-[#4ecdc4]/30 pointer-events-none" : "bg-[#4ecdc4]/5 border-[#4ecdc4]/20 pointer-events-none shadow-[0_0_15px_rgba(78,205,196,0.15)]") : (isNight ? "bg-gray-800/50 border-gray-700 hover:bg-gray-700 hover:shadow-md" : "bg-white/60 hover:shadow-md hover:bg-white/80 border-transparent")
      }`}>
        
        <div className="flex flex-1 items-center space-x-3 overflow-hidden">
          {isUploading ? (
            <div className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-[#4ecdc4] opacity-40"></div>
              <div className="absolute h-full w-full animate-spin rounded-full border-2 border-[#4ecdc4]/40 border-t-[#4ecdc4]"></div>
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ecdc4] shadow-[0_0_6px_rgba(78,205,196,1)]"></div>
            </div>
          ) : isError ? (
            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500 border border-red-200">
              <span className="text-xs font-bold">!</span>
            </div>
          ) : (
            <span className="text-xl shrink-0 drop-shadow-sm">{fileIcon}</span>
          )}

          {isEditing && !isError ? (
            <div className="flex w-full items-center border-b border-[#4ecdc4] pb-0.5">
              <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onBlur={() => onRename(document.id)} onKeyDown={handleKeyDown} className={`w-full min-w-0 bg-transparent text-sm font-semibold outline-none ${isNight ? "text-gray-100" : "text-gray-700"}`} />
              <span className="select-none whitespace-nowrap text-sm text-gray-400">{ext}</span>
            </div>
          ) : (
            <div onDoubleClick={() => !isUploading && !isError && setEditingId(document)} className={`flex flex-1 items-center gap-2 overflow-hidden ${!isUploading && !isError ? 'cursor-pointer' : ''}`} title={isError ? "File này tải lên thất bại" : "Nhấp đúp để đổi tên"}>
              <span className={`truncate text-sm font-semibold transition-colors duration-300 ${isError ? 'text-red-500 line-through opacity-80' : isUploading ? (isNight ? 'text-[#4ecdc4]/90' : 'text-[#2ab7a8]') : (isNight ? 'text-gray-200' : 'text-gray-700')}`}>
                {document.name}
              </span>
              {isUploading && (
                <span className="shrink-0 text-[9px] font-black tracking-widest text-[#4ecdc4] uppercase flex items-center">
                  <span className="animate-pulse">Đang tải</span>
                  <span className="ml-0.5 inline-flex animate-[bounce_1s_infinite_0s] text-lg leading-none">.</span><span className="inline-flex animate-[bounce_1s_infinite_0.15s] text-lg leading-none">.</span><span className="inline-flex animate-[bounce_1s_infinite_0.3s] text-lg leading-none">.</span>
                </span>
              )}
              {isError && (
                <span className="shrink-0 text-[9.5px] font-black tracking-widest text-red-500 uppercase flex items-center bg-red-100 px-1.5 py-0.5 rounded-md">Tải thất bại</span>
              )}
            </div>
          )}
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1">
          {isError ? (
            <button onClick={() => onDelete(document.id)} className={`flex items-center justify-center p-1.5 rounded-lg transition-all duration-300 ${isNight ? 'text-red-400 hover:bg-red-900/60' : 'text-red-500 hover:bg-red-100'}`} title="Xóa file lỗi này">
              <TrashIcon size={18} weight="bold" />
            </button>
          ) : (
            <button onClick={() => setShowModal(true)} className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[11px] font-extrabold transition-all duration-300 ${isUploading ? 'opacity-30 grayscale pointer-events-none' : (isNight ? 'bg-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/40' : 'bg-[#e6fcfb] text-[#38b5ac] hover:bg-[#4ecdc4] hover:text-white shadow-sm')}`}>
              <span className="text-sm">✨</span> Chi tiết
            </button>
          )}
        </div>
      </div>

      {!isError && showModal && createPortal(
        <DocumentDetailModal
          document={document}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onRename={onRename}
          onDelete={onDelete}
          isGeneratingPath={isGeneratingPath}
          pathData={pathData}
          onGenerate={() => generateLearningPath(document.id, document.name)}
          fileIcon={fileIcon}
          // 🎯 2. NÉM TIẾP VÀO TRONG MODAL
          onAutoChat={onAutoChat}
          onAutoGenerate={onAutoGenerate}
        />,
        window.document.body 
      )}
    </>
  );
};