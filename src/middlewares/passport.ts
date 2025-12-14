import passport from "passport";
import LocalStrategy from "passport-local";
import bcrypt from "bcryptjs";
import { prisma } from "../db/prisma.ts";

passport.use(
  new LocalStrategy.Strategy(
    { usernameField: "email" },
    async (username, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: {
            email: username,
          },
        });
        if (!user) {
          return done(null, false, {
            message: "Incorrect email or does not exist",
          });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
          return done(null, false, { message: "Incorrect password" });
        }
        done(null, user);
      } catch (err) {
        done(err);
      }
    }
  )
);
passport.serializeUser((user: any, done) => {
  return done(null, user.id);
});
passport.deserializeUser(async (id: number, done) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: id } });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
