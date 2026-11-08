import React from "react";
import { Gear, GearSix, User, UserCircle } from "@phosphor-icons/react";

const accentColor = "#1d7bd8";

export const Header = () => {
    return (
        <header className="flex items-center justify-between">
          <h1 className="text-meteor text-[2rem] font-black tracking-tight md:text-[2.4rem]">
            EduSpark.AI
          </h1>

          <div className="flex items-center gap-3 md:gap-4">
            <button className="inline-flex items-center gap-2 rounded-full border border-[#5e5e5e] bg-white/80 px-4 py-2 text-[0.95rem] font-semibold text-[#3f3f3f] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:bg-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e7f0ff] text-[1rem]">
                <GearSix size={18} weight="fill" color={accentColor} />
              </span>
              <span>Cài đặt</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-[#5e5e5e] bg-white/80 px-4 py-2 text-[0.95rem] font-semibold text-[#3f3f3f] shadow-[0_1px_0_rgba(255,255,255,0.8)_inset] transition hover:bg-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0d9] text-[1rem]">
                <UserCircle size={18} weight="fill" color={accentColor} />
              </span>
              <span>Tài khoản</span>
            </button>
          </div>
        </header>
    );
};