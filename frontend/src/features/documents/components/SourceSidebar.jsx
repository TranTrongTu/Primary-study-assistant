import React, { useMemo, useState } from "react";
import { DocumentItem } from "./DocumentItem";
import { useTheme } from "../../../components/theme/ThemeWrapper"; 

const FILTER_TABS = [
  { id: 'ALL', label: 'Tất cả', emoji: '📚' },
  { id: 'MATHS', label: 'Toán', emoji: '📐' },
  { id: 'VIETNAMESE', label: 'T.Việt', emoji: '📖' },
  { id: 'ENGLISH', label: 'T.Anh', emoji: '🔤' },
  { id: 'OTHER_TAB', label: 'Khác', emoji: '📂' }
];

export const SourceSidebar = ({ 
  documents, selectedDocIds, onAddClick, editingId, setEditingId, 
  tempName, setTempName, onRename, onPreview, onDocCheck, onDelete, isLoading,
  onOpenPathModal,
  onAutoChat, onAutoGenerate // 🎯 1. NHẬN 2 HÀM TỪ TRANG CHỦ
}) => {
  const { isNight } = useTheme(); 
  const [activeFilter, setActiveFilter] = useState('ALL');

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      const dateA = new Date(a.createdAt || a.created_at || 0);
      const dateB = new Date(b.createdAt || b.created_at || 0);
      return dateB - dateA; 
    });
  }, [documents]);

  const displayedDocuments = useMemo(() => {
    if (activeFilter === 'ALL') return sortedDocuments;
    if (activeFilter === 'OTHER_TAB') {
      // 🎯 Chặn đứng bằng mảng: Bất cứ gì không phải 3 môn này thì ném vào "Khác"
      const mainSubjects = ['MATHS', 'VIETNAMESE', 'ENGLISH'];
      return sortedDocuments.filter(doc => !mainSubjects.includes(doc.subject_type));
    }
    return sortedDocuments.filter(doc => doc.subject_type === activeFilter);
  }, [sortedDocuments, activeFilter]);

  return (
    <aside className={`flex w-[22%] flex-col space-y-4 rounded-3xl p-6 backdrop-blur-md shadow-xl border transition-colors duration-500 ${
      isNight ? "bg-gray-900/60 border-gray-700/50" : "bg-white/30 border-white/20"
    }`}>
      
      <header className="space-y-4 shrink-0">
        <div className={`flex items-center space-x-2 text-2xl font-bold transition-colors ${isNight ? "text-gray-100" : "text-gray-800"}`}>
          <span>📚</span><h2>Nguồn tài liệu</h2>
        </div>
        <hr className={`border-t transition-colors ${isNight ? "border-gray-600/50" : "border-gray-400/30"}`} />
      </header>

      <div className="flex shrink-0">
        <button 
          onClick={onAddClick} 
          className="w-full rounded-2xl py-3.5 font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-95 bg-[#bf94e4] hover:bg-[#b388d8]"
        >
          + Thêm nguồn
        </button>
      </div>

      <div className={`flex w-full items-center p-1 rounded-2xl shrink-0 transition-colors ${
        isNight ? "bg-gray-800/80 border border-gray-700/50" : "bg-slate-100/80 border border-slate-200/60"
      }`}>
        {FILTER_TABS.map(tab => {
          const isActive = activeFilter === tab.id;
          return (
            <button 
              key={tab.id} 
              onClick={() => setActiveFilter(tab.id)} 
              title={tab.label}
              className={`group relative flex items-center justify-center h-[40px] rounded-xl transition-all duration-500 ease-out overflow-hidden ${
                isActive 
                  ? `flex-1 px-2 ${isNight ? "bg-gray-600 shadow-md text-white" : "bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] text-[#bf94e4]"}` 
                  : `w-[40px] ${isNight ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/70"}`
              }`}
            >
              <span className={`text-[16px] shrink-0 transition-transform duration-300 ${isActive ? "scale-110 drop-shadow-sm" : "group-hover:scale-110"}`}>
                {tab.emoji}
              </span>
              
              <div className={`transition-all duration-500 ease-out overflow-hidden whitespace-nowrap flex items-center ${
                isActive ? "max-w-[80px] opacity-100 ml-1.5" : "max-w-0 opacity-0 ml-0"
              }`}>
                <span className="text-[12px] font-black tracking-wide">
                  {tab.label}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {isLoading && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 opacity-50">
            <span className="text-3xl animate-bounce mb-2">⏳</span>
            <p className={`text-center text-sm font-semibold ${isNight ? "text-gray-400" : "text-gray-500"}`}>Đang tải tài liệu...</p>
          </div>
        )}
        
        {!isLoading && documents.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 opacity-60">
            <span className="text-4xl mb-3">📭</span>
            <p className={`text-center text-sm font-semibold ${isNight ? "text-gray-400" : "text-gray-500"}`}>Bé chưa có tài liệu nào.</p>
          </div>
        )}

        {!isLoading && documents.length > 0 && displayedDocuments.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 opacity-60">
            <span className="text-4xl mb-3">🗂️</span>
            <p className={`text-center text-sm font-semibold ${isNight ? "text-gray-400" : "text-gray-500"}`}>Chưa có tài liệu {FILTER_TABS.find(t => t.id === activeFilter)?.label}.</p>
          </div>
        )}
        
        {displayedDocuments.map((doc) => (
          <DocumentItem
            key={doc.id}
            document={doc}
            isEditing={editingId === doc.id} 
            isSelected={selectedDocIds?.includes(doc.id)} 
            tempName={tempName}
            setTempName={setTempName}
            setEditingId={setEditingId}
            onRename={onRename}
            onCheck={onDocCheck}
            onDelete={onDelete}
            isNight={isNight} 
            // 🎯 2. TRUYỀN XUỐNG ITEM
            onAutoChat={onAutoChat}
            onAutoGenerate={onAutoGenerate}
          />
        ))}
      </nav>
    </aside>
  );
};