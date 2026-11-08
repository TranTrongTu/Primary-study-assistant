// src/components/theme/elements/SkyEffects.jsx
import React, { useMemo } from "react";

// MÂY TRÔI ĐỘNG
export const DriftingClouds = ({ darkened }) => {
  const clouds = useMemo(() => [
    { top: "6%",  size: 220, opacity: darkened ? 0.55 : 0.18, dur: "55s",  anim: "cloud-drift-1", delay: "-10s" },
    { top: "11%", size: 160, opacity: darkened ? 0.65 : 0.22, dur: "72s",  anim: "cloud-drift-2", delay: "-30s" },
    { top: "4%",  size: 190, opacity: darkened ? 0.50 : 0.15, dur: "90s",  anim: "cloud-drift-3", delay: "-55s" },
    { top: "16%", size: 130, opacity: darkened ? 0.70 : 0.20, dur: "65s",  anim: "cloud-drift-1", delay: "-42s" },
  ], [darkened]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 4 }}>
      {clouds.map((c, i) => (
        <div key={i} style={{
            position: "absolute", top: c.top, left: "-25%", width: c.size, height: c.size * 0.55,
            borderRadius: "50%", opacity: c.opacity, filter: "blur(14px)",
            background: darkened
              ? "radial-gradient(ellipse, rgba(60,80,120,0.9) 30%, transparent 75%)"
              : "radial-gradient(ellipse, rgba(255,255,255,0.95) 30%, transparent 75%)",
            animation: `${c.anim} ${c.dur} linear infinite`, animationDelay: c.delay,
        }}/>
      ))}
    </div>
  );
};

// SƯƠNG MÙ
export const MorningFog = ({ visible }) => (
  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2, opacity: visible ? 1 : 0, transition: "opacity 4s ease" }}>
    {[0, 1, 2].map(i => (
      <div key={i} style={{
          position: "absolute", bottom: `${12 + i * 9}%`, left: "-10%", right: "-10%", height: `${55 - i * 12}px`,
          background: `radial-gradient(ellipse 80% 100% at 50% 50%, rgba(220,235,255,${0.38 - i * 0.08}) 0%, transparent 70%)`,
          filter: `blur(${12 + i * 6}px)`, animation: `fog-drift ${18 + i * 7}s ease-in-out infinite`,
          animationDelay: `${i * 3.5}s`, transformOrigin: "center",
      }}/>
    ))}
  </div>
);

// SAO ĐÊM NHẤP NHÁY
export const StarField = ({ visible }) => {
  const stars = useMemo(() => Array.from({ length: 90 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 55, size: 0.8 + Math.random() * 1.6,
      baseOp: 0.4 + Math.random() * 0.5, dur: `${2 + Math.random() * 4}s`, delay: `${Math.random() * 5}s`,
  })), []);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1, opacity: visible ? 1 : 0, transition: "opacity 2s ease" }}>
      {stars.map(s => (
        <div key={s.id} style={{
            position: "absolute", left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size,
            borderRadius: "50%", background: "#fff", "--base-op": s.baseOp, opacity: s.baseOp,
            animation: `twinkle ${s.dur} ease-in-out infinite`, animationDelay: s.delay,
            boxShadow: `0 0 ${s.size * 2}px rgba(255,255,255,0.6)`,
        }}/>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SAO BĂNG (Shooting Stars) - Đã fix bug CSS Animation & Mask
═══════════════════════════════════════════════════════════════════ */
export const ShootingStars = ({ star }) => {
  if (!star) return null;

  return (
    <div 
      className="absolute inset-0 pointer-events-none"
      style={{ 
        zIndex: 1,
        // Tạo mặt nạ hình Elip: Nhìn rõ ở giữa trời, mờ dần tàng hình khi lọt ra 2 viền mép (chỗ có cây)
        WebkitMaskImage: "radial-gradient(ellipse at 50% 30%, black 40%, transparent 80%)",
        maskImage: "radial-gradient(ellipse at 50% 30%, black 40%, transparent 80%)"
      }}
    >
      <style>{`
        @keyframes shoot-across {
          0%   { transform: translateX(0) scale(0.5); opacity: 0; }
          10%  { opacity: 1; transform: translateX(10vw) scale(1); }
          85%  { opacity: 1; }
          100% { transform: translateX(100vw) scale(0.5); opacity: 0; }
        }
      `}</style>

      <div
        key={star.id}
        style={{
          position: "absolute",
          left: `${star.x}%`,
          top: `${star.y}%`,
          // Bẻ góc thẻ cha để tạo hướng bay xéo (150-170 độ)
          transform: `rotate(${star.angle}deg)`, 
        }}
      >
        <div
          style={{
            position: "relative",
            width: "140px",
            height: "2px",
            // Đuôi sáng mờ dần
            background: "linear-gradient(to right, transparent 0%, rgba(255,255,255,0.4) 50%, #ffffff 100%)",
            borderRadius: "100px",
            filter: "drop-shadow(0 0 4px rgba(255,255,255,0.8))",
            transformOrigin: "right center",
            // Thẻ con bay dọc theo góc đã bẻ
            animation: `shoot-across ${star.speed}s cubic-bezier(0.25, 0.1, 0.25, 1) forwards`, 
          }}
        >
          {/* Đầu sao chớp lóa */}
          <div 
            className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full bg-white"
            style={{
              width: "4px", height: "4px",
              boxShadow: "0 0 10px 2px white, 0 0 20px 4px rgba(173, 216, 230, 0.6)"
            }}
          />
        </div>
      </div>
    </div>
  );
};