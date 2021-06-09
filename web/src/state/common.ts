import axios from "axios";
import {
  useMutation,
  useQuery,
  UseMutationOptions,
  UseQueryOptions,
} from "react-query";
import { APIError } from "server/src/models";
import { Struct } from "superstruct";
import { axiosClient } from "./axiosClient";

export const makeMutator =
  <Params extends object, Result>(
    {
      paramsStruct,
      resultStruct,
      key,
      url,
    }: {
      paramsStruct: Struct<Params>;
      resultStruct: Struct<Result>;
      key: string;
      url: string;
    },
    outerOptions?: UseMutationOptions<
      Struct<Result>["TYPE"],
      typeof APIError["TYPE"],
      Params
    >
  ) =>
  (
    options?: UseMutationOptions<
      Struct<Result>["TYPE"],
      typeof APIError["TYPE"],
      Params
    >
  ) =>
    useMutation<Struct<Result>["TYPE"], typeof APIError["TYPE"], Params>(
      key,
      (params) => {
        const cancelTokenSource = axios.CancelToken.source();
        const req = axiosClient
          .post(url, paramsStruct.create(params), {
            cancelToken: cancelTokenSource.token,
          })
          .then((r) => resultStruct.create(r.data));

        return Object.assign(req, {
          cancel: (m?: string) => cancelTokenSource.cancel(m),
        });
      },
      {
        ...outerOptions,
        ...options,
      }
    );
export const makeQuerier =
  <Params extends object, Result>(
    {
      paramsStruct,
      resultStruct,
      key,
      url,
    }: {
      paramsStruct: Struct<Params>;
      resultStruct: Struct<Result>;
      key: string;
      url: string;
    },
    outerOptions?: UseQueryOptions<
      Struct<Result>["TYPE"],
      typeof APIError["TYPE"],
      Struct<Result>["TYPE"],
      [string, Params]
    >
  ) =>
  (
    params: Struct<Params>["TYPE"],
    options?: UseQueryOptions<
      Struct<Result>["TYPE"],
      typeof APIError["TYPE"],
      Struct<Result>["TYPE"],
      [string, Params]
    >
  ) =>
    useQuery<
      Struct<Result>["TYPE"],
      typeof APIError["TYPE"],
      Struct<Result>["TYPE"],
      [string, Params]
    >(
      [key, paramsStruct.create(params)],
      (params) => {
        const cancelTokenSource = axios.CancelToken.source();
        const req = axiosClient
          .get(url, {
            params: paramsStruct.create(params.queryKey[1]),
            cancelToken: cancelTokenSource.token,
          })
          .then((r) => resultStruct.create(r.data));

        return Object.assign(req, {
          cancel: (m?: string) => cancelTokenSource.cancel(m),
        });
      },
      { ...outerOptions, ...options }
    );
