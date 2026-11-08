import React, { useEffect, useRef } from 'react';
import { useTheme } from '../../../components/theme/ThemeWrapper'; 

import bgMapDay from '../../../assets/background/background_day.png';
import bgMapNight from '../../../assets/background/background_night.png';
const CHILD_AVATAR = "👦"; 

export const TTRMapTracker = ({ currentIndex, totalQuestions, shieldActive }) => {
  const { isNight } = useTheme();
  const scrollRef = useRef(null);
  const nodes = Array.from({ length: totalQuestions }, (_, i) => i);

  useEffect(() => {
    if (scrollRef.current) {
      const activeNode = scrollRef.current.querySelector('.is-active-node');
      if (activeNode) activeNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentIndex]);

  const getPathData = (index, isRight, totalQuestions) => {
    if (index >= totalQuestions - 1) return null;
    const startX = isRight ? 60 : 40; 
    const endX = isRight ? 40 : 60;   
    const startY = 0;
    const endY = 100; 
    const pathType = index % 4; 
    if (pathType === 0) {
      return `M ${startX} ${startY} Q ${isRight ? 100 : 0} 50 ${endX} ${endY}`;
    } else if (pathType === 1) {
      return `M ${startX} ${startY} C ${isRight ? 90 : 10} 30 ${isRight ? 10 : 90} 70 ${endX} ${endY}`;
    } else if (pathType === 2) {
      return `M ${startX} ${startY} Q 50 50 ${endX} ${endY}`;
    } else {
      return `M ${startX} ${startY} C ${isRight ? 70 : 30} 20 ${isRight ? 30 : 70} 80 ${endX} ${endY}`;
    }
  };

  return (
    <aside className={`flex w-full h-full flex-col rounded-[2.5rem] p-5 backdrop-blur-md shadow-2xl transition-colors duration-500 border relative overflow-hidden ${
      isNight ? "bg-gray-900/70 border-gray-700/50" : "bg-white/90 border-gray-200/80"
    }`}>
      <style>{`
        @keyframes avatar-drop {
          0% { transform: translateX(-50%) translateY(-80px) scale(0.5); opacity: 0; filter: blur(4px); }
          50% { transform: translateX(-50%) translateY(-20px) scale(1.4); opacity: 1; filter: blur(0px); }
          80% { transform: translateX(-50%) translateY(5px) scale(0.9); }
          100% { transform: translateX(-50%) translateY(0) scale(1); }
        }
        .animate-avatar { animation: avatar-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .path-draw { transition: stroke-dashoffset 0.8s ease-in-out; }
      `}</style>

      <div 
        className="absolute inset-0 z-1 pointer-events-none transition-all duration-700 ease-in-out" 
        style={{
          backgroundImage: `url(${isNight ? bgMapNight : bgMapDay})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isNight ? 0.35 : 0.4 
        }} 
      />
      
      <header className="relative z-20 mb-2 text-center shrink-0 border-b pb-4 border-gray-500/20 bg-transparent">
        <h2 className={`text-base font-extrabold uppercase tracking-widest ${isNight ? 'text-gray-100' : 'text-purple-700'}`}>Hành trình</h2>
      </header>

      <div ref={scrollRef} className="relative z-10 flex flex-1 flex-col items-center pt-[80px] pb-[150px] overflow-y-auto hide-scrollbar scroll-smooth">
        <div className="flex flex-col space-y-8 w-full items-center relative">
          {nodes.map((node, index) => {
            const isSolved = index < currentIndex;
            const isActive = index === currentIndex;
            const isRight = index % 2 === 0;
            const translateClass = isRight ? "translate-x-5" : "-translate-x-5";
            
            let nodeClass = `relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-[3px] font-bold transition-all duration-300 shadow-sm ${
              isNight ? 'border-gray-600 bg-gray-800 text-gray-400' : 'border-gray-300 bg-white text-gray-500'
            }`;

            if (isSolved) nodeClass = `relative z-20 flex h-10 w-10 items-center justify-center rounded-full border-[3px] font-bold shadow-md bg-[#1de9b6] border-teal-200 text-teal-950`;
            if (isActive) nodeClass = `relative z-20 flex h-14 w-14 items-center justify-center rounded-full border-4 font-black shadow-[0_0_20px_rgba(168,85,247,0.6)] scale-110 bg-purple-600 border-white text-white is-active-node`;

            const pathData = getPathData(index, isRight, totalQuestions);

            return (
              <div key={node} className={`relative flex items-center justify-center w-full h-12`}>
                {pathData && (
                  <svg className="absolute top-1/2 left-0 w-full h-[8rem] pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d={pathData} stroke={isNight ? "#4b5563" : "#cbd5e1"} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="8 8" />
                    <path d={pathData} stroke="#1de9b6" strokeWidth="6" fill="none" strokeLinecap="round" pathLength="100" strokeDasharray="100" strokeDashoffset={isSolved ? "0" : "100"} className="path-draw" style={{ filter: isSolved ? 'drop-shadow(0 0 6px rgba(29,233,182,0.6))' : 'none' }} />
                  </svg>
                )}
                <div className={`relative ${translateClass} z-10`}>
                  {isActive && <div className="absolute inset-0 rounded-full border-4 border-purple-400 animate-ping opacity-40 z-0"></div>}
                  <div className={nodeClass}>
                    {isSolved ? "✓" : (index + 1)}
                    {isActive && (
                      <div className="absolute -top-[3.2rem] left-1/2 animate-avatar text-[2.8rem] drop-shadow-xl z-50 flex justify-center">
                        {CHILD_AVATAR}
                        {shieldActive && <span className="absolute -top-4 text-2xl animate-bounce">👑</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};