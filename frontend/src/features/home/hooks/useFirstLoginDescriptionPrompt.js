import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../../auth/hooks/useCurrentUser";
import { updateProfile } from "../api/profileApi";
import { descriptionSuggestions } from "../utils/descriptionSuggestions";

const getPromptStorageKey = (userId) =>
  `eduspark_description_prompt_dismissed_${userId}`;

export const useFirstLoginDescriptionPrompt = () => {
  const queryClient = useQueryClient();
  const { data: currentUser, isLoading: isUserLoading } = useCurrentUser();
  const [isOpen, setIsOpen] = useState(false);
  const [draftDescription, setDraftDescription] = useState("");
  const [error, setError] = useState("");

  const storageKey = useMemo(() => {
    if (!currentUser?.id) return null;
    return getPromptStorageKey(currentUser.id);
  }, [currentUser?.id]);

  const saveMutation = useMutation({
    mutationFn: (description) => updateProfile({ description }),
    onSuccess: (updatedUser) => {
      if (storageKey) {
        localStorage.setItem(storageKey, "1");
      }

      queryClient.setQueryData(["current-user"], updatedUser);
      setError("");
      setIsOpen(false);
    },
    onError: (err) => {
      const message =
        err?.response?.data?.detail ||
        "Không thể lưu mô tả lúc này. Bé thử lại nhé!";
      setError(message);
    },
  });

  useEffect(() => {
    if (!currentUser) return;

    const hasDescription = Boolean(currentUser.description?.trim());
    if (hasDescription) {
      setIsOpen(false);
      return;
    }

    if (storageKey && localStorage.getItem(storageKey) === "1") {
      setIsOpen(false);
      return;
    }

    setDraftDescription((prev) => prev || "");
    setIsOpen(true);
  }, [currentUser, storageKey]);

  const closePrompt = () => {
    if (storageKey) {
      localStorage.setItem(storageKey, "1");
    }
    setError("");
    setIsOpen(false);
  };

  const handlePickSuggestion = (suggestion) => {
    setDraftDescription(suggestion.description);
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const trimmedDescription = draftDescription.trim();
    if (!trimmedDescription) {
      setError("Bé hãy nhập ít nhất một dòng mô tả nhé!");
      return;
    }

    await saveMutation.mutateAsync(trimmedDescription);
  };

  return {
    currentUser,
    isUserLoading,
    isOpen,
    draftDescription,
    setDraftDescription,
    handlePickSuggestion,
    handleSubmit,
    closePrompt,
    isSaving: saveMutation.isPending,
    error,
    suggestions: descriptionSuggestions,
  };
};
