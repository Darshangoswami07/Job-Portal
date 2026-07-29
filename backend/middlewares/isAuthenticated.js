import jwt from "jsonwebtoken";

const isProd = () => process.env.NODE_ENV === "production";

// A JWT is always exactly three non-empty, base64url-alphabet segments
// separated by periods. Anything else (missing, "undefined"/"null" string,
// truncated, corrupted) can be rejected before ever touching jwt.verify() —
// that's the difference between "jwt malformed" (structurally not a token)
// and "jwt expired"/"invalid signature" (a real token that failed a check).
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const isWellFormedJwt = (value) => typeof value === "string" && JWT_SHAPE.test(value);

const logAuthFailure = (label, req, error, extra = "") => {
  if (isProd()) {
    console.log(`[auth] ${label}: ${req.method} ${req.originalUrl} (${error.name})${extra}`);
  } else {
    console.error(`[auth] ${label}:${extra}`, error);
  }
};

// Redacts a candidate token for logging: shows enough to tell "undefined"/
// "null"/empty/garbage apart without leaking a usable token in prod logs.
const previewToken = (value) => {
  if (value === null || value === undefined) return String(value);
  if (value === "") return "<empty string>";
  return value.length > 12 ? `${value.slice(0, 8)}...(${value.length} chars)` : value;
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

    // Try every source that was actually supplied, in order, rather than
    // trusting only the first non-empty one. This matters because the
    // cookie and the Bearer header are set independently (login sets both,
    // but a stale/expired cookie can outlive a freshly-refreshed bearer
    // token, or vice versa) — picking one blindly can reject a perfectly
    // valid credential just because a different source is stale or bad.
    const candidates = [
      { source: "cookie", value: req.cookies?.token },
      { source: "bearer", value: bearerToken },
      { source: "query", value: queryToken },
    ].filter((c) => c.value);

    if (candidates.length === 0) {
      return res.status(401).json({
        message: "User not authenticated, please login",
        success: false,
        code: "TOKEN_MISSING",
      });
    }

    let lastError = null;
    for (const { source, value } of candidates) {
      if (!isWellFormedJwt(value)) {
        logAuthFailure("token malformed", req, { name: "TokenShapeError" }, ` source=${source} value=${previewToken(value)}`);
        lastError = { code: "TOKEN_MALFORMED", message: "Invalid session, please login again" };
        continue;
      }

      try {
        const decoded = jwt.verify(value, process.env.SECRET_KEY);
        req.id = decoded.userId;
        req.userId = decoded.userId;
        return next();
      } catch (verifyError) {
        if (verifyError instanceof jwt.TokenExpiredError) {
          logAuthFailure("token expired", req, verifyError, ` source=${source}`);
          lastError = { code: "TOKEN_EXPIRED", message: "Session expired" };
        } else {
          // Covers JsonWebTokenError (malformed/invalid signature) and NotBeforeError
          logAuthFailure("token invalid", req, verifyError, ` source=${source}`);
          lastError = { code: "TOKEN_INVALID", message: "Invalid token, please login again" };
        }
      }
    }

    return res.status(401).json({ success: false, ...lastError });
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
