import { Router } from "express";
import {
  getFileForm,
  postFilePipeline,
  getFileById,
  deleteFileById
} from "../controllers/filesController.ts";

const filesRoutes = Router();

filesRoutes.get("/new", getFileForm);
filesRoutes.post("/", postFilePipeline);
filesRoutes.get("/:id", getFileById);
filesRoutes.get("/:id/del", deleteFileById)

export { filesRoutes };
