import { Router } from "express";
import {
  getHome,
  getSignUp,
  postSignUpPipeline,
  getLogIn,
  postLogInPipeline,
  getLogOut,
} from "../controllers/indexController.ts";

const indexRoutes = Router();

indexRoutes.get("/", getHome);
indexRoutes.get("/sign-up", getSignUp);
indexRoutes.post("/sign-up", ...postSignUpPipeline);
indexRoutes.get("/log-in", getLogIn);
indexRoutes.post("/log-in", ...postLogInPipeline);
indexRoutes.get("/log-out", getLogOut);
indexRoutes.get("/log-out", getLogOut);

export { indexRoutes };
