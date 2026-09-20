const LOCAL_FRONTEND_URL = "http://localhost:5173";
const LOCAL_BACKEND_URL = "http://localhost:8000";

const normalizeUrl = (value) => value?.replace(/\/$/, "");

const splitOrigins = (value) =>
  (value || "")
    .split(",")
    .map((origin) => normalizeUrl(origin.trim()))
    .filter(Boolean);

export const getJwtSecret = () =>
  process.env.JWT_SECRET || process.env.SECRET_KEY;

export const getFrontendUrl = () => {
  const explicitUrl = process.env.FRONTEND_URL || process.env.VITE_FRONTEND_URL;

  if (explicitUrl) {
    return normalizeUrl(explicitUrl);
  }

  return LOCAL_FRONTEND_URL;
};

export const getBackendUrl = () => {
  const explicitUrl =
    process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || process.env.API_URL;

  if (explicitUrl) {
    return normalizeUrl(explicitUrl);
  }

  return LOCAL_BACKEND_URL;
};

export const getAllowedOrigins = () =>
  new Set([
    ...splitOrigins(process.env.FRONTEND_URL),
    LOCAL_FRONTEND_URL,
    "http://localhost:5174",
  ]);
