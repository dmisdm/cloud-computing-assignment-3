import { useQuery } from "react-query";
import {
  APIError,
  AxiosErrorReponseData,
  SearchResults,
} from "server/src/models";
import { axiosClient } from "./axiosClient";
export const useSearch = (query: string, enabled?: boolean) =>
  useQuery<
    typeof SearchResults.TYPE,
    typeof APIError.TYPE,
    typeof SearchResults.TYPE
  >(
    ["search", query],
    (context) =>
      axiosClient
        .get("/api/search", { params: { query: context.queryKey[1] } })
        .then(async (response) => {
          return SearchResults.create(response.data);
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
      retry: false,
      enabled,
      keepPreviousData: true,
    }
  );
