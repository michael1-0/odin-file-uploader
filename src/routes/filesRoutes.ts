import { Router } from "express";
import {
  getFileForm,
  postFilePipeline,
  getFileById,
  deleteFileById,
  downloadFile
} from "../controllers/filesController.ts";

const filesRoutes = Router();

filesRoutes.get("/new", getFileForm);
filesRoutes.post("/", postFilePipeline);
filesRoutes.get("/:id", getFileById);
filesRoutes.get("/:id/del", deleteFileById)
filesRoutes.get("/:id/download", downloadFile)

export { filesRoutes };
