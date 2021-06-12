import {
  any,
  array,
  number,
  optional,
  string,
  type,
  unknown,
} from "superstruct";
import { makeQuerier } from "./common";

export const mostFrequentSearchTerms = makeQuerier({
  paramsStruct: optional(unknown()),
  key: "mostFrequentSearchTerms",
  resultStruct: array(type({ term: string(), frequency: number() })),
  url: "/api/most-frequent-search-terms",
});
