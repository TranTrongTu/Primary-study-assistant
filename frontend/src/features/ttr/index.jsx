import React, { useState } from "react";
import { useTTRGame } from "./hooks/useTTRGame";
import { TTRMapTracker } from "./components/TTRMapTracker";
import { TTRCard } from "./components/TTRCard";
import { MagicCursor } from "./components/MagicCursor";
import { TTRActionModal } from "./components/TTRActionModal"; // <-- Nhúng Modal vào đây

export const TTRFeature = ({ activityId, isNew, initialMode, onClose }) => {
  // Nếu là bài mới thì vô làm luôn ('play'). Nếu bài cũ thì đợi chọn chế độ (null)
  const [mode, setMode] = useState(isNew ? initialMode : null);

  // NẾU CHƯA CHỌN CHẾ ĐỘ -> HIỆN BẢNG MENU HỎI
  if (!mode) {
    return (
      <TTRActionModal isOpen={true} onClose={onClose} onSelectMode={setMode} />
    );
  }

  // NẾU ĐÃ CHỌN XONG -> HIỆN GAME
  return <TTRGameCore activityId={activityId} mode={mode} onClose={onClose} />;
};

// Tách Game ra một component con để đảm bảo hook useTTRGame chỉ chạy khi đã có mode
const TTRGameCore = ({ activityId, mode, onClose }) => {
  const game = useTTRGame(activityId || 1, onClose, mode);

  if (game.isLoading)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md text-white text-2xl font-bold">
        Đang tải trò chơi...
      </div>
    );
  if (game.error)
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md text-red-400 text-2xl font-bold">
        {game.error}
      </div>
    );

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="grid w-full max-w-[96rem] grid-cols-1 gap-6 xl:grid-cols-[clamp(180px,18vw,220px)_minmax(0,1fr)_clamp(180px,18vw,220px)] xl:items-center relative">
        <MagicCursor isActive={game.streak >= 10} />
        <div className="h-[560px] w-full xl:h-[600px]">
          <TTRMapTracker
            currentIndex={game.currentIndex}
            totalQuestions={game.totalQuestions}
            shieldActive={game.shieldActive}
          />
        </div>
        <div className="w-full min-w-0">
          <TTRCard {...game} />
        </div>
        <div className="hidden xl:block pointer-events-none" />
      </div>
    </div>
  );
};
