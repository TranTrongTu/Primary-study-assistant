import React from "react";
import { Link } from "react-router-dom";
import { CreateNotebookCard } from "./CreateNotebookCard";
import { RecentNotebooksCard } from "./RecentNotebooksCard";
import { StreakCard } from "./StreakCard";
import { useInteractions } from "../../../interactions/hooks/useInteractions";
import { useCurrentUser } from "../../../auth/hooks/useCurrentUser";
import { useTheme } from "../../../../components/theme/ThemeWrapper";

export const NotebookHeader = () => {
  const { isNight } = useTheme();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const {
    interactions,
    isLoading,
    formData,
    handleFormChange,
    createInteraction,
    updateInteraction,
    deleteInteraction,
  } = useInteractions();

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    await createInteraction({
      name: formData.name.trim(),
      description: formData.description.trim() || "...",
    });
  };

  // ĐÃ SỬA: Đổi giao diện ban ngày sang kính mờ (Glassmorphism) đồng bộ với Sidebar phải
  const cardCls = isNight
    ? "bg-slate-900/90 border-white/[0.1] shadow-2xl"
    : "bg-white/60 border-white/60 backdrop-blur-xl shadow-[0_8px_30px_-4px_rgba(0,0,0,0.08)]";

  const currentStreak = currentUser?.login_streak ?? 0;
  const longestStreak = currentUser?.longest_login_streak ?? 0;

  return (
    <div className="relative flex flex-col gap-4 h-[90vh] overflow-hidden pr-2 pb-4 pt-10">
      <Link
        to="/dashboard"
        className={`
          fixed left-8 top-5
          text-3xl md:text-4xl font-black tracking-tight
          transition-all duration-300 ease-out
          hover:scale-105
          active:scale-95
          cursor-pointer
          select-none
          ${
            isNight
              ? "hover:drop-shadow-[0_0_20px_rgba(255,255,255,0.35)]"
              : "hover:drop-shadow-[0_0_20px_rgba(37,99,235,0.35)]"
          }
        `}
      >
        <span className="text-meteor">EduSpark.AI</span>
      </Link>

      {/* ROW 1: Chuỗi học tập + Tạo sổ */}
      <div className="flex gap-4 shrink-0 items-stretch">
        <div className="flex-[0.95] min-w-[280px] h-[200px]">
          <StreakCard
            currentStreak={currentStreak}
            longestStreak={longestStreak}
            isLoading={isUserLoading}
          />
        </div>

        <div
          className={`flex-[2] h-[200px] rounded-[2rem] px-6 py-5 border-2 transition-all ${cardCls}`}
        >
          <CreateNotebookCard
            formData={formData}
            onChange={handleFormChange}
            onSubmit={handleCreateSubmit}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* ROW 2: Sổ gần đây */}
      <div className="flex-1 min-h-0">
        <RecentNotebooksCard
          interactions={interactions}
          isLoading={isLoading}
          onEdit={updateInteraction}
          onDelete={deleteInteraction}
        />
      </div>
    </div>
  );
};