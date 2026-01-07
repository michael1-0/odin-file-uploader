import { join } from "node:path";

import express, { urlencoded } from "express";
import sessionHandler from "./middlewares/session.ts";
import passportHandler from "./middlewares/passport.ts";
import { currentUserHandler } from "./middlewares/currentUser.ts";

import { filesRoutes } from "./routes/filesRoutes.ts";
import { foldersRoutes } from "./routes/foldersRoutes.ts";
import { indexRoutes } from "./routes/indexRoutes.ts";

const app = express();

app.set("view engine", "ejs");
app.set("views", join(import.meta.dirname, "views"));

app.use(express.static(join(import.meta.dirname, "../public")));
app.use(sessionHandler);
app.use(passportHandler.session());
app.use(urlencoded({ extended: false }));
app.use(currentUserHandler);

app.use("/files", filesRoutes);
app.use("/folders", foldersRoutes);
app.use("/", indexRoutes);

export default app;
