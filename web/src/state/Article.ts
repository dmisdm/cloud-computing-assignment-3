import { Article, Comment, Like } from "server/src/models";
import {
  string,
  type,
  never,
  any,
  array,
  optional,
  instance,
  unknown,
  nullable,
} from "superstruct";
import { makeMutator, makeQuerier } from "./common";
import { queryClient } from "./queryClient";
export const likesKey = "likes";
const params = type({
  articleId: string(),
});
export const useBookmark = makeMutator(
  {
    paramsStruct: params,
    resultStruct: Like,
    url: "/api/articles/bookmark",
    key: "like",
  },
  {
    onMutate: async ({ articleId }) => {
      await queryClient.cancelQueries([likesKey, undefined]);
      queryClient.setQueryData(
        [likesKey, undefined],
        (data?: typeof Like.TYPE[]) => {
          return (
            data?.concat([
              {
                articleId,
                article: {
                  authors: [],
                  id: "unknown",
                  source: "",
                  summary: "",
                  title: "",
                  documentUrl: "",
                  updatedAt: new Date(),
                },
              },
            ]) || []
          );
        }
      );
    },
  }
);
export const useUnbookmark = makeMutator(
  {
    paramsStruct: params,
    resultStruct: Like,
    url: "/api/articles/unbookmark",
    key: "unlike",
  },
  {
    onMutate: async ({ articleId }) => {
      await queryClient.cancelQueries([likesKey, undefined]);
      queryClient.setQueryData(
        [likesKey, undefined],
        (data?: typeof Like.TYPE[]) =>
          data?.filter((item) => item.articleId !== articleId) || []
      );
    },
    onSettled: async () => {
      await queryClient.invalidateQueries(likesKey);
    },
  }
);

export const useBookmarks = makeQuerier({
  paramsStruct: optional(any()),
  key: likesKey,
  resultStruct: array(Like),
  url: "/api/articles/bookmarks",
});

export const usePublications = makeQuerier({
  paramsStruct: optional(any()),
  key: "publications",
  resultStruct: array(Article),
  url: "/api/articles/my",
});

export const usePublishArticle = makeMutator({
  paramsStruct: type({
    title: string(),
    summary: string(),
    document: instance(File),
  }),
  resultStruct: any(),
  key: "publishArticle",
  url: "/api/articles/publish",
  multipartForm: true,
});

export const useComments = makeQuerier({
  paramsStruct: optional(unknown()),
  resultStruct: array(Comment),
  key: "comments",
  url: "/api/articles/comments",
});
export const useAddComment = makeMutator({
  paramsStruct: type({
    comment: string(),
    articleId: string(),
  }),
  resultStruct: Comment,
  key: "addComment",
  url: "/api/articles/add-comment",
});

export const useArticle = makeQuerier({
  paramsStruct: type({
    id: string(),
  }),
  resultStruct: optional(nullable(Article)),
  key: "article",
  url: "/api/articles",
});
