import { User } from "../models/user.model.js";

/**
 * Route guard that checks the authenticated user holds a given role.
 * Must run after `isAuthenticated` (relies on `req.id`).
 *
 *   router.put("/update/:id", isAuthenticated, requireRole("recruiter"), updateJob);
 */
const requireRole = (role) => async (req, res, next) => {
  try {
    const userId = req.id || req.userId;
    if (!userId) {
      return res.status(401).json({
        message: "User not authenticated, please login",
        success: false,
      });
    }

    const user = await User.findById(userId).select("roles");
    if (!user) {
      return res.status(401).json({
        message: "User not found, please login again",
        success: false,
      });
    }

    if (!user.roles?.[role]) {
      return res.status(403).json({
        message: `This action requires ${role} access`,
        success: false,
      });
    }

    req.userRoles = user.roles;
    next();
  } catch (error) {
    console.error("requireRole middleware error:", error);
    return res.status(500).json({
      message: "Server error while checking permissions",
      success: false,
    });
  }
};

export default requireRole;
