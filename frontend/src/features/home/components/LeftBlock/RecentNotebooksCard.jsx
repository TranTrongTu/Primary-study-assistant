import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilSimple, Trash } from "@phosphor-icons/react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";
import { EditNotebookModal } from "./EditNotebookModal";
import { DeleteNotebookModal } from "./DeleteNotebookModal";

const NOTEBOOK_COLORS = [
  { bg: "#fffbeb", border: "#fde68a", emoji: "📒" },
  { bg: "#f0fdf4", border: "#86efac", emoji: "📗" },
  { bg: "#fdf4ff", border: "#e879f9", emoji: "📓" },
];

export const RecentNotebooksCard = ({ interactions = [], isLoading, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const { isNight } = useTheme();

  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const displayItems = interactions && interactions.length > 0 ? [...interactions].reverse() : [];

  const cardCls = isNight 
    ? "bg-slate-900/90 border-white/[0.1] shadow-2xl" 
    : "bg-white/60 border-white/60 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]";
  
  const itemBaseCls = isNight 
    ? "bg-slate-800/40 border-white/[0.06] hover:bg-slate-800/80" 
    : "bg-white/40 border-white/60 backdrop-blur-sm hover:bg-white/70 hover:shadow-sm hover:border-white/80";

  const handleSaveEdit = async (id, updatedData) => {
    setIsProcessing(true);
    if (onEdit) await onEdit(id, updatedData);
    setIsProcessing(false);
    setEditingItem(null);
  };

  const handleConfirmDelete = async (id) => {
    setIsProcessing(true);
    if (onDelete) await onDelete(id);
    setIsProcessing(false);
    setDeletingItem(null);
  };

  return (
    <>
      <EditNotebookModal isOpen={!!editingItem} notebook={editingItem} onClose={() => setEditingItem(null)} onSave={handleSaveEdit} isLoading={isProcessing} />
      <DeleteNotebookModal isOpen={!!deletingItem} notebook={deletingItem} onClose={() => setDeletingItem(null)} onConfirm={handleConfirmDelete} isLoading={isProcessing} />

      <div className={`rounded-[2rem] p-5 border-2 transition-all duration-500 flex flex-col h-full ${cardCls}`}>
        <div className="flex items-center justify-between mb-3 shrink-0 px-1">
          <h3 className={`text-[15px] font-black ${isNight ? "text-slate-200" : "text-[#1e293b]"}`}>Sổ ghi chú gần đây</h3>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-1">
          {/* LỖI CŨ: (isLoading || displayItems.length > 0) ? { <div...> } : { <div...> } */}
          {/* LỖI MỚI: Dấu ngoặc nhọn { } ngay sau dấu ? là sai cú pháp */}
          
          {(isLoading || displayItems.length > 0) ? (
            // ĐÃ SỬA: Chỉ dùng ngoặc tròn ( ) cho khối JSX
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {isLoading && (
                <div className={`border-2 border-dashed rounded-2xl p-3 flex items-center justify-between h-[76px] animate-pulse transition-all ${isNight ? "border-blue-500/50 bg-blue-950/40" : "border-blue-400 bg-blue-50/60"}`}>
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-blue-500/20 flex items-center justify-center text-xl animate-spin text-blue-500">⏳</div>
                    <div className="flex-1 space-y-2"><div className="h-3.5 bg-blue-500/30 rounded-full w-2/3"></div><div className="h-2.5 bg-blue-500/15 rounded-full w-1/2"></div></div>
                  </div>
                </div>
              )}

              {displayItems.map((item, idx) => {
                const color = NOTEBOOK_COLORS[idx % NOTEBOOK_COLORS.length];
                return (
                  <div key={item.id} onClick={() => navigate(`/interaction/${item.id}`)} className={`border-2 rounded-2xl p-3 flex items-center justify-between cursor-pointer group transition-all h-[76px] ${itemBaseCls}`}>
                    <div className="flex items-center gap-3 w-full overflow-hidden">
                      <div className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-xl border" style={{ backgroundColor: color.bg, borderColor: color.border }}>{color.emoji}</div>
                      
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13.5px] font-extrabold truncate block w-full ${isNight ? "text-slate-200" : "text-slate-700"}`} title={item.name}>{item.name}</p>
                        <p className={`text-[11px] font-semibold mt-0.5 truncate block w-full ${isNight ? "text-slate-500" : "text-slate-400"}`} title={item.description}>{item.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2 shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); setEditingItem(item); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#eff6ff] text-[#3b82f6] hover:bg-[#dbeafe] hover:scale-110 transition-transform">
                        <PencilSimple size={15} weight="bold" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setDeletingItem(item); }} className="w-8 h-8 rounded-full flex items-center justify-center bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2] hover:scale-110 transition-transform">
                        <Trash size={15} weight="bold" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // ĐÃ SỬA: Chỉ dùng ngoặc tròn ( ) cho khối JSX
            <div className="flex flex-col items-center justify-center h-full opacity-90 animate-in fade-in zoom-in duration-500 pb-4">
              <span className="text-[3rem] mb-3 drop-shadow-sm filter grayscale-[30%] opacity-80">📭</span>
              <h4 className={`text-[15px] font-black mb-1.5 ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>Bé chưa có sổ ghi chú nào!</h4>
              <p className={`text-[12px] font-bold text-center max-w-[70%] leading-relaxed ${isNight ? 'text-gray-500' : 'text-gray-500'}`}>Hãy bắt đầu hành trình học tập bằng cách tạo một cuốn sổ mới ở phía trên nhé.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};