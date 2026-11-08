// src/features/auth/hooks/useLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { loginUser } from "../api/authApi";

export const useLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleEmailChange = (e) => {
    console.log(e.target.value);
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    console.log(e.target.value);
    setPassword(e.target.value);
  };

  /**
   * handleSubmit nhận thêm tham số thứ 2 là object callbacks (tuỳ chọn):
   * { onSuccess, onError }
   * Nếu onSuccess được cung cấp → KHÔNG tự navigate (để AuthPage xử lý animation trước)
   * Nếu không có callbacks → hoạt động như cũ (navigate thẳng)
   */
  const handleSubmit = async (e, callbacks = {}) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { onSuccess, onError } = callbacks;

    try {
      // Bắt buộc đợi tối thiểu 2 giây để cún diễn nét thám tử
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const data = await loginUser(email, password);
      localStorage.setItem("token", data.access_token);

      // Ensure current-user query refetches with the new token
      try {
        queryClient.invalidateQueries(["current-user"]);
      } catch (e) {
        // ignore
      }

      if (onSuccess) {
        // Nhường quyền điều hướng cho AuthPage để chạy animation cổng
        onSuccess();
      } else {
        // Fallback: navigate thẳng nếu dùng hook độc lập
        navigate("/dashboard");
      }
    } catch (err) {
      let errorMsg = "";

      if (err.response && err.response.status === 401) {
        errorMsg = "Tài khoản hoặc mật khẩu chưa đúng. Bé kiểm tra lại nhé!";
      } else if (err.response && err.response.status === 422) {
        errorMsg = "Thông tin nhập vào chưa hợp lệ!";
      } else {
        errorMsg =
          err?.response?.data?.detail ||
          "Lỗi kết nối đến máy chủ. Vui lòng thử lại sau.";
      }

      setError(errorMsg);

      if (onError) {
        onError(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    isLoading,
    error,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
  };
};
