import { fromUnixTime, parseISO } from 'date-fns';
import {
  array,
  coerce,
  date,
  number,
  object,
  optional,
  string,
  type,
  union,
  unknown,
} from 'superstruct';

export const coercedDate = coerce(
  date(),
  union([string(), number()]),
  (value) =>
    typeof value === 'string' ? parseISO(value) : fromUnixTime(value),
);
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

export const SearchRequest = type({
  query: string(),
  limit: optional(number()),
  offset: optional(number()),
});

export const SearchResults = type({
  total: number(),
  offset: number(),
  limit: number(),
  query: string(),
  results: array(
    type({
      id: string(),
      updated: coercedDate,
      published: coercedDate,
      title: string(),
      summary: string(),
      authors: union([
        array(type({ name: string() })),
        type({ name: string() }),
      ]),
    }),
  ),
});

export const ArxivSearchResults = type({
  feed: type({
    'opensearch:totalResults': number(),
    'opensearch:startIndex': number(),
    'opensearch:itemsPerPage': number(),
    entry: array(
      type({
        id: string(),
        updated: coercedDate,
        published: coercedDate,
        title: string(),
        summary: string(),
        author: union([
          array(type({ name: string() })),
          type({ name: string() }),
        ]),
      }),
    ),
  }),
});

export const AxiosErrorReponseData = type({
  response: type({
    data: object(),
  }),
});

export const RegisterRequest = type({
  email: string(),
  password: string(),
  name: string(),
});
