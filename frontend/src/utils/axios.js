import axios from "axios";
import { BACKEND_URL } from "./constant";
import store from "@/store/store";
import { setToken, clearAuth } from "@/store/slices/authSlice";

axios.defaults.baseURL = BACKEND_URL;
axios.defaults.withCredentials = true;

axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

const REFRESH_URL = `${BACKEND_URL}/api/auth/refresh`;

let refreshPromise = null;

const requestRefresh = () => {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(REFRESH_URL, {}, { withCredentials: true, _skipAuthRefresh: true })
      .then((res) => res.data?.token)
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
};

const redirectToLogin = () => {
  store.dispatch(clearAuth());
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (
      !response ||
      response.status !== 401 ||
      response.data?.code !== "TOKEN_EXPIRED" ||
      config?._retry ||
      config?._skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    config._retry = true;

    try {
      const newToken = await requestRefresh();
      if (!newToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      store.dispatch(setToken(newToken));
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${newToken}`;
      return axios(config);
    } catch (refreshError) {
      redirectToLogin();
      return Promise.reject(refreshError);
    }
  }
);

export default axios;
