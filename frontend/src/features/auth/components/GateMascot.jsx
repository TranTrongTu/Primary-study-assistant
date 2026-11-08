import React from "react";
import { motion, AnimatePresence } from "framer-motion";

// Import 4 tấm ảnh đã tách nền
import dogIdle from "../assets/dog_1.png";
import dogFocus from "../assets/dog_2.png";
import dogHide from "../assets/dog_3.png";
import dogPeek from "../assets/dog_4.png";

export const GateMascot = ({ focusField, isPasswordVisible }) => {
  // Logic quyết định hiển thị ảnh nào
  let currentImage = dogIdle;

  if (focusField === "email" || focusField === "username") {
    currentImage = dogFocus;
  } else if (focusField === "password") {
    currentImage = isPasswordVisible ? dogPeek : dogHide;
  }

  return (
    <div className="absolute -top-20 left-1/2 z-20 flex size-[130px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full border-[6px] border-[#2d7a72] bg-[#e8e8e8] shadow-[0_0_15px_rgba(78,205,196,0.5)]">
      <AnimatePresence mode="wait">
        <motion.img
          key={currentImage}
          src={currentImage}
          alt="Linh vật EduSpark"
          className="mt-4 h-full w-full object-cover"
          initial={{ opacity: 0, y: 15, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1.1 }}
          exit={{ opacity: 0, y: -15, scale: 0.8 }}
          transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
        />
      </AnimatePresence>
    </div>
  );
};