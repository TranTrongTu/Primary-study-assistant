// src/features/auth/components/SchoolGate.jsx
import React from 'react';

import './animations/SchoolGate.css';

export const SchoolGate = ({ isOpen, isDark }) => {
  return (
    <div className={`school-gate-wrap ${isOpen ? 'open' : ''} ${isDark ? 'dark' : ''}`}>
      <svg
        className="gate-svg"
        viewBox="0 0 1400 800"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMax meet"
        overflow="visible"
      >
        <defs>
          <linearGradient id="stoneGray" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#4a4c50"/>
            <stop offset="20%"  stopColor="#6b6d73"/>
            <stop offset="50%"  stopColor="#888a90"/>
            <stop offset="80%"  stopColor="#585a5f"/>
            <stop offset="100%" stopColor="#353639"/>
          </linearGradient>
          <linearGradient id="stoneDark" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#2c2d30"/>
            <stop offset="50%"  stopColor="#4b4d52"/>
            <stop offset="100%" stopColor="#2c2d30"/>
          </linearGradient>
          <linearGradient id="ironBlack" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#111"/>
            <stop offset="50%"  stopColor="#2a2a2a"/>
            <stop offset="100%" stopColor="#050505"/>
          </linearGradient>
          <linearGradient id="goldRich" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="#FFF4CC"/>
            <stop offset="30%"  stopColor="#D4AF37"/>
            <stop offset="70%"  stopColor="#997A00"/>
            <stop offset="100%" stopColor="#4A3B00"/>
          </linearGradient>
          <radialGradient id="lanternFire" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffffff" stopOpacity="1"/>
            <stop offset="25%"  stopColor="#ffe680" stopOpacity="0.9"/>
            <stop offset="60%"  stopColor="#ff8c00" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="#ff4500" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ffcc66" stopOpacity="0.45"/>
            <stop offset="50%"  stopColor="#ff6600" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#000000" stopOpacity="0"/>
          </radialGradient>
          <filter id="shadowHeavy">
            <feDropShadow dx="0" dy="15" stdDeviation="20" floodOpacity="0.65"/>
          </filter>
          <filter id="shadowLight">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.4"/>
          </filter>
          <filter id="goldGlow">
            <feGaussianBlur stdDeviation="2.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <ellipse cx="700" cy="760" rx="900" ry="25" fill="rgba(0,0,0,0.4)" filter="url(#shadowHeavy)"/>

        {/* HÀNG RÀO LAN TỎA */}
        <FenceWing x={-1500} width={1850} />
        <FenceWing x={1050} width={1500} />

        {/* =========================================================
            SỬA LOGIC Ở ĐÂY: VẼ CÁNH CỬA TRƯỚC ĐỂ NÓ NẰM LỚP DƯỚI CÙNG
        ========================================================= */}
        {/* CÁNH CỔNG CHÍNH */}
        <g className="gate-door-l" style={{ transformOrigin: "480px center" }}>
          <GateDoor side="left" x={480} doorW={220} />
        </g>
        <g className="gate-door-r" style={{ transformOrigin: "920px center" }}>
          <GateDoor side="right" x={700} doorW={220} />
        </g>

        {/* CỘT ĐÁ (Vẽ sau để đè lên che mép cửa khi cửa xoay lùi ra sau) */}
        <CastlePillar x={350} side="left" />
        <CastlePillar x={920} side="right" />

        {/* VÒM CỔNG & BẢNG HIỆU (Vẽ sau cùng) */}
        <OrnateArch />

        {isDark && (
          <g className="lantern-glow" pointerEvents="none" style={{ mixBlendMode: 'screen' }}>
            <circle cx="280" cy="200" r="280" fill="url(#lanternGlow)" />
            <circle cx="1120" cy="200" r="280" fill="url(#lanternGlow)" />
          </g>
        )}
      </svg>
    </div>
  );
};

const FenceWing = ({ x, width }) => {
  const spacing = 40;
  const count   = Math.floor(width / spacing);
  return (
    <g filter="url(#shadowHeavy)">
      <rect x={x} y={640} width={width} height={120} fill="url(#stoneDark)"/>
      <line x1={x} y1={650} x2={x+width} y2={650} stroke="#6b6d73" strokeWidth="4"/>
      <rect x={x} y={320} width={width} height={16} fill="url(#ironBlack)" rx="2"/>
      <rect x={x} y={580} width={width} height={18} fill="url(#ironBlack)" rx="2"/>
      <rect x={x} y={620} width={width} height={12} fill="url(#ironBlack)" rx="2"/>
      {Array.from({ length: count }).map((_, i) => {
        const bx = x + 15 + i * spacing;
        return (
          <g key={i}>
            <rect x={bx} y={290} width={12} height={350} fill="url(#ironBlack)"/>
            <path d={`M${bx-6},290 L${bx+6},240 L${bx+18},290 Z`} fill="url(#goldRich)"/>
            <circle cx={bx+6} cy={328} r="8" fill="url(#ironBlack)"/>
          </g>
        );
      })}
    </g>
  );
};

const CastlePillar = ({ x, side }) => {
  const isLeft = side === 'left';
  const w  = 130;
  const cx = x + w / 2;
  const stoneLines = [];
  for (let i = 0; i < 18; i++) {
    const y = 160 + i * 30;
    stoneLines.push(<line key={`h${i}`} x1={x} y1={y} x2={x+w} y2={y} stroke="#1f2022" strokeWidth="3" opacity="0.6" />);
  }
  const armX   = isLeft ? x - 40 : x + w;
  const lampCx = isLeft ? x - 45 : x + w + 45;

  return (
    <g filter="url(#shadowHeavy)">
      <rect x={x-15} y={710} width={w+30} height={50} fill="url(#stoneDark)" rx="4"/>
      <rect x={x-10} y={670} width={w+20} height={40} fill="url(#stoneGray)" rx="2"/>
      {/* Thân cột cao lên */}
      <rect x={x} y={160} width={w} height={510} fill="url(#stoneGray)"/>
      {stoneLines}
      <g transform={`translate(${cx}, 380) scale(0.85)`} filter="url(#shadowLight)">
        <path d="M-30,-40 L30,-40 L35,10 C35,40 0,60 0,60 C0,60 -35,40 -35,10 Z" fill="#202520" stroke="url(#goldRich)" strokeWidth="4"/>
        <circle cx="0" cy="5" r="14" fill="url(#goldRich)"/>
      </g>
      <rect x={x-12} y={130} width={w+24} height={30} fill="url(#stoneDark)" rx="3"/>
      <rect x={x-6} y={110}  width={w+12} height={20} fill="url(#stoneGray)"/>
      <path d={`M${x-10},110 C${x-10},20 ${x+w+10},20 ${x+w+10},110 Z`} fill="url(#stoneGray)"/>
      <polygon points={`${cx-12},35 ${cx},0 ${cx+12},35`} fill="url(#goldRich)"/>
      <circle cx={cx} cy={0} r="10" fill="url(#goldRich)" filter="url(#goldGlow)"/>
      <path d={`M${isLeft ? armX+40 : armX-40},200 C${lampCx},180 ${lampCx},130 ${lampCx},160`} fill="none" stroke="url(#ironBlack)" strokeWidth="12" strokeLinecap="round"/>
      <VintageLantern cx={lampCx} cy={220} />
      <RoseVines x={x} w={w} side={side}/>
    </g>
  );
};

const VintageLantern = ({ cx, cy }) => (
  <g filter="url(#shadowLight)">
    <path d={`M${cx-35},${cy-40} L${cx},${cy-80} L${cx+35},${cy-40} Z`} fill="#111" stroke="url(#goldRich)" strokeWidth="2"/>
    <circle cx={cx} cy={cy-85} r="6" fill="url(#goldRich)"/>
    <rect x={cx-30} y={cy-40} width={60} height={90} fill="#0a0a0a"/>
    <polygon points={`${cx-20},${cy-30} ${cx+20},${cy-30} ${cx+15},${cy+40} ${cx-15},${cy+40}`} fill="url(#lanternFire)"/>
    <circle cx={cx} cy={cy+15} r="25" fill="#fff" filter="url(#goldGlow)"/>
    <line x1={cx} y1={cy-40} x2={cx} y2={cy+50} stroke="#111" strokeWidth="5"/>
    <line x1={cx-30} y1={cy+5} x2={cx+30} y2={cy+5} stroke="#111" strokeWidth="5"/>
    <rect x={cx-35} y={cy+50} width={70} height={15} fill="#111" rx="4"/>
  </g>
);

const OrnateArch = () => (
  <g filter="url(#shadowHeavy)">
    {/* 1. Nền bảng hiệu khổng lồ lấp kín lỗ hổng */}
    {/* Kéo từ mép cửa (y=180) lên vòm cong và nối sang 2 cột */}
    <path
      d="M 480, 180 L 480, 120 C 580, -30 820, -30 920, 120 L 920, 180 Z"
      fill="#1a1105"
      stroke="url(#goldRich)"
      strokeWidth="6"
    />

    {/* 2. Viền sắt bảo vệ uốn lượn phía trên cùng */}
    <path
      d="M 475, 120 C 580, -40 820, -40 925, 120"
      fill="none"
      stroke="url(#ironBlack)"
      strokeWidth="16"
      strokeLinecap="round"
    />

    {/* 3. Đường quỹ đạo vô hình cho chữ EduSpark cong */}
    <defs>
      <path id="textCurve" d="M 520, 130 C 610, 30 790, 30 880, 130" fill="none" />
    </defs>

    {/* 4. Chữ EduSpark uốn cong Parabol hoàn hảo */}
    <defs>
    <path
        id="textCurve"
        d="M 130 145 Q 250 70 370 145"
        fill="transparent"
    />

    <linearGradient id="kidGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFE66D" />
        <stop offset="25%" stopColor="#FF9FF3" />
        <stop offset="50%" stopColor="#A29BFE" />
        <stop offset="75%" stopColor="#74B9FF" />
        <stop offset="100%" stopColor="#55EFC4" />
    </linearGradient>

    <filter id="magicGlow" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="3" result="blur1" />
        <feGaussianBlur stdDeviation="8" result="blur2" />
        <feGaussianBlur stdDeviation="14" result="blur3" />
        <feMerge>
        <feMergeNode in="blur3" />
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>

    {/* sparkle glow */}
    <filter id="sparkleGlow">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
        </feMerge>
    </filter>
    </defs>

    {/* shadow */}
    <text
    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Ubuntu', sans-serif"
    fontSize="54"
    fontWeight="900"
    letterSpacing="4"
    fill="rgba(20,20,60,0.45)"
    >
    <textPath href="#textCurve" startOffset="50%" textAnchor="middle" dy="5">
        EDUSPARK
    </textPath>
    </text>

    {/* main text */}
    <text
    fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Ubuntu', sans-serif"
    fontSize="54"
    fontWeight="900"
    letterSpacing="4"
    fill="url(#kidGradient)"
    stroke="#FFFFFF"
    strokeWidth="3"
    paintOrder="stroke"
    filter="url(#magicGlow)"
    >
    <textPath href="#textCurve" startOffset="50%" textAnchor="middle">
        EDUSPARK
    </textPath>
    </text>

    {/* sparkles */}
    <g filter="url(#sparkleGlow)">
    {/* trái */}
    <g transform="translate(145 90)">
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#FFFBEA" strokeWidth="2"/>
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#FFFBEA" strokeWidth="2"/>
    </g>

    {/* giữa */}
    <g transform="translate(250 62)">
        <line x1="-6" y1="0" x2="6" y2="0" stroke="#FFE66D" strokeWidth="2"/>
        <line x1="0" y1="-6" x2="0" y2="6" stroke="#FFE66D" strokeWidth="2"/>
    </g>

    {/* phải */}
    <g transform="translate(355 95)">
        <line x1="-5" y1="0" x2="5" y2="0" stroke="#FF9FF3" strokeWidth="2"/>
        <line x1="0" y1="-5" x2="0" y2="5" stroke="#FF9FF3" strokeWidth="2"/>
    </g>

    {/* chấm sáng */}
    <circle cx="180" cy="72" r="2.5" fill="#FFFFFF" />
    <circle cx="320" cy="78" r="2" fill="#74B9FF" />
    <circle cx="285" cy="58" r="2" fill="#FF9FF3" />
    </g>

    {/* 5. Slogan thẳng lấp đầy khoảng hở bên dưới */}
    <g transform="translate(0, 155)">
      {/* Hai gạch vàng trang trí 2 bên chữ */}
      <line x1="510" y1="-5" x2="540" y2="-5" stroke="url(#goldRich)" strokeWidth="3" strokeLinecap="round" />
      <line x1="860" y1="-5" x2="890" y2="-5" stroke="url(#goldRich)" strokeWidth="3" strokeLinecap="round" />
      
      {/* Chữ Slogan
      <text
        x="700" y="0"
        textAnchor="middle"
        fontFamily="Montserrat, sans-serif"
        fontWeight="800"
        fontSize="17"
        fill="#D4AF37"
        letterSpacing="5"
      >
        ★ HỌC VIỆN PHÉP THUẬT ★
      </text> */}
    </g>

    {/* 6. Hoa văn vương miện trên đỉnh vòm */}
    <path d="M 680, -5 C 680, -35 720, -35 720, -5 Z" fill="url(#goldRich)" />
    <circle cx="700" cy="-40" r="10" fill="url(#goldRich)" filter="url(#goldGlow)" />
  </g>
);

const GateDoor = ({ side, x, doorW }) => {
  const isLeft = side === 'left';
  const bars = 6;
  const spacing = doorW / bars;
  return (
    <g filter="url(#shadowHeavy)">
      {/* Cửa cao thêm (Từ 180 đến 720) */}
      <rect x={x} y={180} width={doorW} height={540} fill="none" stroke="url(#ironBlack)" strokeWidth="22" rx="4"/>
      <rect x={x} y={350} width={doorW} height={20} fill="url(#ironBlack)"/>
      <rect x={x} y={640} width={doorW} height={20} fill="url(#ironBlack)"/>
      {isLeft ? (
        <path d={`M${x+20},250 C${x+80},170 ${x+140},320 ${x+180},250`} fill="none" stroke="url(#goldRich)" strokeWidth="6" strokeLinecap="round"/>
      ) : (
        <path d={`M${x+doorW-20},250 C${x+doorW-80},170 ${x+doorW-140},320 ${x+doorW-180},250`} fill="none" stroke="url(#goldRich)" strokeWidth="6" strokeLinecap="round"/>
      )}
      {Array.from({ length: bars - 1 }).map((_, i) => {
        const bx  = x + (i + 1) * spacing;
        return (
          <g key={i}>
            <rect x={bx-6} y={180} width={12} height={540} fill="url(#ironBlack)"/>
            <circle cx={bx} cy={360} r="8" fill="url(#goldRich)"/>
            <path d={`M${bx-8},180 L${bx},140 L${bx+8},180 Z`} fill="url(#goldRich)"/>
          </g>
        );
      })}
      <rect x={isLeft ? x+doorW-25 : x-5} y={220} width={30} height={60} fill="url(#goldRich)" rx="5"/>
      <rect x={isLeft ? x+doorW-25 : x-5} y={580} width={30} height={60} fill="url(#goldRich)" rx="5"/>
    </g>
  );
};

const RoseVines = ({ x, w, side }) => {
  const isLeft = side === 'left';
  const vx = isLeft ? x - 10 : x + w + 10;
  const stemD = isLeft ? `M${vx},700 Q${vx-30},450 ${vx+20},300 T${vx-10},120` : `M${vx},700 Q${vx+30},450 ${vx-20},300 T${vx+10},120`;
  const points = [140, 220, 310, 420, 540, 670];
  return (
    <g filter="url(#shadowLight)">
      <path d={stemD} fill="none" stroke="#1d3816" strokeWidth="6" strokeLinecap="round"/>
      {points.map((y, i) => {
        const dir = i % 2 === 0 ? 1 : -1;
        const lx = isLeft ? vx + (dir * 20) : vx - (dir * 20);
        return (
          <g key={i}>
            <ellipse cx={lx} cy={y+10} rx="12" ry="7" fill="#2d5a20" transform={`rotate(${dir * 45} ${lx} ${y})`}/>
            {i % 2 === 0 && <circle cx={lx} cy={y} r="9" fill="#a82030" stroke="#7a1020" strokeWidth="2"/>}
          </g>
        );
      })}
    </g>
  );
};