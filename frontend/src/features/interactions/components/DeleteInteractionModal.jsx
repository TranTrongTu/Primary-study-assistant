import React from "react";
import { Trash } from "@phosphor-icons/react";

export const DeleteInteractionModal = ({ interactionName, onClose, onConfirm }) => {
  if (!interactionName) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#102018]/55 px-4 backdrop-blur-sm" 
      onClick={onClose}
      aria-hidden="true"
    >
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-white/70 bg-white shadow-[0_30px_90px_rgba(0,0,0,0.22)]" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#ff7a7a] via-[#ffb84d] to-[#ff6f91]" />
        
        <div className="bg-[radial-gradient(circle_at_top,_rgba(255,94,94,0.18),_transparent_58%),linear-gradient(180deg,_#fffaf8_0%,_#ffffff_100%)] px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ffe3e3] text-[#d33c3c]">
              <Trash size={28} weight="fill" />
            </div>
            <div className="pt-1">
              <p className="text-[0.78rem] font-bold uppercase tracking-[0.22em] text-[#d46b3f]">Xác nhận xóa</p>
              <h3 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2f2f2f]">Xóa sổ ghi chú này?</h3>
            </div>
          </div>

          <p className="text-[0.98rem] leading-7 text-[#636363]">
            Sổ <span className="font-bold text-[#373737]">{interactionName}</span> sẽ bị xóa vĩnh viễn. Nếu bạn chắc chắn, hãy nhấn nút xóa bên dưới.
          </p>
          
          <div className="mt-5 rounded-2xl border border-[#ffe4d9] bg-[#fff8f4] px-4 py-3 text-sm font-medium text-[#7b5d52]">
            Mẹo nhỏ: Thao tác này không thể hoàn tác sau khi xác nhận.
          </div>

          <div className="mt-7 flex gap-3 sm:justify-end">
            <button 
              type="button" 
              onClick={onClose} 
              className="h-12 rounded-2xl border border-[#d9d9d9] bg-white px-5 font-bold text-[#4e4e4e] hover:bg-[#fafafa]"
            >
              Hủy
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              className="flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-[#e94b4b] to-[#c92d54] px-5 font-bold text-white hover:from-[#d84343] hover:to-[#b9264a]"
            >
              <Trash size={18} weight="fill" /> Xóa ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};