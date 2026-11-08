import React, { useState, useEffect } from "react";
import { useTheme } from "../../../components/theme/ThemeWrapper"; 
import { useExerciseStore } from "../hooks/useExerciseStore";
import { OpenEndedSidebar } from "./OpenEndedSidebar";
import { OpenEndedWorkspace } from "./OpenEndedWorkspace";
import ErrorBanner from "../../../components/ErrorBanner";

export const OpenEndedArea = ({ 
  activityData, isLoading, isSubmitting, 
  error, clearError,
  onSaveDraft, onSubmit, onExit 
}) => {
  const { isNight } = useTheme(); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [drafts, setDrafts] = useState({}); 

  const [isMinTimePassed, setIsMinTimePassed] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setIsMinTimePassed(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const getUnsureItems = useExerciseStore(state => state.getUnsureItems);
  const toggleUnsure = useExerciseStore(state => state.toggleUnsure);
  const unsureItems = activityData?.id ? getUnsureItems(activityData.id) : new Set();

  useEffect(() => {
    if (activityData?.items) {
      const initialDrafts = {};
      activityData.items.forEach(item => { initialDrafts[item.id] = item.attempt || ""; });
      setDrafts(initialDrafts);
    }
  }, [activityData]);

  if (isLoading || !isMinTimePassed) {
    return (
      <div className="relative flex h-[82vh] w-[95vw] max-w-[1600px] flex-col items-center justify-center bg-transparent mt-12">
        <style>{`
          .book-wrapper { position: relative; width: 100px; height: 70px; perspective: 1000px; }
          .book-cover { position: absolute; inset: -4px; background: #a855f7; border-radius: 4px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
          .book-page { position: absolute; right: 0; width: 50%; height: 100%; background: white; border: 1px solid #e2e8f0; border-radius: 0 4px 4px 0; transform-origin: left center; animation: page-flip 1.2s infinite linear; }
          @keyframes page-flip { 0% { transform: rotateY(0deg); opacity: 1; } 40% { opacity: 1; } 50% { transform: rotateY(-180deg); opacity: 0; } 100% { transform: rotateY(-180deg); opacity: 0; } }
        `}</style>
        <div className="book-wrapper">
          <div className="book-cover" />
          {[1,2,3].map(i => <div key={i} className="book-page" style={{animationDelay: `${(i-1)*0.4}s`}} />)}
        </div>
        <h3 className={`mt-8 text-xl font-black animate-pulse ${isNight ? 'text-white' : 'text-gray-800'}`}>ĐANG TRẢI TRANG GIẤY...</h3>
      </div>
    );
  }

  if (!activityData || !activityData.items || activityData.items.length === 0) return null;
  const items = activityData.items;
  const currentItem = items[currentIndex];

  return (
    <div className="relative flex h-[82vh] w-[95vw] max-w-[1600px] gap-8 mt-12 overflow-hidden bg-transparent">
      
      {/* FLOATING ERROR BANNER — nổi trên đầu, không đẩy layout */}
      {error && (
        <div className="absolute top-4 left-1/2 z-[200] w-full max-w-lg -translate-x-1/2 px-4 animate-in slide-in-from-top-4 fade-in duration-300">
          <ErrorBanner error={error} onDismiss={clearError} />
        </div>
      )}

      {isSubmitting && (
        <div className={`absolute inset-0 z-[100] flex flex-col items-center justify-center rounded-[2.5rem] backdrop-blur-md ${isNight ? 'bg-black/60' : 'bg-white/60'}`}>
          <span className="text-6xl animate-bounce mb-4">🦉</span>
          <h3 className="text-2xl font-black text-[#4ecdc4]">ĐANG CHẤM BÀI...</h3>
        </div>
      )}

      <OpenEndedSidebar items={items} currentIndex={currentIndex} drafts={drafts} unsureItems={unsureItems} onSelect={setCurrentIndex} onExit={onExit} />
      
      <OpenEndedWorkspace 
        currentItem={currentItem} currentIndex={currentIndex} totalItems={items.length} 
        draftValue={drafts[currentItem.id] || ""} isSubmitted={activityData.is_submitted} isUnsure={unsureItems.has(currentItem.id)} 
        onChange={(id, val) => setDrafts(p => ({...p, [id]: val}))} 
        onBlur={(id) => { if (!activityData.is_submitted && onSaveDraft) onSaveDraft(id, drafts[id]); }} 
        onToggleUnsure={(id) => { if (activityData?.id) toggleUnsure(activityData.id, id); }} 
        onPrev={() => currentIndex > 0 && setCurrentIndex(p => p - 1)} 
        onNext={() => currentIndex < items.length - 1 && setCurrentIndex(p => p + 1)} 
        onSubmit={onSubmit} 
      />
    </div>
  );
};