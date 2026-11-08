import React from "react";
import { BookOpenText, PencilSimple, XCircle, CheckCircle, PlusCircle } from "@phosphor-icons/react";

export const InteractionForm = ({ 
  isEditing, onSubmit, formData, onChange, onCancel 
}) => {
  return (
    <form
      onSubmit={onSubmit}
      className={`mb-8 rounded-[24px] border transition-all duration-300 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.08)] backdrop-blur-md md:p-6 ${
        isEditing ? "border-[#1d7bd8] bg-[#f0f7ff]" : "border-white/70 bg-white/65"
      }`}
    >
      <div className="mb-4 flex items-center gap-3 text-[#4f4f4f]">
        <span className={`flex h-10 w-10 items-center justify-center rounded-2xl shadow-sm ${
          isEditing ? "bg-[#1d7bd8] text-white" : "bg-[#d8f3ff] text-[#1d7bd8]"
        }`}>
          {isEditing ? <PencilSimple size={24} weight="fill" /> : <BookOpenText size={24} weight="fill" />}
        </span>
        <div>
          <h3 className="text-lg font-bold">{isEditing ? "Chỉnh sửa sổ ghi chú" : "Tạo sổ ghi chú mới"}</h3>
          <p className="text-sm font-medium text-[#777]">{isEditing ? "Cập nhật lại tên và mô tả cho sổ ghi chú của bé." : "Nhập tên sổ và mô tả ngắn để bắt đầu."}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.1fr_1.4fr_auto] md:items-end">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#5b5b5b]">Tên sổ ghi chú</span>
          <input 
            name="name"
            value={formData.name} 
            onChange={onChange} 
            placeholder="Ví dụ: Toán lớp 5..." 
            className="w-full rounded-2xl border border-[#d8d8d8] bg-white px-4 py-3 text-[1rem] font-medium outline-none transition focus:border-[#1d7bd8] focus:ring-4 focus:ring-[#1d7bd8]/15" 
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-[#5b5b5b]">Mô tả ngắn</span>
          <input 
            name="description"
            value={formData.description} 
            onChange={onChange} 
            placeholder="Ví dụ: Ôn thi giữa kỳ" 
            className="w-full rounded-2xl border border-[#d8d8d8] bg-white px-4 py-3 text-[1rem] font-medium outline-none transition focus:border-[#1d7bd8] focus:ring-4 focus:ring-[#1d7bd8]/15" 
          />
        </label>

        <div className="flex gap-2">
          {isEditing && (
            <button type="button" onClick={onCancel} className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl border border-[#d8d8d8] bg-white px-5 font-bold text-[#555] hover:bg-[#f5f5f5]">
              <XCircle size={18} weight="fill" /> Hủy
            </button>
          )}
          <button type="submit" className={`inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl px-5 font-bold text-white shadow-lg transition hover:-translate-y-0.5 ${
            isEditing ? "bg-[#28a745] hover:bg-[#218838]" : "bg-[#1d7bd8] hover:bg-[#1665b4]"
          }`}>
            {isEditing ? <CheckCircle size={18} weight="fill" /> : <PlusCircle size={18} weight="fill" />}
            {isEditing ? "Cập nhật" : "Tạo sổ"}
          </button>
        </div>
      </div>
    </form>
  );
};