import { join } from "node:path";

import express, { urlencoded } from "express";
import type { NextFunction, Request, Response } from "express";

import sessionHandler from "./middlewares/session.ts";
import passportHandler from "./middlewares/passport.ts";
import { currentUserHandler } from "./middlewares/currentUser.ts";

import { filesRoutes } from "./routes/filesRoutes.ts";

import { validateSignup, validateLogin } from "./middlewares/validations.ts";
import { validationResult, matchedData } from "express-validator";
import bcrypt from "bcryptjs";

import { prisma } from "./db/prisma.ts";

const app = express();

app.set("view engine", "ejs");
app.set("views", join(import.meta.dirname, "views"));

app.use(sessionHandler);
app.use(passportHandler.session());
app.use(urlencoded({ extended: false }));
app.use(currentUserHandler);
app.use("/files", filesRoutes);

app.get("/", (req: Request, res: Response) => {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  res.render("home");
});

app.get("/sign-up", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return res.render("sign-up", { errors: null });
});
app.post(
  "/sign-up",
  validateSignup,
  async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.render("sign-up", { errors: errors.array() });
    }
    const body = matchedData(req);
    try {
      const hash = await bcrypt.hash(body.password, 10);
      const newUser = await prisma.user.create({
        data: { name: body.name, email: body.email, password: hash },
      });
      req.logIn(newUser, (err) => {
        if (err) {
          throw err;
        }
        res.redirect("/");
      });
    } catch (err) {
      next(err);
    }
  }
);

app.get("/log-in", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("log-in", { errors: null });
});
app.post(
  "/log-in",
  validateLogin,
  (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) {
      return res.redirect("/");
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.render("log-in", { errors: errors.array() });
    }
    next();
  },
  passportHandler.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in",
  })
);
app.get("/log-out", (req: Request, res: Response, next: NextFunction) => {
  if (req.isUnauthenticated()) {
    return res.redirect("/");
  }
  req.logOut((err) => {
    if (err) {
      return next(err);
    }
    req.session.destroy((err) => {
      if (err) {
        return next(err);
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });
});

export default app;
