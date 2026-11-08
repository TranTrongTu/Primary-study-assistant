import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "../api/authApi";

export const useCurrentUser = () => {
  const hasToken = Boolean(localStorage.getItem("token"));

  return useQuery({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
    enabled: hasToken,
    staleTime: 5 * 60 * 1000,
  });
};
