import React, { useState } from "react";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm"; // Bạn có thể áp dụng logic focus tương tự cho trang đăng ký
import nightBg from "../assets/background_night-DFLZyt0L.png"; // Đường dẫn đến ảnh nền đêm của bạn

export const AuthLayout = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div
      className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-cover bg-center bg-no-repeat px-4 py-6"
      style={{ backgroundImage: `url(${nightBg})` }}
    >
      {/* Lớp phủ hơi tối mờ để làm nổi bật form */}
      <div className="absolute inset-0 bg-black/20"></div>

      {/* Vùng chứa Cổng và Form */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Nút chuyển đổi Đăng nhập / Đăng ký (Tạo thành hình bảng gỗ treo trên cổng) */}
        <div className="z-20 mb-[-20px] flex gap-2 rounded-t-[20px] bg-[#8b5a2b] p-2 shadow-md">
          <button
            onClick={() => setIsLogin(true)}
            className={`rounded-t-[12px] px-8 py-2 font-bold transition ${isLogin ? "bg-[#fffdf5] text-[#8b5a2b]" : "bg-transparent text-white/70 hover:text-white"}`}
          >
            Đăng Nhập
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`rounded-t-[12px] px-8 py-2 font-bold transition ${!isLogin ? "bg-[#fffdf5] text-[#8b5a2b]" : "bg-transparent text-white/70 hover:text-white"}`}
          >
            Đăng Ký
          </button>
        </div>

        {/* Hiển thị form tương ứng */}
        {isLogin ? <LoginForm /> : <RegisterForm />}
      </div>
    </div>
  );
};
