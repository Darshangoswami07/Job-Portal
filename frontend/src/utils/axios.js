import axios from "axios";
import { BACKEND_URL } from "./constant";

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

export default axios;
