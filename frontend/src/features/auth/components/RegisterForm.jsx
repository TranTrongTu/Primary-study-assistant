// src/features/auth/components/RegisterForm.jsx
import { useRef, useEffect } from "react";
import { useRegister } from "../hooks/useRegister";

export const RegisterForm = ({ setFocusField, showPassword, setShowPassword, onSuccess, onError, onLoading }) => {
  const { username, setUsername, email, setEmail, password, setPassword, isLoading, error, handleSubmit: rawSubmit } = useRegister();
  const passwordRef = useRef(null);

  useEffect(() => {
    if (onLoading) onLoading(isLoading);
  }, [isLoading, onLoading]);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
    if (passwordRef.current) {
      setTimeout(() => {
        if (passwordRef.current) {
          passwordRef.current.focus();
          const length = passwordRef.current.value.length;
          passwordRef.current.setSelectionRange(length, length);
        }
      }, 0);
      setFocusField(password.length > 0 ? "password" : "password-empty");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await rawSubmit(e, { onSuccess, onError });
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      /* ĐÃ SỬA: Bỏ chiều cao fix cứng */
      className="mx-auto flex w-full max-w-[400px] h-auto flex-col justify-start items-stretch gap-3 text-center relative"
    >
      {/* --- WATERMARK CHÌM --- */}
      <svg className="absolute -bottom-4 -left-6 w-32 h-32 text-[#4ecdc4] opacity-[0.07] -rotate-12 pointer-events-none z-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
      </svg>
      <svg className="absolute -top-2 -right-4 w-20 h-20 text-[#f1c40f] opacity-[0.08] rotate-12 pointer-events-none z-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
      </svg>

      <div className="flex flex-col gap-3 relative z-10 pt-2">
        <div className="relative text-[#999] focus-within:text-[#4ecdc4] transition-colors">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <input
            id="register-username" type="text" value={username}
            onChange={(e) => setUsername(e.target.value)}
            onFocus={() => setFocusField("username")} onBlur={() => setFocusField("default")}
            placeholder="Tên người dùng"
            className="w-full rounded-[14px] border-[2px] border-[#e0e0e0] bg-[#f9f9f9] dark:bg-[#1a2238] dark:border-[#2d3748] dark:text-white pl-10 pr-3 py-3.5 text-[1rem] font-bold text-[#333] placeholder-[#aaa] outline-none transition focus:border-[#4ecdc4] focus:bg-white dark:focus:bg-[#1f2937]"
          />
        </div>

        <div className="relative text-[#999] focus-within:text-[#4ecdc4] transition-colors">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
          <input
            id="register-email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={() => setFocusField("email")} onBlur={() => setFocusField("default")}
            placeholder="Email (be@eduspark.vn)"
            className="w-full rounded-[14px] border-[2px] border-[#e0e0e0] bg-[#f9f9f9] dark:bg-[#1a2238] dark:border-[#2d3748] dark:text-white pl-10 pr-3 py-3.5 text-[1rem] font-bold text-[#333] placeholder-[#aaa] outline-none transition focus:border-[#4ecdc4] focus:bg-white dark:focus:bg-[#1f2937]"
          />
        </div>

        <div className="relative text-[#999] focus-within:text-[#4ecdc4] transition-colors">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <input
            ref={passwordRef} id="register-password"
            type={showPassword ? "text" : "password"} value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setFocusField(e.target.value.length > 0 ? "password" : "password-empty");
            }}
            onFocus={() => setFocusField(password.length > 0 ? "password" : "password-empty")}
            onBlur={() => setFocusField("default")}
            placeholder="Mật khẩu"
            className="w-full rounded-[14px] border-[2px] border-[#e0e0e0] bg-[#f9f9f9] dark:bg-[#1a2238] dark:border-[#2d3748] dark:text-white pl-10 pr-11 py-3.5 text-[1rem] font-bold text-[#333] placeholder-[#aaa] outline-none transition focus:border-[#4ecdc4] focus:bg-white dark:focus:bg-[#1f2937]"
          />
          <button
            type="button" onMouseDown={(e) => e.preventDefault()} onClick={handleTogglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[#888] hover:text-[#4ecdc4] transition-colors focus:outline-none"
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 pb-2 relative z-10">
        {error && <p className="text-center font-bold text-[#ff4757] text-sm">{error}</p>}
        <button type="submit" disabled={isLoading} className="w-full rounded-[14px] border-[2px] border-[#2d7a72] bg-[#4ecdc4] px-4 py-3.5 text-[1.1rem] font-black text-white transition duration-300 hover:bg-[#45b7aa] hover:shadow-[0_4px_12px_rgba(78,205,196,0.4)] disabled:cursor-not-allowed disabled:bg-[#ccc] disabled:border-[#aaa]">
          {isLoading ? "Đang xử lý..." : "🎒 Đăng ký ngay!"}
        </button>
      </div>
    </form>
  );
};