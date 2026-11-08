import React, { useState } from "react";
import { useTheme } from "../../../../components/theme/ThemeWrapper";

// 1. NGÂN HÀNG CÂU CHÀO (Top)
const GREETINGS = [
  "Chào Bạn! 👋",
  "Ngày mới vui vẻ nhé! ☀️",
  "Sẵn sàng chưa nào? 🚀",
  "Yay, bạn đến rồi! 🎉",
  "Bắt đầu thôi! 🌟",
  "Hế lô ngày mới! 🐾",
  "Học vui nhé bạn ơi! 💡",
  "Tuyệt vời quá! 🌈",
  "Chào mừng trở lại! 🎈",
  "Gõ cửa phép thuật nào!"
];

// 2. NGÂN HÀNG CÂU HỎI KHƠI GỢI (Middle)
const PROMPTS = [
  "Hôm nay muốn học gì?",
  "Sẵn sàng làm bài tập chưa?",
  "Cùng học điều mới nhé?",
  "Hôm nay mình khám phá gì đây?",
  "Thử thách bản thân chút nào?",
  "Chinh phục bài học mới thôi!",
  "Bắt đầu cuộc phiêu lưu tri thức?",
  "Hôm nay bạn có mục tiêu gì?",
  "Sẵn sàng cho các câu đố chưa?",
  "Cùng gom sao điểm 10 nào!"
];

// 3. NGÂN HÀNG CÂU ĐỘNG VIÊN (Bottom)
const ENCOURAGEMENTS = [
  "Cùng khám phá và chinh phục kiến thức thật vui nhé!",
  "Mỗi ngày một niềm vui, mỗi ngày một bài học hay!",
  "Phép thuật thực sự chính là sự chăm chỉ của bạn!",
  "Đừng ngại khó, có EduSpark đồng hành rồi đây!",
  "Học tập giống như một chuyến phiêu lưu kỳ thú vậy!",
  "Bạn giỏi hơn bạn nghĩ rất nhiều đó nha!",
  "Từng bước nhỏ nỗ lực sẽ tạo nên thành công lớn!",
  "Trí tò mò là chìa khóa mở ra kho báu tri thức!",
  "Cố gắng lên, vinh quang đang chờ đón bạn phía trước!",
  "Học hết sức, chơi hết mình cùng EduSpark nhé!"
];

// Hàm tiện ích để random lấy 1 phần tử trong mảng
const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

export const WelcomeCard = ({ name = "Hiệp" }) => {
  const { isNight } = useTheme();

  // Sử dụng useState(() => ...) để chỉ random 1 lần duy nhất khi Component được mount (lúc F5)
  // Việc này giúp câu chào không bị thay đổi liên tục nếu các state khác của ứng dụng cập nhật
  const [greeting] = useState(() => getRandomItem(GREETINGS));
  const [prompt] = useState(() => getRandomItem(PROMPTS));
  const [encouragement] = useState(() => getRandomItem(ENCOURAGEMENTS));

  return (
    <div className="w-full text-center xl:text-left transition-opacity duration-500">
      <h1 className={`text-[1.8rem] font-black mb-1 leading-normal ${isNight ? "text-blue-400" : "text-[#1d7bd8]"}`}>
        {greeting}
      </h1>
      <h2 className={`text-[1.2rem] font-extrabold mb-1.5 ${isNight ? "text-slate-200" : "text-[#1e293b]"}`}>
        {prompt}
      </h2>
      <p className={`text-[13px] font-semibold leading-snug ${isNight ? "text-slate-400" : "text-slate-500"}`}>
        {encouragement}
      </p>
    </div>
  );
};