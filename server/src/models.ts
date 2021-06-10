import { fromUnixTime, parseISO } from 'date-fns';
import {
  array,
  boolean,
  coerce,
  date,
  literal,
  number,
  object,
  optional,
  record,
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

export const ArticleSource = union([literal('User'), literal('Arxiv')]);

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
      statusCode: optional(number()),
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
    statusCode: value.statusCode,
  }),
);
const Author = type({ name: string() });
const Category = type({
  '@_term': string(),
});
export const SearchRequest = type({
  query: string(),
  limit: optional(number()),
  offset: optional(number()),
});

export const ArxivArticle = type({
  id: string(),
  updated: coercedDate,
  published: coercedDate,
  title: string(),
  summary: string(),
  authors: array(string()),
  categories: array(string()),
});

export const SearchResults = type({
  offset: number(),
  limit: number(),
  query: string(),
  results: array(ArxivArticle),
});

export const AggregatedSearchResults = record(string(), SearchResults);
export const ArxivEntry = type({
  id: string(),
  updated: coercedDate,
  published: coercedDate,
  title: string(),
  summary: string(),
  author: union([array(Author), Author]),
  category: union([array(Category), Category]),
});
export const ArxivSearchResults = type({
  feed: type({
    'opensearch:totalResults': type({
      '#text': number(),
    }),
    entry: union([array(ArxivEntry), optional(ArxivEntry)]),
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

export const Article = type({
  id: string(),
  title: string(),
  summary: string(),
  source: string(),
  authors: array(
    type({
      name: string(),
    }),
  ),
  arxivArticle: optional(ArxivArticle),
});
export const Like = type({
  articleId: string(),
  article: Article,
});
