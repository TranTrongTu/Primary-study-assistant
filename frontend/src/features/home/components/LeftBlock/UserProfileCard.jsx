import React from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Power } from "@phosphor-icons/react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";

export const UserProfileCard = ({ name = "Minh" }) => {
  const { isNight } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    // Xóa token và cache user để đảm bảo khi đăng nhập tài khoản khác sẽ fetch dữ liệu mới
    try {
      localStorage.removeItem("token");
      queryClient.invalidateQueries(["current-user"]);
    } catch (e) {}
    // Điều hướng về trang gốc hoặc trang login
    navigate("/");
  };

  const cardCls = isNight
    ? "bg-slate-900/60 border-white/[0.08] backdrop-blur-xl"
    : "bg-white/60 border-white/60 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]";

  return (
    <div
      className={`rounded-[1.5rem] p-4 flex items-center justify-between border-2 transition-all ${cardCls}`}
    >
      {/* KHỐI THÔNG TIN */}
      <div className="flex items-center gap-3 min-w-0 pr-2">
        <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-orange-200 to-orange-100 flex items-center justify-center text-2xl border-2 border-white shadow-sm shrink-0">
          👦🏻
          <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full animate-pulse" />
        </div>
        <div className="flex flex-col min-w-0">
          <h3
            className={`text-[14.5px] font-black tracking-tight truncate ${isNight ? "text-slate-200" : "text-slate-800"}`}
          >
            Xin chào!
          </h3>
          <p
            className={`text-[11px] font-extrabold mt-0.5 truncate ${isNight ? "text-orange-400" : "text-orange-600"}`}
          >
            Sẵn sàng bứt phá!
          </p>
        </div>
      </div>

      {/* VÙNG CHỨA NÚT TĨNH CHỐNG GIẬT LAG LAYOUT */}
      <div className="relative w-10 h-10 shrink-0">
        <button
          type="button"
          className="absolute right-0 top-0 group flex items-center w-10 h-10 rounded-[13px] overflow-hidden transition-all duration-300 hover:w-[115px] bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:border-red-500 shadow-sm hover:shadow-[0_0_20px_rgba(239,68,68,0.6)] active:scale-95 z-10"
          onClick={handleLogout}
        >
          <span className="absolute left-2.75 text-[11px] font-black tracking-wide text-white opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none">
            ĐĂNG XUẤT
          </span>
          <div className="absolute right-0 w-10 h-10 flex items-center justify-center text-red-500 group-hover:text-white transition-colors duration-300 pointer-events-none">
            <Power size={18} weight="bold" />
          </div>
        </button>
      </div>
    </div>
  );
};
