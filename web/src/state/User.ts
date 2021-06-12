import { createState, useState } from "@hookstate/core";
import { Persistence } from "@hookstate/persistence";
import React from "react";
import { useMutation } from "react-query";
import { useHistory } from "react-router-dom";
import {
  APIError,
  AuthPayload,
  AxiosErrorReponseData,
  LoginRequest,
  RegisterRequest,
  UserDTO,
} from "server/src/models";
import { axiosClient } from "./axiosClient";
import { queryClient } from "./queryClient";

export type UserState = {
  user: typeof UserDTO.TYPE | null;
};

export const userState = createState<UserState>({
  user: null,
});
userState.attach(Persistence("user-state"));
export const hydrateCurrentUser = () => {
  if (userState.value.user) {
    // Re-fetch me to check if the user is still valid
    axiosClient
      .get("/api/auth/me")
      .then(async (res) => {
        const response = UserDTO.create(res.data);
        userState.user.set(response);
      })
      .catch(() => {
        userState.user.set(null);
      });
  }
};

hydrateCurrentUser();

export const useUser = (redirectIfUnauthenticated: boolean = true) => {
  const state = useState(userState);
  const router = useHistory();

  React.useEffect(() => {
    if (!state.value.user && redirectIfUnauthenticated) {
      router.push("/login");
    }
  });
  return {
    state: state,
    logout: React.useCallback(() => {
      state.user.set(null);
      router.push("/login");
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []),
  };
};

export const useLoginMutation = () =>
  useMutation<
    typeof UserDTO.TYPE,
    typeof APIError.TYPE | string,
    typeof LoginRequest.TYPE
  >(
    "login",
    (params: typeof LoginRequest.TYPE) =>
      axiosClient.post("/api/auth/login", params).then(async (response) => {
        return UserDTO.create(response.data);
      }),
    {
      onMutate: () => {
        queryClient.clear();
      },
    }
  );
export const useRegisterMutation = () =>
  useMutation<
    typeof AuthPayload.TYPE,
    typeof APIError["TYPE"],
    typeof RegisterRequest.TYPE
  >("login", (params) =>
    axiosClient.post("/api/auth/register", params).then((r) => r.data)
  );
