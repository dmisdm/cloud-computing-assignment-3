import {
  type,
  string,
  number,
  coerce,
  object,
  optional,
  unknown,
  instance,
} from 'superstruct';
export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
};

export const LoginRequest = type({
  email: string(),
  password: string(),
});

export const AuthPayload = type({
  sub: number(),
  email: string(),
  name: string(),
});
export const UserDTO = coerce(
  type({
    email: string(),
    id: number(),
    name: string(),
  }),
  AuthPayload,
  (authPayload) => ({
    ...authPayload,
    id: authPayload.sub,
  }),
);

export const APIError = coerce(
  coerce(
    object({
      errorMessage: string(),
      errorName: string(),
      detail: optional(unknown()),
    }),
    string(),
    (value) => ({
      errorMessage: value,
      errorName: 'Unknown',
    }),
  ),
  type({
    message: string(),
    statusCode: number(),
  }),
  (value) => ({
    errorMessage: value.message,
    errorName: 'Unknown',
  }),
);
