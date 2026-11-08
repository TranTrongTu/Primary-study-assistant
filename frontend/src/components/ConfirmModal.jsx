import React from "react";
import { useTheme } from "./theme/ThemeWrapper";

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện hành động này không?",
  confirmText = "Xóa",
  cancelText = "Hủy",
  isLoading = false,
  isDanger = true,
}) => {
  const { isNight } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md transition-opacity">
      <div
        className={`relative w-full max-w-sm transform overflow-hidden rounded-[2.5rem] border p-8 shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all animate-in zoom-in-95 duration-300 text-center ${
          isNight
            ? "border-white/10 bg-gradient-to-b from-[#1a2342] to-[#111a38] shadow-black/60"
            : "border-white/80 bg-gradient-to-b from-white to-gray-50 shadow-gray-300/50"
        }`}
      >
        {/* ICON CẢNH BÁO TẠO ĐIỂM NHẤN CAO CẤP */}
        <div 
          className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full shadow-inner ${
            isDanger
              ? (isNight ? "bg-red-500/20 text-red-400" : "bg-red-100 text-red-500")
              : (isNight ? "bg-teal-500/20 text-teal-400" : "bg-teal-100 text-teal-500")
          }`}
        >
          {isDanger ? (
            // Icon Thùng Rác (Dùng cho hành động Xóa)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          ) : (
            // Icon Thông tin (Dùng cho các hành động an toàn khác)
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>

        {/* TIÊU ĐỀ */}
        <h3
          className={`text-2xl font-black tracking-tight ${
            isNight ? "text-white" : "text-gray-900"
          }`}
        >
          {title}
        </h3>

        {/* NỘI DUNG */}
        <div className="mt-3 mb-8 text-[15px] leading-relaxed">
          <p className={isNight ? "text-gray-400" : "text-gray-500"}>
            {message}
          </p>
        </div>

        {/* CÁC NÚT HÀNH ĐỘNG (ĐÃ ĐỔI VỊ TRÍ) */}
        <div className="flex items-center justify-center gap-4">
          
          {/* NÚT HỦY NẰM BÊN TRÁI */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`flex-1 rounded-2xl border-2 px-4 py-3.5 text-[15px] font-bold transition-all disabled:opacity-50 ${
              isNight
                ? "border-gray-700/50 bg-gray-800/30 text-gray-300 hover:bg-gray-700 hover:text-white"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-sm"
            }`}
          >
            {cancelText}
          </button>

          {/* NÚT XÓA NẰM BÊN PHẢI (Gradient & Glow) */}
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`group relative flex-1 overflow-hidden rounded-2xl px-4 py-3.5 text-[15px] font-black text-white shadow-lg transition-all hover:-translate-y-1 active:scale-95 disabled:opacity-60 ${
              isDanger
                ? "bg-gradient-to-b from-red-500 to-rose-600 shadow-red-500/30 hover:shadow-red-500/50 ring-1 ring-red-500/50"
                : "bg-gradient-to-b from-[#4ecdc4] to-[#35a8a0] shadow-teal-500/30 hover:shadow-teal-500/50 ring-1 ring-teal-500/50"
            }`}
          >
            {/* Lớp nền sáng lướt qua khi hover */}
            <span className="absolute inset-0 bg-white/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100"></span>
            <span className="relative z-10">{isLoading ? "Đang xử lý..." : confirmText}</span>
          </button>

        </div>
      </div>
    </div>
  );
};