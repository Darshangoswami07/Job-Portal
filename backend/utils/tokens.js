import jwt from "jsonwebtoken";
import { URL } from "url";

export const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
export const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Refresh tokens are signed with a distinct secret so a leaked access token
// (short-lived, sent on every request) can't be replayed as a refresh token.
const getRefreshSecret = () =>
  process.env.REFRESH_SECRET_KEY || `${process.env.SECRET_KEY}_refresh`;

export const signAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.SECRET_KEY, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });

export const signRefreshToken = (userId) =>
  jwt.sign({ userId, type: "refresh" }, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  });

export const verifyRefreshToken = (token) =>
  jwt.verify(token, getRefreshSecret());

const msFromExpiry = (expiry) => {
  const match = /^(\d+)([smhd])$/.exec(expiry);
  if (!match) return 15 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * unitMs[unit];
};

export const getAccessCookieOptions = (baseOptions) => ({
  ...baseOptions,
  maxAge: msFromExpiry(ACCESS_TOKEN_EXPIRES_IN),
});

export const getRefreshCookieOptions = (baseOptions) => ({
  ...baseOptions,
  maxAge: msFromExpiry(REFRESH_TOKEN_EXPIRES_IN),
});

export const getBaseCookieOptions = (req) => {
  const origin = req.headers.origin;

  if (!origin) {
    return { httpOnly: true, sameSite: "lax", secure: false, path: "/" };
  }

  try {
    const originHostname = new URL(origin).hostname;
    const requestHostname = req.hostname;
    const isCrossSite = originHostname !== requestHostname;

    return {
      httpOnly: true,
      sameSite: isCrossSite ? "none" : "lax",
      secure: isCrossSite,
      path: "/",
    };
  } catch (error) {
    return { httpOnly: true, sameSite: "lax", secure: false, path: "/" };
  }
};
