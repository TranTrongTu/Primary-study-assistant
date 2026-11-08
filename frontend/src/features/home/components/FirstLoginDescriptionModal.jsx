import React from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

export const FirstLoginDescriptionModal = ({
  isOpen,
  isSaving,
  error,
  value,
  suggestions,
  onChange,
  onPickSuggestion,
  onSubmit,
}) => {
  const { isNight } = useTheme();

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center px-3 py-3 backdrop-blur-md ${isNight ? "bg-slate-950/75" : "bg-slate-950/55"}`}
    >
      <div
        className={`flex max-h-[calc(100vh-1.5rem)] w-full max-w-[760px] flex-col overflow-hidden rounded-[1.75rem] border shadow-[0_30px_80px_rgba(0,0,0,0.35)] animate-in fade-in zoom-in-95 duration-300 ${
          isNight
            ? "border-white/10 bg-slate-950 text-slate-100"
            : "border-white/70 bg-white text-slate-900"
        }`}
      >
        <div
          className={`relative shrink-0 overflow-hidden px-6 py-5 ${isNight ? "bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-900" : "bg-gradient-to-br from-cyan-50 via-white to-sky-50"}`}
        >
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 text-2xl shadow-lg shadow-cyan-500/25">
              ✨
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-500">
                Onboarding
              </p>
              <h2
                className={`mt-1 text-[1.55rem] font-black leading-tight ${isNight ? "text-white" : "text-slate-900"}`}
              >
                Thêm mô tả để EduSpark cá nhân hóa tốt hơn
              </h2>
            </div>
          </div>

          <p
            className={`mt-3 max-w-xl text-[13px] leading-relaxed ${isNight ? "text-slate-300" : "text-slate-600"}`}
          >
            Bé hãy nhập ngắn gọn 3 ý chính: đang học lớp mấy, muốn giỏi môn nào,
            và mục tiêu học tập là gì.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="flex-1 overflow-y-auto px-6 pb-6 pt-5"
        >
          <label
            className={`mb-2 block text-[13px] font-bold ${isNight ? "text-slate-200" : "text-slate-800"}`}
          >
            Mô tả của bạn
          </label>
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            rows={4}
            placeholder="Ví dụ: Mình học lớp 3, muốn giỏi môn Toán, mục tiêu học sinh xuất sắc."
            className={`w-full rounded-[1.25rem] border px-4 py-3 text-[14px] outline-none transition-all resize-none ${
              isNight
                ? "border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-cyan-400/60 focus:bg-white/8"
                : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:bg-white"
            }`}
          />

          {error && (
            <p className="mt-2 text-[13px] font-semibold text-rose-500">
              {error}
            </p>
          )}

          <div className="mt-5">
            <div className="flex items-center justify-between gap-3">
              <p
                className={`text-[11px] font-black uppercase tracking-[0.28em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
              >
                Gợi ý nhanh
              </p>
              <p
                className={`text-[11px] font-semibold ${isNight ? "text-slate-500" : "text-slate-400"}`}
              >
                Bấm vào chip để điền nhanh
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onPickSuggestion(suggestion)}
                  className={`group rounded-[1.1rem] border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${
                    isNight
                      ? "border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-cyan-400/10"
                      : "border-slate-200 bg-white hover:border-cyan-300 hover:bg-cyan-50"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 text-lg">{suggestion.icon}</span>
                    <div className="min-w-0">
                      <p
                        className={`text-[13px] font-black ${isNight ? "text-white" : "text-slate-900"}`}
                      >
                        {suggestion.title}
                      </p>
                      <p
                        className={`mt-0.5 text-[12px] leading-relaxed ${isNight ? "text-slate-400" : "text-slate-500"}`}
                      >
                        {suggestion.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 transition-all hover:-translate-y-0.5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Đang lưu..." : "Lưu mô tả"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
