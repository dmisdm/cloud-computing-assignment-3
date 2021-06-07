import { createState, useState } from "@hookstate/core";
import React from "react";
import { useMutation } from "react-query";
import { Persistence } from "@hookstate/persistence";
import { queryClient } from "./queryClient";
import { useHistory } from "react-router-dom";
import { APIError, LoginRequest, UserDTO } from "server/src/models";
import { axiosClient } from "./axiosClient";
import { AxiosError } from "axios";
import { type, object } from "superstruct";
const AxiosErrorReponseData = type({
  response: type({
    data: object(),
  }),
});

export type UserState = {
  hydrated: boolean;
  user: typeof UserDTO.TYPE | null;
};

export const userState = createState<UserState>({
  hydrated: false,
  user: null,
});
userState.attach(Persistence("user-state"));
export const hydrateCurrentUser = () => {
  if (!userState.value.hydrated) {
    userState.hydrated.set(true);

    if (userState.value.user) {
      // Re-fetch me to check if the user is still valid
      axiosClient
        .get("/api/me")
        .then(async (res) => {
          const response = UserDTO.create(res.data);
          userState.user.set(response);
        })
        .catch(() => {
          userState.user.set(null);
        });
    }
  }
};

hydrateCurrentUser();

export const useUser = (redirectIfUnauthenticated: boolean = true) => {
  const state = useState(userState);
  const router = useHistory();

  React.useEffect(() => {
    if (
      !state.value.user &&
      state.value.hydrated &&
      redirectIfUnauthenticated
    ) {
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
      axiosClient
        .post("/api/auth/login", params)
        .then(async (response) => {
          return UserDTO.create(response.data);
        })
        .catch((err: unknown) => {
          if (AxiosErrorReponseData.is(err)) {
            throw APIError.create(err.response.data);
          } else if (err instanceof Error) {
            throw APIError.create(err.message);
          } else {
            const error: typeof APIError.TYPE = {
              detail: null,
              errorMessage: "Unknown error",
              errorName: "Unknown",
            };
            throw error;
          }
        }),
    {
      onMutate: () => {
        queryClient.clear();
      },
    }
  );
/* export const useRegisterMutation = () =>
  useMutation<
    typeof RegisterPage.RegistrationSucessResponse.TYPE,
    typeof APIError["TYPE"] | string,
    typeof RegisterPage.RegistrationRequest.TYPE
  >("login", (params) =>
    fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(params),
      headers: {
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (r.ok) {
        return RegisterPage.RegistrationSucessResponse.create(await r.json());
      } else {
        throw APIError.create(await r.json());
      }
    })
  );
 */
