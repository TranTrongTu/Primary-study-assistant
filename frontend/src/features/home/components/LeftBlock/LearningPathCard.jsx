import React from "react";
import { CaretRight } from "@phosphor-icons/react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";

import robotPurple from "../../assets/robot-purple.png";
import robotGreen from "../../assets/robot-green.png";
import robotYellow from "../../assets/robot-yellow.png";
import robotPink from "../../assets/robot-pink.png";
import schoolBag from "../../assets/school-bag.png";

const PATHS = [
  {
    id: 1,
    title: "Ôn tập",
    desc: "Luyện lại kiến thức qua bài tập",
    color: "#6d28d9",
    nightColor: "#a78bfa",
    bg: "#f5f3ff",
    nightBg: "rgba(109,40,217,0.12)",
    border: "#ede9fe",
    icon: robotPurple,
  },
  {
    id: 2,
    title: "Học liệu",
    desc: "Khám phá tài liệu và bài giảng",
    color: "#15803d",
    nightColor: "#4ade80",
    bg: "#f0fdf4",
    nightBg: "rgba(21,128,61,0.12)",
    border: "#dcfce7",
    icon: robotGreen,
  },
  {
    id: 3,
    title: "Thi thử",
    desc: "Làm bài thi thử để kiểm tra",
    color: "#b45309",
    nightColor: "#fbbf24",
    bg: "#fffbeb",
    nightBg: "rgba(180,83,9,0.12)",
    border: "#fef3c7",
    icon: robotYellow,
  },
  {
    id: 4,
    title: "AI Hỏi đáp",
    desc: "Giải đáp thắc mắc cùng AI",
    color: "#be185d",
    nightColor: "#f472b6",
    bg: "#fdf2f8",
    nightBg: "rgba(190,24,93,0.12)",
    border: "#fce7f3",
    icon: robotPink,
  },
];

export const LearningPathCard = () => {
  const { isNight } = useTheme();

  // ĐÃ SỬA NỀN KÍNH
  const cardCls = isNight
    ? "bg-slate-900/90 border-white/[0.1] shadow-2xl"
    : "bg-white/60 border-white/60 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]";

  return (
    <div
      className={`rounded-[2rem] px-5 py-4 border-2 h-full flex flex-col transition-all ${cardCls}`}
    >
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <img
          src={schoolBag}
          alt="School Bag"
          className="w-7 h-7 drop-shadow-sm"
        />
        <div>
          <h3
            className={`text-[15px] font-black leading-tight ${isNight ? "text-slate-200" : "text-[#1e293b]"}`}
          >
            Hành trình học tập
          </h3>
          <p
            className={`text-[11.5px] font-semibold ${isNight ? "text-slate-400" : "text-slate-500"}`}
          >
            Khám phá các hoạt động giúp bạn học hiệu quả mỗi ngày
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative group mt-1 mx-[-4px]">
        <style>{`
          @keyframes train-scroll { 0%, 15% { transform: translateX(0); } 25%, 40% { transform: translateX(-12.5%); } 50%, 65% { transform: translateX(-25%); } 75%, 90% { transform: translateX(-37.5%); } 100% { transform: translateX(-50%); } }
          .animate-train { display: flex; width: 200%; height: 100%; align-items: center; animation: train-scroll 16s infinite cubic-bezier(0.4, 0, 0.2, 1); }
          .group:hover .animate-train { animation-play-state: paused; }
        `}</style>

        <div className="animate-train">
          {[...PATHS, ...PATHS].map((item, idx) => (
            <div key={idx} className="w-[12.5%] h-full px-1.5 pb-2">
              <div
                style={{
                  backgroundColor: isNight ? item.nightBg : item.bg,
                  borderColor: isNight ? "transparent" : item.border,
                }}
                className="border-2 rounded-[1.5rem] p-3 flex flex-row items-center gap-3.5 cursor-pointer h-full hover:-translate-y-1 hover:shadow-lg transition-all duration-300 overflow-hidden relative"
              >
                <img
                  src={item.icon}
                  alt={item.title}
                  className="w-14 h-14 shrink-0 object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 origin-bottom"
                />

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-start gap-1 mb-0.5 min-w-0">
                    <h4
                      className="text-[13px] font-black tracking-tight leading-tight whitespace-normal break-words"
                      style={{ color: isNight ? item.nightColor : item.color }}
                    >
                      {item.title}
                    </h4>
                    <CaretRight
                      size={14}
                      weight="bold"
                      className={`opacity-60 transition-transform group-hover:translate-x-1 ${isNight ? "text-slate-300" : "text-slate-500"}`}
                    />
                  </div>
                  <p
                    className={`text-[10.5px] font-bold leading-snug whitespace-normal break-words ${isNight ? "text-slate-400" : "text-slate-600"}`}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};