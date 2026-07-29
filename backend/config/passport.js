import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import GoogleStrategy from "passport-google-oauth20";
import GitHubStrategy from "passport-github2";
import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { getBackendUrl } from "./runtimeUrls.js";
import { signAccessToken, signRefreshToken } from "../utils/tokens.js";

const backendUrl = getBackendUrl();

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:
          process.env.GOOGLE_CALLBACK_URL ||
          `${backendUrl}/api/v1/user/google/callback`,
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;
          if (!email) {
            return done(new Error("No email found from Google"), null);
          }

          let user = await User.findOne({ email });

          if (!user) {
            const randomPassword = bcrypt.hashSync(
              Math.random().toString(36),
              10
            );
            user = await User.create({
              fullname: profile.displayName,
              email,
              phoneNumber: 0,
              password: randomPassword,
              roles: { jobSeeker: false, recruiter: false },
              currentRole: null,
              profileCompleted: false,
              profile: {
                profilePhoto: profile.photos?.[0]?.value || "",
              },
            });
          }

          const token = signAccessToken(user._id);
          const refreshToken = signRefreshToken(user._id);

          return done(null, user, { token, refreshToken });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    "github",
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL:
          process.env.GITHUB_CALLBACK_URL ||
          `${backendUrl}/api/v1/user/github/callback`,
        scope: ["user:email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let email = profile.emails?.[0]?.value;
          if (!email) {
            email =
              profile._json?.email ||
              `${profile.username || "githubuser"}@github.com`;
          }

          let user = await User.findOne({ email });

          if (!user) {
            const randomPassword = bcrypt.hashSync(
              Math.random().toString(36),
              10
            );
            user = await User.create({
              fullname: profile.displayName || profile.username,
              email,
              phoneNumber: 0,
              password: randomPassword,
              roles: { jobSeeker: false, recruiter: false },
              currentRole: null,
              profileCompleted: false,
              profile: {
                profilePhoto: profile.photos?.[0]?.value || "",
              },
            });
          }

          const token = signAccessToken(user._id);
          const refreshToken = signRefreshToken(user._id);

          return done(null, user, { token, refreshToken });
        } catch (error) {
          return done(error, null);
        }
      }
    )
  );
}

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
