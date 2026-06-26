import jwt from "jsonwebtoken";

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
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      return res.status(401).json({
        message: "User not authenticated, please login",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.SECRET_KEY);

    if (!decoded) {
      return res.status(401).json({
        message: "Invalid token, please login again",
        success: false,
      });
    }

    req.id = decoded.userId;
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Error in isAuthenticated middleware:", error);
    return res.status(401).json({
      message: "Invalid token, please login again",
      success: false,
    });
  }
};

export default isAuthenticated;
