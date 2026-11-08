// src/components/theme/elements/Rainbow.jsx
import React from "react";

export const Rainbow = ({ phase }) => {
  // Các giai đoạn: "hidden" | "in" | "visible" | "out"
  if (phase === "hidden") return null;
  
  // Áp dụng class animation từ GlobalStyles
  const cls = phase === "out" ? "rainbow-out" : "rainbow-in";

  return (
    <div
      className={`absolute pointer-events-none ${cls}`}
      style={{
        /* Định vị: chiếm toàn bộ chiều ngang màn hình, cao ~65vh */
        left: 0, 
        right: 0, 
        top: "3%", 
        height: "65vh",
        zIndex: 3,
        
        /* Mask composite (Kỹ thuật cắt mây, núi và cây):
           - mask 1 (horizontal): ẩn 2 bên mép để giấu sau gốc cây (0-18% và 82-100%)
           - mask 2 (vertical):   ẩn phần dưới đường chân trời (~55% trở xuống) để giấu sau núi
           - mask 3 (radial):     tạo một lỗ hổng hình elip phủ lên đám mây giả (20-35% từ trái)
        */
        WebkitMaskImage: `
          linear-gradient(to right,
            transparent 0%,
            rgba(0,0,0,0.2) 10%,
            black 20%,
            black 80%,
            rgba(0,0,0,0.2) 90%,
            transparent 100%
          ),
          linear-gradient(to top,
            transparent 0%,
            transparent 35%,
            black 52%,
            black 100%
          ),
          radial-gradient(ellipse 28% 18% at 38% 22%,
            transparent 60%,
            black 75%
          )
        `,
        WebkitMaskComposite: "source-in, source-in",
        maskComposite: "intersect",
      }}
    >
      <svg
        viewBox="0 0 1000 650"
        preserveAspectRatio="xMidYMax meet"
        style={{ width: "100%", height: "100%" }}
      >
        <defs>
          <filter id="rbf">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
        
        {/* 7 dải màu cầu vồng — Vẽ từ ngoài (Đỏ) vào trong (Tím) */}
        {[
          { r: 490, color: "rgba(255,0,0,0.72)" },
          { r: 475, color: "rgba(255,127,0,0.72)" },
          { r: 460, color: "rgba(255,220,0,0.72)" },
          { r: 445, color: "rgba(0,210,0,0.65)" },
          { r: 430, color: "rgba(0,80,255,0.65)" },
          { r: 415, color: "rgba(75,0,130,0.65)" },
          { r: 400, color: "rgba(148,0,211,0.60)" },
        ].map(({ r, color }, i) => (
          <path
            key={i}
            d={`M ${500 - r} 650 A ${r} ${r} 0 0 1 ${500 + r} 650`}
            fill="none"
            stroke={color}
            strokeWidth="18"
            filter="url(#rbf)"
          />
        ))}
      </svg>
    </div>
  );
};