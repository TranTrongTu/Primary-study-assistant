import React from 'react';

export const StairsLoader = () => {
  const steps = [
    { color: "from-yellow-400 to-orange-500", h: "35px", anim: "pillar-1-sync" },
    { color: "from-cyan-400 to-blue-500", h: "55px", anim: "pillar-2-sync" },
    { color: "from-green-400 to-emerald-500", h: "75px", anim: "pillar-3-sync" },
    { color: "from-pink-400 to-rose-500", h: "95px", anim: "pillar-4-sync" },
  ];

  return (
    <div className="relative h-[120px] w-[180px] flex items-end justify-start px-4 overflow-visible">
      {/* BÓNG: Chạy linear để các khoảng thời gian nhảy bằng chằn chặn */}
      <div 
        className="absolute bottom-0 left-[30px] w-6 h-6 -ml-3 rounded-full shadow-lg z-20 border-2 border-white/60"
        style={{ animation: 'ball-sync-pendulum 3s linear infinite' }}
      ></div>

      <div className="flex items-end gap-3 w-full h-full">
        {steps.map((step, i) => (
          <div 
            key={i}
            className={`w-8 rounded-t-xl bg-gradient-to-t ${step.color} origin-bottom shadow-md`}
            style={{ 
              height: step.h,
              animation: `${step.anim} 3s linear infinite` // Khóa chung chu kỳ 3 giây
            }}
          ></div>
        ))}
      </div>
    </div>
  );
};