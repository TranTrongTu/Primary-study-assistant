import React from "react";
import { Trash } from "@phosphor-icons/react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";

export const DeleteNotebookModal = ({ isOpen, onClose, notebook, onConfirm, isLoading }) => {
  const { isNight } = useTheme();

  if (!isOpen || !notebook) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-[400px] rounded-[2rem] p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-300 ${
        isNight ? "bg-[#1e252e] border-red-900/50" : "bg-white border-red-100"
      }`}>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-pulse">
            <Trash size={32} weight="fill" />
          </div>
          
          <h2 className={`text-[18px] font-black mb-2 ${isNight ? "text-slate-100" : "text-slate-800"}`}>
            Xóa sổ "{notebook.name}"?
          </h2>
          <p className={`text-[13px] font-semibold mb-6 px-4 ${isNight ? "text-slate-400" : "text-slate-500"}`}>
            Bé có chắc chắn muốn xóa cuốn sổ này không? <br/>
            <span className="text-red-500">Toàn bộ bài tập và dữ liệu bên trong sẽ bị mất vĩnh viễn!</span>
          </p>

          <div className="flex w-full gap-3">
            <button onClick={onClose} disabled={isLoading} className={`flex-1 py-3 rounded-xl text-[13px] font-bold transition-all ${isNight ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
              Không, giữ lại
            </button>
            <button onClick={() => onConfirm(notebook.id)} disabled={isLoading} className="flex-1 py-3 rounded-xl text-[13px] font-extrabold bg-red-500 hover:bg-red-600 active:scale-95 text-white transition-all shadow-lg shadow-red-500/30 flex items-center justify-center">
              {isLoading ? "Đang xóa..." : "Có, xóa ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};