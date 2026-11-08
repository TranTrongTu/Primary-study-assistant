import React from "react";
import { Link } from "react-router-dom";
import { ThemeWrapper, useTheme } from "../../../components/theme/ThemeWrapper";

// Tách phần nội dung ra riêng để có thể sử dụng hook useTheme() từ Context
const InteractionContent = ({
  children,
  onNewChat,
  headerTitle = "EduSpark",
  modals,
}) => {
  const { isNight } = useTheme(); // Lấy trạng thái từ ThemeWrapper

  // Adaptive colors
  const logoColor = isNight ? "#a8c4ff" : "#f97316";
  const btnBg = isNight ? "rgba(30,50,100,0.55)" : "rgba(255,255,255,0.60)";
  const btnText = isNight ? "#c8d8ff" : "#374151";
  const btnHover = isNight ? "rgba(50,80,160,0.75)" : "rgba(255,255,255,1)";

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
