import express from "express";
import passport from "passport";
import { getFrontendUrl } from "../config/runtimeUrls.js";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    const frontendUrl = getFrontendUrl();
    req.frontendUrl = frontendUrl;
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/oauth/failure",
  }),
  (req, res) => {
    const frontendUrl = getFrontendUrl();
    const token = req.authInfo?.token;
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  }
);

router.get(
  "/github",
  passport.authenticate("github", { scope: ["user:email"], session: false })
);

router.get(
  "/github/callback",
  (req, res, next) => {
    const frontendUrl = getFrontendUrl();
    req.frontendUrl = frontendUrl;
    next();
  },
  passport.authenticate("github", {
    session: false,
    failureRedirect: "/oauth/failure",
  }),
  (req, res) => {
    const frontendUrl = getFrontendUrl();
    const token = req.authInfo?.token;
    res.redirect(`${frontendUrl}/oauth/callback?token=${token}`);
  }
);

router.get("/oauth/failure", (req, res) => {
  const frontendUrl = getFrontendUrl();
  res.redirect(`${frontendUrl}/login?error=oauth_failed`);
});

export default router;
