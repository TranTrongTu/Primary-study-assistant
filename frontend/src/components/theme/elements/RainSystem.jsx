import React, { useEffect, useRef, useState } from "react";

/* ═══════════════════════════════════════════════════════════════════
   CANVAS MƯA THẬT  (mỗi giọt là 1 line riêng)
═══════════════════════════════════════════════════════════════════ */
export const RainCanvas = ({ active, stopping }) => {
  const canvasRef = useRef(null);
  const stateRef  = useRef({ drops: [], raf: null, active, stopping });

  useEffect(() => { stateRef.current.active   = active;   }, [active]);
  useEffect(() => { stateRef.current.stopping = stopping; }, [stopping]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    /* Khởi tạo giọt mưa */
    const POOL = 420; // Số lượng giọt mưa trên màn hình
    const makeDrops = () => Array.from({ length: POOL }, () => newDrop(canvas));
    stateRef.current.drops = makeDrops();

    function newDrop(cv) {
      const speed  = 9 + Math.random() * 14;        // Tốc độ rơi
      const angle  = (Math.PI / 180) * (8 + Math.random() * 6); // Góc xiên của gió (8-14 độ)
      const len    = 18 + Math.random() * 28;       // Độ dài giọt mưa
      const alpha  = 0.25 + Math.random() * 0.45;   // Độ mờ
      const width  = 2.2 + Math.random() * 2;       // Độ dày giọt mưa
      return {
        x: Math.random() * cv.width * 1.3 - cv.width * 0.15,
        y: Math.random() * cv.height,
        speed, angle, len, alpha, width,
        vx: Math.sin(angle) * speed,
        vy: Math.cos(angle) * speed,
      };
    }

    function resetDrop(d, cv) {
      d.x = Math.random() * cv.width * 1.3 - cv.width * 0.15;
      d.y = -d.len * 2;
      d.speed  = 9  + Math.random() * 14;
      d.angle  = (Math.PI / 180) * (8 + Math.random() * 6);
      d.len    = 10 + Math.random() * 18;
      d.alpha  = 0.25 + Math.random() * 0.45;
      d.width  = 0.6  + Math.random() * 0.8;
      d.vx = Math.sin(d.angle) * d.speed;
      d.vy = Math.cos(d.angle) * d.speed;
    }

    let globalAlpha = 0; // fade in/out toàn bộ canvas

    function tick() {
      stateRef.current.raf = requestAnimationFrame(tick);
      const { active, stopping } = stateRef.current;

      // Fade in khi bắt đầu mưa, fade out khi ngớt mưa
      if (active && !stopping) globalAlpha = Math.min(1, globalAlpha + 0.025);
      else globalAlpha = Math.max(0, globalAlpha - (stopping ? 0.006 : 0.05));

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (globalAlpha <= 0.01) return;

      const drops = stateRef.current.drops;
      for (let i = 0; i < drops.length; i++) {
        const d = drops[i];
        d.x += d.vx;
        d.y += d.vy;
        
        // Nếu rơi qua khỏi màn hình thì reset lại trên đỉnh
        if (d.y > canvas.height + 30) resetDrop(d, canvas);

        const endX = d.x - Math.sin(d.angle) * d.len;
        const endY = d.y - Math.cos(d.angle) * d.len;

        // Gradient mỗi giọt: sáng giữa, trong suốt 2 đầu
        const grad = ctx.createLinearGradient(endX, endY, d.x, d.y);
        grad.addColorStop(0,   `rgba(200,220,255,0)`);
        grad.addColorStop(0.4, `rgba(200,220,255,${d.alpha * globalAlpha})`);
        grad.addColorStop(1,   `rgba(180,210,255,0)`);

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(d.x,  d.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth   = d.width;
        ctx.stroke();
      }
    }

    tick();
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SPLASH VŨNG NƯỚC  (xuất hiện dưới chân màn hình khi mưa)
═══════════════════════════════════════════════════════════════════ */
export const PuddleSplashes = ({ active }) => {
  const [splashes, setSplashes] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) { setSplashes([]); return; }
    const spawn = () => {
      setSplashes(prev => {
        const next = [
          ...prev.slice(-14),
          {
            id:   Date.now() + Math.random(),
            x:    8 + Math.random() * 84,     // % từ mép trái
            y:    78 + Math.random() * 16,    // % từ đỉnh (hiện ở vùng dưới cùng)
            size: 6 + Math.random() * 18,
          },
        ];
        return next;
      });
      timerRef.current = setTimeout(spawn, 120 + Math.random() * 200);
    };
    timerRef.current = setTimeout(spawn, 300);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 11 }}>
      {splashes.map(s => (
        <div
          key={s.id}
          className="splash-ring absolute rounded-full border"
          style={{
            left:   `${s.x}%`,
            top:    `${s.y}%`,
            width:  s.size,
            height: s.size * 0.38,
            marginLeft: -s.size / 2,
            borderColor: "rgba(160,200,255,0.55)",
            borderWidth: 1,
          }}
          onAnimationEnd={() =>
            setSplashes(prev => prev.filter(p => p.id !== s.id))
          }
        />
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   PETRICHOR MIST  (hơi đất bốc lên sau mưa)
═══════════════════════════════════════════════════════════════════ */
export const PetrichorMist = ({ active }) => {
  const [puffs, setPuffs] = useState([]);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const spawn = () => {
      setPuffs(prev => [
        ...prev.slice(-8),
        {
          id:    Date.now() + Math.random(),
          x:     5 + Math.random() * 90,
          delay: Math.random() * 0.8,
          scale: 0.7 + Math.random() * 0.8,
        },
      ]);
      timerRef.current = setTimeout(spawn, 400 + Math.random() * 600);
    };
    timerRef.current = setTimeout(spawn, 200);
    return () => clearTimeout(timerRef.current);
  }, [active]);

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 12 }}>
      {puffs.map(p => (
        <div
          key={p.id}
          className="mist-puff absolute rounded-full"
          style={{
            left:             `${p.x}%`,
            bottom:           "18%",
            width:            60 + p.scale * 40,
            height:           20,
            background:       "radial-gradient(ellipse, rgba(200,220,255,0.35) 0%, transparent 70%)",
            animationDelay:   `${p.delay}s`,
            filter:           "blur(8px)",
            transform:        `scaleX(${p.scale})`,
          }}
          onAnimationEnd={() =>
            setPuffs(prev => prev.filter(q => q.id !== p.id))
          }
        />
      ))}
    </div>
  );
};