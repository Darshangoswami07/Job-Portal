import express from "express";
import passport from "passport";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
  }),
  (req, res) => {
    const token = req.authInfo?.token;
    const user = req.user;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roles: user.roles || { jobSeeker: false, recruiter: false },
      currentRole: user.currentRole || null,
      profileCompleted: user.profileCompleted || false,
      profile: user.profile,
    };
    res.redirect(
      `${frontendUrl}/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`
    );
  }
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`,
  }),
  (req, res) => {
    const token = req.authInfo?.token;
    const user = req.user;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const safeUser = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      roles: user.roles || { jobSeeker: false, recruiter: false },
      currentRole: user.currentRole || null,
      profileCompleted: user.profileCompleted || false,
      profile: user.profile,
    };
    res.redirect(
      `${frontendUrl}/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`
    );
  }
);

export default router;
