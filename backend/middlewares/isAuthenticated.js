import jwt from "jsonwebtoken";

const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token;

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
    next();
  } catch (error) {
    console.log("Error in isAuthenticated middleware", error);
  }
};

export default isAuthenticated;
