import React from "react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";
import notebookPencil from "../../assets/notebook-pencil.png";

export const CreateNotebookCard = ({ formData, onChange, onSubmit, isLoading }) => {
  const { isNight } = useTheme();

  const labelCls = isNight ? "text-slate-400" : "text-slate-600";
  // ĐÃ SỬA: Ô input ban ngày cũng được làm mờ (bg-white/50) để hợp với nền kính
  const inputCls = isNight
    ? "bg-slate-800/80 border-slate-700 text-slate-200 placeholder:text-slate-600 focus:border-blue-500"
    : "bg-white/50 border-white/60 text-slate-800 placeholder:text-slate-500 focus:bg-white/80 focus:border-[#2563eb] focus:ring-4 focus:ring-blue-50/50 backdrop-blur-sm";

  return (
    <div className="flex gap-6 w-full h-full items-center relative">
      <div className="flex-1 flex flex-col justify-center">
        
        <div className="mb-2">
          <h3 className={`text-[16px] font-black flex items-center gap-2 ${isNight ? "text-slate-200" : "text-slate-800"}`}>
            Tạo sổ ghi chú mới
          </h3>
          <p className={`text-[12px] font-semibold ${isNight ? "text-slate-500" : "text-slate-500"}`}>
            Viết mô tả ngắn để bắt đầu học hiệu quả hơn!
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <div className="flex-1">
            <label className={`text-[11px] font-extrabold block mb-1 ${labelCls}`}>Tên sổ ghi chú</label>
            <input name="name" value={formData?.name || ""} onChange={onChange} type="text" placeholder="Ví dụ: Toán lớp 5..."
              className={`w-full h-[44px] border-2 rounded-xl px-3 text-[13px] font-semibold outline-none transition-all shadow-sm ${inputCls}`} />
          </div>
          
          <div className="flex-1">
            <label className={`text-[11px] font-extrabold block mb-1 ${labelCls}`}>Mô tả ngắn</label>
            <input name="description" value={formData?.description || ""} onChange={onChange} type="text" placeholder="Ví dụ: Ôn thi..."
              className={`w-full h-[44px] border-2 rounded-xl px-3 text-[13px] font-semibold outline-none transition-all shadow-sm ${inputCls}`} />
          </div>

          <div className="flex flex-col justify-end">
            <label className="block mb-1 text-[11px] opacity-0 pointer-events-none">_</label>
            <button onClick={onSubmit} disabled={isLoading}
              className="shrink-0 bg-[#2563eb] hover:bg-[#1d4ed8] active:scale-95 text-white px-5 h-[44px] rounded-xl text-[13px] font-extrabold flex items-center gap-1.5 transition-all shadow-lg">
              <span className="text-lg leading-none">+</span> {isLoading ? "Đang tạo..." : "Tạo sổ"}
            </button>
          </div>
        </div>

      </div>

      <div className="hidden lg:block shrink-0 px-2 opacity-90 drop-shadow-lg">
        <img src={notebookPencil} alt="Notebook" className="w-24 h-24 animate-pulse" style={{ animationDuration: '3s' }} />
      </div>
    </div>
  );
};