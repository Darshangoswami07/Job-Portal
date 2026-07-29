import express from "express";
import passport from "passport";
import { getFrontendUrl } from "../config/runtimeUrls.js";
import { getBaseCookieOptions, getRefreshCookieOptions } from "../utils/tokens.js";

const frontendUrl = getFrontendUrl();

const router = express.Router();

const requireStrategy = (name) => (req, res, next) => {
  if (!passport._strategy(name)) {
    console.error(`OAuth strategy "${name}" is not configured (missing client ID/secret env vars)`);
    return res.redirect(`${frontendUrl}/login?error=oauth_not_configured&provider=${name}`);
  }
  next();
};

router.get(
  "/google",
  requireStrategy("google"),
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  requireStrategy("google"),
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${frontendUrl}/login`,
  }),
  (req, res) => {
    const token = req.authInfo?.token;
    const refreshToken = req.authInfo?.refreshToken;
    const user = req.user;
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
    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, getRefreshCookieOptions(getBaseCookieOptions(req)));
    }
    res.redirect(
      `${frontendUrl}/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`
    );
  }
);

router.get(
  "/github",
  requireStrategy("github"),
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  requireStrategy("github"),
  passport.authenticate("github", {
    session: false,
    failureRedirect: `${frontendUrl}/login`,
  }),
  (req, res) => {
    const token = req.authInfo?.token;
    const refreshToken = req.authInfo?.refreshToken;
    const user = req.user;
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
    if (refreshToken) {
      res.cookie("refreshToken", refreshToken, getRefreshCookieOptions(getBaseCookieOptions(req)));
    }
    res.redirect(
      `${frontendUrl}/oauth/callback?token=${token}&user=${encodeURIComponent(JSON.stringify(safeUser))}`
    );
  }
);

export default router;
