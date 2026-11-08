import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { changePassword, updateProfile } from "../api/profileApi";

const initialProfileForm = {
  username: "",
  email: "",
  description: "",
};

const initialPasswordForm = {
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export const useProfileSettings = () => {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [profileForm, setProfileForm] = useState(initialProfileForm);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const profileData = useMemo(
    () => ({
      username: currentUser?.username || "",
      email: currentUser?.email || "",
      description: currentUser?.description || "",
    }),
    [currentUser],
  );

  useEffect(() => {
    setProfileForm(profileData);
  }, [profileData]);

  const closeModal = () => {
    setIsOpen(false);
    setProfileError("");
    setPasswordError("");
  };

  const openModal = () => {
    setProfileForm(profileData);
    setPasswordForm(initialPasswordForm);
    setProfileError("");
    setPasswordError("");
    setActiveTab("profile");
    setIsOpen(true);
  };

  const updateProfileMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["current-user"], updatedUser);
      setProfileError("");
      closeModal();
    },
    onError: (err) => {
      setProfileError(
        err?.response?.data?.detail || "Không thể cập nhật thông tin lúc này.",
      );
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setPasswordForm(initialPasswordForm);
      setPasswordError("");
      closeModal();
    },
    onError: (err) => {
      setPasswordError(
        err?.response?.data?.detail || "Không thể đổi mật khẩu lúc này.",
      );
    },
  });

  const setProfileField = (field, value) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const setPasswordField = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      username: profileForm.username.trim(),
      email: profileForm.email.trim(),
      description: profileForm.description.trim(),
    };

    if (!payload.username || !payload.email || !payload.description) {
      setProfileError("Bé hãy nhập đủ tên, email và mô tả nhé.");
      return;
    }

    await updateProfileMutation.mutateAsync(payload);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (
      !passwordForm.oldPassword.trim() ||
      !passwordForm.newPassword.trim() ||
      !passwordForm.confirmPassword.trim()
    ) {
      setPasswordError(
        "Bé hãy nhập đủ mật khẩu cũ, mật khẩu mới và xác nhận mật khẩu.",
      );
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }

    await changePasswordMutation.mutateAsync({
      old_password: passwordForm.oldPassword,
      new_password: passwordForm.newPassword,
    });
  };

  return {
    currentUser,
    isUserLoading,
    isOpen,
    activeTab,
    profileForm,
    passwordForm,
    profileError,
    passwordError,
    isSavingProfile: updateProfileMutation.isPending,
    isSavingPassword: changePasswordMutation.isPending,
    openModal,
    closeModal,
    setActiveTab,
    setProfileField,
    setPasswordField,
    handleProfileSubmit,
    handlePasswordSubmit,
  };
};
