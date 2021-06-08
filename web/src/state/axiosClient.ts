import axios from "axios";
import { APIError, AxiosErrorReponseData } from "server/src/models";
export const axiosClient = axios.create();
axiosClient.interceptors.response.use(undefined, (err: unknown) => {
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
});
