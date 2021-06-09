import { AggregatedSearchResults } from "server/src/models";
import { string, type } from "superstruct";
import { makeQuerier } from "./common";

export const useSearch = makeQuerier({
  paramsStruct: type({ query: string() }),
  resultStruct: AggregatedSearchResults,
  key: "search",
  url: "/api/search",
});
