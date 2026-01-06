import type { Request, Response, NextFunction } from "express";
import passportHandler from "../middlewares/passport.ts";

import { validateSignup, validateLogin } from "../middlewares/validations.ts";
import { validationResult, matchedData } from "express-validator";
import bcrypt from "bcryptjs";

import { prisma } from "../db/prisma.ts";
import { getBreadcrumbs } from "../util/breadcrumb.ts";

async function getHome(req: Request, res: Response, next: NextFunction) {
  if (req.isUnauthenticated()) {
    return res.redirect("/log-in");
  }
  try {
    const folders = await prisma.folder.findMany({
      where: {
        parentId: null,
        userId: (req.user as any).id,
      },
    });
    const files = await prisma.files.findMany({
      where: {
        folderId: null,
        userId: (req.user as any).id,
      },
    });
    const breadcrumbs = await getBreadcrumbs(null, (req.user as any).id);
    res.render("home", {
      folders: folders,
      title: "Home",
      folderId: null,
      files: files,
      breadcrumbs: breadcrumbs,
    });
  } catch (err) {
    next(err);
  }
}

function getSignUp(req: Request, res: Response) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  return res.render("sign-up", { errors: null });
}

async function postSignUp(req: Request, res: Response, next: NextFunction) {
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

function getLogIn(req: Request, res: Response) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  res.render("log-in", { errors: null });
}

function postLogIn(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return res.redirect("/");
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render("log-in", { errors: errors.array() });
  }
  next();
}

function getLogOut(req: Request, res: Response, next: NextFunction) {
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
}

function goBack(req: Request, res: Response) {
  const backURL = req.body.previousUrl || "/";
  res.redirect(backURL);
}

const postSignUpPipeline = [validateSignup, postSignUp];
const postLogInPipeline = [
  validateLogin,
  postLogIn,
  passportHandler.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in",
  }),
];

export {
  getHome,
  getSignUp,
  postSignUpPipeline,
  getLogIn,
  postLogInPipeline,
  getLogOut,
  goBack,
};
