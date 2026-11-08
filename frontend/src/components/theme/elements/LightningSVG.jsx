import React from "react";

export const LightningSVG = ({ bolts }) => {
  // Nếu không có tia sét nào trong mảng thì không render gì cả
  if (!bolts || bolts.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 15 }}>
      
      {/* 1. HIỆU ỨNG NHÁY SÁNG TOÀN MÀN HÌNH (Flash Overlay) */}
      {/* Cường độ sáng và thời gian nháy phụ thuộc vào độ mạnh (intensity) của tia sét */}
      {bolts.map((b, i) => (
        <div
          key={`flash-${i}`}
          className="flash-overlay absolute inset-0"
          style={{
            background: `rgba(190,215,255,${0.25 + b.intensity * 0.35})`,
            animationDuration: `${0.6 + b.intensity * 0.4}s`,
            animationDelay: `${b.delay * 0.001}s`,
          }}
        />
      ))}

      {/* 2. VẼ TIA SÉT BẰNG SVG */}
      <svg
        viewBox="0 0 1000 500"
        preserveAspectRatio="xMidYMin slice"
        style={{ 
          position: "absolute", 
          inset: 0, 
          width: "100%", 
          height: "75%", 
          pointerEvents: "none" 
        }}
      >
        <defs>
          {/* Bộ lọc tạo vầng hào quang tỏa rộng (Soft Glow) */}
          <filter id="bolt-glow-soft">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Bộ lọc tạo vầng hào quang gắt sát lõi sét (Hard Glow) */}
          <filter id="bolt-glow-hard">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Lặp qua danh sách các tia sét để vẽ */}
        {bolts.map((b, bi) => (
          <g key={`bolt-${bi}`} opacity={0.88 + b.intensity * 0.12}>
            
            {/* Lớp 1: Hào quang ngoài cùng (Glow rộng, mờ) */}
            <path 
              d={b.path} 
              fill="none"
              stroke={`rgba(120,170,255,${0.3 + b.intensity * 0.2})`}
              strokeWidth="14" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="url(#bolt-glow-soft)"
            />
            
            {/* Lớp 2: Hào quang giữa (Glow gắt hơn) */}
            <path 
              d={b.path} 
              fill="none"
              stroke={`rgba(180,215,255,${0.55 + b.intensity * 0.25})`}
              strokeWidth="5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              filter="url(#bolt-glow-hard)"
            />
            
            {/* Lớp 3: Lõi sét trắng sáng rực ở giữa */}
            <path 
              d={b.path} 
              fill="none"
              stroke="rgba(240,248,255,0.95)"
              strokeWidth={1.5 + b.intensity}
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
            
            {/* Vẽ các tia sét nhánh (Branches) nứt ra từ thân chính */}
            {b.branches.map((bp, bpi) => (
              <g key={bpi}>
                {/* Hào quang của nhánh */}
                <path 
                  d={bp} 
                  fill="none"
                  stroke="rgba(160,200,255,0.45)" 
                  strokeWidth="4"
                  strokeLinecap="round" 
                  filter="url(#bolt-glow-soft)"
                />
                {/* Lõi của nhánh */}
                <path 
                  d={bp} 
                  fill="none"
                  stroke="rgba(220,238,255,0.75)" 
                  strokeWidth="1.2"
                  strokeLinecap="round"
                />
              </g>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
};