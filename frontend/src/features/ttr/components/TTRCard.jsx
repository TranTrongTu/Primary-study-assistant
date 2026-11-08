import React, { useState, useEffect, useRef } from 'react';
import { BlankSlot } from './BlankSlot';
import { useTheme } from '../../../components/theme/ThemeWrapper';
import { SmartContent } from "../../../components/SmartContent";
import ErrorBanner from '../../../components/ErrorBanner';

// ====================================================================
// HOOK VẼ SÉT PHÂN NHÁNH TRÊN CANVAS (Giữ nguyên toàn bộ logic vẽ sét)
// ====================================================================
const useLightningCanvas = (canvasRef, active) => {
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width;
    let H = canvas.height;
    let rafId = null;
    let isMounted = true;

    function buildLightningTree(startX, startY, endY, numBranches) {
      const segs = [];
      function buildBolt(x, y, targetY, depth, maxDepth, branchFactor) {
        if (y >= targetY || depth > maxDepth || !isMounted) return;
        const segLen = 18 + Math.random() * 22; 
        const jitter = (Math.random() - 0.5) * 60 * (1 - depth / maxDepth * 0.5);
        const nx = x + jitter;
        const ny = Math.min(y + segLen, targetY);
        segs.push({ x1: x, y1: y, x2: nx, y2: ny, depth: depth });
        buildBolt(nx, ny, targetY, depth + 1, maxDepth, branchFactor);
        if (depth < maxDepth - 1 && Math.random() < branchFactor) {
          const branchTargetY = ny + 40 + Math.random() * 120;
          buildBolt(nx, ny, Math.min(branchTargetY, targetY * 0.95), depth + 2, maxDepth, branchFactor * 0.5);
        }
      }
      buildBolt(startX, startY, endY, 0, 14, 0.38 + numBranches * 0.04);
      return segs;
    }

    function drawSeg(seg, opacity) {
      const alpha = opacity * (1 - seg.depth / 16 * 0.5);
      const w = Math.max(0.5, 3.5 - seg.depth * 0.22);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = w;
      ctx.shadowColor = '#a78bfa';
      ctx.shadowBlur = 12 + (3 - Math.min(seg.depth, 3)) * 6;
      ctx.beginPath();
      ctx.moveTo(seg.x1, seg.y1);
      ctx.lineTo(seg.x2, seg.y2);
      ctx.stroke();
      if (seg.depth < 3) {
        ctx.strokeStyle = 'rgba(167,139,250,0.35)';
        ctx.lineWidth = w * 4;
        ctx.shadowBlur = 0;
        ctx.stroke();
      }
      ctx.restore();
    }

    function doFlash(startX, numBranches, flashEl) {
      if (!isMounted) return;
      W = canvas.width; H = canvas.height;
      const bolt = buildLightningTree(startX, 0, H, numBranches);
      let opacity = 1;
      let drawProgress = 0;

      function drawStep() {
        if (!isMounted) return;
        ctx.clearRect(0, 0, W, H);
        drawProgress++;
        bolt.slice(0, drawProgress).forEach(seg => drawSeg(seg, opacity));
        if (drawProgress < bolt.length) {
          setTimeout(drawStep, 12);
        } else {
          if (flashEl) {
            flashEl.style.background = 'rgba(200,220,255,0.18)';
            setTimeout(() => { if (flashEl) flashEl.style.background = 'rgba(200,220,255,0)'; }, 60);
            setTimeout(() => {
              if (flashEl) flashEl.style.background = 'rgba(200,220,255,0.08)';
              setTimeout(() => { if (flashEl) flashEl.style.background = 'rgba(200,220,255,0)'; }, 40);
            }, 120);
          }
          function fadeOut() {
            if (!isMounted) { ctx.clearRect(0, 0, W, H); return; }
            opacity -= 0.08;
            if (opacity <= 0) { ctx.clearRect(0, 0, W, H); return; }
            ctx.clearRect(0, 0, W, H);
            bolt.forEach(seg => drawSeg(seg, opacity));
            rafId = requestAnimationFrame(fadeOut);
          }
          setTimeout(fadeOut, 200);
        }
      }
      drawStep();
    }

    const strikes = [
      { x: W * 0.5, delay: 0, branches: 5 }, { x: W * 0.2, delay: 800, branches: 3 },
      { x: W * 0.78, delay: 1600, branches: 4 }, { x: W * 0.35, delay: 2900, branches: 3 },
      { x: W * 0.65, delay: 3700, branches: 4 }, { x: W * 0.5, delay: 5200, branches: 6 },
    ];

    const flashEl = canvas.parentElement?.querySelector?.('.screen-flash');
    const timers = strikes.map(s => setTimeout(() => { if (isMounted) doFlash(s.x, s.branches, flashEl); }, s.delay));

    return () => {
      isMounted = false;
      timers.forEach(clearTimeout);
      if (rafId) cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active]);
};

// ====================================================================
// HOOK VẼ VẾT NỨT ĐẤT (Giữ nguyên toàn bộ logic vẽ vết nứt đất)
// ====================================================================
const useCrackCanvas = (canvasRef, active) => {
  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let W = canvas.width;
    let H = canvas.height;

    function drawCrack(x, y, angle, depth, maxDepth) {
      if (depth > maxDepth) return;
      const len = 35 + Math.random() * 40 - depth * 6;
      const nx = x + Math.cos((angle * Math.PI) / 180) * len;
      const ny = y + Math.sin((angle * Math.PI) / 180) * len;
      const alpha = 1 - depth / maxDepth * 0.6;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = 'rgba(120,60,0,0.7)';
      ctx.lineWidth = Math.max(0.5, 3 - depth * 0.5);
      ctx.shadowColor = 'rgba(0,0,0,0.3)';
      ctx.shadowBlur = 3;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.restore();
      if (depth < maxDepth) {
        const spread = 20 + Math.random() * 25;
        drawCrack(nx, ny, angle - spread + Math.random() * 10, depth + 1, maxDepth);
        if (Math.random() > 0.4) drawCrack(nx, ny, angle + spread + Math.random() * 10, depth + 1, maxDepth);
      }
    }

    ctx.clearRect(0, 0, W, H);
    const timer = setTimeout(() => {
      W = canvas.width; H = canvas.height;
      const origins = [ [W * 0.3, H], [W * 0.7, H], [W * 0.5, H * 0.95] ];
      origins.forEach(([ox, oy]) => drawCrack(ox, oy, -80 - Math.random() * 40, 0, 5));
    }, 200);

    return () => {
      clearTimeout(timer);
      ctx.clearRect(0, 0, W, H);
    };
  }, [active]);
};

// ====================================================================
// COMPONENT CHÍNH TTRCARD (Đã đồng bộ hóa ID Option hoàn toàn)
// ====================================================================
export const TTRCard = ({ 
  isLoading, error, onRetry, onExit,
  isCompleted, mode, timeLeft, maxTime, isTimeFrozen, freezeTimeLeft, shields, isFogActive, isGameOver, gameOverReason,
  currentIndex, totalQuestions, currentQuestion, activeBlankId, filledBlanks, wrongBlanks, confirmedBlanks, checkStatus, 
  streak, onSelectWord, onBlankClick, onDropWord, onCheckAnswer, onNextQuestion,
  power5050, powerMagic, shieldActive, eliminatedOptions, handleUse5050, handleUseMagic 
}) => {
  const { isNight } = useTheme();
  const lightningCanvasRef = useRef(null);
  const crackCanvasRef = useRef(null);
  const containerRef = useRef(null);
  const [debrisList, setDebrisList] = useState([]);
  const [glowIntensity, setGlowIntensity] = useState(1);

  const baseStreak = totalQuestions > 0 ? Math.min(totalQuestions, 10) : 10;
  const stepGlowSmall = Math.max(1, Math.round(baseStreak * 0.4)); 
  const stepGlowBig = Math.max(2, Math.round(baseStreak * 0.7));   
  const isWaitingForNext = checkStatus === 'success';
  const isHighStreakSuccess = streak >= stepGlowBig && isWaitingForNext;
  const isIntenseMode = mode === 'speed' || mode === 'survival';
  const nightLightningActive = isHighStreakSuccess && isNight && isIntenseMode;
  const dayQuakeActive = isHighStreakSuccess && !isNight && isIntenseMode;

  // QUẢN LÝ THEO ID: Danh sách các ID của option đã được điền vào chỗ trống
  const usedOptionIds = currentQuestion ? Object.values(filledBlanks) : [];
  const isAllFilled = currentQuestion ? Object.keys(filledBlanks).length === currentQuestion.blanks.length : false;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault(); 
        if (checkStatus !== 'success' && isAllFilled && checkStatus !== 'checking') {
          onCheckAnswer();
        } else if (checkStatus === 'success') {
          onNextQuestion();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [checkStatus, isAllFilled, onCheckAnswer, onNextQuestion]);

  useEffect(() => {
    const resize = () => {
      const el = containerRef.current;
      if (!el) return;
      [lightningCanvasRef, crackCanvasRef].forEach(ref => {
        if (ref.current) {
          ref.current.width  = el.offsetWidth;
          ref.current.height = el.offsetHeight;
        }
      });
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useLightningCanvas(lightningCanvasRef, nightLightningActive);
  useCrackCanvas(crackCanvasRef, dayQuakeActive);

  useEffect(() => {
    if (!dayQuakeActive) { setDebrisList([]); return; }
    const colors = ['#92400e','#b45309','#d97706','#78350f','#fbbf24'];
    let id = 0;
    const interval = setInterval(() => {
      const el = containerRef.current;
      const W = el ? el.offsetWidth : 400;
      const newPiece = {
        id: id++,
        left: 20 + Math.random() * (W - 40),
        size: 3 + Math.random() * 7,
        color: colors[Math.floor(Math.random() * colors.length)],
        dx: (Math.random() - 0.5) * 180,
        dy: -(40 + Math.random() * 120),
        dr: (Math.random() - 0.5) * 360,
        dur: 0.6 + Math.random() * 0.8,
      };
      setDebrisList(prev => [...prev.slice(-18), newPiece]);
    }, 120);
    return () => clearInterval(interval);
  }, [dayQuakeActive]);

  useEffect(() => {
    if (!dayQuakeActive) return;
    let rafId;
    const pulse = () => {
      setGlowIntensity(0.7 + 0.3 * Math.sin(Date.now() / 400));
      rafId = requestAnimationFrame(pulse);
    };
    rafId = requestAnimationFrame(pulse);
    return () => cancelAnimationFrame(rafId);
  }, [dayQuakeActive]);

  // LOADING SCREEN
  if (isLoading) {
    return (
      <main className={`flex w-full min-h-[580px] flex-col items-center justify-center rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl border border-white/20 ${isNight ? 'bg-[#151b23]/90' : 'bg-white/95'}`}>
        <div className="text-6xl animate-spin mb-6">⚙️</div>
        <p className={`text-xl font-black ${isNight ? 'text-gray-300' : 'text-gray-700'}`}>Đang tải bài tập...</p>
      </main>
    );
  }

  // ERROR SCREEN
  if (error) {
    return (
      <main className={`flex w-full min-h-[580px] flex-col items-center justify-center rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl border border-white/20 gap-6 ${isNight ? 'bg-[#151b23]/90' : 'bg-white/95'}`}>
        <div className="w-full max-w-md">
          <ErrorBanner error={error} />
        </div>
        <div className="flex gap-3">
          {onRetry && (
            <button onClick={onRetry} className="px-6 py-3 rounded-2xl font-black bg-purple-600 text-white hover:bg-purple-500 transition-all hover:scale-105 active:scale-95">
              Thử lại
            </button>
          )}
          <button onClick={onExit} className={`px-6 py-3 rounded-2xl font-black border-2 transition-all hover:scale-105 active:scale-95 ${isNight ? 'border-gray-600 text-gray-300 hover:bg-gray-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
            Quay về
          </button>
        </div>
      </main>
    );
  }

  if (!currentQuestion) return null;

  if (isCompleted) {
    const isTier2 = streak >= stepGlowSmall && streak < stepGlowBig; 
    const isTier3 = streak >= stepGlowBig; 
    return (
      <main className={`flex w-full min-h-[580px] flex-col items-center justify-center rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl transition-all duration-700 relative overflow-hidden
        ${!isTier3 && isNight ? 'bg-[#151b23]/95 border-gray-700' : ''} ${!isTier3 && !isNight ? 'bg-white/95 border-gray-200' : ''}
        ${isTier3 ? (isNight ? 'gold-frame-dark shadow-[0_0_100px_rgba(255,215,0,0.5)]' : 'gold-frame-light shadow-[0_0_100px_rgba(255,215,0,0.8)]') : ''}
        ${isTier2 ? (isNight ? 'shadow-[0_0_40px_rgba(168,85,247,0.2)]' : 'shadow-[0_0_40px_rgba(168,85,247,0.3)]') : ''}
      `}>
        <style>
          {`
            .shimmer-text { background: linear-gradient(90deg, #F59E0B 0%, #FEF08A 50%, #F59E0B 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; animation: shimmer 2s linear infinite; }
            @keyframes shimmer { to { background-position: 200% center; } }
            @keyframes supernova-boom { 0% { transform: scale(0.5); opacity: 0; filter: brightness(2); } 60% { transform: scale(1.1); opacity: 1; filter: brightness(1.2); } 100% { transform: scale(1); opacity: 1; filter: brightness(1); } }
            @keyframes liquid-gold { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
            .gold-frame-dark { border: 4px solid transparent; background-image: linear-gradient(#151b23, #151b23), linear-gradient(60deg, #b8860b, #ffd700, #fff8dc, #ffd700, #b8860b); background-origin: border-box; background-clip: padding-box, border-box; background-size: 300% 300%; animation: liquid-gold 3s ease infinite; }
            .gold-frame-light { border: 4px solid transparent; background-image: linear-gradient(#ffffff, #ffffff), linear-gradient(60deg, #b8860b, #ffd700, #fff8dc, #ffd700, #b8860b); background-origin: border-box; background-clip: padding-box, border-box; background-size: 300% 300%; animation: liquid-gold 3s ease infinite; }
            @keyframes diamond-float { 0%, 100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 0.2; } 50% { transform: translateY(-20px) scale(1.5) rotate(45deg); opacity: 1; filter: drop-shadow(0 0 10px #fff); } }
          `}
        </style>
        {isTier3 && (
          <div className="absolute inset-0 z-0 pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="absolute w-2 h-2 bg-white" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`, animation: `diamond-float ${2 + Math.random() * 3}s ease-in-out infinite`, animationDelay: `${Math.random() * 2}s` }} />
            ))}
          </div>
        )}
        <div className={`z-10 flex flex-col items-center ${isTier3 ? 'animate-[supernova-boom_0.6s_ease-out_forwards]' : 'animate-in zoom-in duration-500'}`}>
          <div className={`mb-2 leading-none drop-shadow-2xl ${isTier3 ? 'text-[120px]' : (isTier2 ? 'text-[90px]' : 'text-[70px]')}`}>{isTier3 ? '🏆' : (isTier2 ? '🌟' : '👏')}</div>
          <h2 className={`font-black mb-4 drop-shadow-md text-center ${isTier3 ? 'text-6xl shimmer-text' : (isTier2 ? 'text-5xl text-yellow-500' : `text-4xl ${isNight ? 'text-purple-400' : 'text-purple-600'}`)}`}>{isTier3 ? 'XUẤT SẮC!' : 'CHÚC MỪNG BÉ!'}</h2>
          <p className={`text-xl font-bold mb-8 ${isNight ? 'text-gray-300' : 'text-gray-600'}`}>Đã hoàn thành bài tập</p>
          <div className={`px-8 py-4 rounded-3xl border-2 mb-10 transform hover:scale-105 transition-all ${isTier3 ? (isNight ? 'bg-[#261f0e]/80 border-yellow-500/50 shadow-[0_0_20px_rgba(250,204,21,0.3)]' : 'bg-yellow-50 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.5)]') : (isNight ? 'bg-gray-800/50 border-gray-600' : 'bg-gray-50 border-gray-200')}`}>
            <span className={`text-lg font-bold flex items-center gap-2 ${isTier3 ? 'text-yellow-600' : (isNight ? 'text-gray-300' : 'text-gray-700')}`}>
              <span className="text-3xl animate-pulse">{isTier3 ? '🔥' : '🎯'}</span> Chuỗi đúng: <span className={`text-3xl font-black ml-1 ${isTier3 ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500' : (isNight ? 'text-purple-400' : 'text-purple-600')}`}>{streak}</span> câu
            </span>
          </div>
          <button onClick={onExit} className={`px-10 py-4 font-black text-xl rounded-2xl transition-all shadow-xl hover:scale-110 active:scale-95 border-b-4 ${isTier3 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-orange-700 hover:brightness-110' : (isNight ? 'bg-purple-600 text-white border-purple-800 hover:bg-purple-500' : 'bg-gray-900 text-white border-gray-700 hover:bg-black')}`}>QUAY VỀ BÀI HỌC</button>
        </div>
      </main>
    );
  }

  if (isGameOver) {
    const isTimeUp = gameOverReason === 'time_up';
    return (
      <main className={`flex w-full min-h-[580px] flex-col items-center justify-center rounded-[2.5rem] p-8 backdrop-blur-md shadow-2xl transition-all duration-700 relative overflow-hidden ${isNight ? 'bg-[#2a0808]/95 border-red-900 shadow-[0_0_100px_rgba(220,38,38,0.4)]' : 'bg-red-50/95 border-red-200 shadow-[0_0_100px_rgba(220,38,38,0.6)]'}`}>
        <div className="z-10 flex flex-col items-center animate-in zoom-in duration-500">
          <div className="text-[100px] mb-2 leading-none drop-shadow-2xl animate-bounce">{isTimeUp ? '⏰' : '💔'}</div>
          <h2 className="text-6xl font-black mb-4 drop-shadow-md text-center text-red-500">{isTimeUp ? 'HẾT GIỜ!' : 'TIẾC QUÁ!'}</h2>
          <p className={`text-2xl font-bold mb-8 ${isNight ? 'text-red-200' : 'text-red-800'}`}>Bé dừng chân tại câu số {currentIndex + 1} rồi. Lần sau cố lên nhé!</p>
          <button onClick={onExit} className="px-12 py-5 font-black text-2xl rounded-2xl transition-all shadow-xl hover:scale-110 active:scale-95 border-b-4 bg-red-600 text-white border-red-800 hover:bg-red-500">QUAY VỀ HỌC LIỆU</button>
        </div>
      </main>
    );
  }

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  let glowEffect = '';
  if (isTimeFrozen) glowEffect = isNight ? 'shadow-[0_0_50px_rgba(56,189,248,0.4)] ring-2 ring-sky-400/80' : 'shadow-[0_0_50px_rgba(56,189,248,0.6)] ring-2 ring-sky-400';
  else if (mode === 'survival' && !isFogActive && streak > 0) glowEffect = isNight ? 'shadow-[inset_0_0_80px_rgba(249,115,22,0.15),0_0_50px_rgba(249,115,22,0.4)] ring-2 ring-orange-500/80' : 'shadow-[inset_0_0_80px_rgba(249,115,22,0.2),0_0_50px_rgba(249,115,22,0.5)] ring-2 ring-orange-400';
  else if (streak >= stepGlowBig) glowEffect = isNight ? 'shadow-[0_0_50px_rgba(168,85,247,0.6)] ring-2 ring-purple-400' : 'shadow-[0_0_50px_rgba(250,204,21,0.6)] ring-2 ring-yellow-400';
  else if (streak >= stepGlowSmall) glowEffect = isNight ? 'shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/50' : 'shadow-[0_0_20px_rgba(250,204,21,0.3)] ring-1 ring-yellow-400/50';

  const dayCardGlow = dayQuakeActive ? { boxShadow: `0 0 ${40 * glowIntensity}px rgba(251,191,36,0.9), 0 0 ${80 * glowIntensity}px rgba(251,191,36,0.4)`, transition: 'box-shadow 0.1s' } : {};

  let streakContainerClass = `relative flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 z-10 ${isNight ? 'bg-[#1e293b] text-gray-300' : 'bg-gray-800 text-gray-100'} ${(shieldActive || shields > 0) ? 'shadow-[0_0_15px_rgba(56,189,248,0.6)] ring-2 ring-sky-400' : ''}`;
  let streakColorClass = "text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]";

  if (streak >= stepGlowBig) {
    streakContainerClass = `relative flex items-center gap-1.5 px-5 py-2 rounded-full font-black text-lg transition-all duration-300 z-10 ${isNight ? 'bg-[#2a0a0a] border border-red-500/50' : 'bg-orange-50 border border-orange-400'} shadow-[0_0_30px_rgba(239,68,68,0.8)]`;
    streakColorClass = "streak-fire-text text-xl";
  } else if (streak >= stepGlowSmall) {
    streakContainerClass = `relative flex items-center gap-1.5 px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 z-10 ${isNight ? 'bg-[#170f2e] text-gray-300' : 'bg-cyan-50 text-gray-800'} static-electricity`;
    streakColorClass = "text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]";
  }

  return (
    <main
      ref={containerRef}
      className={`flex w-full min-h-[580px] flex-col items-center rounded-[2.5rem] p-8 backdrop-blur-md transition-all duration-500 border border-white/20 relative overflow-hidden
        ${isNight ? 'bg-[#151b23]/90 shadow-[0_20px_50px_rgba(0,0,0,0.7)]' : 'bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.15)]'}
        ${shieldActive ? '-translate-y-2' : ''} ${glowEffect} ${dayQuakeActive ? 'animate-earthquake' : ''}
      `}
      style={dayCardGlow}
    >
      <style>{`
        @keyframes static-zap { 0%, 100% { box-shadow: 0 0 5px #06b6d4, inset 0 0 5px #06b6d4; border-color: #06b6d4; } 50% { box-shadow: 0 0 20px #8b5cf6, inset 0 0 10px #8b5cf6; border-color: #8b5cf6; } }
        .static-electricity { animation: static-zap 0.3s infinite; }
        @keyframes fire-pulse { 0%, 100% { filter: drop-shadow(0 0 8px #ef4444) drop-shadow(0 0 15px #f97316); transform: scale(1); } 50% { filter: drop-shadow(0 0 15px #ef4444) drop-shadow(0 0 25px #fbbf24); transform: scale(1.1); } }
        .streak-fire-text { background: linear-gradient(to top, #ea580c, #fcd34d); -webkit-background-clip: text; color: transparent; animation: fire-pulse 1s infinite alternate; }
        @keyframes earthquake { 0% { transform: translate(0,0) rotate(0deg) scale(1); } 8% { transform: translate(-3px,2px) rotate(-0.4deg) scale(1.002); } 16% { transform: translate(3px,-1px) rotate(0.5deg) scale(0.999); } 24% { transform: translate(-2px,3px) rotate(-0.3deg) scale(1.003); } 32% { transform: translate(4px,-2px) rotate(0.6deg) scale(1.001); } 40% { transform: translate(-1px,1px) rotate(-0.2deg) scale(1.002); } 48% { transform: translate(3px,2px) rotate(0.4deg) scale(0.998); } 56% { transform: translate(-3px,-1px) rotate(-0.5deg) scale(1.003); } 64% { transform: translate(2px,3px) rotate(0.3deg) scale(1.001); } 72% { transform: translate(-4px,-2px) rotate(-0.6deg) scale(1.002); } 80% { transform: translate(1px,1px) rotate(0.2deg) scale(0.999); } 100% { transform: translate(0,0) rotate(0deg) scale(1); } }
        .animate-earthquake { animation: earthquake 0.32s infinite; }
        @keyframes debris-fly { 0% { transform: translate(0,0) rotate(0deg); opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) rotate(var(--dr)); opacity: 0; } }
        .screen-flash { position: absolute; inset: 0; background: rgba(200,220,255,0); border-radius: 2.5rem; z-index: 20; pointer-events: none; transition: background 0.05s; }
        @keyframes meteor { 0% { transform: rotate(-45deg) translateX(0); opacity: 0; } 5% { opacity: 1; } 100% { transform: rotate(-45deg) translateX(-700px); opacity: 0; } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-spin-slow { animation: spin-slow 6s linear infinite; }
        @keyframes panic-shake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-2deg); } 75% { transform: rotate(2deg); } }
        .animate-panic { animation: panic-shake 0.3s ease-in-out infinite; }
        @keyframes vanish { 0% { opacity: 1; transform: scale(1); filter: blur(0); } 100% { opacity: 0; transform: scale(0); filter: blur(5px); display: none; } }
        .animate-vanish { animation: vanish 0.5s ease-out forwards; pointer-events: none; }
      `}</style>

      {/* CÁC CANVAS MÔI TRƯỜNG */}
      <canvas ref={lightningCanvasRef} className="absolute inset-0 z-[5] pointer-events-none" style={{ borderRadius: '2.5rem', display: nightLightningActive ? 'block' : 'none' }} />
      <div className="screen-flash" style={{ display: nightLightningActive ? 'block' : 'none' }} />
      
      <canvas ref={crackCanvasRef} className="absolute inset-0 z-[6] pointer-events-none" style={{ borderRadius: '2.5rem', display: dayQuakeActive ? 'block' : 'none' }} />
      {debrisList.map(d => (
        <div key={d.id} className="absolute pointer-events-none z-[7]" style={{ bottom: '30px', left: `${d.left}px`, width: `${d.size}px`, height: `${d.size*0.6}px`, borderRadius: '2px', background: d.color, '--dx': `${d.dx}px`, '--dy': `${d.dy}px`, '--dr': `${d.dr}deg`, animation: `debris-fly ${d.dur}s ease-out forwards` }} />
      ))}

      {/* SAO BĂNG KHI STREAK CAO NHƯNG CHƯA TRẢ LỜI ĐÚNG */}
      {streak >= stepGlowBig && !isHighStreakSuccess && (
        <div className="absolute inset-0 pointer-events-none z-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="absolute pointer-events-none" style={{ top: ['0%', '-20%', '30%'][i], left: ['80%', '50%', '110%'][i], width: [200, 150, 300][i] + 'px', height: '2px', background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)', boxShadow: '0 0 10px 2px rgba(255,255,255,0.4)', transform: 'rotate(-45deg)', animation: `meteor 2s linear infinite`, animationDelay: `${i * 0.7}s` }} />
          ))}
          <div className="absolute pointer-events-none" style={{ top: '10%', left: '100%', width: '200px', height: '2px', background: isNight ? 'linear-gradient(90deg, rgba(168,85,247,0), rgba(168,85,247,1))' : 'linear-gradient(90deg, rgba(168,85,247,0), rgba(168,85,247,0.5))', transform: 'rotate(-45deg)', animation: 'meteor 2s linear infinite', animationDelay: '1.5s' }} />
        </div>
      )}

      {/* HEADER CARD */}
      <div className="relative z-10 flex w-full items-center justify-between mb-8 px-2 gap-4">
        <button onClick={onExit} className="w-10 h-10 rounded-[14px] border border-gray-300 hover:text-red-500">✕</button>

        {mode === 'speed' ? (
          <div className="flex-1 h-6 rounded-full relative overflow-hidden shadow-inner flex items-center justify-center bg-gray-200 border border-gray-300">
            <div className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${isTimeFrozen ? 'bg-blue-400' : 'bg-orange-500'}`} style={{ width: `${Math.min((timeLeft / (maxTime || 1)) * 100, 100)}%` }} />
            <span className="relative z-10 text-[12px] font-black text-white">
              {isTimeFrozen ? `❄️ ĐÓNG BĂNG (${freezeTimeLeft}s)` : `⏳ ${timeLeft}s`}
            </span>
          </div>
        ) : (
          <div className="flex-1 h-5 rounded-full relative overflow-hidden bg-gray-200">
            <div className="absolute top-0 left-0 h-full bg-[#1de9b6]" style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }} />
          </div>
        )}

        <div className="flex items-center gap-1.5 px-4 py-2 rounded-full font-bold bg-gray-800 text-gray-100">
          🔥 x{streak}
        </div>
      </div>

      {/* TEXT & SƯƠNG MÙ */}
      <div className={`relative z-10 w-full mt-2 mb-10 px-8 text-center text-[1.4rem] font-medium leading-[4rem] tracking-wide ${isNight ? 'text-gray-100' : 'text-gray-900'}`}>
        {currentQuestion.textChunks.map((chunk, idx) => {
          const blankId = currentQuestion.blanks[idx]?.id;
          const assignedOptionId = filledBlanks[blankId];
          
          // CẢI TIẾN: Tìm ngược text từ Object Option bằng ID
          const assignedOption = currentQuestion.options.find(o => o.id === assignedOptionId);
          const filledWord = assignedOption ? assignedOption.text : (typeof assignedOptionId === 'string' && !assignedOptionId.startsWith('opt-') ? assignedOptionId : null);

          return (
            <React.Fragment key={`chunk-${idx}`}>
              <span className={`transition-all duration-300 inline-block ${isFogActive ? 'blur-[6px] opacity-60 hover:blur-none hover:opacity-100 cursor-help grayscale hover:grayscale-0' : ''}`}>
                <SmartContent inline className="text-[1.4rem]">
                  {chunk}
                </SmartContent>
              </span>
              {idx < currentQuestion.blanks.length && (
                <BlankSlot
                  isActive={activeBlankId === blankId} 
                  filledWord={filledWord}
                  isWrong={wrongBlanks.includes(blankId)} 
                  isSuccess={checkStatus === 'success' || confirmedBlanks.includes(blankId)}
                  onClick={() => onBlankClick(blankId)} 
                  onDropWord={(optionId) => onDropWord(optionId, blankId)}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <hr className={`relative z-10 w-full border-t mb-6 ${isNight ? 'border-gray-600/50' : 'border-gray-200'}`} />

      {/* OPTIONS */}
      <div className="relative z-10 flex w-full flex-wrap justify-center gap-4 mb-4 px-4 min-h-[60px]">
        {currentQuestion.options.map((option, idx) => {
          // CẢI TIẾN: Kiểm tra xem ID cụ thể của nút này đã nằm trong ô trống nào chưa
          const isUsed       = usedOptionIds.includes(option.id);
          const isEliminated = eliminatedOptions && eliminatedOptions.includes(option.id);
          const isDisabled   = isUsed || checkStatus === 'success' || isEliminated;
          const isPanic      = mode === 'speed' && timeLeft <= 10 && !isTimeFrozen;
          return (
            <button key={idx} onClick={() => onSelectWord(option.id)} draggable={!isDisabled && !isEliminated}
              onDragStart={(e) => { e.dataTransfer.setData('text/plain', option.id); e.target.style.opacity = '0.5'; }}
              onDragEnd={(e) => { e.target.style.opacity = '1'; }} disabled={isDisabled || isEliminated}
              className={`px-6 py-3 text-lg font-bold rounded-xl transition-all border-2
                ${isEliminated ? 'animate-vanish' : ''} ${isPanic && !isDisabled ? 'animate-panic' : ''}
                ${isDisabled && !isEliminated
                  ? (isNight ? 'border-dashed border-gray-600 bg-transparent text-gray-600 cursor-not-allowed opacity-50' : 'border-dashed border-gray-300 bg-transparent text-gray-400 cursor-not-allowed opacity-50')
                  : (!isEliminated && (isNight ? 'bg-gray-800 border-gray-500 text-gray-200 hover:bg-gray-700 hover:-translate-y-1 hover:border-purple-400 shadow-md cursor-grab active:cursor-grabbing' : 'bg-white border-gray-200 text-purple-700 hover:bg-purple-50 hover:-translate-y-1 hover:border-purple-500 shadow-md cursor-grab active:cursor-grabbing'))
                }
              `}
            >
              <SmartContent inline className="text-inherit font-bold pointer-events-none">
                {option.text}
              </SmartContent>
            </button>
          );
        })}
      </div>

      {/* TOOLBAR */}
      <div className="relative z-10 w-full flex items-end justify-between mt-auto pt-4 pb-2">
        <div className="flex gap-3">
          <button onClick={handleUse5050} disabled={!power5050 || checkStatus === 'success'} title="Loại bỏ một nửa đáp án sai"
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl border-2 font-black text-xl transition-all ${
              power5050 > 0 && checkStatus !== 'success'
                ? 'bg-blue-500/20 border-blue-400 text-blue-400 hover:bg-blue-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(59,130,246,0.4)] cursor-pointer'
                : (isNight ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50')
            }`}>
            ✂️
            {power5050 > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{power5050}</span>}
          </button>
          <button onClick={handleUseMagic} disabled={!powerMagic || checkStatus === 'success'} title="Tự động điền 1 đáp án đúng"
            className={`relative flex items-center justify-center w-14 h-14 rounded-2xl border-2 font-black text-xl transition-all ${
              powerMagic > 0 && checkStatus !== 'success'
                ? 'bg-fuchsia-500/20 border-fuchsia-400 text-fuchsia-400 hover:bg-fuchsia-500/30 hover:scale-110 hover:shadow-[0_0_15px_rgba(217,70,239,0.4)] cursor-pointer'
                : (isNight ? 'bg-gray-800 border-gray-700 text-gray-600 cursor-not-allowed opacity-50' : 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50')
            }`}>
            🔮
            {powerMagic > 0 && <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">{powerMagic}</span>}
          </button>
        </div>

        <div className="flex-1 flex justify-center pl-8">
          {checkStatus !== 'success' ? (
            <button onClick={onCheckAnswer} disabled={!isAllFilled || checkStatus === 'checking'}
              className={`w-[80%] max-w-[280px] py-4 rounded-2xl text-xl font-extrabold transition-all duration-300 border-2 ${
                isAllFilled ? 'bg-purple-600 border-purple-500 text-white hover:bg-purple-500 hover:scale-105 active:scale-95 shadow-[0_8px_20px_rgba(147,51,234,0.4)]' : 'bg-gray-100/10 border-gray-600/30 text-gray-500 cursor-not-allowed shadow-none'
              }`}>Kiểm tra (Enter)</button>
          ) : (
            <button onClick={onNextQuestion}
              className="w-[80%] max-w-[280px] py-4 rounded-2xl text-xl font-extrabold text-white transition-all duration-300 bg-[#1de9b6] hover:bg-[#15c39a] hover:scale-105 active:scale-95 border-2 border-teal-400 shadow-[0_8px_30px_rgba(29,233,182,0.5)] animate-in slide-in-from-bottom-4">
              Tiếp tục ➔ (Enter)
            </button>
          )}
        </div>
        <div className="w-[124px] hidden sm:block pointer-events-none" />
      </div>
    </main>
  );
};