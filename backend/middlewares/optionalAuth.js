import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/runtimeUrls.js";

/**
 * Sets `req.id` / `req.userId` when a valid token is present, but NEVER rejects
 * an anonymous request. Use for endpoints that are public but want to attribute
 * an action to a user when possible (e.g. external Apply click tracking).
 */
export default function optionalAuth(req, _res, next) {
  try {
    const header = req.headers.authorization;
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null;
    const token = req.cookies?.token || bearer;
    const secret = getJwtSecret();
    if (token && secret) {
      const decoded = jwt.verify(token, secret);
      if (decoded?.userId) {
        req.id = decoded.userId;
        req.userId = decoded.userId;
      }
    }
  } catch {
    // invalid/expired token → treat as anonymous
  }
  next();
}
