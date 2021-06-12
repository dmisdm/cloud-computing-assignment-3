import axios from "axios";
import { APIError, AxiosErrorReponseData } from "server/src/models";
import { history } from "./history";
export const axiosClient = axios.create();
axiosClient.interceptors.response.use(undefined, (err: unknown) => {
  if (AxiosErrorReponseData.is(err)) {
    const apiError = APIError.create(err.response.data);
    if (apiError.statusCode === 401) {
      history.push("/login");
    }
    throw apiError;
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
