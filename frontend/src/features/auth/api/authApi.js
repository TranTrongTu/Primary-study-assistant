import axiosClient from "../../../api/axiosClient";
// Đổi chữ username thành email ở tham số đầu vào cho đúng với UI
export const loginUser = async (email, password) => {
  const formData = new URLSearchParams();

  // Gắn giá trị của biến 'email' vào cái nhãn bắt buộc là 'username'
  formData.append("username", email);
  formData.append("password", password);

  const response = await axiosClient.post("/login", formData, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await axiosClient.post("/user/register", userData);
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await axiosClient.get("/user/me");
  return response.data;
};
