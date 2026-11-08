// import React from "react";

// import { NotebookHeader } from "../features/home/components/NotebookHeader";
import { ChartHolder } from "../features/home/components/ChartHolder";
import { listOfCharts } from "../features/home/utils/listOfCharts";
// import { ThemeWrapper, useTheme } from "../components/theme/ThemeWrapper";
// import { UserProfileCard } from "../features/home/components/LeftBlock/UserProfileCard";

// const HomeContent = () => {
//   const { isNight } = useTheme();

//   // Thêm backdrop-blur-xl và giảm bg xuống 60% để mờ ảo
//   const sidebarCardCls = isNight
//     ? "bg-slate-900/60 border-white/[0.08] backdrop-blur-xl"
//     : "bg-white/60 border-white/60 backdrop-blur-xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)]";

//   return (
//     <div className="flex flex-col h-full w-full overflow-hidden">
//       <div className="flex flex-1 overflow-hidden gap-8 pl-8 lg:pl-12 pr-4 lg:pr-6 pt-24 pb-5 w-full">

//         {/* CỘT TRÁI: Nội dung chính */}
//         <div className="w-[80%] flex-1 overflow-hidden min-w-[600px]">
//           <NotebookHeader />
//         </div>

//         {/* CỘT PHẢI: Sidebar Profile & Charts */}
//         <aside className="w-[20%] shrink-0 flex flex-col gap-5 overflow-y-auto custom-scrollbar pb-6 pr-2">

//           {/* ĐÃ TÁCH FILE: Gọi Component UserProfileCard vào đây */}
//           <UserProfileCard name="Minh" />

//           <ChartHolder listOfCharts={listOfCharts} sidebarCardCls={sidebarCardCls} isNight={isNight} />

//         </aside>
//       </div>

//     </div>
//   );
// };

// export const HomePage = () => (
//   <ThemeWrapper showToggle={true}>
//     <HomeContent />
//   </ThemeWrapper>
// );

import React from "react";
import { ThemeWrapper, useTheme } from "../components/theme/ThemeWrapper";
import { NotebookHeader } from "../features/home/components/LeftBlock/NotebookHeader";
import { UserProfileCard } from "../features/home/components/LeftBlock/UserProfileCard";
import { ProfileSettingsModal } from "../features/home/components/ProfileSettingsModal";
import { useProfileSettings } from "../features/home/hooks/useProfileSettings";
import { GearSix } from "@phosphor-icons/react";
import { FirstLoginDescriptionModal } from "../features/home/components/FirstLoginDescriptionModal";
import { useFirstLoginDescriptionPrompt } from "../features/home/hooks/useFirstLoginDescriptionPrompt";
import { getSidebarCardClasses } from "../features/home/utils/dropdownColor";
import EvaluationBot from "../features/home/components/EvaluationBot";

const HomeContent = () => {
  const { isNight } = useTheme();

  // Thêm backdrop-blur-xl và giảm bg xuống 60% để mờ ảo
  const sidebarCardCls = getSidebarCardClasses(isNight);

  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex flex-1 overflow-hidden gap-8 px-8 lg:px-12 pt-24 pb-8 w-full">
        {/* CỘT TRÁI: Nội dung chính */}
        <div className="flex-1 overflow-hidden min-w-[600px]">
          <NotebookHeader />
        </div>

        {/* CỘT PHẢI: Sidebar Profile & Charts */}
        <aside className="w-[340px] shrink-0 flex flex-col gap-5 overflow-y-auto custom-scrollbar pb-6 pr-2">
          {/* ĐÃ TÁCH FILE: Gọi Component UserProfileCard vào đây */}
          <UserProfileCard name="Minh" />

          <ChartHolder
            listOfCharts={listOfCharts}
            sidebarCardCls={sidebarCardCls}
            isNight={isNight}
          />
        </aside>
      </div>
      {/* Evaluation bot floating button */}
      <EvaluationBot />
    </div>
  );
};

export const HomePage = () => <HomePageShell />;

const HomePageShell = () => {
  const profileSettings = useProfileSettings();
  const firstLoginPrompt = useFirstLoginDescriptionPrompt();
  const isProfileEditLocked =
    !firstLoginPrompt.currentUser?.description?.trim();

  const topRightActions = (
    <button
      type="button"
      onClick={isProfileEditLocked ? undefined : profileSettings.openModal}
      disabled={isProfileEditLocked}
      className={`group flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition-all duration-300 ${
        isProfileEditLocked
          ? "cursor-not-allowed border-slate-300/70 bg-white/40 text-slate-400 opacity-60"
          : "border-cyan-300 bg-white/80 text-cyan-700 hover:border-cyan-400 hover:bg-white active:scale-95"
      }`}
      aria-label="Chỉnh sửa hồ sơ"
      title={
        isProfileEditLocked
          ? "Hoàn thành mô tả trước để chỉnh sửa hồ sơ"
          : "Chỉnh sửa hồ sơ"
      }
    >
      <GearSix size={16} weight="bold" className="shrink-0" />
      <span className="whitespace-nowrap">Chỉnh sửa hồ sơ</span>
    </button>
  );

  return (
    <ThemeWrapper showToggle={true} topRightActions={topRightActions}>
      <HomeContent />

      <FirstLoginDescriptionModal
        isOpen={firstLoginPrompt.isOpen}
        isSaving={firstLoginPrompt.isSaving}
        error={firstLoginPrompt.error}
        value={firstLoginPrompt.draftDescription}
        suggestions={firstLoginPrompt.suggestions}
        onChange={firstLoginPrompt.setDraftDescription}
        onPickSuggestion={firstLoginPrompt.handlePickSuggestion}
        onSubmit={firstLoginPrompt.handleSubmit}
      />

      <ProfileSettingsModal
        isOpen={profileSettings.isOpen}
        activeTab={profileSettings.activeTab}
        profileForm={profileSettings.profileForm}
        passwordForm={profileSettings.passwordForm}
        profileError={profileSettings.profileError}
        passwordError={profileSettings.passwordError}
        isSavingProfile={profileSettings.isSavingProfile}
        isSavingPassword={profileSettings.isSavingPassword}
        onClose={profileSettings.closeModal}
        onTabChange={profileSettings.setActiveTab}
        onProfileChange={profileSettings.setProfileField}
        onPasswordChange={profileSettings.setPasswordField}
        onProfileSubmit={profileSettings.handleProfileSubmit}
        onPasswordSubmit={profileSettings.handlePasswordSubmit}
      />
    </ThemeWrapper>
  );
};
