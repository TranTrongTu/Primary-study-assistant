import React from "react";

export const GlobalStyles = () => (
  <style>{`
    /* ── Hiệu ứng mây trôi tự nhiên trên bầu trời ── */
    @keyframes cloud-drift-1 { 0%{transform:translateX(-18%)} 100%{transform:translateX(110%)} }
    @keyframes cloud-drift-2 { 0%{transform:translateX(-12%)} 100%{transform:translateX(108%)} }
    @keyframes cloud-drift-3 { 0%{transform:translateX(110%)}  100%{transform:translateX(-20%)} }

    /* ── Sương mù lướt nhẹ nhàng (dành cho sáng sớm hoặc sau mưa) ── */
    @keyframes fog-drift {
      0%   { transform: translateX(-8%) scaleY(1);   opacity: 0.55; }
      50%  { transform: translateX(4%)  scaleY(1.08); opacity: 0.75; }
      100% { transform: translateX(-8%) scaleY(1);   opacity: 0.55; }
    }

    /* ── Hiệu ứng vòng tròn lan tỏa khi giọt mưa chạm đất ── */
    @keyframes splash-ring {
      0%   { transform: scale(0.2); opacity: 0.8; }
      100% { transform: scale(1);   opacity: 0;   }
    }
    .splash-ring { animation: splash-ring 0.7s ease-out forwards; }

    /* ── Hơi nước bốc lên từ mặt đất (petrichor) sau khi tạnh mưa ── */
    @keyframes mist-rise {
      0%   { transform: translateY(0)   scaleX(1);   opacity: 0; }
      20%  { opacity: 0.5; }
      80%  { opacity: 0.3; }
      100% { transform: translateY(-60px) scaleX(1.3); opacity: 0; }
    }
    .mist-puff { animation: mist-rise 3.5s ease-out forwards; }

    /* ── Hiệu ứng đom đóm bay lượn và phát sáng ── */
    @keyframes firefly-float {
      0%,100% { transform: translate(0,0);      opacity:0; }
      20%      { opacity: 1; }
      50%      { transform: translate(var(--fx), var(--fy)); opacity:0.9; }
      80%      { opacity: 0.6; }
    }
    @keyframes firefly-glow {
      0%,100% { box-shadow: 0 0 3px 1px #ffe066, 0 0 6px 2px #ffe06644; }
      50%     { box-shadow: 0 0 6px 3px #ffe066, 0 0 14px 6px #ffe06655; }
    }

    /* ── Chớp sáng toàn bộ bầu trời khi có sấm sét ── */
    @keyframes sky-flash {
      0%,100% { opacity:0; }
      8%      { opacity:0.55; }
      14%     { opacity:0; }
      22%     { opacity:0.75; }
      35%     { opacity:0; }
    }
    .flash-overlay { animation: sky-flash 0.9s ease-out forwards; }

    /* ── Hiệu ứng sao đêm nhấp nháy ── */
    @keyframes twinkle {
      0%,100% { opacity: var(--base-op); transform: scale(1); }
      50%     { opacity: 1;              transform: scale(1.5); }
    }

    /* ── Chuyển động xuất hiện và biến mất của cầu vồng ── */
    @keyframes rainbow-appear {
      0%   { opacity:0; transform: scaleX(0.88) translateY(12px); }
      100% { opacity:1; transform: scaleX(1)    translateY(0); }
    }
    @keyframes rainbow-fade {
      0%   { opacity:1; }
      100% { opacity:0; }
    }
    .rainbow-in  { animation: rainbow-appear 2.5s cubic-bezier(0.22,1,0.36,1) forwards; }
    .rainbow-out { animation: rainbow-fade   2s ease-in forwards; }
  `}</style>
);