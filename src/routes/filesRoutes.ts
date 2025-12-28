import { Router } from "express";
import {
  getFileForm,
  postFilePipeline,
} from "../controllers/filesController.ts";

const filesRoutes = Router();

filesRoutes.get("/new", getFileForm);
filesRoutes.post("/", postFilePipeline);
// filesRoutes.get("/:id");
// filesRoutes.get("/:id/delete")

export { filesRoutes };
