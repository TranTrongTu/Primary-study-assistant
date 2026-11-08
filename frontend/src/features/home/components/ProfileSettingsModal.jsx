import React from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

export const ProfileSettingsModal = ({
  isOpen,
  activeTab,
  profileForm,
  passwordForm,
  profileError,
  passwordError,
  isSavingProfile,
  isSavingPassword,
  onClose,
  onTabChange,
  onProfileChange,
  onPasswordChange,
  onProfileSubmit,
  onPasswordSubmit,
}) => {
  const { isNight } = useTheme();

  if (!isOpen) return null;

  const tabBaseCls = "rounded-full px-4 py-2 text-sm font-bold transition-all";
  const activeTabCls = "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20";
  const inactiveTabCls = isNight
    ? "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
    : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800";

  const inputCls = isNight
    ? "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:border-cyan-400/70"
    : "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-400";

  return (
    <div
      className={`fixed inset-0 z-[160] flex items-center justify-center px-4 py-4 backdrop-blur-md ${isNight ? "bg-slate-950/75" : "bg-slate-950/55"}`}
    >
      <div
        className={`w-full max-w-[760px] overflow-hidden rounded-[1.75rem] border shadow-[0_30px_80px_rgba(0,0,0,0.35)] ${isNight ? "border-white/10 bg-slate-950 text-slate-100" : "border-white/70 bg-white text-slate-900"}`}
      >
        <div
          className={`flex items-start justify-between gap-4 px-6 py-5 ${isNight ? "bg-gradient-to-br from-cyan-950 via-slate-950 to-slate-900" : "bg-gradient-to-br from-cyan-50 via-white to-sky-50"}`}
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.32em] text-cyan-500">
              Profile settings
            </p>
            <h2
              className={`mt-1 text-[1.4rem] font-black ${isNight ? "text-white" : "text-slate-900"}`}
            >
              Chỉnh thông tin người dùng
            </h2>
            <p
              className={`mt-2 text-[13px] leading-relaxed ${isNight ? "text-slate-300" : "text-slate-600"}`}
            >
              Tách riêng phần thông tin cá nhân và đổi mật khẩu để thao tác rõ
              ràng hơn.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`rounded-full p-2 transition-colors ${isNight ? "text-slate-400 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}`}
            aria-label="Đóng modal"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-wrap gap-2 px-6 pt-5">
          <button
            type="button"
            onClick={() => onTabChange("profile")}
            className={`${tabBaseCls} ${activeTab === "profile" ? activeTabCls : inactiveTabCls}`}
          >
            Thông tin cá nhân
          </button>
          <button
            type="button"
            onClick={() => onTabChange("password")}
            className={`${tabBaseCls} ${activeTab === "password" ? activeTabCls : inactiveTabCls}`}
          >
            Đổi mật khẩu
          </button>
        </div>

        <div className="max-h-[calc(100vh-10rem)] overflow-y-auto px-6 pb-6 pt-5">
          {activeTab === "profile" ? (
            <form onSubmit={onProfileSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className={`mb-2 block text-xs font-black uppercase tracking-[0.22em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Tên hiển thị
                  </label>
                  <input
                    value={profileForm.username}
                    onChange={(event) =>
                      onProfileChange("username", event.target.value)
                    }
                    className={inputCls}
                    placeholder="Tên của bạn"
                  />
                </div>
                <div>
                  <label
                    className={`mb-2 block text-xs font-black uppercase tracking-[0.22em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Gmail
                  </label>
                  <input
                    value={profileForm.email}
                    onChange={(event) =>
                      onProfileChange("email", event.target.value)
                    }
                    className={inputCls}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`mb-2 block text-xs font-black uppercase tracking-[0.22em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
                >
                  Mô tả
                </label>
                <textarea
                  value={profileForm.description}
                  onChange={(event) =>
                    onProfileChange("description", event.target.value)
                  }
                  rows={4}
                  className={inputCls}
                  placeholder="Ví dụ: Mình học lớp 7, muốn giỏi Toán và mục tiêu là học sinh giỏi."
                />
              </div>

              {profileError && (
                <p className="text-sm font-semibold text-rose-500">
                  {profileError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-bold ${isNight ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <div>
                <label
                  className={`mb-2 block text-xs font-black uppercase tracking-[0.22em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
                >
                  Mật khẩu cũ
                </label>
                <input
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(event) =>
                    onPasswordChange("oldPassword", event.target.value)
                  }
                  className={inputCls}
                  placeholder="Nhập mật khẩu cũ"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    className={`mb-2 block text-xs font-black uppercase tracking-[0.22em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      onPasswordChange("newPassword", event.target.value)
                    }
                    className={inputCls}
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div>
                  <label
                    className={`mb-2 block text-xs font-black uppercase tracking-[0.22em] ${isNight ? "text-slate-500" : "text-slate-400"}`}
                  >
                    Xác nhận
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(event) =>
                      onPasswordChange("confirmPassword", event.target.value)
                    }
                    className={inputCls}
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-sm font-semibold text-rose-500">
                  {passwordError}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className={`rounded-2xl border px-4 py-2.5 text-sm font-bold ${isNight ? "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
