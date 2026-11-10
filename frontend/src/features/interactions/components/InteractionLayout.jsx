import React from "react";
import { Link } from "react-router-dom";
import { ThemeWrapper } from "../../../components/theme/ThemeWrapper";

// Content is split out of the layout so it can sit inside ThemeWrapper.
const InteractionContent = ({
  children,
  headerTitle = "Dolphin",
  modals,
}) => {
  return (
    // Đưa các class căn lề (padding) đặc thù của trang Interaction vào đây
    <div className="relative flex h-full w-full flex-col px-10 pb-10 pt-28">
      {/* Logo */}
      <Link
        to="/dashboard"
        className="fixed left-8 top-5 z-50 text-4xl font-black tracking-tight drop-shadow-md transition-transform hover:scale-105 active:scale-95"
      >
        <span className="text-meteor">{headerTitle}.AI</span>
      </Link>

      <main className="flex h-full w-full space-x-6 overflow-hidden">
        {children}
      </main>

      {modals}
    </div>
  );
};

// Component xuất ra ngoài
export const InteractionLayout = (props) => {
  return (
    <ThemeWrapper showToggle={true}>
      <InteractionContent {...props} />
    </ThemeWrapper>
  );
};
