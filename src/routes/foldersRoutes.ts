import { Router } from "express";
import {
  getFolderForm,
  postFolder,
  getFolderById,
  getFolderFormWithId,
  postFolderWithId,
  deleteFolderById,
  getUpdateForm,
  updateFolderById,
} from "../controllers/foldersController.ts";

const foldersRoutes = Router();

foldersRoutes.get("/new", getFolderForm);
foldersRoutes.post("/", postFolder);
foldersRoutes.get("/:id", getFolderById);
foldersRoutes.get("/:id/new", getFolderFormWithId);
foldersRoutes.post("/:id", postFolderWithId);
foldersRoutes.get("/:id/del", deleteFolderById);
foldersRoutes.get("/:id/update", getUpdateForm);
foldersRoutes.post("/:id/update", updateFolderById);

export { foldersRoutes };
