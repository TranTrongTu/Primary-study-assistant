import React, { useState, useEffect } from "react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";

export const EditNotebookModal = ({ isOpen, onClose, notebook, onSave, isLoading }) => {
  const { isNight } = useTheme();
  const [formData, setFormData] = useState({ name: "", description: "" });

  useEffect(() => {
    if (notebook && isOpen) {
      setFormData({ name: notebook.name || "", description: notebook.description || "" });
    }
  }, [notebook, isOpen]);

  if (!isOpen || !notebook) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    onSave(notebook.id, formData);
  };

  const inputCls = isNight
    ? "bg-slate-800/80 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-blue-500"
    : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className={`relative w-full max-w-[500px] rounded-[2rem] p-8 shadow-2xl border transition-all animate-in zoom-in-95 duration-300 ${
        isNight ? "bg-slate-900/95 border-slate-700" : "bg-white/95 border-slate-200"
      }`}>
        <button onClick={onClose} disabled={isLoading} className="absolute right-6 top-6 text-gray-400 hover:text-red-500 transition-all hover:rotate-90">
          <span className="text-xl font-bold">✕</span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl shrink-0 ${isNight ? "bg-blue-900/40" : "bg-[#eff6ff]"}`}>✏️</div>
          <div>
            <h2 className={`text-[18px] font-black ${isNight ? "text-slate-100" : "text-slate-800"}`}>Chỉnh sửa sổ ghi chú</h2>
            <p className={`text-[12px] font-semibold ${isNight ? "text-slate-400" : "text-slate-500"}`}>Cập nhật lại thông tin cho "{notebook.name}"</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`text-[12px] font-extrabold block mb-1.5 ${isNight ? "text-slate-400" : "text-slate-600"}`}>Tên sổ mới</label>
            <input 
              type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
              className={`w-full h-[46px] border-2 rounded-xl px-4 text-[14px] font-bold outline-none transition-all shadow-sm ${inputCls}`} autoFocus
            />
          </div>
          <div>
            <label className={`text-[12px] font-extrabold block mb-1.5 ${isNight ? "text-slate-400" : "text-slate-600"}`}>Mô tả mới</label>
            <input 
              type="text" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
              className={`w-full h-[46px] border-2 rounded-xl px-4 text-[14px] font-bold outline-none transition-all shadow-sm ${inputCls}`} 
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-dashed border-gray-500/30">
            <button type="button" onClick={onClose} disabled={isLoading} className={`px-5 py-2.5 rounded-xl text-[13px] font-bold transition-all ${isNight ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-100"}`}>Hủy bỏ</button>
            <button type="submit" disabled={isLoading || !formData.name.trim()} className="bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white px-6 py-2.5 rounded-xl text-[13px] font-extrabold flex items-center gap-2 transition-all shadow-lg disabled:opacity-50">
              {isLoading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};