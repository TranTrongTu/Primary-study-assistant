import axiosClient from "../../../api/axiosClient";

export const updateProfile = async (profileData) => {
  const response = await axiosClient.patch("/user/me", profileData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await axiosClient.patch(
    "/user/change-password",
    passwordData,
  );
  return response.data;
};
