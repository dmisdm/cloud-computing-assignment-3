import { Like } from "server/src/models";
import { string, type, never, any, array, optional } from "superstruct";
import { makeMutator, makeQuerier } from "./common";
import { queryClient } from "./queryClient";
export const likesKey = "likes";
const params = type({
  articleId: string(),
});
export const useLike = makeMutator(
  {
    paramsStruct: params,
    resultStruct: Like,
    url: "/api/articles/like",
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
              },
            ]) || []
          );
        }
      );
    },
  }
);
export const useUnlike = makeMutator(
  {
    paramsStruct: params,
    resultStruct: Like,
    url: "/api/articles/unlike",
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

export const useLikes = makeQuerier({
  paramsStruct: optional(any()),
  key: likesKey,
  resultStruct: array(Like),
  url: "/api/articles/liked",
});
