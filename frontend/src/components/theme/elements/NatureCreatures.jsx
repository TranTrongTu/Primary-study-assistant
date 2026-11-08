// src/components/theme/elements/NatureCreatures.jsx
import React, { useEffect, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════════════════
   ĐOM ĐÓM ĐÊM (Fireflies)
═══════════════════════════════════════════════════════════════════ */
const FIREFLY_COLORS = [
  { core: "#ffe066", glow1: "rgba(255,224,102,0.9)", glow2: "rgba(255,224,102,0.35)" },
  { core: "#aaff88", glow1: "rgba(170,255,136,0.85)", glow2: "rgba(170,255,136,0.3)" },
  { core: "#88ffcc", glow1: "rgba(136,255,204,0.8)",  glow2: "rgba(136,255,204,0.28)" },
  { core: "#ffdd88", glow1: "rgba(255,221,136,0.85)", glow2: "rgba(255,221,136,0.3)" },
];

export const Fireflies = ({ visible }) => {
  const flies = useMemo(() =>
    Array.from({ length: 55 }, (_, i) => {
      const color = FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)];
      return {
        id:    i,
        x:     2 + Math.random() * 96,
        y:     38 + Math.random() * 55,
        fx:    `${(Math.random() - 0.5) * 140}px`,
        fy:    `${(Math.random() - 0.5) * 90}px`,
        dur:   `${2.5 + Math.random() * 5.5}s`,
        delay: `${Math.random() * 10}s`,
        size:  2 + Math.random() * 2.5,
        color,
      };
    })
  , []);

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 6, opacity: visible ? 1 : 0, transition: "opacity 3s ease" }}
    >
      <style>{`
        @keyframes firefly-float {
          0%,100% { transform: translate(0,0); opacity: 0; }
          15%     { opacity: 1; }
          50%     { transform: translate(var(--fx), var(--fy)); opacity: 0.95; }
          85%     { opacity: 0.55; }
        }
        @keyframes ff-glow-y { 0%,100%{box-shadow:0 0 3px 1px #ffe066,0 0 7px 2px rgba(255,224,102,.4)} 50%{box-shadow:0 0 7px 3px #ffe066,0 0 16px 6px rgba(255,224,102,.5)} }
        @keyframes ff-glow-g { 0%,100%{box-shadow:0 0 3px 1px #aaff88,0 0 7px 2px rgba(170,255,136,.35)} 50%{box-shadow:0 0 7px 3px #aaff88,0 0 16px 6px rgba(170,255,136,.45)} }
        @keyframes ff-glow-c { 0%,100%{box-shadow:0 0 3px 1px #88ffcc,0 0 7px 2px rgba(136,255,204,.32)} 50%{box-shadow:0 0 7px 3px #88ffcc,0 0 16px 6px rgba(136,255,204,.42)} }
        @keyframes ff-glow-o { 0%,100%{box-shadow:0 0 3px 1px #ffdd88,0 0 7px 2px rgba(255,221,136,.35)} 50%{box-shadow:0 0 7px 3px #ffdd88,0 0 16px 6px rgba(255,221,136,.45)} }
      `}</style>
      {flies.map(f => {
        const glowAnim = f.color.core === "#ffe066" ? "ff-glow-y" : f.color.core === "#aaff88" ? "ff-glow-g" : f.color.core === "#88ffcc" ? "ff-glow-c" : "ff-glow-o";
        const glowDur = `${(parseFloat(f.dur) * 0.55).toFixed(1)}s`;
        return (
          <div key={f.id}
            style={{
              position: "absolute", left: `${f.x}%`, top: `${f.y}%`,
              width: f.size, height: f.size, borderRadius: "50%",
              background: f.color.core, "--fx": f.fx, "--fy": f.fy,
              animation: `firefly-float ${f.dur} ease-in-out infinite, ${glowAnim} ${glowDur} ease-in-out infinite`,
              animationDelay: f.delay,
            }}
          />
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BƯỚM BAY (Butterflies) - Canvas 2D
═══════════════════════════════════════════════════════════════════ */
export const Butterflies = ({ visible, hide }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ visible: true, hide: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const COLORS = ['#ff9ecd','#ffcc66','#99ddff','#bbff99','#ffaa88','#cc99ff'];
    const butterflies = Array.from({ length: 6 }, (_, i) => ({
      x: Math.random() * window.innerWidth,
      y: 0.3 * window.innerHeight + Math.random() * 0.4 * window.innerHeight,
      tx: Math.random() * window.innerWidth,   
      ty: 0.3 * window.innerHeight + Math.random() * 0.4 * window.innerHeight,
      angle: 0,          
      wingPhase: Math.random() * Math.PI * 2,
      baseSpeed: 0.6 + Math.random() * 0.8,
      speed: 0.6 + Math.random() * 0.8,
      size: 10 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
    }));

    let prevHide = stateRef.current.hide;
    let raf;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const t = Date.now() / 1000;
      const currentHide = stateRef.current.hide;

      // XỬ LÝ SỰ KIỆN TRỜI CHUẨN BỊ MƯA / TẠNH MƯA
      if (currentHide && !prevHide) {
         // Bắt đầu kéo mây đen -> Bướm bay thẳng về khối giữa màn hình nấp
         butterflies.forEach(b => {
            b.tx = canvas.width / 2 + (Math.random() - 0.5) * 80;
            b.ty = canvas.height / 2 + (Math.random() - 0.5) * 80;
            b.speed = b.baseSpeed * 3; // Bay nhanh gấp 3 lần để chạy mưa
         });
      } else if (!currentHide && prevHide) {
         // Trời hửng nắng trở lại -> Đặt vị trí xuất phát từ giữa màn hình bay tủa ra
         butterflies.forEach(b => {
            b.x = canvas.width / 2 + (Math.random() - 0.5) * 40;
            b.y = canvas.height / 2 + (Math.random() - 0.5) * 40;
            b.tx = Math.random() * canvas.width;
            b.ty = Math.random() * canvas.height;
            b.speed = b.baseSpeed * 1.5; // Bay ùa ra nhanh một chút rồi chậm lại
         });
      }
      prevHide = currentHide;

      butterflies.forEach(b => {
        const dx = b.tx - b.x;
        const dy = b.ty - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 10) {
          if (currentHide) {
             b.speed = 0; // Đã tới chỗ nấp (giữa màn hình) thì đứng yên
          } else {
             // Bay bình thường ngẫu nhiên quanh màn hình
             b.tx = 0.05 * canvas.width + Math.random() * 0.9 * canvas.width;
             b.ty = 0.25 * canvas.height + Math.random() * 0.5 * canvas.height;
             b.speed = b.baseSpeed;
          }
        }

        if (b.speed > 0) {
          b.angle = Math.atan2(dy, dx);
          b.x += (dx / dist) * b.speed;
          b.y += (dy / dist) * b.speed + Math.sin(t * 2 + b.wingPhase) * 0.4; 
          b.wingPhase += 0.22 * (b.speed / b.baseSpeed); // Đập cánh nhanh theo tốc độ
        }

        // Vẽ Bướm
        if (b.speed > 0 || currentHide) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle); 
            const wingOpen = Math.abs(Math.cos(b.wingPhase)); 
            ctx.save(); ctx.scale(-wingOpen, 1); ctx.beginPath(); ctx.ellipse(-2, -3, b.size * 0.8, b.size * 0.55, -0.4, 0, Math.PI * 2); ctx.fillStyle = b.color + 'cc'; ctx.fill(); ctx.restore();
            ctx.save(); ctx.scale(wingOpen, 1); ctx.beginPath(); ctx.ellipse(2, -3, b.size * 0.8, b.size * 0.55, 0.4, 0, Math.PI * 2); ctx.fillStyle = b.color + 'cc'; ctx.fill(); ctx.restore();
            ctx.save(); ctx.scale(-wingOpen, 1); ctx.beginPath(); ctx.ellipse(-2, 4, b.size * 0.55, b.size * 0.4, 0.3, 0, Math.PI * 2); ctx.fillStyle = b.color + 'aa'; ctx.fill(); ctx.restore();
            ctx.save(); ctx.scale(wingOpen, 1); ctx.beginPath(); ctx.ellipse(2, 4, b.size * 0.55, b.size * 0.4, -0.3, 0, Math.PI * 2); ctx.fillStyle = b.color + 'aa'; ctx.fill(); ctx.restore();
            ctx.beginPath(); ctx.ellipse(0, 0, 1.8, b.size * 0.45, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(60,30,0,0.7)'; ctx.fill();
            ctx.restore();
        }
      });
    };

    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => { stateRef.current.visible = visible; }, [visible]);
  useEffect(() => { stateRef.current.hide = hide; }, [hide]);

  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 7, opacity: visible ? 1 : 0, transition: 'opacity 2s ease' }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════════
   CÁNH HOA RƠI (Falling Petals)
═══════════════════════════════════════════════════════════════════ */
export const FallingPetals = ({ visible }) => {
  const petals = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    dur: `${6 + Math.random() * 8}s`,
    delay: `${Math.random() * 10}s`,
    size: 7 + Math.random() * 8,
    color: ['#ffb7c5','#ffd6a5','#fff0a0','#d4f0c0','#ffc8e8'][i % 5],
    rotate: Math.random() * 360,
  })), []);

  return (
    <>
      <style>{`
        @keyframes petal-fall {
          0%   { transform: translateY(-20px) translateX(0) rotate(0deg); opacity:0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(105vh) translateX(var(--sway)) rotate(var(--rot)); opacity:0; }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden"
        style={{ zIndex: 8, opacity: visible ? 1 : 0, transition: 'opacity 2s ease' }}>
        {petals.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:`${p.x}%`, top:'-20px',
            width: p.size, height: p.size * 0.7,
            borderRadius:'50% 50% 30% 70%',
            background: p.color,
            boxShadow:`0 0 4px ${p.color}88`,
            '--sway': `${(Math.random()-0.5)*120}px`,
            '--rot':  `${p.rotate}deg`,
            animation:`petal-fall ${p.dur} ease-in infinite`,
            animationDelay: p.delay,
            filter:'blur(0.4px)',
          }}/>
        ))}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   BỤI NẮNG (Golden Dust)
═══════════════════════════════════════════════════════════════════ */
export const GoldenDust = ({ visible }) => {
  const particles = useMemo(() => Array.from({ length: 35 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: 20 + Math.random() * 70,
    dur: `${4 + Math.random() * 6}s`,
    delay: `${Math.random() * 8}s`,
    size: 1.5 + Math.random() * 2.5,
  })), []);

  return (
    <>
      <style>{`
        @keyframes dust-float {
          0%   { transform: translate(0,0) scale(0.5); opacity:0; }
          20%  { opacity:1; }
          50%  { transform: translate(var(--dx),var(--dy)) scale(1.2); opacity:0.8; }
          100% { transform: translate(var(--dx2),var(--dy2)) scale(0.3); opacity:0; }
        }
      `}</style>
      <div className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 7, opacity: visible ? 1 : 0, transition: 'opacity 3s ease' }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position:'absolute', left:`${p.x}%`, top:`${p.y}%`,
            width:p.size, height:p.size, borderRadius:'50%',
            background:'#ffe566',
            boxShadow:`0 0 ${p.size*2}px ${p.size}px rgba(255,220,60,0.7)`,
            '--dx':  `${(Math.random()-0.5)*80}px`,
            '--dy':  `${-20 - Math.random()*50}px`,
            '--dx2': `${(Math.random()-0.5)*120}px`,
            '--dy2': `${-60 - Math.random()*80}px`,
            animation:`dust-float ${p.dur} ease-out infinite`,
            animationDelay: p.delay,
          }}/>
        ))}
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   LÁ RƠI THEO GIÓ
═══════════════════════════════════════════════════════════════════ */
export const FallingLeaves = ({ visible, cloudDark, isRaining }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ visible: true, cloudDark: false, isRaining: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    // Bảng màu lá (xanh lá cây pha chút vàng để hợp với cây trong background)
    const LEAF_COLORS = ['#556b2f', '#6b8e23', '#8fbc8f', '#9acd32', '#7cb342'];

    // Khởi tạo lá cho 2 bên cây
    const createLeaf = (treeSide) => {
      // Cây bên trái (0 -> 25% chiều ngang), Cây bên phải (75% -> 100% chiều ngang)
      const startX = treeSide === 'left' 
        ? Math.random() * (canvas.width * 0.25) 
        : canvas.width * 0.75 + Math.random() * (canvas.width * 0.25);
      
      return {
        x: startX,
        y: Math.random() * (canvas.height * 0.35) - 50, // Xuất phát từ tán cây
        treeSide,
        size: 5 + Math.random() * 6,
        color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
        phase: Math.random() * Math.PI * 2, // Lệch pha để không rơi giống hệt nhau
        phaseSpeed: 0.02 + Math.random() * 0.03,
        fallSpeed: 0.8 + Math.random() * 1.5,
        angle: Math.random() * Math.PI * 2,
        spinSpeed: (Math.random() - 0.5) * 0.1,
      };
    };

    // Tạo 40 chiếc lá (20 trái, 20 phải)
    let leaves = Array.from({ length: 40 }, (_, i) => createLeaf(i % 2 === 0 ? 'left' : 'right'));

    let raf;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!stateRef.current.visible) return;

      const { cloudDark, isRaining } = stateRef.current;
      const isStormApproaching = cloudDark && !isRaining; // Lúc mây đen chuẩn bị mưa

      // Tạo một biến "Cơn gió" (Gust) dùng sóng Sin để làm gió giật từng cơn (đồng bộ 60% toàn cục)
      const time = Date.now() / 1000;
      const globalGust = Math.sin(time * 0.8) * 0.5 + 0.5; // Giá trị từ 0 -> 1

      leaves.forEach(L => {
        L.phase += L.phaseSpeed;
        L.angle += L.spinSpeed;

        let windX = 0;
        let fallY = L.fallSpeed;

        if (isStormApproaching) {
          // GIÓ LỐC SẮP MƯA (Quỹ đạo Lò xo)
          windX = 2 + globalGust * 3; // Gió thổi ngang mạnh
          fallY = 1.5 + globalGust * 2;
          
          // Thêm nhiễu loạn sóng vòng tròn (lò xo)
          L.x += Math.cos(L.phase * 3) * 4; 
          L.y += Math.sin(L.phase * 3) * 2;
          L.angle += 0.1; // Xoay tít mù
        } 
        else if (isRaining) {
          // ĐANG MƯA TO (Rơi xéo mạnh xuống đất)
          windX = 4; // Bị gió mưa đẩy xiên sang phải
          fallY = L.fallSpeed * 3; // Rơi rất nhanh do hạt mưa đè xuống
          L.angle = Math.PI / 4; // Lá bị ép chúi đầu xuống
        } 
        else {
          // TRỜI QUANG MÂY TẠNH (Rơi hiu hiu)
          windX = 0.5 + globalGust; 
          L.x += Math.sin(L.phase) * 1.5; // Lắc lư ziczac qua lại
        }

        L.x += windX;
        L.y += fallY;

        // Nếu lá rớt khỏi màn hình -> Tái sinh lại trên tán cây
        if (L.y > canvas.height + 20 || L.x > canvas.width + 20) {
          Object.assign(L, createLeaf(L.treeSide));
          L.y = -20; // Rơi lại từ trên đỉnh
        }

        // --- Bắt đầu vẽ lá ---
        ctx.save();
        ctx.translate(L.x, L.y);
        ctx.rotate(L.angle);
        
        ctx.fillStyle = L.color;
        ctx.globalAlpha = 0.85;
        
        // Vẽ hình chiếc lá bằng 2 cung tròn (bezier)
        ctx.beginPath();
        ctx.ellipse(0, 0, L.size, L.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Vẽ gân lá
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-L.size, 0);
        ctx.lineTo(L.size, 0);
        ctx.stroke();

        ctx.restore();
      });
    };

    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  // Cập nhật state vào Ref để Canvas đọc được
  useEffect(() => { stateRef.current.visible = visible; }, [visible]);
  useEffect(() => { stateRef.current.cloudDark = cloudDark; }, [cloudDark]);
  useEffect(() => { stateRef.current.isRaining = isRaining; }, [isRaining]);

  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 6, opacity: visible ? 1 : 0, transition: 'opacity 2s ease' }}
    />
  );
};


/* ═══════════════════════════════════════════════════════════════════
   ONG BAY (Bees) - Canvas 2D
═══════════════════════════════════════════════════════════════════ */
export const Bees = ({ visible, hide }) => {
  const canvasRef = useRef(null);
  const stateRef = useRef({ visible: true, hide: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const bees = Array.from({ length: 4 }, () => ({
      x: 0.1 * window.innerWidth + Math.random() * 0.6 * window.innerWidth,
      y: 0.35 * window.innerHeight + Math.random() * 0.35 * window.innerHeight,
      tx: Math.random() * window.innerWidth * 0.8,
      ty: 0.35 * window.innerHeight + Math.random() * 0.35 * window.innerHeight,
      angle: 0,
      wingPhase: Math.random() * Math.PI * 2,
      baseSpeed: 0.5 + Math.random() * 0.6,
      speed: 0.5 + Math.random() * 0.6,
      size: 9 + Math.random() * 5,
    }));

    let prevHide = stateRef.current.hide;
    let raf;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentHide = stateRef.current.hide;

      if (currentHide && !prevHide) {
         // Bay về giữa nấp mưa
         bees.forEach(b => {
            b.tx = canvas.width / 2 + (Math.random() - 0.5) * 80;
            b.ty = canvas.height / 2 + (Math.random() - 0.5) * 80;
            b.speed = b.baseSpeed * 3.5; 
         });
      } else if (!currentHide && prevHide) {
         // Từ giữa tỏa ra
         bees.forEach(b => {
            b.x = canvas.width / 2 + (Math.random() - 0.5) * 40;
            b.y = canvas.height / 2 + (Math.random() - 0.5) * 40;
            b.tx = Math.random() * canvas.width;
            b.ty = Math.random() * canvas.height;
            b.speed = b.baseSpeed * 1.5;
         });
      }
      prevHide = currentHide;

      bees.forEach(b => {
        const dx = b.tx - b.x;
        const dy = b.ty - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist < 10) {
          if (currentHide) {
             b.speed = 0; // Đứng im nấp
          } else {
             b.tx = 0.05 * canvas.width + Math.random() * 0.85 * canvas.width;
             b.ty = 0.3 * canvas.height + Math.random() * 0.45 * canvas.height;
             b.speed = b.baseSpeed;
          }
        }

        if (b.speed > 0) {
          b.angle = Math.atan2(dy, dx);
          b.x += (dx / dist) * b.speed;
          b.y += (dy / dist) * b.speed;
          b.wingPhase += 0.35 * (b.speed / b.baseSpeed);
        }

        // Vẽ Ong
        if (b.speed > 0 || currentHide) {
            ctx.save();
            ctx.translate(b.x, b.y);
            ctx.rotate(b.angle); 
            const s = b.size;
            const wingFlap = Math.abs(Math.sin(b.wingPhase));

            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = 'rgba(210,240,255,0.85)';
            ctx.save(); ctx.scale(1, wingFlap * 0.8 + 0.2); ctx.beginPath(); ctx.ellipse(-s*0.1, -s*0.55, s*0.55, s*0.35, -0.3, 0, Math.PI*2); ctx.fill(); ctx.restore();
            ctx.save(); ctx.scale(1, wingFlap * 0.8 + 0.2); ctx.beginPath(); ctx.ellipse(-s*0.1, s*0.55, s*0.55, s*0.35, 0.3, 0, Math.PI*2); ctx.fill(); ctx.restore();
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            ctx.ellipse(0, 0, s*0.65, s*0.38, 0, 0, Math.PI*2);
            const grad = ctx.createLinearGradient(-s*0.6, 0, s*0.6, 0);
            grad.addColorStop(0,   '#cc6600');
            grad.addColorStop(0.2, '#ffcc00');
            grad.addColorStop(0.4, '#222');
            grad.addColorStop(0.6, '#ffcc00');
            grad.addColorStop(0.8, '#222');
            grad.addColorStop(1,   '#ffcc00');
            ctx.fillStyle = grad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(0,0,0,0.4)';
            ctx.lineWidth = 0.5;
            ctx.stroke();
            ctx.restore();
            ctx.restore();
        }
      });
    };

    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  useEffect(() => { stateRef.current.visible = visible; }, [visible]);
  useEffect(() => { stateRef.current.hide = hide; }, [hide]);

  return (
    <canvas ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 7, opacity: visible ? 1 : 0, transition: 'opacity 2s ease' }}
    />
  );
};