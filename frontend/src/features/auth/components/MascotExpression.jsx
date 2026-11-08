import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Import các phần vector của chú chó để animate
// (Bạn cần chuẩn bị các phần này từ file vector xịn)
import dogBody from '../assets/mascot_premium_body.svg';
import mouthNeutral from '../assets/mascot_premium_mouth_neutral.svg';
import mouthSmileFocus from '../assets/mascot_premium_mouth_smile_focused.svg';
import mouthMischievous from '../assets/mascot_premium_mouth_mischievous.svg'; // Miệng tò mò/hóng chuyện

const MascotExpression = ({ focusField }) => {
  const [typedCharPosition, setTypedCharPosition] = useState({ x: 0, y: 0 });

  // Logic liếc mắt & Breathing (giữ nguyên logic liếc mượt mà từ bản cũ)
  // ... (Phần logic tính toán x, y và setMousePosition giữ nguyên)

  // 1. Quyết định biểu cảm khuôn mặt & miệng
  let currentMouth = mouthNeutral;
  let isPeeking = false;

  if (focusField === 'email' || focusField === 'username') {
    // Typing: Cười nhẹ, chăm chú
    currentMouth = mouthSmileFocus;
  } else if (focusField === 'password') {
    // Password (Hidden): Nhắm tịt mắt (đóng rèm), hoặc (Peeking): Ti hí, tò mò
    currentMouth = mouthMischievous; // Miệng tò mò
    isPeeking = true; // Kích hoạt trạng thái ti hí (dùng CSS để đóng mi mắt 1 nửa)
  }

  return (
    // 2. Container tạo hiệu ứng "Thở" liên tục
    <motion.div
      className="absolute top-10 right-10 z-20 flex size-[130px] items-center justify-center overflow-hidden rounded-full border-4 border-[#2d7a72] bg-[#e8e8e8]/90"
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }} // Tốc độ thở êm ái
    >
      <div className={`mascot-eyes-wrap ${isPeeking ? 'is-peeking' : ''}`}>
        {/* Lòng trắng, Đồng tử */}
        {/* ... (SVG mắt & con ngươi giữ nguyên logic liếc) */}

        {/* Mí mắt: Dùng Rèm mi trượt từ trên xuống để tạo độ khít/hé mượt mà */}
        <div className="mascot-eyelid mascot-eyelid-L"></div>
        <div className="mascot-eyelid mascot-eyelid-R"></div>
      </div>

      <motion.img
        src={dogBody}
        alt="Linh vật"
        className="size-full object-cover"
        animate={{ x: focusField === 'default' ? mousePosition.x : 0, y: focusField === 'default' ? mousePosition.y : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      />

      {/* 3. Đổi biểu cảm MIỆNG */}
      <AnimatePresence mode="wait">
        <motion.img
          key={currentMouth} // Thay đổi key sẽ kích hoạt animation miệng
          src={currentMouth}
          alt="Miệng"
          className="absolute h-[15%] w-auto object-cover"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.25 }}
        />
      </AnimatePresence>
    </motion.div>
  );
};

export default MascotExpression;    