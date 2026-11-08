import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../../components/theme/ThemeWrapper";

// 1. BÍ QUYẾT LÀ ĐÂY: Khai báo bộ nhớ NGOÀI component.
// Dù bạn đóng/mở Quiz liên tục, nó vẫn nhớ các mốc đã hiện.
const shownMilestones = new Set();

const QuizMilestone = ({ milestoneMessage, clearMilestoneMessage }) => {
  const { isNight } = useTheme();
  // Dùng state nội bộ để tự quản lý việc hiển thị, không phụ thuộc file cha
  const [currentMsg, setCurrentMsg] = useState(null);

  useEffect(() => {
    // Nếu không có tin nhắn gì thì thôi
    if (!milestoneMessage) return;

    const msgId = milestoneMessage.title;

    // Nếu tin nhắn này ĐÃ TỪNG HIỆN trong quá khứ
    if (shownMilestones.has(msgId)) {
      clearMilestoneMessage(); // Báo cha xóa luôn
      return;
    }

    // Nếu đây là LẦN ĐẦU TIÊN: Lưu vào bộ nhớ toàn cục và hiện lên
    shownMilestones.add(msgId);
    setCurrentMsg(milestoneMessage);

    // Bắt đầu đếm ngược 5 giây bảo vệ
    const timer = setTimeout(() => {
      setCurrentMsg(null);
      clearMilestoneMessage();
    }, 5000);

    // 2. BÍ QUYẾT SỐ 2: Bỏ qua cảnh báo dependency để bảo vệ bộ đếm
    return () => clearTimeout(timer);
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestoneMessage]); 
  // Chỉ chạy lại khi nội dung tin nhắn thực sự đổi, mặc kệ file cha re-render

  // Tắt hẳn giao diện nếu không có message
  if (!currentMsg) return null;

  return (
    <div className="fixed bottom-10 right-10 z-[120] animate-in slide-in-from-right-10 fade-in duration-500">
      <div className={`flex max-w-sm items-start gap-4 rounded-[1.5rem] border-4 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ${
          isNight 
            ? "bg-[#1e293b] border-yellow-400 text-yellow-50 shadow-yellow-500/10" 
            : "bg-white border-yellow-400 text-gray-800 shadow-yellow-500/20"
        }`}>
        <div className="text-3xl animate-bounce">⭐</div>
        <div className="flex-1">
          <p className={`font-black text-sm uppercase tracking-wider mb-1 ${isNight ? "text-yellow-400" : "text-yellow-600"}`}>
            {currentMsg.title}
          </p>
          <p className="text-xs font-bold leading-relaxed opacity-90">
            {currentMsg.body}
          </p>
        </div>
        <button 
          onClick={() => {
            setCurrentMsg(null);
            clearMilestoneMessage();
          }} 
          className="rounded-full p-1 hover:bg-black/10 transition-all opacity-50 hover:opacity-100"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default QuizMilestone;