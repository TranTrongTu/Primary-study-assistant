// src/features/auth/hooks/useRegister.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi";

export const useRegister = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleUsernameChange = (e) => { setUsername(e.target.value); };
  const handleEmailChange    = (e) => { setEmail(e.target.value); };
  const handlePasswordChange = (e) => { setPassword(e.target.value); };

  /**
   * handleSubmit nhận thêm tham số thứ 2 là object callbacks (tuỳ chọn):
   * { onSuccess, onError }
   */
  const handleSubmit = async (e, callbacks = {}) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const { onSuccess, onError } = callbacks;

    try {
      // Bắt buộc đợi 2 giây
      await new Promise(resolve => setTimeout(resolve, 2000));

      await registerUser({ username, email, password });

      if (onSuccess) {
        onSuccess();
      } else {
        alert("Đăng ký thành công! Hãy đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      let errorMsg = "";

      if (err.response && err.response.status === 409) {
        errorMsg = "Email này đã được sử dụng. Bé thử một email khác nhé!";
      } else if (err.response && err.response.status === 422) {
        errorMsg = "Thông tin đăng ký chưa hợp lệ (Ví dụ: Email sai định dạng)!";
      } else {
        errorMsg = err?.response?.data?.detail || "Đăng ký thất bại. Vui lòng thử lại sau.";
      }

      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    username, setUsername,
    email, setEmail,
    password, setPassword,
    isLoading, error,
    handleSubmit,
    handleUsernameChange,
    handleEmailChange,
    handlePasswordChange,
  };
};