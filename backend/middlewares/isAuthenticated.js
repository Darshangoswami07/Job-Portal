import jwt from "jsonwebtoken";

const isProd = () => process.env.NODE_ENV === "production";

const logAuthFailure = (label, req, error) => {
  if (isProd()) {
    console.log(`[auth] ${label}: ${req.method} ${req.originalUrl} (${error.name})`);
  } else {
    console.error(`[auth] ${label}:`, error);
  }
};

const isAuthenticated = async (req, res, next) => {
  try {
    if (!process.env.SECRET_KEY) {
      console.error("SECRET_KEY is not configured");
      return res.status(500).json({
        message: "Server authentication is not configured",
        success: false,
      });
    }

    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    // Query-param fallback: lets same-origin-restricted embeds (iframe/window.open
    // previews) authenticate a GET request when they can't set a custom header.
    const queryToken = typeof req.query?.token === "string" ? req.query.token : null;
    const token = req.cookies?.token || bearerToken || queryToken;

    if (!token) {
      return res.status(401).json({
        message: "User not authenticated, please login",
        success: false,
        code: "TOKEN_MISSING",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (verifyError) {
      if (verifyError instanceof jwt.TokenExpiredError) {
        logAuthFailure("token expired", req, verifyError);
        return res.status(401).json({
          success: false,
          message: "Session expired",
          code: "TOKEN_EXPIRED",
        });
      }

      // Covers JsonWebTokenError (malformed/invalid signature) and NotBeforeError
      logAuthFailure("token invalid", req, verifyError);
      return res.status(401).json({
        success: false,
        message: "Invalid token, please login again",
        code: "TOKEN_INVALID",
      });
    }

    req.id = decoded.userId;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    logAuthFailure("unexpected error", req, error);
    return res.status(401).json({
      success: false,
      message: "Invalid token, please login again",
      code: "TOKEN_INVALID",
    });
  }
};

export default isAuthenticated;
