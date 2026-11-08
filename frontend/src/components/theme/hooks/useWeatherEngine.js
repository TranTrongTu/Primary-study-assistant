// src/components/theme/hooks/useWeatherEngine.js
import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════════
   HÀM TẠO SẤM SÉT (Procedural Lightning)
═══════════════════════════════════════════════════════════════════ */
const genVerticalBolt = () => {
  const startX = 15 + Math.random() * 70; 
  let x = startX * 10; let y = -20; let d = `M ${x} ${y}`;
  const steps = 9 + Math.floor(Math.random() * 6);
  const branches = [];
  for (let i = 0; i < steps; i++) {
    x += (Math.random() - 0.46) * 110; y += 520 / steps + Math.random() * 25; d += ` L ${x} ${y}`;
    if (Math.random() < 0.38 && i > 1 && i < steps - 1) {
      let bx = x, by = y; let bp = `M ${bx} ${by}`;
      const bl = 2 + Math.floor(Math.random() * 3);
      for (let j = 0; j < bl; j++) {
        bx += (Math.random() - 0.46) * 80; by += 55 + Math.random() * 30; bp += ` L ${bx} ${by}`;
      }
      branches.push(bp);
    }
  }
  return { type: "vertical", path: d, branches, startX };
};

const genHorizontalBolt = () => {
  const startY = 5 + Math.random() * 25; 
  let x = Math.random() < 0.5 ? -50 : 1050; 
  const dir = x < 0 ? 1 : -1;
  const drift =  (Math.random() - 0.5) * 2; 
  let y = startY * 5; let d = `M ${x} ${y}`;
  const steps = 7 + Math.floor(Math.random() * 5);
  const branches = [];
  for (let i = 0; i < steps; i++) {
    x += dir * (80 + Math.random() * 60); y += drift * 30 + (Math.random() - 0.5) * 55; d += ` L ${x} ${y}`;
    if (Math.random() < 0.3 && i > 1) {
      let bx = x, by = y; let bp = `M ${bx} ${by}`;
      bx += dir * (40 + Math.random() * 40); by += (Math.random() - 0.4) * 60; bp += ` L ${bx} ${by}`;
      branches.push(bp);
    }
  }
  return { type: "horizontal", path: d, branches, startX: 50 };
};

/* ═══════════════════════════════════════════════════════════════════
   CUSTOM HOOK CHÍNH: useWeatherEngine
═══════════════════════════════════════════════════════════════════ */
export const useWeatherEngine = (isNight) => {
  const [weather, setWeather] = useState("clear");
  const [rainbowPhase, setRainbowPhase] = useState("hidden");
  const [stormApproaching, setStormApproaching] = useState(false);
  const [lightningBolts, setLightningBolts] = useState([]);
  const [shootingStar, setShootingStar] = useState(null);

  const weatherLoopRef = useRef(null);
  const lightningRef = useRef(null);
  const shootingStarRef = useRef(null);

  const isNightRef = useRef(isNight);
  useEffect(() => { isNightRef.current = isNight; }, [isNight]);

  /* ── Chu kỳ thời tiết chính ── */
  const scheduleNextCycle = useCallback((delayMs) => {
    weatherLoopRef.current = setTimeout(() => {
      if (Math.random() > 0.85) { scheduleNextCycle(25000); return; }

      setStormApproaching(true);           
      setTimeout(() => { setWeather("raining"); setStormApproaching(false); }, 4000);     

      const rainDur = 10000 + Math.random() * 7000;    

      weatherLoopRef.current = setTimeout(() => {
        setWeather("stopping"); 
        setTimeout(() => {
          setWeather("clear"); 
          if (!isNightRef.current) {
            setRainbowPhase("in");
            setTimeout(() => setRainbowPhase("visible"), 2600);
            setTimeout(() => setRainbowPhase("out"), 9000);
            setTimeout(() => setRainbowPhase("hidden"), 11500);
          }
          setTimeout(() => {
            setWeather("mist");
            setTimeout(() => { setWeather("clear"); scheduleNextCycle(30000); }, 7000);
          }, 1000);
        }, 4500); 
      }, rainDur);
    }, delayMs);
  }, []);

  useEffect(() => {
    scheduleNextCycle(25000); 
    return () => clearTimeout(weatherLoopRef.current);
  }, [scheduleNextCycle]);

  /* ── Chu kỳ Sấm Sét ban đêm ── */
  useEffect(() => {
    if (!isNight || (weather !== "raining" && weather !== "stopping")) {
      setLightningBolts([]); clearTimeout(lightningRef.current); return;
    }
    const strikeOnce = () => {
      const count = Math.random() < 0.35 ? 2 : (Math.random() < 0.15 ? 3 : 1);
      const bolts = Array.from({ length: count }, (_, i) => {
        const isHoriz = Math.random() < 0.22; 
        const base = isHoriz ? genHorizontalBolt() : genVerticalBolt();
        return { ...base, intensity: 0.5 + Math.random() * 0.5, delay: i * (80 + Math.random() * 120) };
      });
      setLightningBolts(bolts);

      const onDur = 150 + Math.random() * 200; const offGap = 60 + Math.random() * 80; const on2Dur = 100 + Math.random() * 150;
      setTimeout(() => {
        setLightningBolts([]); 
        if (Math.random() < 0.5) {
          setTimeout(() => {
            setLightningBolts(bolts.map(b => ({ ...b, intensity: b.intensity * 0.6 })));
            setTimeout(() => setLightningBolts([]), on2Dur);
          }, offGap);
        }
      }, onDur);
    };

    const scheduleStrike = () => {
      const gap = Math.random() < 0.2 ? 800 + Math.random() * 1200 : 3000 + Math.random() * 4500; 
      lightningRef.current = setTimeout(() => { strikeOnce(); scheduleStrike(); }, gap);
    };
    lightningRef.current = setTimeout(scheduleStrike, 1500 + Math.random() * 2000);
    return () => clearTimeout(lightningRef.current);
  }, [isNight, weather]);

  /* ── Chu kỳ Sao Băng ban đêm (Đã fix lỗi timer) ── */
  useEffect(() => {
    clearTimeout(shootingStarRef.current);

    const isBadWeather = weather === "raining" || weather === "stopping" || stormApproaching;
    
    // Nếu trời sáng hoặc thời tiết xấu -> Không có sao băng
    if (!isNight || isBadWeather) {
      setShootingStar(null);
      return;
    }

    const spawnStar = () => {
      setShootingStar({
        id: Date.now(),
        x: 50 + Math.random() * 40, // Góc trên bên phải
        y: Math.random() * 20,
        angle: 155 + Math.random() * 15, // Bay xéo xuống
        speed: 1.2 + Math.random() * 0.8, // Tốc độ bay
      });

      setTimeout(() => setShootingStar(null), 3000); // Xóa sau khi bay xong
      shootingStarRef.current = setTimeout(spawnStar, 15000 + Math.random() * 10000); // 15-25s có 1 ngôi
    };

    shootingStarRef.current = setTimeout(spawnStar, 5000 + Math.random() * 5000);
    return () => clearTimeout(shootingStarRef.current);
  }, [isNight, weather, stormApproaching]);

  const isRaining  = weather === "raining" || weather === "stopping";
  const isStopping = weather === "stopping";
  const showFog    = !isNight && (weather === "mist");
  const cloudDark  = isRaining || stormApproaching;

  return {
    weather, rainbowPhase, lightningBolts, shootingStar,
    isRaining, isStopping, showFog, cloudDark
  };
};